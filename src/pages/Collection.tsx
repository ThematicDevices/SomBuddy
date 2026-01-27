import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useWines } from '../contexts';
import { WineCard } from '../components';
import { searchWines, filterWines } from '../utils';
import { DrinkingStatus, WineColor, wineColorOptions } from '../types';
import { Search, SlidersHorizontal, X, Wine, PlusCircle } from 'lucide-react';

export function Collection() {
  const { wines } = useWines();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    wineColor: searchParams.get('color') as WineColor | undefined,
    drinkingStatus: searchParams.get('status') as DrinkingStatus | undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    region: searchParams.get('region') || undefined,
    varietal: searchParams.get('varietal') || undefined,
  });

  const filteredWines = useMemo(() => {
    let result = wines;

    if (searchQuery) {
      result = searchWines(result, searchQuery);
    }

    if (Object.values(filters).some(v => v !== undefined)) {
      result = filterWines(result, filters);
    }

    return result.sort((a, b) =>
      new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    );
  }, [wines, searchQuery, filters]);

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

  if (wines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 bg-wine-50 rounded-full flex items-center justify-center mb-6">
          <Wine className="w-12 h-12 text-wine-400" />
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
          <h1 className="text-2xl font-display font-bold text-charcoal-900">Wine Collection</h1>
          <p className="text-charcoal-500">
            {filteredWines.length} of {wines.length} wines
          </p>
        </div>
        <Link
          to="/add"
          className="flex items-center gap-2 px-4 py-2 bg-wine-900 text-white rounded-lg hover:bg-wine-800 transition-colors font-medium text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Add Wine
        </Link>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
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
          <Wine className="w-12 h-12 text-charcoal-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-charcoal-700 mb-2">No wines found</h3>
          <p className="text-charcoal-500">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWines.map(wine => (
            <WineCard key={wine.id} wine={wine} />
          ))}
        </div>
      )}
    </div>
  );
}
