import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-haiku-4-20251001';

interface Wine {
  id: string;
  producer: string;
  wine_name: string;
  vintage: number | null;
  region: string;
  country: string;
  varietals: Array<{ varietal: string; percentage?: number }>;
  estimated_value: number | null;
  user_id: string;
}

interface PriceUpdate {
  id: string;
  estimatedValue: number;
}

async function getWinePriceEstimate(
  wine: Wine,
  claudeApiKey: string
): Promise<number | null> {
  const wineDescription = [
    wine.vintage ? `${wine.vintage}` : '',
    wine.producer || '',
    wine.wine_name || '',
    wine.varietals?.map(v => v.varietal).join(', ') || '',
    wine.region ? `from ${wine.region}` : '',
    wine.country ? `(${wine.country})` : ''
  ].filter(Boolean).join(' ');

  const systemPrompt = `You are a wine pricing expert. Estimate the current market price (in USD) for the following wine based on recent market data, auction results, and retailer prices. Return ONLY a JSON object with the format: {"estimatedPrice": 45.00}. Be realistic and accurate.`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 256,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `What is the current market price for: ${wineDescription}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`Claude API error for wine ${wine.id}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const textContent = data.content.find((c: { type: string }) => c.type === 'text');
    const result = textContent?.text || '';

    // Parse the JSON response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.estimatedPrice === 'number') {
        return parsed.estimatedPrice;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error getting price for wine ${wine.id}:`, error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // This endpoint can be called by Vercel Cron or manually with a secret
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // Vercel Cron jobs include this header
  const isVercelCron = authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && cronSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!CLAUDE_API_KEY) {
      throw new Error('Claude API key not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    // Initialize Supabase with service role key for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch all wines that need price updates
    const { data: wines, error: fetchError } = await supabase
      .from('wines')
      .select('id, producer, wine_name, vintage, region, country, varietals, estimated_value, user_id')
      .gt('quantity', 0); // Only update wines that are still in collection

    if (fetchError) {
      throw new Error(`Failed to fetch wines: ${fetchError.message}`);
    }

    if (!wines || wines.length === 0) {
      return res.status(200).json({ message: 'No wines to update', updated: 0 });
    }

    console.log(`Updating prices for ${wines.length} wines...`);

    const updates: PriceUpdate[] = [];
    const batchSize = 5; // Process 5 wines at a time to avoid rate limits

    for (let i = 0; i < wines.length; i += batchSize) {
      const batch = wines.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (wine) => {
          const newPrice = await getWinePriceEstimate(wine, CLAUDE_API_KEY);
          if (newPrice !== null) {
            return { id: wine.id, estimatedValue: newPrice };
          }
          return null;
        })
      );

      updates.push(...batchResults.filter((u): u is PriceUpdate => u !== null));

      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < wines.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update all wines with new prices
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('wines')
        .update({
          estimated_value: update.estimatedValue,
          date_modified: new Date().toISOString(),
        })
        .eq('id', update.id);

      if (updateError) {
        console.error(`Failed to update wine ${update.id}:`, updateError);
      }
    }

    const result = {
      message: 'Price update complete',
      totalWines: wines.length,
      updated: updates.length,
      timestamp: new Date().toISOString(),
    };

    console.log(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Price update error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
