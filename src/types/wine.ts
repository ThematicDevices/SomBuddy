export type DrinkingStatus = 'ready' | 'needs-aging' | 'past-peak' | 'unknown';
export type BottleCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
export type WineColor = 'red' | 'white' | 'rosé' | 'sparkling' | 'dessert' | 'fortified' | 'orange';
export type BottleSize = '375ml' | '500ml' | '750ml' | '1L' | '1.5L' | '3L' | '5L';

export const bottleSizeOptions: { value: BottleSize; label: string }[] = [
  { value: '375ml', label: '375ml (Half Bottle)' },
  { value: '500ml', label: '500ml' },
  { value: '750ml', label: '750ml (Standard)' },
  { value: '1L', label: '1L' },
  { value: '1.5L', label: '1.5L (Magnum)' },
  { value: '3L', label: '3L (Double Magnum)' },
  { value: '5L', label: '5L (Jeroboam)' },
];

export interface VarietalBlend {
  varietal: string;
  percentage?: number;
}

export interface TastingNote {
  id: string;
  date: string;
  notes: string;
  rating?: number;
  context?: string;
  pairingUsed?: string;
}

export interface ConsumptionRecord {
  id: string;
  date: string;
  occasion?: string;
  notes?: string;
  rating?: number;
  pairedWith?: string;
  sharedWith?: string[];
}

export interface Wine {
  id: string;

  producer: string;
  wineName: string;
  vintage: number | null;
  region: string;
  subRegion?: string;
  country: string;
  appellation?: string;
  varietals: VarietalBlend[];
  wineColor: WineColor;
  bottleSize?: BottleSize;
  alcoholContent?: number;

  purchaseDate?: string;
  purchasePrice?: number;
  purchasedFrom?: string;
  estimatedValue?: number;
  marketPriceMin?: number;
  marketPriceMax?: number;

  quantity: number;
  storageLocation?: string;
  bottleCondition: BottleCondition;
  labelCondition?: BottleCondition;
  capsuleCondition?: BottleCondition;

  tastingNotes: TastingNote[];
  drinkingWindowStart?: number;
  drinkingWindowEnd?: number;
  drinkingStatus: DrinkingStatus;
  pairingSuggestions: string[];
  personalRating?: number;
  isOpen: boolean;

  whyPurchased?: string;
  provenance?: string;
  story?: string;
  labelImageUrl?: string;
  labelImageBase64?: string;
  labelImageStoragePath?: string;

  dateAdded: string;
  dateModified: string;

  consumptionHistory: ConsumptionRecord[];
}

export interface WineFormData {
  producer: string;
  wineName: string;
  vintage: number | null;
  region: string;
  subRegion?: string;
  country: string;
  appellation?: string;
  varietals: VarietalBlend[];
  wineColor: WineColor;
  bottleSize?: BottleSize;
  alcoholContent?: number;
  quantity: number;
  purchasePrice?: number;
  purchaseDate?: string;
  purchasedFrom?: string;
  estimatedValue?: number;
  storageLocation?: string;
  drinkingWindowStart?: number;
  drinkingWindowEnd?: number;
  whyPurchased?: string;
  pairingSuggestions: string[];
  labelImageBase64?: string;
  story?: string;
  tastingNotes?: TastingNote[];
  isOpen?: boolean;
}

export const createDefaultWine = (): WineFormData => ({
  producer: '',
  wineName: '',
  vintage: null,
  region: '',
  country: '',
  varietals: [],
  wineColor: 'red',
  bottleSize: '750ml',
  quantity: 1,
  pairingSuggestions: [],
});

export const wineColorOptions: { value: WineColor; label: string }[] = [
  { value: 'red', label: 'Red' },
  { value: 'white', label: 'White' },
  { value: 'rosé', label: 'Rosé' },
  { value: 'sparkling', label: 'Sparkling' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'fortified', label: 'Fortified' },
  { value: 'orange', label: 'Orange' },
];

export const commonVarietals = [
  'Cabernet Sauvignon',
  'Merlot',
  'Pinot Noir',
  'Syrah',
  'Shiraz',
  'Zinfandel',
  'Malbec',
  'Sangiovese',
  'Nebbiolo',
  'Tempranillo',
  'Grenache',
  'Mourvèdre',
  'Petit Verdot',
  'Cabernet Franc',
  'Chardonnay',
  'Sauvignon Blanc',
  'Riesling',
  'Pinot Grigio',
  'Pinot Gris',
  'Gewürztraminer',
  'Viognier',
  'Chenin Blanc',
  'Sémillon',
  'Albariño',
  'Grüner Veltliner',
  'Muscat',
  'Prosecco',
  'Champagne Blend',
];

export const wineRegions = [
  'Bordeaux',
  'Burgundy',
  'Champagne',
  'Rhône Valley',
  'Loire Valley',
  'Alsace',
  'Napa Valley',
  'Sonoma',
  'Willamette Valley',
  'Santa Barbara',
  'Paso Robles',
  'Mendoza',
  'Barossa Valley',
  'Marlborough',
  'Tuscany',
  'Piedmont',
  'Veneto',
  'Rioja',
  'Ribera del Duero',
  'Priorat',
  'Mosel',
  'Rheingau',
  'Douro Valley',
  'South Africa - Stellenbosch',
];
