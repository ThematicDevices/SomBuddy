import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

// Get allowed origins from environment variable, or use default for development
const getAllowedOrigin = (req: VercelRequest): string => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

  // In development, allow localhost
  if (origin?.includes('localhost') || origin?.includes('127.0.0.1')) {
    return origin;
  }

  // Check if origin is in allowed list
  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }

  // For Vercel deployments, allow the default Vercel domains
  if (origin?.includes('.vercel.app')) {
    return origin;
  }

  // Fallback to same-origin (no CORS header)
  return '';
};

const setCorsHeaders = (req: VercelRequest, res: VercelResponse) => {
  const allowedOrigin = getAllowedOrigin(req);
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

interface RequestBody {
  action: 'extract-wine' | 'enrich-wine' | 'sommelier-chat' | 'restaurant-advisor';
  imageBase64?: string;
  mimeType?: string;
  userQuery?: string;
  wineInfo?: {
    producer?: string;
    wineName?: string;
    vintage?: number | null;
    region?: string;
    country?: string;
    varietals?: Array<{ varietal: string; percentage?: number }>;
  };
  wines?: Array<{
    id: string;
    producer: string;
    wineName: string;
    vintage?: number;
    region: string;
    country: string;
    varietals?: Array<{ varietal: string; percentage?: number }>;
    drinkingWindowStart?: number;
    drinkingWindowEnd?: number;
    drinkingStatus?: string;
    purchasePrice?: number;
    quantity?: number;
  }>;
  conversationHistory?: Array<{ role: string; content: string }>;
  restaurantName?: string;
  corkageFee?: number;
  wineListImage?: string;
  wineListMimeType?: string;
  wineListText?: string;
  mealDescription?: string;
}

const WINE_EXTRACTION_SCHEMA = `{
  "producer": "Producer/Winery name",
  "wineName": "Name of the wine (cuvée or specific wine name, if different from producer)",
  "vintage": 2020,
  "region": "Wine region (e.g., Napa Valley, Bordeaux, Barossa Valley)",
  "subRegion": "Sub-region or commune if known (e.g., Rutherford, Saint-Julien)",
  "country": "Country of origin",
  "appellation": "Specific appellation (e.g., AOC Margaux, DOC Barolo)",
  "varietals": [{"varietal": "Grape variety", "percentage": 100}],
  "wineColor": "red|white|rosé|sparkling|dessert|fortified|orange",
  "alcoholContent": 14.5,
  "estimatedPrice": 45.00,
  "tastingNotes": [
    {"category": "Aroma", "notes": "blackberry, cedar, vanilla"},
    {"category": "Palate", "notes": "full-bodied, velvety tannins, long finish"},
    {"category": "Appearance", "notes": "deep ruby with purple hues"}
  ],
  "drinkingWindowStart": 2024,
  "drinkingWindowEnd": 2035,
  "pairingSuggestions": ["grilled ribeye steak", "aged hard cheeses", "lamb chops"],
  "wineStyle": "Full-bodied, oak-aged red with aging potential",
  "criticScores": "Wine Advocate: 94, Wine Spectator: 92",
  "story": "Brief background about the producer or wine's significance"
}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(req, res);
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    if (!CLAUDE_API_KEY) {
      throw new Error('Claude API key not configured');
    }

    const { action, imageBase64, mimeType, userQuery, wineInfo, wines, conversationHistory } =
      req.body as RequestBody;

    let messages: unknown[];
    let systemPrompt: string;

    if (action === 'extract-wine') {
      const currentYear = new Date().getFullYear();

      systemPrompt = `You are an expert sommelier and wine data extraction specialist with extensive knowledge of wines worldwide. Your task is to analyze wine label images and extract detailed information about the wine.

CURRENT YEAR: ${currentYear}

Based on the wine label AND your expert knowledge, provide comprehensive information including:
- Basic details visible on the label
- Estimated current market price (USD) based on your knowledge of similar wines
- Professional tasting notes (aroma, palate, appearance)
- Recommended drinking window based on vintage and wine style
- Food pairing suggestions
- Any notable critic scores you're aware of
- Brief story or background about the producer/wine

Always respond with valid JSON in this exact format:
${WINE_EXTRACTION_SCHEMA}

IMPORTANT GUIDELINES:
- For drinking windows, consider the vintage year and wine style. Young everyday wines might be "drink now to +3 years", while fine wines could age 10-30+ years.
- Estimate prices realistically based on region, producer reputation, and quality tier.
- If any field cannot be determined, use null for numbers, empty string for strings, or empty array for arrays.
- Be specific with tasting notes based on the grape varieties and region.
- For varietals, if it's a blend and percentages aren't shown, estimate typical percentages for that wine style.`;

      messages = [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'Please analyze this wine label and provide comprehensive information including tasting notes, estimated price, drinking window, and food pairings. Return the data as JSON.',
            },
          ],
        },
      ];
    } else if (action === 'enrich-wine') {
      const currentYear = new Date().getFullYear();
      const { producer, wineName, vintage, region, country, varietals } = wineInfo || {};

      const wineDescription = [
        vintage ? `${vintage}` : '',
        producer || '',
        wineName || '',
        varietals?.map(v => v.varietal).join(', ') || '',
        region ? `from ${region}` : '',
        country ? `(${country})` : ''
      ].filter(Boolean).join(' ');

      systemPrompt = `You are an expert sommelier with comprehensive knowledge of wines worldwide. Your task is to provide detailed information about a specific wine based on your expertise.

CURRENT YEAR: ${currentYear}

The user is adding this wine to their collection:
${wineDescription}

Based on your knowledge of this wine (or similar wines if this exact wine is unknown), provide comprehensive information.

Always respond with valid JSON in this exact format:
${WINE_EXTRACTION_SCHEMA}

IMPORTANT GUIDELINES:
- Fill in any missing basic information you know about this wine
- Estimate current market price (USD) based on producer reputation and quality tier
- Provide professional tasting notes typical for this wine style
- Calculate drinking window: start year should be when it begins drinking well, end year when it will likely decline
- Suggest food pairings that complement the wine style
- Include critic scores if you're aware of any for this wine or vintage
- Add any interesting background about the producer or wine
- If information is uncertain, provide your best estimate based on similar wines
- For unknown/obscure wines, base estimates on the region and grape varieties`;

      messages = [
        {
          role: 'user',
          content: `Please provide comprehensive information about this wine: ${wineDescription}. Include estimated price, tasting notes, drinking window, food pairings, and any background information. Return the data as JSON.`,
        },
      ];
    } else if (action === 'sommelier-chat') {
      const currentYear = new Date().getFullYear();
      const winesSummary = (wines || []).map((w) => {
        const drinkingInfo = w.drinkingWindowStart && w.drinkingWindowEnd
          ? `drinking window: ${w.drinkingWindowStart}-${w.drinkingWindowEnd}`
          : `status: ${w.drinkingStatus || 'unknown'}`;
        const varietalStr = (w.varietals || []).map((v) => v.varietal).join(', ');
        const priceInfo = w.purchasePrice ? `$${w.purchasePrice}` : 'price unknown';
        return `- ID:${w.id} | ${w.vintage || 'NV'} ${w.producer} ${w.wineName} | ${varietalStr} | ${w.region}, ${w.country} | ${priceInfo} | ${drinkingInfo} | qty: ${w.quantity || 1}`;
      }).join('\n');

      systemPrompt = `You are an expert sommelier helping a wine enthusiast manage their personal collection.

CURRENT YEAR: ${currentYear}

THE USER'S WINE COLLECTION:
${winesSummary || 'The collection is currently empty.'}

IMPORTANT:
- Only recommend wines from the user's actual collection
- Always mention specific bottles by producer and vintage
- Keep responses conversational but informative`;

      messages = [
        ...(conversationHistory || []).map(m => ({
          role: m.role,
          content: m.content,
        })),
        {
          role: 'user',
          content: userQuery,
        },
      ];
    } else if (action === 'restaurant-advisor') {
      const { restaurantName, corkageFee, wineListImage, wineListMimeType, wineListText, mealDescription } = req.body as RequestBody;
      const currentYear = new Date().getFullYear();

      const winesSummary = (wines || []).map((w) => {
        const drinkingInfo = w.drinkingWindowStart && w.drinkingWindowEnd
          ? `drinking window: ${w.drinkingWindowStart}-${w.drinkingWindowEnd}`
          : `status: ${w.drinkingStatus || 'unknown'}`;
        const varietalStr = (w.varietals || []).map((v) => v.varietal).join(', ');
        const priceInfo = w.purchasePrice ? `$${w.purchasePrice}` : 'price unknown';
        return `- ID:${w.id} | ${w.vintage || 'NV'} ${w.producer} ${w.wineName} | ${varietalStr} | ${w.region}, ${w.country} | ${priceInfo} | ${drinkingInfo} | qty: ${w.quantity || 1}`;
      }).join('\n');

      systemPrompt = `You are an expert sommelier helping a wine enthusiast decide whether to bring wine from their personal collection to a restaurant (and pay corkage) or buy wine at the restaurant.

CURRENT YEAR: ${currentYear}
RESTAURANT: ${restaurantName || 'Unknown Restaurant'}
CORKAGE FEE: $${corkageFee || 0}
${mealDescription ? `PLANNED MEAL: ${mealDescription}` : ''}

THE GUEST'S WINE COLLECTION:
${winesSummary || 'The collection is currently empty.'}

TASK:
1. Parse all wines from the restaurant's wine list with their prices
2. For each wine category (reds, whites, etc.), compare restaurant options to the guest's collection
3. Calculate value: (Restaurant wine price) vs (Collection wine value + corkage fee)
4. Consider quality: Is the collection wine of similar/better/lesser quality?
5. Consider pairing: How well does each option pair with the planned meal (if specified)?
6. Provide clear recommendations

Return valid JSON in this exact format:
{
  "restaurantName": "Restaurant Name",
  "corkageFee": 35,
  "mealDescription": "What they plan to eat",
  "recommendations": [
    {
      "recommendation": "bring|buy",
      "restaurantWineName": "Wine name on restaurant list",
      "restaurantWineVintage": 2020,
      "restaurantWineProducer": "Producer",
      "restaurantWineVarietal": "Grape variety",
      "restaurantWinePrice": 85,
      "restaurantWineRegion": "Region",
      "collectionWineId": "id-from-collection-or-null",
      "collectionWineValue": 45,
      "corkageFee": 35,
      "totalBringCost": 80,
      "savings": 5,
      "qualityComparison": "better|similar|lesser",
      "pairingScore": 8,
      "reasoning": "Explanation of recommendation"
    }
  ],
  "summary": "Overall strategy summary - what to bring vs buy and why"
}

GUIDELINES:
- Only recommend bringing wines the guest actually owns (from their collection)
- Calculate savings accurately: savings = restaurantPrice - (collectionWineValue + corkageFee)
- If savings are negative, recommend buying at restaurant unless quality is significantly better
- Pairing score is 1-10 where 10 is perfect pairing
- Consider the dining experience holistically - sometimes buying at restaurant is worth it
- If no good matches exist in collection, recommend buying
- Limit to top 5-8 most relevant recommendations`;

      // Build the message content based on whether image or text was provided
      if (wineListImage && wineListMimeType) {
        messages = [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: wineListMimeType,
                  data: wineListImage,
                },
              },
              {
                type: 'text',
                text: `This is the wine list from ${restaurantName || 'a restaurant'}. Please analyze it and compare with my collection to provide recommendations on what to bring vs. buy. Return the analysis as JSON.`,
              },
            ],
          },
        ];
      } else if (wineListText) {
        messages = [
          {
            role: 'user',
            content: `Here is the wine list from ${restaurantName || 'a restaurant'}:\n\n${wineListText}\n\nPlease analyze it and compare with my collection to provide recommendations on what to bring vs. buy. Return the analysis as JSON.`,
          },
        ];
      } else {
        throw new Error('Wine list image or text is required');
      }
    } else {
      throw new Error('Invalid action');
    }

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const textContent = data.content.find((c: { type: string }) => c.type === 'text');
    const result = textContent?.text || '';

    setCorsHeaders(req, res);
    return res.status(200).json({ result });
  } catch (error) {
    console.error('Claude proxy error:', error);
    setCorsHeaders(req, res);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
