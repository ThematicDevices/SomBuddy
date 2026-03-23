import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAllWines } from '../hooks/useWineQueries';
import { WineCard, WineCardSkeletonList } from '../components';
import { searchWines, filterWines, isNearEndOfDrinkingWindow, isPastPrime, getDrinkingWindowStoplight } from '../utils';
import { DrinkingStatus, WineColor, wineColorOptions, Wine } from '../types';
import { Search, SlidersHorizontal, X, Wine as WineIcon, PlusCircle, Loader2, ChevronDown, ArrowUpDown, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const PRICES_LAST_UPDATED_KEY = 'sombuddy_prices_last_updated';
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function formatLastUpdated(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

type SortOption = 'newest' | 'oldest' | 'price-high' | 'price-low' | 'drink-window' | 'vintage-new' | 'vintage-old' | 'name';
type DrinkWindowFilter = 'any' | 'ready' | 'aging' | 'ending-soon' | 'past-prime';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Recently Added' },
  { value: 'oldest', label: 'Oldest Added' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'drink-window', label: 'Drink Soonest First' },
  { value: 'vintage-new', label: 'Vintage: Newest' },
  { value: 'vintage-old', label: 'Vintage: Oldest' },
  { value: 'name', label: 'Name A-Z' },
];

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
        return stoplight === 'yellow' || isNearEndOfDrinkingWindow(wine, 2);
      case 'past-prime':
        return stoplight === 'red' || isPastPrime(wine);
      default:
        return true;
    }
  });
}

