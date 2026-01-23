import { Wine, WineColor, VarietalBlend } from '../types';

interface ClaudeResponse {
  content: Array<{
    type: string;
    text?: string;
  }>;
}

interface ExtractedWineData {
  producer: string;
  wineName: string;
  vintage: number | null;
  region: string;
  country: string;
  appellation?: string;
  varietals: VarietalBlend[];
  wineColor: WineColor;
  alcoholContent?: number;
}

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

async function callClaude(
  apiKey: string,
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; source?: { type: string; media_type: string; data: string } }> }>,
  systemPrompt?: string
): Promise<string> {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
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

  const data: ClaudeResponse = await response.json();
  const textContent = data.content.find(c => c.type === 'text');
  return textContent?.text || '';
}

export async function extractWineFromImage(
  apiKey: string,
  imageBase64: string,
  mimeType: string
): Promise<ExtractedWineData> {
  const systemPrompt = `You are an expert sommelier and wine data extraction specialist. Your task is to analyze wine label images and extract detailed information about the wine.

Always respond with valid JSON in this exact format:
{
  "producer": "Producer/Winery name",
  "wineName": "Name of the wine (if different from producer)",
  "vintage": 2020,
  "region": "Wine region (e.g., Napa Valley, Bordeaux)",
  "country": "Country of origin",
  "appellation": "Specific appellation if visible",
  "varietals": [{"varietal": "Grape variety", "percentage": 100}],
  "wineColor": "red|white|rosé|sparkling|dessert|fortified|orange",
  "alcoholContent": 14.5
}

If any field cannot be determined from the label, use null for numbers and empty string for strings.
For vintage, only include the year as a number (e.g., 2020), or null if not visible.
For wineColor, infer from the varietal and region if not explicitly shown.`;

  const messages = [
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
          text: 'Please analyze this wine label and extract all visible information. Return the data as JSON.',
        },
      ],
    },
  ];

  const response = await callClaude(apiKey, messages as never, systemPrompt);

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse wine data from image');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`Invalid JSON response from image analysis: ${e instanceof Error ? e.message : 'Unknown parsing error'}`);
  }

  return {
    producer: typeof parsed.producer === 'string' ? parsed.producer : '',
    wineName: typeof parsed.wineName === 'string' ? parsed.wineName : '',
    vintage: parsed.vintage ? parseInt(String(parsed.vintage), 10) : null,
    region: typeof parsed.region === 'string' ? parsed.region : '',
    country: typeof parsed.country === 'string' ? parsed.country : '',
    appellation: typeof parsed.appellation === 'string' ? parsed.appellation : undefined,
    varietals: Array.isArray(parsed.varietals) ? parsed.varietals : [],
    wineColor: (typeof parsed.wineColor === 'string' && ['red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified', 'orange'].includes(parsed.wineColor))
      ? parsed.wineColor as WineColor
      : 'red',
    alcoholContent: parsed.alcoholContent ? parseFloat(String(parsed.alcoholContent)) : undefined,
  };
}

export async function getSommelierRecommendation(
  apiKey: string,
  userQuery: string,
  wines: Wine[],
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  const currentYear = new Date().getFullYear();

  const winesSummary = wines.map(w => {
    const drinkingInfo = w.drinkingWindowStart && w.drinkingWindowEnd
      ? `drinking window: ${w.drinkingWindowStart}-${w.drinkingWindowEnd}`
      : `status: ${w.drinkingStatus}`;

    const varietalStr = w.varietals.map(v => v.varietal).join(', ');
    const priceInfo = w.purchasePrice ? `$${w.purchasePrice}` : 'price unknown';

    return `- ID:${w.id} | ${w.vintage || 'NV'} ${w.producer} ${w.wineName} | ${varietalStr} | ${w.region}, ${w.country} | ${priceInfo} | ${drinkingInfo} | qty: ${w.quantity} | ${w.isOpen ? 'OPEN' : 'sealed'}`;
  }).join('\n');

  const systemPrompt = `You are an expert sommelier with deep knowledge of wine pairings, regions, and vintages. You're helping a wine enthusiast manage their personal collection.

PERSONALITY & VOICE:
- Expert but approachable: knowledgeable without being pretentious
- Contextual: understand the user's specific situation and collection
- Helpful: proactive in suggesting alternatives or asking clarifying questions
- Conversational: natural language, not robotic recommendations

CURRENT YEAR: ${currentYear}

THE USER'S WINE COLLECTION:
${winesSummary || 'The collection is currently empty.'}

RECOMMENDATION LOGIC:
1. Parse Request: Extract key parameters (food item, occasion, price range, style preference)
2. Scan Catalog: Match wines against criteria from the actual collection above
3. Filter by Readiness: Prefer wines ready to drink now (drinking window includes current year)
4. Rank by Fit: Score matches based on pairing logic, varietals, regions
5. Explain: Provide sommelier-level reasoning for each recommendation
6. Offer Alternatives: "If you prefer something lighter..." or "For a different budget..."

DRINKING WINDOW INTERPRETATION:
- "ready" = perfect to drink now
- "needs-aging" = should wait
- "past-peak" = may have declined
- If drinking window years are specified, compare to current year (${currentYear})

PRICE INTERPRETATION:
- "budget/inexpensive": under $20
- "moderate/mid-range": $20-50
- "splurge/expensive": $50-100
- "special occasion": over $100

IMPORTANT:
- Only recommend wines from the user's actual collection
- Always mention specific bottles by producer and vintage
- If no suitable wines match, say so honestly and suggest what to look for
- Keep responses conversational but informative`;

  const messages = [
    ...conversationHistory.map(m => ({
      role: m.role,
      content: m.content,
    })),
    {
      role: 'user',
      content: userQuery,
    },
  ];

  return callClaude(apiKey, messages as never, systemPrompt);
}
