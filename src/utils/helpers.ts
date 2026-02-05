import { Wine, WineFormData, DrinkingStatus } from '../types';

/**
 * Check if a wine is within N years of the end of its drinking window
 */
export function isNearEndOfDrinkingWindow(wine: Wine, yearsThreshold = 2): boolean {
  const currentYear = new Date().getFullYear();
  if (!wine.drinkingWindowEnd) return false;
  const yearsRemaining = wine.drinkingWindowEnd - currentYear;
  return yearsRemaining > 0 && yearsRemaining <= yearsThreshold;
}

/**
 * Check if a wine is past its drinking window
 */
export function isPastPrime(wine: Wine): boolean {
  const currentYear = new Date().getFullYear();
  return !!wine.drinkingWindowEnd && wine.drinkingWindowEnd < currentYear;
}

/**
 * Stoplight status for drinking window
 * - green: Ready to Drink (within drinking window)
 * - yellow: Drink window Ending soon (within 2 years of end)
 * - red: Past the drink window
 * - blue: Aging (before drinking window starts)
 */
export type DrinkingWindowStoplight = 'green' | 'yellow' | 'red' | 'blue' | 'unknown';

export function getDrinkingWindowStoplight(wine: Wine): DrinkingWindowStoplight {
  const currentYear = new Date().getFullYear();

  // If no drinking window defined, return unknown
  if (!wine.drinkingWindowStart && !wine.drinkingWindowEnd) {
    return 'unknown';
  }

  // Past prime - red
  if (wine.drinkingWindowEnd && currentYear > wine.drinkingWindowEnd) {
    return 'red';
  }

  // Still aging - blue
  if (wine.drinkingWindowStart && currentYear < wine.drinkingWindowStart) {
    return 'blue';
  }

  // Within 2 years of end - yellow
  if (wine.drinkingWindowEnd) {
    const yearsRemaining = wine.drinkingWindowEnd - currentYear;
    if (yearsRemaining > 0 && yearsRemaining <= 2) {
      return 'yellow';
    }
  }

  // Ready to drink - green
  return 'green';
}

export function getStoplightColor(stoplight: DrinkingWindowStoplight): string {
  switch (stoplight) {
    case 'green':
      return 'bg-green-500';
    case 'yellow':
      return 'bg-amber-400';
    case 'red':
      return 'bg-red-500';
    case 'blue':
      return 'bg-blue-500';
    default:
      return 'bg-charcoal-300';
  }
}

export function getStoplightLabel(stoplight: DrinkingWindowStoplight): string {
  switch (stoplight) {
    case 'green':
      return 'Ready to Drink';
    case 'yellow':
      return 'Drink Soon';
    case 'red':
      return 'Past Prime';
    case 'blue':
      return 'Aging';
    default:
      return 'Unknown';
  }
}

export function getStoplightBorderColor(stoplight: DrinkingWindowStoplight): string {
  switch (stoplight) {
    case 'green':
      return 'border-green-500';
    case 'yellow':
      return 'border-amber-400';
    case 'red':
      return 'border-red-500';
    case 'blue':
      return 'border-blue-500';
    default:
      return 'border-charcoal-300';
  }
}

export function formDataToWine(formData: WineFormData): Wine {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    producer: formData.producer,
    wineName: formData.wineName,
    vintage: formData.vintage,
    region: formData.region,
    subRegion: formData.subRegion,
    country: formData.country,
    appellation: formData.appellation,
    varietals: formData.varietals,
    wineColor: formData.wineColor,
    bottleSize: formData.bottleSize || '750ml',
    alcoholContent: formData.alcoholContent,
    purchaseDate: formData.purchaseDate,
    purchasePrice: formData.purchasePrice,
    purchasedFrom: formData.purchasedFrom,
    quantity: formData.quantity,
    storageLocation: formData.storageLocation,
    bottleCondition: 'unknown',
    drinkingWindowStart: formData.drinkingWindowStart,
    drinkingWindowEnd: formData.drinkingWindowEnd,
    drinkingStatus: 'unknown',
    pairingSuggestions: formData.pairingSuggestions || [],
    whyPurchased: formData.whyPurchased,
    labelImageBase64: formData.labelImageBase64,
    isOpen: false,
    tastingNotes: [],
    consumptionHistory: [],
    dateAdded: now,
    dateModified: now,
  };
}

export function calculateDrinkingStatus(wine: Wine): DrinkingStatus {
  const currentYear = new Date().getFullYear();

  if (wine.drinkingWindowStart && wine.drinkingWindowEnd) {
    if (currentYear < wine.drinkingWindowStart) {
      return 'needs-aging';
    } else if (currentYear > wine.drinkingWindowEnd) {
      return 'past-peak';
    } else {
      return 'ready';
    }
  }

  return wine.drinkingStatus || 'unknown';
}

