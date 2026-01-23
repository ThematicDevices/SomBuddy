import React from 'react';
import { Link } from 'react-router-dom';
import { Wine } from '../types';
import {
  getWineDisplayName,
  getVarietalString,
  formatPrice,
  getDrinkingStatusColor,
  getDrinkingStatusLabel,
  getWineColorClass,
  calculateDrinkingStatus,
} from '../utils';
import { MapPin, Calendar, DollarSign } from 'lucide-react';

interface WineCardProps {
  wine: Wine;
  compact?: boolean;
}

export function WineCard({ wine, compact = false }: WineCardProps) {
  const drinkingStatus = calculateDrinkingStatus(wine);

  if (compact) {
    return (
      <Link
        to={`/wine/${wine.id}`}
        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-charcoal-100 hover:border-wine-200 hover:shadow-sm transition-all"
      >
        <div className={`w-3 h-12 rounded-full ${getWineColorClass(wine.wineColor)}`} />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-charcoal-900 truncate">
            {getWineDisplayName(wine)}
          </h3>
          <p className="text-sm text-charcoal-500 truncate">
            {getVarietalString(wine)} • {wine.region}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-sm font-medium text-charcoal-700">
            {formatPrice(wine.purchasePrice)}
          </span>
          <span className={`block text-xs px-2 py-0.5 rounded-full border mt-1 ${getDrinkingStatusColor(drinkingStatus)}`}>
            {getDrinkingStatusLabel(drinkingStatus)}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/wine/${wine.id}`}
      className="group block bg-white rounded-xl border border-charcoal-100 hover:border-wine-200 hover:shadow-md transition-all overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative">
            {wine.labelImageBase64 ? (
              <img
                src={`data:image/jpeg;base64,${wine.labelImageBase64}`}
                alt={wine.producer}
                className="w-16 h-24 object-cover rounded-lg shadow-sm"
              />
            ) : (
              <div className={`w-16 h-24 rounded-lg flex items-center justify-center ${getWineColorClass(wine.wineColor)}`}>
                <div className="w-6 h-12 bg-white/20 rounded-sm" />
              </div>
            )}
            {wine.quantity > 1 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-wine-900 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {wine.quantity}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display font-semibold text-charcoal-900 group-hover:text-wine-900 transition-colors truncate">
                  {getWineDisplayName(wine)}
                </h3>
                <p className="text-sm text-charcoal-600 truncate">
                  {getVarietalString(wine)}
                </p>
              </div>
              <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-full border font-medium ${getDrinkingStatusColor(drinkingStatus)}`}>
                {getDrinkingStatusLabel(drinkingStatus)}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-charcoal-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {wine.region}, {wine.country}
              </span>
              {wine.vintage && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {wine.vintage}
                </span>
              )}
              {wine.purchasePrice && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  {formatPrice(wine.purchasePrice)}
                </span>
              )}
            </div>

            {wine.pairingSuggestions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {wine.pairingSuggestions.slice(0, 3).map((pairing, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 bg-gold-50 text-gold-700 rounded-full"
                  >
                    {pairing}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
