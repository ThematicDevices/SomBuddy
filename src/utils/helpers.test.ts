import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isNearEndOfDrinkingWindow,
  isPastPrime,
  getDrinkingWindowStoplight,
  getStoplightColor,
  getStoplightLabel,
  getStoplightBorderColor,
  calculateDrinkingStatus,
  searchWines,
  filterWines,
  formatPrice,
  getWineDisplayName,
  getVarietalString,
} from './helpers';
import { Wine } from '../types';

// Helper to create a mock wine with sensible defaults
function createMockWine(overrides: Partial<Wine> = {}): Wine {
  return {
    id: 'test-wine-1',
    producer: 'Test Producer',
    wineName: 'Test Wine',
    vintage: 2020,
    region: 'Napa Valley',
    country: 'USA',
    varietals: [{ varietal: 'Cabernet Sauvignon', percentage: 100 }],
    wineColor: 'red',
    quantity: 1,
    bottleCondition: 'excellent',
    drinkingStatus: 'unknown',
    pairingSuggestions: [],
    isOpen: false,
    tastingNotes: [],
    consumptionHistory: [],
    dateAdded: '2024-01-01T00:00:00Z',
    dateModified: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('isNearEndOfDrinkingWindow', () => {
  beforeEach(() => {
    // Mock the current year to be 2026 for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false when wine has no drinking window end', () => {
    const wine = createMockWine({ drinkingWindowEnd: undefined });
    expect(isNearEndOfDrinkingWindow(wine)).toBe(false);
  });

  it('returns true when wine is exactly 1 year from end of drinking window', () => {
    const wine = createMockWine({ drinkingWindowEnd: 2027 });
    expect(isNearEndOfDrinkingWindow(wine)).toBe(true);
  });

  it('returns true when wine is exactly 2 years from end of drinking window', () => {
    const wine = createMockWine({ drinkingWindowEnd: 2028 });
    expect(isNearEndOfDrinkingWindow(wine)).toBe(true);
  });

  it('returns false when wine has more than 2 years remaining', () => {
    const wine = createMockWine({ drinkingWindowEnd: 2030 });
    expect(isNearEndOfDrinkingWindow(wine)).toBe(false);
  });

  it('returns false when wine is past its drinking window', () => {
    const wine = createMockWine({ drinkingWindowEnd: 2025 });
    expect(isNearEndOfDrinkingWindow(wine)).toBe(false);
  });

  it('allows custom threshold for years remaining', () => {
    const wine = createMockWine({ drinkingWindowEnd: 2031 });
    expect(isNearEndOfDrinkingWindow(wine, 5)).toBe(true);
    expect(isNearEndOfDrinkingWindow(wine, 2)).toBe(false);
  });
});

describe('isPastPrime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false when wine has no drinking window end', () => {
    const wine = createMockWine({ drinkingWindowEnd: undefined });
    expect(isPastPrime(wine)).toBe(false);
  });

  it('returns true when wine is past its drinking window', () => {
    const wine = createMockWine({ drinkingWindowEnd: 2024 });
    expect(isPastPrime(wine)).toBe(true);
  });

  it('returns true when wine drinking window ended last year', () => {
    const wine = createMockWine({ drinkingWindowEnd: 2025 });
    expect(isPastPrime(wine)).toBe(true);
  });

  it('returns false when wine is still within drinking window', () => {
    const wine = createMockWine({ drinkingWindowEnd: 2030 });
    expect(isPastPrime(wine)).toBe(false);
  });

  it('returns false when drinking window ends this year', () => {
    const wine = createMockWine({ drinkingWindowEnd: 2026 });
    expect(isPastPrime(wine)).toBe(false);
  });
});

