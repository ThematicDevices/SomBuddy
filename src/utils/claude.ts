import { Wine, WineColor, VarietalBlend } from '../types';

// Separate interface for AI-extracted tasting profile (not the same as user TastingNote)
interface AITastingProfile {
  category: string;
  notes: string;
}

interface ExtractedWineData {
  producer: string;
  wineName: string;
  vintage: number | null;
  region: string;
  subRegion?: string;
  country: string;
  appellation?: string;
  varietals: VarietalBlend[];
  wineColor: WineColor;
  alcoholContent?: number;
  estimatedPrice?: number;
  tastingProfile?: AITastingProfile[];
  drinkingWindowStart?: number;
  drinkingWindowEnd?: number;
  pairingSuggestions?: string[];
  story?: string;
}

interface WineInfoForEnrichment {
  producer?: string;
  wineName?: string;
  vintage?: number | null;
  region?: string;
  country?: string;
  varietals?: VarietalBlend[];
}

// Use relative URL for Vercel serverless function
const CLAUDE_PROXY_URL = '/api/claude-proxy';

const VALID_WINE_COLORS: WineColor[] = ['red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified', 'orange'];

function parseWineResponse(jsonString: string): ExtractedWineData {
  const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse wine data from response');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`Invalid JSON response: ${e instanceof Error ? e.message : 'Unknown parsing error'}`);
  }

  // Parse tasting notes from AI into a profile (category + notes format)
  let tastingProfile: AITastingProfile[] = [];
  if (Array.isArray(parsed.tastingNotes)) {
    tastingProfile = parsed.tastingNotes.map((note: unknown) => {
      if (typeof note === 'string') {
        return { category: 'General', notes: note };
      }
      if (typeof note === 'object' && note !== null) {
        const n = note as Record<string, unknown>;
        return {
          category: typeof n.category === 'string' ? n.category : 'General',
          notes: typeof n.notes === 'string' ? n.notes : ''
        };
      }
      return { category: 'General', notes: '' };
    }).filter((n: AITastingProfile) => n.notes);
  }

  // Parse pairing suggestions
  let pairingSuggestions: string[] = [];
  if (Array.isArray(parsed.pairingSuggestions)) {
    pairingSuggestions = parsed.pairingSuggestions
      .filter((p): p is string => typeof p === 'string')
      .slice(0, 10); // Limit to 10 suggestions
  }

  // Combine tasting profile into a story if not already provided
  let story = typeof parsed.story === 'string' ? parsed.story : '';
  if (tastingProfile.length > 0 && !story) {
    story = tastingProfile.map(t => `${t.category}: ${t.notes}`).join('\n');
  } else if (tastingProfile.length > 0 && story) {
    // Append tasting notes to story
    story += '\n\nTasting Profile:\n' + tastingProfile.map(t => `• ${t.category}: ${t.notes}`).join('\n');
  }

  return {
    producer: typeof parsed.producer === 'string' ? parsed.producer : '',
    wineName: typeof parsed.wineName === 'string' ? parsed.wineName : '',
    vintage: parsed.vintage ? parseInt(String(parsed.vintage), 10) : null,
    region: typeof parsed.region === 'string' ? parsed.region : '',
    subRegion: typeof parsed.subRegion === 'string' ? parsed.subRegion : undefined,
    country: typeof parsed.country === 'string' ? parsed.country : '',
    appellation: typeof parsed.appellation === 'string' ? parsed.appellation : undefined,
    varietals: Array.isArray(parsed.varietals) ? parsed.varietals : [],
    wineColor: (typeof parsed.wineColor === 'string' && VALID_WINE_COLORS.includes(parsed.wineColor as WineColor))
      ? parsed.wineColor as WineColor
      : 'red',
    alcoholContent: parsed.alcoholContent ? parseFloat(String(parsed.alcoholContent)) : undefined,
    estimatedPrice: parsed.estimatedPrice ? parseFloat(String(parsed.estimatedPrice)) : undefined,
    tastingProfile,
    drinkingWindowStart: parsed.drinkingWindowStart ? parseInt(String(parsed.drinkingWindowStart), 10) : undefined,
    drinkingWindowEnd: parsed.drinkingWindowEnd ? parseInt(String(parsed.drinkingWindowEnd), 10) : undefined,
    pairingSuggestions,
    story: story || undefined,
  };
}

export async function extractWineFromImage(
  imageBase64: string,
  mimeType: string
): Promise<ExtractedWineData> {
  const response = await fetch(CLAUDE_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'extract-wine',
      imageBase64,
      mimeType,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return parseWineResponse(data.result);
}

export async function enrichWineData(
  wineInfo: WineInfoForEnrichment
): Promise<ExtractedWineData> {
  const response = await fetch(CLAUDE_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'enrich-wine',
      wineInfo,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return parseWineResponse(data.result);
}

export async function getSommelierRecommendation(
  userQuery: string,
  wines: Wine[],
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  const response = await fetch(CLAUDE_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'sommelier-chat',
      userQuery,
      wines,
      conversationHistory,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data.result;
}
