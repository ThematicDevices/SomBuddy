import { Wine, WineColor, VarietalBlend } from '../types';
import { supabase } from '../lib/supabase';

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

export async function extractWineFromImage(
  imageBase64: string,
  mimeType: string
): Promise<ExtractedWineData> {
  const { data, error } = await supabase.functions.invoke('claude-proxy', {
    body: {
      action: 'extract-wine',
      imageBase64,
      mimeType,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.error) {
    throw new Error(data.error);
  }

  const jsonMatch = data.result.match(/\{[\s\S]*\}/);
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
  userQuery: string,
  wines: Wine[],
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('claude-proxy', {
    body: {
      action: 'sommelier-chat',
      userQuery,
      wines,
      conversationHistory,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.result;
}