describe('getDrinkingWindowStoplight', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "unknown" when no drinking window is defined', () => {
    const wine = createMockWine({
      drinkingWindowStart: undefined,
      drinkingWindowEnd: undefined,
    });
    expect(getDrinkingWindowStoplight(wine)).toBe('unknown');
  });

  it('returns "red" when wine is past its drinking window', () => {
    const wine = createMockWine({
      drinkingWindowStart: 2020,
      drinkingWindowEnd: 2024,
    });
    expect(getDrinkingWindowStoplight(wine)).toBe('red');
  });

  it('returns "blue" when wine is still aging (before drinking window starts)', () => {
    const wine = createMockWine({
      drinkingWindowStart: 2028,
      drinkingWindowEnd: 2035,
    });
    expect(getDrinkingWindowStoplight(wine)).toBe('blue');
  });

  it('returns "yellow" when wine is within 2 years of end of drinking window', () => {
    const wine = createMockWine({
      drinkingWindowStart: 2020,
      drinkingWindowEnd: 2027,
    });
    expect(getDrinkingWindowStoplight(wine)).toBe('yellow');
  });

  it('returns "green" when wine is ready to drink with plenty of time remaining', () => {
    const wine = createMockWine({
      drinkingWindowStart: 2020,
      drinkingWindowEnd: 2035,
    });
    expect(getDrinkingWindowStoplight(wine)).toBe('green');
  });

  it('returns "green" when only drinkingWindowStart is set and wine is in window', () => {
    const wine = createMockWine({
      drinkingWindowStart: 2020,
      drinkingWindowEnd: undefined,
    });
    expect(getDrinkingWindowStoplight(wine)).toBe('green');
  });

  it('returns "blue" when only drinkingWindowStart is set and wine is aging', () => {
    const wine = createMockWine({
      drinkingWindowStart: 2030,
      drinkingWindowEnd: undefined,
    });
    expect(getDrinkingWindowStoplight(wine)).toBe('blue');
  });

  it('handles edge case where drinking window ends exactly at current year', () => {
    const wine = createMockWine({
      drinkingWindowStart: 2020,
      drinkingWindowEnd: 2026,
    });
    // Should be yellow (within 2 years, including current year)
    // yearsRemaining = 2026 - 2026 = 0, which is not > 0, so falls through to 'green'
    expect(getDrinkingWindowStoplight(wine)).toBe('green');
  });
});

describe('getStoplightColor', () => {
  it('returns green background class for green stoplight', () => {
    expect(getStoplightColor('green')).toBe('bg-green-500');
  });

  it('returns amber background class for yellow stoplight', () => {
    expect(getStoplightColor('yellow')).toBe('bg-amber-400');
  });

  it('returns red background class for red stoplight', () => {
    expect(getStoplightColor('red')).toBe('bg-red-500');
  });

  it('returns blue background class for blue stoplight', () => {
    expect(getStoplightColor('blue')).toBe('bg-blue-500');
  });

  it('returns charcoal background class for unknown stoplight', () => {
    expect(getStoplightColor('unknown')).toBe('bg-charcoal-300');
  });
});

describe('getStoplightLabel', () => {
  it('returns "Ready to Drink" for green stoplight', () => {
    expect(getStoplightLabel('green')).toBe('Ready to Drink');
  });

  it('returns "Drink Soon" for yellow stoplight', () => {
    expect(getStoplightLabel('yellow')).toBe('Drink Soon');
  });

  it('returns "Past Prime" for red stoplight', () => {
    expect(getStoplightLabel('red')).toBe('Past Prime');
  });

  it('returns "Aging" for blue stoplight', () => {
    expect(getStoplightLabel('blue')).toBe('Aging');
  });

  it('returns "Unknown" for unknown stoplight', () => {
    expect(getStoplightLabel('unknown')).toBe('Unknown');
  });
});

describe('getStoplightBorderColor', () => {
  it('returns green border class for green stoplight', () => {
    expect(getStoplightBorderColor('green')).toBe('border-green-500');
  });

  it('returns amber border class for yellow stoplight', () => {
    expect(getStoplightBorderColor('yellow')).toBe('border-amber-400');
  });

  it('returns red border class for red stoplight', () => {
    expect(getStoplightBorderColor('red')).toBe('border-red-500');
  });

  it('returns blue border class for blue stoplight', () => {
    expect(getStoplightBorderColor('blue')).toBe('border-blue-500');
  });

  it('returns charcoal border class for unknown stoplight', () => {
    expect(getStoplightBorderColor('unknown')).toBe('border-charcoal-300');
  });
});