export function Collection() {
  const { wines, isLoading, isFetching, hasNextPage, fetchNextPage, totalCount } = useAllWines();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useAuth();
  const { showToast } = useToast();
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [lastPricesUpdated, setLastPricesUpdated] = useState<number | null>(() => {
    const stored = localStorage.getItem(PRICES_LAST_UPDATED_KEY);
    return stored ? Number(stored) : null;
  });

  const isPriceUpdateOnCooldown = lastPricesUpdated !== null && Date.now() - lastPricesUpdated < COOLDOWN_MS;

  const handleRefreshPrices = async () => {
    if (!session?.access_token || isUpdatingPrices || isPriceUpdateOnCooldown) return;
    setIsUpdatingPrices(true);
    try {
      const response = await fetch('/api/update-prices', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) throw new Error('Request failed');
      const now = Date.now();
      localStorage.setItem(PRICES_LAST_UPDATED_KEY, String(now));
      setLastPricesUpdated(now);
      showToast('Prices updated successfully', 'success');
    } catch {
      showToast('Failed to update prices', 'error');
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'newest');
  const [drinkWindowFilter, setDrinkWindowFilter] = useState<DrinkWindowFilter>(
    (searchParams.get('drinkWindow') as DrinkWindowFilter) || 'any'
  );
  const [filters, setFilters] = useState({
    wineColor: searchParams.get('color') as WineColor | undefined,
    drinkingStatus: searchParams.get('status') as DrinkingStatus | undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    region: searchParams.get('region') || undefined,
    varietal: searchParams.get('varietal') || undefined,
  });

  // Open filters if there's a drink window filter from URL
  useEffect(() => {
    if (searchParams.get('drinkWindow')) {
      setShowFilters(true);
    }
  }, [searchParams]);

  // Virtual scrolling container ref
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredWines = useMemo(() => {
    let result = wines;

    if (searchQuery) {
      result = searchWines(result, searchQuery);
    }

    if (Object.values(filters).some(v => v !== undefined)) {
      result = filterWines(result, filters);
    }

    // Apply drink window filter (from Dashboard links)
    result = filterByDrinkWindow(result, drinkWindowFilter);

    // Apply sorting
    result = sortWines(result, sortBy);

    return result;
  }, [wines, searchQuery, filters, drinkWindowFilter, sortBy]);

  const uniqueRegions = useMemo(() =>
    [...new Set(wines.map(w => w.region))].sort(),
    [wines]
  );

  const uniqueVarietals = useMemo(() =>
    [...new Set(wines.flatMap(w => w.varietals.map(v => v.varietal)))].sort(),
    [wines]
  );

  const clearFilters = () => {
    setFilters({
      wineColor: undefined,
      drinkingStatus: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      region: undefined,
      varietal: undefined,
    });
    setSearchQuery('');
    setSearchParams({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined) || searchQuery;

  // Virtual list setup - 2 columns on desktop, 1 on mobile
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(filteredWines.length / 2),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 260, // Estimated row height
    overscan: 5,
  });

  // Load more when scrolled near bottom
  useEffect(() => {
    const lastItem = rowVirtualizer.getVirtualItems().at(-1);
    const totalRows = Math.ceil(filteredWines.length / 2);

    if (
      lastItem &&
      lastItem.index >= totalRows - 3 &&
      hasNextPage &&
      !isFetching
    ) {
      fetchNextPage();
    }
  }, [rowVirtualizer.getVirtualItems(), hasNextPage, isFetching, fetchNextPage, filteredWines.length]);

  // Show loading state on initial load
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-charcoal-900">🍷 Wine Collection</h1>
            <p className="text-charcoal-500">Loading your wines...</p>
          </div>
        </div>
        <WineCardSkeletonList count={6} />
      </div>
    );
  }

  // Show empty state
  if (wines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 bg-wine-50 rounded-full flex items-center justify-center mb-6">
          <WineIcon className="w-12 h-12 text-wine-400" />
        </div>
        <h2 className="text-2xl font-display font-bold text-charcoal-900 mb-2">
          Your Collection is Empty
        </h2>
        <p className="text-charcoal-500 text-center max-w-md mb-8">
          Start building your wine collection by adding your first bottle.
        </p>
        <Link
          to="/add"
          className="flex items-center gap-2 px-6 py-3 bg-wine-900 text-white rounded-lg hover:bg-wine-800 transition-colors font-medium"
        >
          <PlusCircle className="w-5 h-5" />
          Add Your First Wine
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-charcoal-900">🍷 Wine Collection</h1>
          <p className="text-charcoal-500">
            {filteredWines.length} of {totalCount} wines
            {isFetching && <span className="ml-2 text-wine-600">• Syncing...</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <button
              onClick={handleRefreshPrices}
              disabled={isUpdatingPrices || isPriceUpdateOnCooldown}
              className="flex items-center gap-2 px-4 py-2 bg-wine-900 text-white rounded-lg hover:bg-wine-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingPrices ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isUpdatingPrices ? 'Updating...' : 'Refresh Prices'}
            </button>
            {lastPricesUpdated !== null && (
              <span className="text-xs text-charcoal-400 mt-0.5">
                Last updated: {formatLastUpdated(lastPricesUpdated)}
              </span>
            )}
          </div>
          <Link
            to="/add"
            className="flex items-center gap-2 px-4 py-2 bg-wine-900 text-white rounded-lg hover:bg-wine-800 transition-colors font-medium text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Add Wine
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-charcoal-100 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by producer, varietal, region..."
              className="w-full pl-10 pr-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-9 pr-8 py-2.5 border border-charcoal-200 rounded-lg text-sm focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors bg-white cursor-pointer"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'border-wine-300 bg-wine-50 text-wine-800'
                : 'border-charcoal-200 text-charcoal-600 hover:bg-charcoal-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-wine-700 text-white text-xs rounded-full flex items-center justify-center">
                {Object.values(filters).filter(v => v !== undefined).length + (searchQuery ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-charcoal-100">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
              <div>
                <label className="block text-xs font-medium text-charcoal-500 mb-1.5">Wine Type</label>
                <select
                  value={filters.wineColor || ''}
                  onChange={e => setFilters(f => ({ ...f, wineColor: e.target.value as WineColor || undefined }))}
                  className="w-full px-3 py-2 border border-charcoal-200 rounded-lg text-sm focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none"
                >
                  <option value="">All Types</option>
                  {wineColorOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-500 mb-1.5">Drink Window</label>
                <select
                  value={drinkWindowFilter}
                  onChange={e => setDrinkWindowFilter(e.target.value as DrinkWindowFilter)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none ${
                    drinkWindowFilter !== 'any'
                      ? 'border-wine-300 bg-wine-50'
                      : 'border-charcoal-200'
                  }`}
                >
                  <option value="any">Any</option>
                  <option value="ready">🟢 Ready to Drink</option>
                  <option value="aging">🔵 Aging</option>
                  <option value="ending-soon">🟡 Ending Soon</option>
                  <option value="past-prime">🔴 Past Prime</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-500 mb-1.5">Status</label>
                <select
                  value={filters.drinkingStatus || ''}
                  onChange={e => setFilters(f => ({ ...f, drinkingStatus: e.target.value as DrinkingStatus || undefined }))}
                  className="w-full px-3 py-2 border border-charcoal-200 rounded-lg text-sm focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none"
                >
                  <option value="">Any Status</option>
                  <option value="ready">Ready to Drink</option>
                  <option value="needs-aging">Needs Aging</option>
                  <option value="past-peak">Past Peak</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-500 mb-1.5">Region</label>
                <select
                  value={filters.region || ''}
                  onChange={e => setFilters(f => ({ ...f, region: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-charcoal-200 rounded-lg text-sm focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none"
                >
                  <option value="">All Regions</option>
                  {uniqueRegions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-500 mb-1.5">Varietal</label>
                <select
                  value={filters.varietal || ''}
                  onChange={e => setFilters(f => ({ ...f, varietal: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-charcoal-200 rounded-lg text-sm focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none"
                >
                  <option value="">All Varietals</option>
                  {uniqueVarietals.map(varietal => (
                    <option key={varietal} value={varietal}>{varietal}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-500 mb-1.5">Min Price</label>
                <input
                  type="number"
                  value={filters.minPrice || ''}
                  onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-charcoal-200 rounded-lg text-sm focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-500 mb-1.5">Max Price</label>
                <input
                  type="number"
                  value={filters.maxPrice || ''}
                  onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="No limit"
                  className="w-full px-3 py-2 border border-charcoal-200 rounded-lg text-sm focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none"
                />
              </div>
            </div>

            {(hasActiveFilters || drinkWindowFilter !== 'any') && (
              <button
                onClick={() => {
                  clearFilters();
                  setDrinkWindowFilter('any');
                }}
                className="mt-4 flex items-center gap-1 text-sm text-wine-700 hover:text-wine-900 font-medium"
              >
                <X className="w-4 h-4" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {filteredWines.length === 0 ? (
        <div className="text-center py-12">
          <WineIcon className="w-12 h-12 text-charcoal-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-charcoal-700 mb-2">No wines found</h3>
          <p className="text-charcoal-500">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <>
          {/* Virtual scrolling container */}
          <div
            ref={parentRef}
            className="h-[calc(100vh-20rem)] overflow-auto"
            style={{ contain: 'strict' }}
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const startIndex = virtualRow.index * 2;
                const wine1 = filteredWines[startIndex];
                const wine2 = filteredWines[startIndex + 1];

                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                      {wine1 && <WineCard key={wine1.id} wine={wine1} scrollContainer={parentRef} />}
                      {wine2 && <WineCard key={wine2.id} wine={wine2} scrollContainer={parentRef} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Load more indicator */}
          {hasNextPage && (
            <div className="flex justify-center py-4">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetching}
                className="flex items-center gap-2 px-4 py-2 text-wine-700 hover:text-wine-900 font-medium disabled:opacity-50"
              >
                {isFetching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
