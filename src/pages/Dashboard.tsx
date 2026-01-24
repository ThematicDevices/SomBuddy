import React from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useWines } from '../contexts';
import { getCollectionStats, formatPrice } from '../utils';
import { WineCard } from '../components';
import {
  Wine,
  PlusCircle,
  MessageCircle,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

// Wine type color mapping for pie chart
const WINE_TYPE_COLORS: Record<string, string> = {
  red: '#722f37',      // Deep wine red
  white: '#F5E6C8',    // Straw/white wine color
  rosé: '#F4B8C5',     // Pink rosé
  sparkling: '#FFF8DC', // Champagne gold
  dessert: '#DAA520',   // Golden amber
  fortified: '#8B4513', // Mahogany brown
  orange: '#E8A954',    // Orange wine
};
const FALLBACK_COLORS = ['#722f37', '#ae214c', '#d02d5f', '#e44d77', '#ef7899', '#f6abbe'];

export function Dashboard() {
  const { wines } = useWines();
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
          <h1 className="text-2xl font-display font-bold text-charcoal-900">Your Wine Cellar</h1>
          <p className="text-charcoal-500">An overview of your collection</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/add"
            className="flex items-center gap-2 px-4 py-2 bg-wine-900 text-white rounded-lg hover:bg-wine-800 transition-colors font-medium text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Add Wine
          </Link>
          <Link
            to="/sommelier"
            className="flex items-center gap-2 px-4 py-2 border border-charcoal-200 text-charcoal-700 rounded-lg hover:bg-charcoal-50 transition-colors font-medium text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Ask Sommelier
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-charcoal-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-wine-50 rounded-lg flex items-center justify-center">
              <Wine className="w-5 h-5 text-wine-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal-900">{stats.totalBottles}</p>
              <p className="text-sm text-charcoal-500">Total Bottles</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-charcoal-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-gold-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal-900">{formatPrice(stats.totalValue)}</p>
              <p className="text-sm text-charcoal-500">Collection Value</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-charcoal-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal-900">{stats.readyToDrink.length}</p>
              <p className="text-sm text-charcoal-500">Ready to Drink</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-charcoal-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal-900">{stats.needsAging.length}</p>
              <p className="text-sm text-charcoal-500">Aging</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {colorData.length > 0 && (
          <div className="bg-white rounded-xl border border-charcoal-100 p-5">
            <h3 className="font-semibold text-charcoal-900 mb-4">By Wine Type</h3>
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
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e7e7e7' }}
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
                  <span className="text-charcoal-600 capitalize">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {regionData.length > 0 && (
          <div className="bg-white rounded-xl border border-charcoal-100 p-5">
            <h3 className="font-semibold text-charcoal-900 mb-4">Top Regions</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 12, fill: '#6d6d6d' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} bottles`]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e7e7e7' }}
                  />
                  <Bar dataKey="value" fill="#722f37" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {readyToDrink.length > 0 && (
          <div className="bg-white rounded-xl border border-charcoal-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-charcoal-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Ready to Drink
              </h3>
              <Link to="/collection?status=ready" className="text-sm text-wine-700 hover:text-wine-900 font-medium">
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
          <div className="bg-white rounded-xl border border-charcoal-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-charcoal-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Past Peak - Drink Soon
              </h3>
              <Link to="/collection?status=past-peak" className="text-sm text-wine-700 hover:text-wine-900 font-medium">
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

      {recentlyAdded.length > 0 && (
        <div className="bg-white rounded-xl border border-charcoal-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-charcoal-900">Recently Added</h3>
            <Link to="/collection" className="text-sm text-wine-700 hover:text-wine-900 font-medium">
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
