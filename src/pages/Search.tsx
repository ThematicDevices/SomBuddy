import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWines } from '../contexts';
import { WineCard } from '../components';
import { searchWines } from '../utils';
import { Search as SearchIcon, X, ArrowLeft } from 'lucide-react';

export function Search() {
  const { wines } = useWines();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState(wines);

  useEffect(() => {
    if (query.trim()) {
      setResults(searchWines(wines, query));
      setSearchParams({ q: query });
    } else {
      setResults([]);
      setSearchParams({});
    }
  }, [query, wines, setSearchParams]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-charcoal-500 hover:text-charcoal-700 hover:bg-charcoal-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search wines by producer, varietal, region..."
            autoFocus
            className="w-full pl-12 pr-10 py-3 bg-white border border-charcoal-200 rounded-xl focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors text-lg"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-charcoal-400 hover:text-charcoal-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {query.trim() ? (
        <>
          <p className="text-sm text-charcoal-500 mb-4">
            {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
          </p>

          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map(wine => (
                <WineCard key={wine.id} wine={wine} compact />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-charcoal-500">No wines found matching your search</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-charcoal-400">Start typing to search your collection</p>
        </div>
      )}
    </div>
  );
}
