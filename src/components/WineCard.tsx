import { Link } from 'react-router-dom';
import { Wine, TastingNote } from '../types';
import { LazyImage } from './LazyImage';
import {
  getWineDisplayName,
  getVarietalString,
  formatPrice,
  getWineColorClass,
  getDrinkingWindowStoplight,
  getStoplightColor,
  getStoplightLabel,
  getStoplightBorderColor,
} from '../utils';
import { MapPin, Calendar, DollarSign, MessageSquare } from 'lucide-react';

interface WineCardProps {
  wine: Wine;
  compact?: boolean;
}

/**
 * Format tasting notes for display - handles both user-added notes and imported notes
 */
function formatTastingNotePreview(notes: TastingNote[]): string | null {
  if (!notes || notes.length === 0) return null;

  // Get the most recent note
  const sortedNotes = [...notes].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const latestNote = sortedNotes[0];
  const noteText = latestNote.notes || '';

  // Truncate to ~100 chars
  if (noteText.length <= 120) return noteText;
  return noteText.slice(0, 117).trim() + '...';
}

export function WineCard({ wine, compact = false }: WineCardProps) {
  const stoplight = getDrinkingWindowStoplight(wine);
  const tastingNotePreview = formatTastingNotePreview(wine.tastingNotes);

  if (compact) {
    return (
      <Link
        to={`/wine/${wine.id}`}
        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-charcoal-100 hover:border-wine-200 hover:shadow-sm transition-all"
      >
        {/* Stoplight indicator */}
        <div className={`w-3 h-12 rounded-full ${getStoplightColor(stoplight)}`} title={getStoplightLabel(stoplight)} />
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
          <span className={`block text-xs px-2 py-0.5 rounded-full border mt-1 bg-white ${getStoplightBorderColor(stoplight)}`}>
            {getStoplightLabel(stoplight)}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/wine/${wine.id}`}
      className={`group block bg-white rounded-xl border-2 hover:shadow-md transition-all overflow-hidden ${getStoplightBorderColor(stoplight)}`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative">
            <LazyImage
              src={wine.labelImageBase64 || wine.labelImageUrl}
              alt={wine.producer}
              className="w-16 h-24 rounded-lg shadow-sm"
              placeholderClassName={getWineColorClass(wine.wineColor)}
              thumbnailSize={{ width: 64, height: 96 }}
              storagePath={wine.labelImageStoragePath}
              fallbackIcon={<div className="w-6 h-12 bg-white/20 rounded-sm" />}
            />
            {wine.quantity > 1 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-wine-900 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {wine.quantity}
              </span>
            )}
            {/* Stoplight dot indicator */}
            <div
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStoplightColor(stoplight)}`}
              title={getStoplightLabel(stoplight)}
            />
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
              <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-full border font-medium bg-white ${getStoplightBorderColor(stoplight)}`}>
                {getStoplightLabel(stoplight)}
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

            {/* Tasting Notes Preview */}
            {tastingNotePreview && (
              <div className="mt-3 p-2 bg-charcoal-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-charcoal-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-charcoal-600 line-clamp-2">
                    {tastingNotePreview}
                  </p>
                </div>
              </div>
            )}

            {wine.pairingSuggestions.length > 0 && !tastingNotePreview && (
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
