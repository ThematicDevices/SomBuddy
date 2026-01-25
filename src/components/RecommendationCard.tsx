import { Wine, TrendingUp, TrendingDown, Minus, UtensilsCrossed } from 'lucide-react';
import { WineComparison } from '../types';
import { formatPrice } from '../utils';

interface RecommendationCardProps {
  comparison: WineComparison;
  collectionWineName?: string;
}

export function RecommendationCard({ comparison, collectionWineName }: RecommendationCardProps) {
  const isBring = comparison.recommendation === 'bring';

  const qualityIcon = {
    better: <TrendingUp className="w-4 h-4 text-green-600" />,
    similar: <Minus className="w-4 h-4 text-charcoal-500" />,
    lesser: <TrendingDown className="w-4 h-4 text-amber-600" />,
  };

  const qualityLabel = {
    better: 'Better Quality',
    similar: 'Similar Quality',
    lesser: 'Lesser Quality',
  };

  const qualityColors = {
    better: 'text-green-600 bg-green-50',
    similar: 'text-charcoal-600 bg-charcoal-50',
    lesser: 'text-amber-600 bg-amber-50',
  };

  return (
    <div className={`rounded-xl border-2 overflow-hidden ${
      isBring ? 'border-green-200 bg-green-50/30' : 'border-charcoal-200 bg-white'
    }`}>
      {/* Header badge */}
      <div className={`px-4 py-2 flex items-center justify-between ${
        isBring ? 'bg-green-100' : 'bg-charcoal-100'
      }`}>
        <span className={`text-sm font-semibold ${
          isBring ? 'text-green-800' : 'text-charcoal-700'
        }`}>
          {isBring ? '🍷 Bring from Cellar' : '🏪 Buy at Restaurant'}
        </span>
        {isBring && comparison.savings > 0 && (
          <span className="text-sm font-bold text-green-700">
            Save {formatPrice(comparison.savings)}
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Restaurant wine info */}
        <div>
          <p className="text-xs text-charcoal-500 uppercase tracking-wide mb-1">
            Restaurant Option
          </p>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-charcoal-900">
                {comparison.restaurantWine.vintage && `${comparison.restaurantWine.vintage} `}
                {comparison.restaurantWine.producer || comparison.restaurantWine.name}
              </p>
              {comparison.restaurantWine.producer && comparison.restaurantWine.name !== comparison.restaurantWine.producer && (
                <p className="text-sm text-charcoal-600">{comparison.restaurantWine.name}</p>
              )}
              {comparison.restaurantWine.varietal && (
                <p className="text-xs text-charcoal-500">{comparison.restaurantWine.varietal}</p>
              )}
            </div>
            <span className="text-lg font-bold text-charcoal-900 whitespace-nowrap">
              {formatPrice(comparison.restaurantPrice)}
            </span>
          </div>
        </div>

        {/* Collection wine info (if bringing) */}
        {isBring && collectionWineName && (
          <div className="pt-3 border-t border-charcoal-200">
            <p className="text-xs text-charcoal-500 uppercase tracking-wide mb-1">
              Your Collection Match
            </p>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-wine-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wine className="w-4 h-4 text-wine-700" />
                </div>
                <p className="font-medium text-charcoal-900">{collectionWineName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-charcoal-600">
                  {formatPrice(comparison.collectionWineValue)} + {formatPrice(comparison.corkageFee)}
                </p>
                <p className="text-xs text-charcoal-500">
                  = {formatPrice(comparison.totalBringCost)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics row */}
        <div className="flex items-center gap-3 pt-3 border-t border-charcoal-200">
          {/* Quality comparison */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${qualityColors[comparison.qualityComparison]}`}>
            {qualityIcon[comparison.qualityComparison]}
            <span className="text-xs font-medium">{qualityLabel[comparison.qualityComparison]}</span>
          </div>

          {/* Pairing score */}
          {comparison.pairingScore > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gold-50 text-gold-700">
              <UtensilsCrossed className="w-4 h-4" />
              <span className="text-xs font-medium">Pairing: {comparison.pairingScore}/10</span>
            </div>
          )}
        </div>

        {/* Reasoning */}
        {comparison.reasoning && (
          <p className="text-sm text-charcoal-600 italic">
            "{comparison.reasoning}"
          </p>
        )}
      </div>
    </div>
  );
}
