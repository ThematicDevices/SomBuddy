import { Link } from 'react-router-dom';
import { Wine, TastingNote } from '../types';
import { LazyImage } from './LazyImage';
import {
  getWineDisplayName,
  getVarietalString,
  formatPrice,
  getWineColorClass,
  getDrinkingWindowStoplight,
  getStoplightLabel,
} from '../utils';
import { MapPin } from 'lucide-react';

interface WineCardProps {
  wine: Wine;
  compact?: boolean;
  scrollContainer?: React.RefObject<Element>;
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

type Stoplight = 'green' | 'yellow' | 'red' | 'blue';

function getStoplightAccentColor(stoplight: Stoplight): string {
  switch (stoplight) {
    case 'green': return 'bg-emerald-400';
    case 'yellow': return 'bg-amber-400';
    case 'red': return 'bg-red-400';
    case 'blue': return 'bg-blue-400';
    default: return 'bg-charcoal-300';
  }
}

function getStoplightPillClasses(stoplight: Stoplight): string {
  switch (stoplight) {
    case 'green': return 'bg-emerald-50 text-emerald-700';
    case 'yellow': return 'bg-amber-50 text-amber-700';
    case 'red': return 'bg-red-50 text-red-600';
    case 'blue': return 'bg-blue-50 text-blue-700';
    default: return 'bg-charcoal-50 text-charcoal-600';
  }
}

export function WineCard({ wine, compact = false, scrollContainer }: WineCardProps) {
  const stoplight = getDrinkingWindowStoplight(wine) as Stoplight;
  const tastingNotePreview = formatTastingNotePreview(wine.tastingNotes);

  if (compact) {
    return (
      <Link
        to={`/wine/${wine.id}`}
        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-charcoal-100 hover:border-wine-200 hover:shadow-sm transition-all"
      >
        <div className={`w-1 h-10 rounded-full flex-shrink-0 ${getStoplightAccentColor(stoplight)}`} />
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
          <span className={`block text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${getStoplightPillClasses(stoplight)}`}>
            {getStoplightLabel(stoplight)}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/wine/${wine.id}`}
      className="group relative block bg-white rounded-2xl shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden"
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${getStoplightAccentColor(stoplight)}`} />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Image area */}
          <div className="relative flex-shrink-0">
            <div className="relative w-16 h-28 rounded-xl overflow-hidden bg-charcoal-100">
              <LazyImage
                src={wine.labelImageBase64 || wine.labelImageUrl}
                alt={wine.producer}
                className="w-16 h-28"
                placeholderClassName={getWineColorClass(wine.wineColor)}
                thumbnailSize={{ width: 64, height: 112 }}
                storagePath={wine.labelImageStoragePath}
                fallbackIcon={<div className="w-6 h-12 bg-white/20 rounded-sm" />}
                scrollContainer={scrollContainer}
              />
              {/* Gradient overlay at bottom of image */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/20 to-transparent rounded-b-xl" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Producer + vintage badge */}
            <div className="flex items-center gap-1 flex-wrap">
              <h3 className="text-base font-semibold text-charcoal-900 leading-tight group-hover:text-wine-900 transition-colors">
                {wine.producer}
              </h3>
              {wine.vintage && (
                <span className="ml-1 text-xs font-medium px-1.5 py-0.5 bg-charcoal-100 text-charcoal-600 rounded">
                  {wine.vintage}
                </span>
              )}
            </div>

            {/* Wine name */}
            <p className="text-sm text-charcoal-500 truncate mt-0.5">
              {wine.wineName || getVarietalString(wine)}
            </p>

            {/* Metadata chips */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className="text-xs px-2 py-0.5 bg-charcoal-50 text-charcoal-600 rounded-full border border-charcoal-100 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{wine.region}
              </span>
              {wine.purchasePrice != null && (
                <span className="text-xs px-2 py-0.5 bg-gold-50 text-gold-700 rounded-full border border-gold-100">
                  {formatPrice(wine.purchasePrice)}
                </span>
              )}
            </div>

            {/* Status pill + quantity */}
            <div className="mt-3 flex items-center justify-between">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStoplightPillClasses(stoplight)}`}>
                {getStoplightLabel(stoplight)}
              </span>
              {wine.quantity > 1 && (
                <span className="text-xs text-charcoal-400">{wine.quantity} bottles</span>
              )}
            </div>

            {/* Tasting notes */}
            {tastingNotePreview && (
              <div className="mt-2.5 pl-3 border-l-2 border-wine-200">
                <p className="text-xs text-charcoal-500 line-clamp-2 italic">{tastingNotePreview}</p>
              </div>
            )}

            {/* Pairing suggestions fallback */}
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
          </div>
        </div>
      </div>
    </Link>
  );
}