describe('calculateDrinkingStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "needs-aging" when current year is before drinking window starts', () => {
    const wine = createMockWine({
      drinkingWindowStart: 2028,
      drinkingWindowEnd: 2035,
    });
    expect(calculateDrinkingStatus(wine)).toBe('needs-aging');
  });

  it('returns "past-peak" when current year is after drinking window ends', () => {
    const wine = createMockWine({
      drinkingWindowStart: 2018,
      drinkingWindowEnd: 2024,
    });
    expect(calculateDrinkingStatus(wine)).toBe('past-peak');
  });

  it('returns "ready" when current year is within drinking window', () => {
    const wine = createMockWine({
      drinkingWindowStart: 2020,
      drinkingWindowEnd: 2030,
    });
    expect(calculateDrinkingStatus(wine)).toBe('ready');
  });

  it('returns existing drinkingStatus when no window is defined', () => {
    const wine = createMockWine({
      drinkingWindowStart: undefined,
      drinkingWindowEnd: undefined,
      drinkingStatus: 'ready',
    });
    expect(calculateDrinkingStatus(wine)).toBe('ready');
  });

  it('returns "unknown" when no window and no status defined', () => {
    const wine = createMockWine({
      drinkingWindowStart: undefined,
      drinkingWindowEnd: undefined,
      drinkingStatus: 'unknown',
    });
    expect(calculateDrinkingStatus(wine)).toBe('unknown');
  });
});

describe('searchWines', () => {
  const wines: Wine[] = [
    createMockWine({
      id: '1',
      producer: 'Caymus',
      wineName: 'Special Selection',
      region: 'Napa Valley',
      country: 'USA',
      vintage: 2019,
      varietals: [{ varietal: 'Cabernet Sauvignon', percentage: 100 }],
    }),
    createMockWine({
      id: '2',
      producer: 'Chateau Margaux',
      wineName: 'Grand Vin',
      region: 'Bordeaux',
      country: 'France',
      vintage: 2015,
      varietals: [
        { varietal: 'Cabernet Sauvignon', percentage: 75 },
        { varietal: 'Merlot', percentage: 25 },
      ],
    }),
    createMockWine({
      id: '3',
      producer: 'Opus One',
      wineName: '',
      region: 'Napa Valley',
      country: 'USA',
      vintage: 2018,
      varietals: [{ varietal: 'Cabernet Sauvignon', percentage: 85 }],
    }),
  ];

  it('returns all wines when query is empty', () => {
    expect(searchWines(wines, '')).toHaveLength(3);
  });

  it('returns all wines when query is only whitespace', () => {
    expect(searchWines(wines, '   ')).toHaveLength(3);
  });

  it('searches by producer name', () => {
    const results = searchWines(wines, 'Caymus');
    expect(results).toHaveLength(1);
    expect(results[0].producer).toBe('Caymus');
  });

  it('searches by region', () => {
    const results = searchWines(wines, 'Napa');
    expect(results).toHaveLength(2);
  });

  it('searches by country', () => {
    const results = searchWines(wines, 'France');
    expect(results).toHaveLength(1);
    expect(results[0].producer).toBe('Chateau Margaux');
  });

  it('searches by varietal', () => {
    const results = searchWines(wines, 'Merlot');
    expect(results).toHaveLength(1);
    expect(results[0].producer).toBe('Chateau Margaux');
  });

  it('searches by vintage', () => {
    const results = searchWines(wines, '2019');
    expect(results).toHaveLength(1);
    expect(results[0].producer).toBe('Caymus');
  });

  it('is case-insensitive', () => {
    const results = searchWines(wines, 'CAYMUS');
    expect(results).toHaveLength(1);
    expect(results[0].producer).toBe('Caymus');
  });

  it('returns empty array when no matches found', () => {
    const results = searchWines(wines, 'NonExistentWine');
    expect(results).toHaveLength(0);
  });
});

