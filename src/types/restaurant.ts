export interface RestaurantWine {
  name: string;
  vintage?: number;
  producer?: string;
  varietal?: string;
  price: number;
  region?: string;
  description?: string;
}

export interface CollectionWineRef {
  id: string;
}

export interface WineComparison {
  recommendation: 'bring' | 'buy';
  restaurantWine: RestaurantWine;
  collectionWine?: CollectionWineRef;
  collectionWineValue: number;
  corkageFee: number;
  totalBringCost: number;
  restaurantPrice: number;
  savings: number;
  qualityComparison: 'better' | 'similar' | 'lesser';
  pairingScore: number;
  reasoning: string;
}

export interface RestaurantAnalysis {
  restaurantName: string;
  corkageFee: number;
  mealDescription?: string;
  recommendations: WineComparison[];
  summary: string;
  bringFromCellarCount: number;
  buyAtRestaurantCount: number;
  totalPotentialSavings: number;
}

export interface RestaurantAdvisorRequest {
  restaurantName: string;
  corkageFee: number;
  mealDescription?: string;
  wineListImage?: string;
  wineListMimeType?: string;
  wineListText?: string;
}
