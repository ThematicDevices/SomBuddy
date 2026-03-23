import { Link } from 'react-router-dom';
import { Wine, TastingNote } from '../types';
import { LazyImage } from './LazyImage';
import {
  getVarietalString,
  formatPrice,
  getWineColorClass,
  getDrinkingWindowStoplight,
  getStoplightColor,
  getStoplightLabel,
  getStoplightBorderColor,
} from '../utils';
import { MapPin, DollarSign } from 'lucide-react';

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
        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-charcoal-100 hover:border-wine-200 hover:shadow-sm transition-all"
      >
        {/* Stoplight indicator */}
        <div className={`w-1 h-10 rounded-full flex-shrink-0 ${getStoplightColor(stoplight)}`} title={getStoplightLabel(stoplight)} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-charcoal-900 truncate">
            {wine.producer}
          </h3>
          <p className="text-xs text-charcoal-500 truncate">
            {wine.wineName && <span>{wine.wineName} · </span>}
            {getVarietalString(wine)}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          {wine.vintage && (
            <span className="text-xs font-semibold text-charcoal-600 bg-charcoal-50 px-1.5 py-0.5 rounded">
              {wine.vintage}
            </span>
          )}
          <span className="block text-sm font-medium text-charcoal-700 mt-1">
            {formatPrice(wine.purchasePrice)}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/wine/${wine.id}`}
      className="group relative block bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-charcoal-100"
    >
      {/* Left stoplight accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStoplightColor(stoplight)}`} />

      <div className="pl-5 pr-4 pt-4 pb-3">
        <div className="flex items-start gap-4">
          {/* Wine image */}
          <div className="relative flex-shrink-0">
            <div className="relative overflow-hidden rounded-xl w-16 h-28">
              <LazyImage
                src={wine.labelImageBase64 || wine.labelImageUrl}
                alt={wine.producer}
                className="w-16 h-28 rounded-xl shadow-sm"
                placeholderClassName={getWineColorClass(wine.wineColor)}
                thumbnailSize={{ width: 64, height: 112 }}
                storagePath={wine.labelImageStoragePath}
                fallbackIcon={<div className="w-6 h-12 bg-white/20 rounded-sm" />}
              />
              {/* Soft gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
            {wine.quantity > 1 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-wine-900 text-white text-xs font-bold rounded-full flex items-center justify-center z-10">
                {wine.quantity}
              </span>
            )}
          </div>

          {/* Card info */}
          <div className="flex-1 min-w-0">
            {/* Producer + vintage badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-base text-charcoal-900 group-hover:text-wine-900 transition-colors truncate leading-tight">
                  {wine.producer}
                </p>
                {wine.wineName && (
                  <p className="text-sm text-charcoal-600 truncate font-normal mt-0.5">
                    {wine.wineName}
                  </p>
                )}
              </div>
              {wine.vintage && (
                <span className="flex-shrink-0 text-xs font-semibold text-charcoal-700 bg-charcoal-50 px-2 py-1 rounded-lg tracking-wide">
                  {wine.vintage}
                </span>
              )}
            </div>

            {/* Varietal */}
            <p className="text-xs text-charcoal-400 truncate mt-1">
              {getVarietalString(wine)}
            </p>

            {/* Metadata chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-charcoal-50 text-charcoal-600 rounded-full">
                <MapPin className="w-3 h-3" />
                {wine.region}{wine.country ? `, ${wine.country}` : ''}
              </span>
              {wine.purchasePrice && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-charcoal-50 text-charcoal-600 rounded-full">
                  <DollarSign className="w-3 h-3" />
                  {formatPrice(wine.purchasePrice)}
                </span>
              )}
            </div>

            {/* Tasting notes - editorial left border style */}
            {tastingNotePreview && (
              <div className="mt-2.5 pl-2.5 border-l-2 border-wine-200">
                <p className="text-xs text-charcoal-500 line-clamp-2 italic leading-relaxed">
                  {tastingNotePreview}
                </p>
              </div>
            )}

            {/* Pairing suggestions */}
            {wine.pairingSuggestions.length > 0 && !tastingNotePreview && (
              <div className="mt-2.5 flex flex-wrap gap-1">
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

            {/* Stoplight status pill */}
            <div className="mt-2.5">
              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium bg-white ${getStoplightBorderColor(stoplight)}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStoplightColor(stoplight)}`} />
                {getStoplightLabel(stoplight)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