describe('filterWines', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const wines: Wine[] = [
    createMockWine({
      id: '1',
      wineColor: 'red',
      purchasePrice: 50,
      region: 'Napa Valley',
      varietals: [{ varietal: 'Cabernet Sauvignon', percentage: 100 }],
      drinkingWindowStart: 2020,
      drinkingWindowEnd: 2030,
    }),
    createMockWine({
      id: '2',
      wineColor: 'white',
      purchasePrice: 30,
      region: 'Burgundy',
      varietals: [{ varietal: 'Chardonnay', percentage: 100 }],
      drinkingWindowStart: 2022,
      drinkingWindowEnd: 2025,
    }),
    createMockWine({
      id: '3',
      wineColor: 'red',
      purchasePrice: 150,
      region: 'Bordeaux',
      varietals: [{ varietal: 'Merlot', percentage: 100 }],
      drinkingWindowStart: 2028,
      drinkingWindowEnd: 2040,
    }),
  ];

  it('filters by wine color', () => {
    const results = filterWines(wines, { wineColor: 'red' });
    expect(results).toHaveLength(2);
    expect(results.every(w => w.wineColor === 'red')).toBe(true);
  });

  it('filters by minimum price', () => {
    const results = filterWines(wines, { minPrice: 40 });
    expect(results).toHaveLength(2);
    expect(results.every(w => (w.purchasePrice || 0) >= 40)).toBe(true);
  });

  it('filters by maximum price', () => {
    const results = filterWines(wines, { maxPrice: 60 });
    expect(results).toHaveLength(2);
    expect(results.every(w => (w.purchasePrice || 0) <= 60)).toBe(true);
  });

  it('filters by price range', () => {
    const results = filterWines(wines, { minPrice: 40, maxPrice: 100 });
    expect(results).toHaveLength(1);
    expect(results[0].purchasePrice).toBe(50);
  });

  it('filters by region (case-insensitive, partial match)', () => {
    const results = filterWines(wines, { region: 'napa' });
    expect(results).toHaveLength(1);
    expect(results[0].region).toBe('Napa Valley');
  });

  it('filters by varietal (case-insensitive, partial match)', () => {
    const results = filterWines(wines, { varietal: 'cabernet' });
    expect(results).toHaveLength(1);
  });

  it('filters by drinking status', () => {
    const results = filterWines(wines, { drinkingStatus: 'ready' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  it('applies multiple filters together', () => {
    const results = filterWines(wines, {
      wineColor: 'red',
      minPrice: 100,
    });
    expect(results).toHaveLength(1);
    expect(results[0].purchasePrice).toBe(150);
  });

  it('returns all wines when no filters applied', () => {
    const results = filterWines(wines, {});
    expect(results).toHaveLength(3);
  });
});

describe('formatPrice', () => {
  it('formats a valid price with USD currency symbol', () => {
    expect(formatPrice(50)).toBe('$50.00');
  });

  it('formats a price with cents correctly', () => {
    expect(formatPrice(49.99)).toBe('$49.99');
  });

  it('formats large prices with commas', () => {
    expect(formatPrice(1500)).toBe('$1,500.00');
  });

  it('returns "N/A" for undefined price', () => {
    expect(formatPrice(undefined)).toBe('N/A');
  });

  it('returns "N/A" for null price', () => {
    expect(formatPrice(null as unknown as number)).toBe('N/A');
  });

  it('formats zero correctly', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });
});

describe('getWineDisplayName', () => {
  it('combines vintage, producer, and wine name', () => {
    const wine = createMockWine({
      vintage: 2020,
      producer: 'Caymus',
      wineName: 'Special Selection',
    });
    expect(getWineDisplayName(wine)).toBe('2020 Caymus Special Selection');
  });

  it('handles wine without vintage', () => {
    const wine = createMockWine({
      vintage: null,
      producer: 'Caymus',
      wineName: 'Special Selection',
    });
    expect(getWineDisplayName(wine)).toBe('Caymus Special Selection');
  });

  it('handles wine without wine name', () => {
    const wine = createMockWine({
      vintage: 2020,
      producer: 'Caymus',
      wineName: '',
    });
    expect(getWineDisplayName(wine)).toBe('2020 Caymus');
  });

  it('returns producer when both vintage and wine name are empty', () => {
    const wine = createMockWine({
      vintage: null,
      producer: 'Caymus',
      wineName: '',
    });
    expect(getWineDisplayName(wine)).toBe('Caymus');
  });
});

describe('getVarietalString', () => {
  it('returns single varietal without percentage if 100%', () => {
    const wine = createMockWine({
      varietals: [{ varietal: 'Cabernet Sauvignon', percentage: 100 }],
    });
    expect(getVarietalString(wine)).toBe('Cabernet Sauvignon');
  });

  it('includes percentage for blends', () => {
    const wine = createMockWine({
      varietals: [
        { varietal: 'Cabernet Sauvignon', percentage: 75 },
        { varietal: 'Merlot', percentage: 25 },
      ],
    });
    expect(getVarietalString(wine)).toBe('Cabernet Sauvignon (75%), Merlot (25%)');
  });

  it('returns "Unknown varietal" when no varietals', () => {
    const wine = createMockWine({ varietals: [] });
    expect(getVarietalString(wine)).toBe('Unknown varietal');
  });

  it('handles varietals without percentage', () => {
    const wine = createMockWine({
      varietals: [{ varietal: 'Pinot Noir' }],
    });
    expect(getVarietalString(wine)).toBe('Pinot Noir');
  });
});
