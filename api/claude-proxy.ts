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
  "story": "Brief background about the producer or wine's significance",
  "confidence": 0.85
}`;

// Few-shot examples for wine extraction
const WINE_EXTRACTION_EXAMPLES = `
EXAMPLE 1 - Clear Label:
Input: Photo shows "CAYMUS CABERNET SAUVIGNON 2019 NAPA VALLEY"
Output: {
  "producer": "Caymus Vineyards",
  "wineName": "Cabernet Sauvignon",
  "vintage": 2019,
  "region": "Napa Valley",
  "subRegion": null,
  "country": "USA",
  "appellation": "Napa Valley AVA",
  "varietals": [{"varietal": "Cabernet Sauvignon", "percentage": 100}],
  "wineColor": "red",
  "alcoholContent": 14.6,
  "estimatedPrice": 85.00,
  "tastingNotes": [
    {"category": "Aroma", "notes": "ripe dark cherry, cassis, cocoa, vanilla"},
    {"category": "Palate", "notes": "rich and velvety, dark fruit, soft tannins, long finish"},
    {"category": "Appearance", "notes": "deep garnet with purple rim"}
  ],
  "drinkingWindowStart": 2022,
  "drinkingWindowEnd": 2032,
  "pairingSuggestions": ["grilled ribeye", "braised short ribs", "aged cheddar"],
  "wineStyle": "Full-bodied, fruit-forward Napa Cabernet",
  "criticScores": "Wine Advocate: 93",
  "story": "Founded in 1972 by Chuck Wagner, Caymus is known for its rich, approachable Cabernet Sauvignon.",
  "confidence": 0.95
}

EXAMPLE 2 - Non-Vintage (NV) Wine:
Input: Photo shows "VEUVE CLICQUOT BRUT YELLOW LABEL CHAMPAGNE" (no year visible)
Output: {
  "producer": "Veuve Clicquot",
  "wineName": "Brut Yellow Label",
  "vintage": null,
  "region": "Champagne",
  "subRegion": null,
  "country": "France",
  "appellation": "AOC Champagne",
  "varietals": [{"varietal": "Pinot Noir", "percentage": 50}, {"varietal": "Chardonnay", "percentage": 28}, {"varietal": "Pinot Meunier", "percentage": 22}],
  "wineColor": "sparkling",
  "alcoholContent": 12.0,
  "estimatedPrice": 55.00,
  "tastingNotes": [
    {"category": "Aroma", "notes": "apple, pear, brioche, light citrus"},
    {"category": "Palate", "notes": "balanced acidity, fine bubbles, toasty notes"},
    {"category": "Appearance", "notes": "golden yellow with persistent fine bubbles"}
  ],
  "drinkingWindowStart": 2024,
  "drinkingWindowEnd": 2027,
  "pairingSuggestions": ["oysters", "sushi", "brie cheese", "smoked salmon"],
  "wineStyle": "Classic brut champagne with freshness and depth",
  "criticScores": null,
  "story": "One of the most recognized Champagne houses, founded in 1772, famous for its distinctive yellow label.",
  "confidence": 0.98
}

EXAMPLE 3 - Blurry/Partial Label:
Input: Photo shows blurry label with "...ROS...2021...PROVENC..." visible
Output: {
  "producer": null,
  "wineName": "Rosé de Provence",
  "vintage": 2021,
  "region": "Provence",
  "subRegion": null,
  "country": "France",
  "appellation": "Côtes de Provence AOC",
  "varietals": [{"varietal": "Grenache", "percentage": 45}, {"varietal": "Cinsault", "percentage": 30}, {"varietal": "Syrah", "percentage": 25}],
  "wineColor": "rosé",
  "alcoholContent": 13.0,
  "estimatedPrice": 18.00,
  "tastingNotes": [
    {"category": "Aroma", "notes": "strawberry, peach, citrus"},
    {"category": "Palate", "notes": "dry, refreshing, mineral finish"},
    {"category": "Appearance", "notes": "pale salmon pink"}
  ],
  "drinkingWindowStart": 2021,
  "drinkingWindowEnd": 2024,
  "pairingSuggestions": ["grilled fish", "salads", "Mediterranean dishes"],
  "wineStyle": "Classic dry Provence rosé",
  "criticScores": null,
  "story": "Provence is renowned for producing some of the world's finest rosé wines.",
  "confidence": 0.55
}
`;

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
- Confidence score (0.0 to 1.0) indicating how certain you are about the extraction

FIELD-SPECIFIC GUIDELINES:

PRODUCER: The winery or estate name. Look for prominent branding on the label. Examples: "Château Margaux", "Caymus Vineyards", "Penfolds".

WINE NAME: The specific wine name or cuvée, if different from producer. Examples: "Grand Vin", "Special Selection", "Grange". If the wine is just named by varietal/region, use that (e.g., "Chardonnay" or "Châteauneuf-du-Pape").

VINTAGE: The harvest year. If no year is visible, this is likely a Non-Vintage (NV) wine - set vintage to null. Common for Champagne, Port, and some sparkling wines.

REGION/COUNTRY: Identify from text on label or from your knowledge. Examples: "Napa Valley, USA", "Bordeaux, France", "Barossa Valley, Australia".

VARIETALS: List grape varieties with percentages if known. For single varietals, use 100%. For blends, estimate typical percentages for that wine style if not shown.

WINE COLOR: Must be one of: red, white, rosé, sparkling, dessert, fortified, orange

DRINKING WINDOW:
- Light whites/rosés: drink within 1-3 years
- Full-bodied whites: 3-10 years
- Light reds: 2-5 years
- Full-bodied reds: 5-15+ years
- Fine Bordeaux/Burgundy: 10-30+ years
- Start year = when wine becomes enjoyable, End year = when it will likely decline

PRICE ESTIMATION:
- Entry-level: $8-20
- Mid-range: $20-50
- Premium: $50-100
- Luxury: $100-250
- Icon/Collector: $250+

CONFIDENCE SCORE:
- 0.9-1.0: Label is clear, well-known wine, high certainty
- 0.7-0.89: Most fields readable, some estimation needed
- 0.5-0.69: Label partially readable, significant estimation
- Below 0.5: Poor image quality, many fields uncertain

${WINE_EXTRACTION_EXAMPLES}

Always respond with valid JSON in this exact format:
${WINE_EXTRACTION_SCHEMA}

IMPORTANT:
- If any field cannot be determined, use null for numbers, empty string for strings, or empty array for arrays.
- Be specific with tasting notes based on the grape varieties and region.
- Always include a confidence score reflecting your certainty about the extraction.`;

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

      // Limit wines to reduce payload size and processing time (top 100 by value/relevance)
      const limitedWines = (wines || [])
        .sort((a, b) => (b.purchasePrice || 0) - (a.purchasePrice || 0))
        .slice(0, 100);

      const winesSummary = limitedWines.map((w) => {
        const drinkingInfo = w.drinkingWindowStart && w.drinkingWindowEnd
          ? `drink: ${w.drinkingWindowStart}-${w.drinkingWindowEnd}`
          : '';
        const varietalStr = (w.varietals || []).map((v) => v.varietal).join('/');
        const priceInfo = w.purchasePrice ? `$${w.purchasePrice}` : '';
        // Compact format to reduce tokens
        return `${w.id}|${w.vintage || 'NV'} ${w.producer} ${w.wineName}|${varietalStr}|${w.region}|${priceInfo}|${drinkingInfo}|qty:${w.quantity || 1}`;
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
