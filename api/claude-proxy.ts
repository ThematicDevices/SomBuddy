import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

interface RequestBody {
  action: 'extract-wine' | 'sommelier-chat';
  imageBase64?: string;
  mimeType?: string;
  userQuery?: string;
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
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

    const { action, imageBase64, mimeType, userQuery, wines, conversationHistory } =
      req.body as RequestBody;

    let messages: unknown[];
    let systemPrompt: string;

    if (action === 'extract-wine') {
      systemPrompt = `You are an expert sommelier and wine data extraction specialist. Your task is to analyze wine label images and extract detailed information about the wine.

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

If any field cannot be determined from the label, use null for numbers and empty string for strings.`;

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
              text: 'Please analyze this wine label and extract all visible information. Return the data as JSON.',
            },
          ],
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

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ result });
  } catch (error) {
    console.error('Claude proxy error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
