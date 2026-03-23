import { Link } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useAllWines } from '../hooks/useWineQueries';
import { getCollectionStats, formatPrice, isNearEndOfDrinkingWindow, isPastPrime } from '../utils';
import { WineCard } from '../components';
import {
  Wine,
  PlusCircle,
  MessageCircle,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  GlassWater,
  DollarSign,
} from 'lucide-react';

// Wine type color mapping for pie chart
const WINE_TYPE_COLORS: Record<string, string> = {
  red: '#c4505a',
  white: '#d4af37',
  rosé: '#e07090',
  sparkling: '#a0c4ff',
  dessert: '#f59e0b',
  fortified: '#8B4513',
  orange: '#f97316',
};
const FALLBACK_COLORS = ['#c4505a', '#d4af37', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export function Dashboard() {
  const { wines, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useAllWines();

  // Automatically fetch all pages for accurate stats
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const stats = getCollectionStats(wines);

  const colorData = Object.entries(stats.byColor).map(([name, value]) => ({ name, value }));
  const regionData = Object.entries(stats.byRegion)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  const recentlyAdded = [...wines]
    .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
    .slice(0, 4);

  const readyToDrink = stats.readyToDrink.slice(0, 3);
  const needsAttention = stats.pastPeak.slice(0, 3);

  // Calculate opened bottles metrics
  const openedBottlesStats = useMemo(() => {
    const openBottles = wines.filter(w => w.isOpen);
    const totalOpened = openBottles.length;
    // Sum purchase price per bottle (not multiplied by quantity since we're tracking opened bottles)
    const totalValueConsumed = openBottles.reduce((sum, w) => sum + (w.purchasePrice || 0), 0);
    const recentlyOpened = openBottles
      .sort((a, b) => new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime())
      .slice(0, 3);

    return {
      totalOpened,
      totalValueConsumed,
      recentlyOpened,
    };
  }, [wines]);

  // Calculate wines that need attention for drinking window
  const winesDrinkSoon = useMemo(() => {
    return wines.filter(w => isNearEndOfDrinkingWindow(w, 2) && !w.isOpen && w.quantity > 0);
  }, [wines]);

  const winesPastPrime = useMemo(() => {
    return wines.filter(w => isPastPrime(w) && !w.isOpen && w.quantity > 0);
  }, [wines]);

  if (wines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 bg-wine-50 rounded-full flex items-center justify-center mb-6">
          <Wine className="w-12 h-12 text-wine-400" />
        </div>
        <h2 className="text-2xl font-display font-bold text-charcoal-900 mb-2">
          Welcome to Your Wine Cellar
        </h2>
        <p className="text-charcoal-500 text-center max-w-md mb-8">
          Start building your collection by adding your first bottle. Take a photo of the label and let our AI do the rest.
        </p>
        <div className="flex gap-4">
          <Link
            to="/add"
            className="flex items-center gap-2 px-6 py-3 bg-wine-900 text-white rounded-lg hover:bg-wine-800 transition-colors font-medium"
          >
            <PlusCircle className="w-5 h-5" />
            Add Your First Wine
          </Link>
          <Link
            to="/sommelier"
            className="flex items-center gap-2 px-6 py-3 border border-charcoal-200 text-charcoal-700 rounded-lg hover:bg-charcoal-50 transition-colors font-medium"
          >
            <MessageCircle className="w-5 h-5" />
            Chat with Sommelier
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Your Wine Cellar</h1>
          <p style={{ color: 'var(--text-secondary)' }}>An overview of your collection</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/add"
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm"
            style={{ background: 'var(--accent-wine)' }}
          >
            <PlusCircle className="w-4 h-4" />
            Add Wine
          </Link>
          <Link
            to="/sommelier"
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
            style={{ border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}
          >
            <MessageCircle className="w-4 h-4" />
            Ask Sommelier
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl p-4 transition-shadow" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(196,80,90,0.12)' }}>
              <Wine className="w-5 h-5" style={{ color: 'var(--accent-wine)' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.totalBottles}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Bottles</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4 transition-shadow" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.12)' }}>
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-gold)' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatPrice(stats.totalValue)}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Collection Value</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4 transition-shadow" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.readyToDrink.length}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ready to Drink</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4 transition-shadow" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <Clock className="w-5 h-5" style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.needsAging.length}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Aging</p>
            </div>
          </div>
        </div>
      </div>

      {/* Opened Bottles Metrics */}
      {openedBottlesStats.totalOpened > 0 && (
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2 mb-4">
            <GlassWater className="w-5 h-5" style={{ color: 'var(--accent-wine)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Opened Bottles</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-2 mb-1">
                <GlassWater className="w-4 h-4" style={{ color: 'var(--accent-wine)' }} />
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Opened Bottles</p>
              </div>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{openedBottlesStats.totalOpened}</p>
            </div>

            <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Value Consumed</p>
              </div>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatPrice(openedBottlesStats.totalValueConsumed)}</p>
            </div>

            {openedBottlesStats.recentlyOpened.length > 0 && (
              <div className="col-span-2 md:col-span-1 rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Recently Opened</p>
                <div className="space-y-1">
                  {openedBottlesStats.recentlyOpened.map(wine => (
                    <Link
                      key={wine.id}
                      to={`/wine/${wine.id}`}
                      className="block text-sm truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {wine.vintage} {wine.producer}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {colorData.length > 0 && (
          <div className="rounded-2xl p-5 transition-shadow" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>By Wine Type</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={colorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {colorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={WINE_TYPE_COLORS[entry.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} bottles`, name]}
                    contentStyle={{ borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {colorData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: WINE_TYPE_COLORS[item.name] || FALLBACK_COLORS[0] }}
                  />
                  <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {regionData.length > 0 && (
          <div className="rounded-2xl p-5 transition-shadow" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Top Regions</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 12, fill: '#9c9189' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} bottles`]}
                    contentStyle={{ borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
                  />
                  <Bar dataKey="value" fill="#c4505a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {readyToDrink.length > 0 && (
          <div className="rounded-2xl p-5 transition-shadow" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
                Ready to Drink
              </h3>
              <Link to="/collection?status=ready" className="text-sm font-medium" style={{ color: 'var(--accent-wine)' }}>
                View All →
              </Link>
            </div>
            <div className="space-y-2">
              {readyToDrink.map(wine => (
                <WineCard key={wine.id} wine={wine} compact />
              ))}
            </div>
          </div>
        )}

        {needsAttention.length > 0 && (
          <div className="rounded-2xl p-5 transition-shadow" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
                Past Peak - Drink Soon
              </h3>
              <Link to="/collection?status=past-peak" className="text-sm font-medium" style={{ color: 'var(--accent-wine)' }}>
                View All →
              </Link>
            </div>
            <div className="space-y-2">
              {needsAttention.map(wine => (
                <WineCard key={wine.id} wine={wine} compact />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drinking Window Warnings */}
      {(winesDrinkSoon.length > 0 || winesPastPrime.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {winesDrinkSoon.length > 0 && (
            <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2" style={{ color: '#f59e0b' }}>
                  <Clock className="w-5 h-5" />
                  Drink Within 2 Years ({winesDrinkSoon.length})
                </h3>
              </div>
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                These wines are approaching the end of their optimal drinking window.
              </p>
              <div className="space-y-2">
                {winesDrinkSoon.slice(0, 5).map(wine => (
                  <Link
                    key={wine.id}
                    to={`/wine/${wine.id}`}
                    className="block p-3 rounded-lg transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {wine.vintage} {wine.producer} {wine.wineName}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{wine.region}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                        Until {wine.drinkingWindowEnd}
                      </span>
                    </div>
                  </Link>
                ))}
                {winesDrinkSoon.length > 5 && (
                  <Link
                    to="/collection?drinkWindow=ending-soon"
                    className="block text-sm text-center pt-2 font-medium"
                    style={{ color: '#f59e0b' }}
                  >
                    +{winesDrinkSoon.length - 5} more wines →
                  </Link>
                )}
              </div>
            </div>
          )}

          {winesPastPrime.length > 0 && (
            <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2" style={{ color: '#ef4444' }}>
                  <AlertTriangle className="w-5 h-5" />
                  Past Prime ({winesPastPrime.length})
                </h3>
              </div>
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                These wines have passed their recommended drinking window.
              </p>
              <div className="space-y-2">
                {winesPastPrime.slice(0, 5).map(wine => (
                  <Link
                    key={wine.id}
                    to={`/wine/${wine.id}`}
                    className="block p-3 rounded-lg transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {wine.vintage} {wine.producer} {wine.wineName}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{wine.region}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                        Ended {wine.drinkingWindowEnd}
                      </span>
                    </div>
                  </Link>
                ))}
                {winesPastPrime.length > 5 && (
                  <Link
                    to="/collection?drinkWindow=past-prime"
                    className="block text-sm text-center pt-2 font-medium"
                    style={{ color: '#ef4444' }}
                  >
                    +{winesPastPrime.length - 5} more wines →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {recentlyAdded.length > 0 && (
        <div className="rounded-2xl p-5 transition-shadow" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Recently Added</h3>
            <Link to="/collection" className="text-sm font-medium" style={{ color: 'var(--accent-wine)' }}>
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentlyAdded.map(wine => (
              <WineCard key={wine.id} wine={wine} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