export function getWineDisplayName(wine: Wine): string {
  const vintage = wine.vintage ? `${wine.vintage} ` : '';
  const name = wine.wineName || wine.producer;
  return `${vintage}${wine.producer}${wine.wineName ? ` ${wine.wineName}` : ''}`.trim() || name;
}

export function getVarietalString(wine: Wine): string {
  if (!wine.varietals || wine.varietals.length === 0) return 'Unknown varietal';
  return wine.varietals.map(v =>
    v.percentage && v.percentage < 100 ? `${v.varietal} (${v.percentage}%)` : v.varietal
  ).join(', ');
}

export function formatPrice(price?: number): string {
  if (price === undefined || price === null) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getDrinkingStatusColor(status: DrinkingStatus): string {
  switch (status) {
    case 'ready':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'needs-aging':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'past-peak':
      return 'text-gray-500 bg-gray-50 border-gray-200';
    default:
      return 'text-charcoal-500 bg-charcoal-50 border-charcoal-200';
  }
}

export function getDrinkingStatusLabel(status: DrinkingStatus): string {
  switch (status) {
    case 'ready':
      return 'Ready to Drink';
    case 'needs-aging':
      return 'Needs Aging';
    case 'past-peak':
      return 'Past Peak';
    default:
      return 'Unknown';
  }
}

export function getWineColorClass(color: Wine['wineColor']): string {
  switch (color) {
    case 'red':
      return 'bg-wine-900';
    case 'white':
      return 'bg-yellow-100';
    case 'rosé':
      return 'bg-pink-300';
    case 'sparkling':
      return 'bg-yellow-50 border border-yellow-200';
    case 'dessert':
      return 'bg-amber-500';
    case 'fortified':
      return 'bg-amber-800';
    case 'orange':
      return 'bg-orange-400';
    default:
      return 'bg-gray-400';
  }
}

export function searchWines(wines: Wine[], query: string): Wine[] {
  if (!query.trim()) return wines;

  const lowerQuery = query.toLowerCase();
  return wines.filter(wine => {
    const searchFields = [
      wine.producer,
      wine.wineName,
      wine.region,
      wine.country,
      wine.appellation,
      wine.storageLocation,
      wine.vintage?.toString(),
      ...wine.varietals.map(v => v.varietal),
      ...wine.pairingSuggestions,
    ];

    return searchFields.some(field =>
      field && field.toLowerCase().includes(lowerQuery)
    );
  });
}

export function filterWines(
  wines: Wine[],
  filters: {
    wineColor?: Wine['wineColor'];
    drinkingStatus?: DrinkingStatus;
    minPrice?: number;
    maxPrice?: number;
    region?: string;
    varietal?: string;
  }
): Wine[] {
  return wines.filter(wine => {
    if (filters.wineColor && wine.wineColor !== filters.wineColor) return false;
    if (filters.drinkingStatus && calculateDrinkingStatus(wine) !== filters.drinkingStatus) return false;
    if (filters.minPrice !== undefined && (wine.purchasePrice ?? 0) < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && (wine.purchasePrice ?? Infinity) > filters.maxPrice) return false;
    if (filters.region && !wine.region.toLowerCase().includes(filters.region.toLowerCase())) return false;
    if (filters.varietal && !wine.varietals.some(v => v.varietal.toLowerCase().includes(filters.varietal!.toLowerCase()))) return false;
    return true;
  });
}

export function getCollectionStats(wines: Wine[]) {
  const totalBottles = wines.reduce((sum, w) => sum + w.quantity, 0);
  const totalValue = wines.reduce((sum, w) => sum + (w.purchasePrice || 0) * w.quantity, 0);

  const byColor: Record<string, number> = {};
  const byRegion: Record<string, number> = {};
  const byVarietal: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  wines.forEach(wine => {
    byColor[wine.wineColor] = (byColor[wine.wineColor] || 0) + wine.quantity;
    byRegion[wine.region] = (byRegion[wine.region] || 0) + wine.quantity;

    const status = calculateDrinkingStatus(wine);
    byStatus[status] = (byStatus[status] || 0) + wine.quantity;

    wine.varietals.forEach(v => {
      byVarietal[v.varietal] = (byVarietal[v.varietal] || 0) + wine.quantity;
    });
  });

  const readyToDrink = wines.filter(w => calculateDrinkingStatus(w) === 'ready');
  const needsAging = wines.filter(w => calculateDrinkingStatus(w) === 'needs-aging');
  const pastPeak = wines.filter(w => calculateDrinkingStatus(w) === 'past-peak');

  return {
    totalBottles,
    totalValue,
    uniqueWines: wines.length,
    byColor,
    byRegion,
    byVarietal,
    byStatus,
    readyToDrink,
    needsAging,
    pastPeak,
  };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}
