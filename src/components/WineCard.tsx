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
    case 'green': return '#10b981';
    case 'yellow': return '#f59e0b';
    case 'red': return '#ef4444';
    case 'blue': return '#3b82f6';
    default: return '#6b7280';
  }
}

export function WineCard({ wine, compact = false }: WineCardProps) {
  const stoplight = getDrinkingWindowStoplight(wine) as Stoplight;
  const tastingNotePreview = formatTastingNotePreview(wine.tastingNotes);
  const accentColor = getStoplightAccentColor(stoplight);

  if (compact) {
    return (
      <Link
        to={`/wine/${wine.id}`}
        className="flex items-center gap-3 p-3 rounded-xl transition-all"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: accentColor }} />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {getWineDisplayName(wine)}
          </h3>
          <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
            {getVarietalString(wine)} • {wine.region}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {formatPrice(wine.purchasePrice)}
          </span>
          <span className="flex items-center gap-1 text-xs mt-1 justify-end" style={{ color: accentColor }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: accentColor }} />
            {getStoplightLabel(stoplight)}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/wine/${wine.id}`}
      className="group relative block rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/40"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
    >
      {/* Left accent bar */}
      <div style={{ background: accentColor }} className="absolute left-0 top-0 bottom-0 w-[3px]" />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Image area */}
          <div
            className="relative flex-shrink-0 w-16 h-28 rounded-xl overflow-hidden"
            style={{ background: 'var(--bg-surface)' }}
          >
            <LazyImage
              src={wine.labelImageBase64 || wine.labelImageUrl}
              alt={wine.producer}
              className="w-16 h-28"
              placeholderClassName={getWineColorClass(wine.wineColor)}
              thumbnailSize={{ width: 64, height: 112 }}
              storagePath={wine.labelImageStoragePath}
              fallbackIcon={<div className="w-6 h-12 bg-white/20 rounded-sm" />}
              eager
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Producer + vintage badge */}
            <div className="flex items-center gap-1 flex-wrap">
              <h3 className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {wine.producer}
              </h3>
              {wine.vintage && (
                <span
                  className="ml-1 text-xs px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--text-secondary)' }}
                >
                  {wine.vintage}
                </span>
              )}
            </div>

            {/* Wine name */}
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
              {wine.wineName || getVarietalString(wine)}
            </p>

            {/* Metadata chips */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span
                className="text-xs px-2 py-0.5 rounded-full border flex items-center gap-1"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
              >
                <MapPin className="w-3 h-3" />{wine.region}
              </span>
              {wine.purchasePrice != null && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full border"
                  style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'rgba(212,175,55,0.2)', color: 'var(--accent-gold)' }}
                >
                  {formatPrice(wine.purchasePrice)}
                </span>
              )}
            </div>

            {/* Status pill + quantity */}
            <div className="mt-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: accentColor }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: accentColor }} />
                {getStoplightLabel(stoplight)}
              </span>
              {wine.quantity > 1 && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{wine.quantity} bottles</span>
              )}
            </div>

            {/* Tasting notes */}
            {tastingNotePreview && (
              <div className="mt-2 pl-3" style={{ borderLeft: '2px solid rgba(196,80,90,0.3)' }}>
                <p className="text-xs italic line-clamp-2" style={{ color: 'var(--text-muted)' }}>{tastingNotePreview}</p>
              </div>
            )}

            {/* Pairing suggestions fallback */}
            {wine.pairingSuggestions.length > 0 && !tastingNotePreview && (
              <div className="mt-2.5 flex flex-wrap gap-1">
                {wine.pairingSuggestions.slice(0, 3).map((pairing, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full border"
                    style={{ background: 'rgba(212,175,55,0.08)', borderColor: 'rgba(212,175,55,0.15)', color: 'var(--accent-gold)' }}
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
