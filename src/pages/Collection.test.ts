import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Wine } from '../types';

// Mock functions matching the Collection.tsx implementation
type SortOption = 'newest' | 'oldest' | 'price-high' | 'price-low' | 'drink-window' | 'vintage-new' | 'vintage-old' | 'name';
type DrinkWindowFilter = 'any' | 'ready' | 'aging' | 'ending-soon' | 'past-prime';

function sortWines(wines: Wine[], sortBy: SortOption): Wine[] {
  const sorted = [...wines];
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());
    case 'price-high':
      return sorted.sort((a, b) => (b.purchasePrice || 0) - (a.purchasePrice || 0));
    case 'price-low':
      return sorted.sort((a, b) => (a.purchasePrice || 0) - (b.purchasePrice || 0));
    case 'drink-window':
      return sorted.sort((a, b) => {
        const aEnd = a.drinkingWindowEnd || 9999;
        const bEnd = b.drinkingWindowEnd || 9999;
        return aEnd - bEnd;
      });
    case 'vintage-new':
      return sorted.sort((a, b) => (b.vintage || 0) - (a.vintage || 0));
    case 'vintage-old':
      return sorted.sort((a, b) => (a.vintage || 9999) - (b.vintage || 9999));
    case 'name':
      return sorted.sort((a, b) => a.producer.localeCompare(b.producer));
    default:
      return sorted;
  }
}

// Mock stoplight helper to match actual implementation
function getDrinkingWindowStoplight(wine: Wine): 'green' | 'yellow' | 'red' | 'blue' | 'unknown' {
  const currentYear = new Date().getFullYear();

  if (!wine.drinkingWindowStart && !wine.drinkingWindowEnd) {
    return 'unknown';
  }

  if (wine.drinkingWindowEnd && currentYear > wine.drinkingWindowEnd) {
    return 'red';
  }

  if (wine.drinkingWindowStart && currentYear < wine.drinkingWindowStart) {
    return 'blue';
  }

  if (wine.drinkingWindowEnd) {
    const yearsRemaining = wine.drinkingWindowEnd - currentYear;
    if (yearsRemaining > 0 && yearsRemaining <= 2) {
      return 'yellow';
    }
  }

  return 'green';
}

function filterByDrinkWindow(wines: Wine[], filter: DrinkWindowFilter): Wine[] {
  if (filter === 'any') return wines;

  return wines.filter(wine => {
    const stoplight = getDrinkingWindowStoplight(wine);
    switch (filter) {
      case 'ready':
        return stoplight === 'green';
      case 'aging':
        return stoplight === 'blue';
      case 'ending-soon':
        return stoplight === 'yellow';
      case 'past-prime':
        return stoplight === 'red';
      default:
        return true;
    }
  });
}

// Helper to create mock wine
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

