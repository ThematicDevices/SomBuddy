export function WineCardSkeleton() {
  return (
    <div
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      className="rounded-2xl p-5 animate-pulse"
    >
      <div className="flex gap-4">
        {/* Image placeholder */}
        <div className="w-16 h-28 rounded-xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />

        {/* Content placeholder */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Producer + vintage row */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 flex-1">
              <div className="h-4 rounded w-3/5" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <div className="h-3 rounded w-4/5" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
            <div className="h-5 w-10 rounded flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>

          {/* Metadata chips */}
          <div className="flex gap-1.5 pt-0.5">
            <div className="h-5 rounded-full w-24" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="h-5 rounded-full w-16" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>

          {/* Tasting note placeholder */}
          <div className="pt-0.5 pl-3 space-y-1" style={{ borderLeft: '2px solid rgba(196,80,90,0.15)' }}>
            <div className="h-3 rounded w-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="h-3 rounded w-4/5" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>

          {/* Status placeholder */}
          <div className="h-4 rounded w-20" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
      </div>
    </div>
  );
}

export function WineCardSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <WineCardSkeleton key={i} />
      ))}
    </div>
  );
}