describe('sortWines', () => {
  const wines: Wine[] = [
    createMockWine({
      id: '1',
      producer: 'Caymus',
      dateAdded: '2024-03-15T00:00:00Z',
      purchasePrice: 85,
      vintage: 2019,
      drinkingWindowEnd: 2030,
    }),
    createMockWine({
      id: '2',
      producer: 'Opus One',
      dateAdded: '2024-01-10T00:00:00Z',
      purchasePrice: 400,
      vintage: 2018,
      drinkingWindowEnd: 2035,
    }),
    createMockWine({
      id: '3',
      producer: 'Acacia',
      dateAdded: '2024-06-20T00:00:00Z',
      purchasePrice: 35,
      vintage: 2022,
      drinkingWindowEnd: 2026,
    }),
  ];

  it('sorts by newest (most recently added first)', () => {
    const sorted = sortWines(wines, 'newest');
    expect(sorted[0].producer).toBe('Acacia');
    expect(sorted[1].producer).toBe('Caymus');
    expect(sorted[2].producer).toBe('Opus One');
  });

  it('sorts by oldest (earliest added first)', () => {
    const sorted = sortWines(wines, 'oldest');
    expect(sorted[0].producer).toBe('Opus One');
    expect(sorted[1].producer).toBe('Caymus');
    expect(sorted[2].producer).toBe('Acacia');
  });

  it('sorts by price high to low', () => {
    const sorted = sortWines(wines, 'price-high');
    expect(sorted[0].purchasePrice).toBe(400);
    expect(sorted[1].purchasePrice).toBe(85);
    expect(sorted[2].purchasePrice).toBe(35);
  });

  it('sorts by price low to high', () => {
    const sorted = sortWines(wines, 'price-low');
    expect(sorted[0].purchasePrice).toBe(35);
    expect(sorted[1].purchasePrice).toBe(85);
    expect(sorted[2].purchasePrice).toBe(400);
  });

  it('sorts by drink window (soonest ending first)', () => {
    const sorted = sortWines(wines, 'drink-window');
    expect(sorted[0].drinkingWindowEnd).toBe(2026);
    expect(sorted[1].drinkingWindowEnd).toBe(2030);
    expect(sorted[2].drinkingWindowEnd).toBe(2035);
  });

  it('sorts by vintage newest first', () => {
    const sorted = sortWines(wines, 'vintage-new');
    expect(sorted[0].vintage).toBe(2022);
    expect(sorted[1].vintage).toBe(2019);
    expect(sorted[2].vintage).toBe(2018);
  });

  it('sorts by vintage oldest first', () => {
    const sorted = sortWines(wines, 'vintage-old');
    expect(sorted[0].vintage).toBe(2018);
    expect(sorted[1].vintage).toBe(2019);
    expect(sorted[2].vintage).toBe(2022);
  });

  it('sorts by name alphabetically', () => {
    const sorted = sortWines(wines, 'name');
    expect(sorted[0].producer).toBe('Acacia');
    expect(sorted[1].producer).toBe('Caymus');
    expect(sorted[2].producer).toBe('Opus One');
  });

  it('handles wines with missing price (treats as 0)', () => {
    const winesWithMissingPrice = [
      createMockWine({ id: '1', purchasePrice: 100 }),
      createMockWine({ id: '2', purchasePrice: undefined }),
      createMockWine({ id: '3', purchasePrice: 50 }),
    ];
    const sorted = sortWines(winesWithMissingPrice, 'price-low');
    expect(sorted[0].purchasePrice).toBeUndefined();
    expect(sorted[1].purchasePrice).toBe(50);
    expect(sorted[2].purchasePrice).toBe(100);
  });

  it('handles wines with missing drinking window (pushes to end)', () => {
    const winesWithMissingWindow = [
      createMockWine({ id: '1', drinkingWindowEnd: 2028 }),
      createMockWine({ id: '2', drinkingWindowEnd: undefined }),
      createMockWine({ id: '3', drinkingWindowEnd: 2025 }),
    ];
    const sorted = sortWines(winesWithMissingWindow, 'drink-window');
    expect(sorted[0].drinkingWindowEnd).toBe(2025);
    expect(sorted[1].drinkingWindowEnd).toBe(2028);
    expect(sorted[2].drinkingWindowEnd).toBeUndefined();
  });

  it('handles wines with null vintage', () => {
    const winesWithNullVintage = [
      createMockWine({ id: '1', vintage: 2020 }),
      createMockWine({ id: '2', vintage: null }),
      createMockWine({ id: '3', vintage: 2015 }),
    ];

    const sortedNew = sortWines(winesWithNullVintage, 'vintage-new');
    expect(sortedNew[0].vintage).toBe(2020);
    expect(sortedNew[1].vintage).toBe(2015);
    expect(sortedNew[2].vintage).toBeNull(); // null treated as 0

    const sortedOld = sortWines(winesWithNullVintage, 'vintage-old');
    expect(sortedOld[0].vintage).toBe(2015);
    expect(sortedOld[1].vintage).toBe(2020);
    expect(sortedOld[2].vintage).toBeNull(); // null treated as 9999, pushed to end
  });

  it('does not mutate the original array', () => {
    const original = [...wines];
    sortWines(wines, 'newest');
    expect(wines).toEqual(original);
  });
});

describe('filterByDrinkWindow', () => {
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
      producer: 'Ready Wine',
      drinkingWindowStart: 2020,
      drinkingWindowEnd: 2035, // Plenty of time - green
    }),
    createMockWine({
      id: '2',
      producer: 'Ending Soon Wine',
      drinkingWindowStart: 2020,
      drinkingWindowEnd: 2027, // Within 2 years - yellow
    }),
    createMockWine({
      id: '3',
      producer: 'Aging Wine',
      drinkingWindowStart: 2030,
      drinkingWindowEnd: 2045, // Still aging - blue
    }),
    createMockWine({
      id: '4',
      producer: 'Past Prime Wine',
      drinkingWindowStart: 2018,
      drinkingWindowEnd: 2024, // Past drinking window - red
    }),
    createMockWine({
      id: '5',
      producer: 'Unknown Wine',
      drinkingWindowStart: undefined,
      drinkingWindowEnd: undefined, // No window - unknown
    }),
  ];

  it('returns all wines when filter is "any"', () => {
    const filtered = filterByDrinkWindow(wines, 'any');
    expect(filtered).toHaveLength(5);
  });

  it('filters for ready to drink wines (green)', () => {
    const filtered = filterByDrinkWindow(wines, 'ready');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].producer).toBe('Ready Wine');
  });

  it('filters for aging wines (blue)', () => {
    const filtered = filterByDrinkWindow(wines, 'aging');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].producer).toBe('Aging Wine');
  });

  it('filters for wines ending soon (yellow)', () => {
    const filtered = filterByDrinkWindow(wines, 'ending-soon');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].producer).toBe('Ending Soon Wine');
  });

  it('filters for past prime wines (red)', () => {
    const filtered = filterByDrinkWindow(wines, 'past-prime');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].producer).toBe('Past Prime Wine');
  });

  it('does not include unknown wines in any specific filter', () => {
    expect(filterByDrinkWindow(wines, 'ready').find(w => w.producer === 'Unknown Wine')).toBeUndefined();
    expect(filterByDrinkWindow(wines, 'aging').find(w => w.producer === 'Unknown Wine')).toBeUndefined();
    expect(filterByDrinkWindow(wines, 'ending-soon').find(w => w.producer === 'Unknown Wine')).toBeUndefined();
    expect(filterByDrinkWindow(wines, 'past-prime').find(w => w.producer === 'Unknown Wine')).toBeUndefined();
  });

  it('handles empty wine array', () => {
    const filtered = filterByDrinkWindow([], 'ready');
    expect(filtered).toHaveLength(0);
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

  it('returns green for wine in optimal drinking window with time remaining', () => {
    const wine = createMockWine({
      drinkingWindowStart: 2020,
      drinkingWindowEnd: 2035,
    });
    expect(getDrinkingWindowStoplight(wine)).toBe('green');
  });

  it('returns yellow when 1 year from end of drinking window', () => {
    const wine = createMockWine({
      drinkingWindowStart: 2020,
      drinkingWindowEnd: 2027,
    });
    expect(getDrinkingWindowStoplight(wine)).toBe('yellow');
  });

  it('returns yellow when 2 years from end of drinking window', () => {
    const wine = createMockWine({
      drinkingWindowStart: 2020,
      drinkingWindowEnd: 2028,
    });
    expect(getDrinkingWindowStoplight(wine)).toBe('yellow');
  });

  it('returns red when past drinking window', () => {
    const wine = createMockWine({
      drinkingWindowStart: 2018,
      drinkingWindowEnd: 2024,
    });
    expect(getDrinkingWindowStoplight(wine)).toBe('red');
  });

  it('returns blue when before drinking window starts', () => {
    const wine = createMockWine({
      drinkingWindowStart: 2030,
      drinkingWindowEnd: 2045,
    });
    expect(getDrinkingWindowStoplight(wine)).toBe('blue');
  });

  it('returns unknown when no drinking window defined', () => {
    const wine = createMockWine({
      drinkingWindowStart: undefined,
      drinkingWindowEnd: undefined,
    });
    expect(getDrinkingWindowStoplight(wine)).toBe('unknown');
  });
});
