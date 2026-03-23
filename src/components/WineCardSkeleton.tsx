export function WineCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm overflow-hidden animate-pulse">
      <div className="flex">
        {/* Left accent bar placeholder */}
        <div className="w-1 bg-charcoal-200 flex-shrink-0" />
        <div className="flex-1 pl-4 pr-4 pt-4 pb-3">
          <div className="flex gap-4">
            {/* Image placeholder */}
            <div className="w-16 h-28 bg-charcoal-200 rounded-xl flex-shrink-0" />

            {/* Content placeholder */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Producer + vintage row */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <div className="h-5 bg-charcoal-200 rounded w-3/5" />
                  <div className="h-4 bg-charcoal-200 rounded w-4/5" />
                </div>
                <div className="h-7 w-12 bg-charcoal-200 rounded-lg flex-shrink-0" />
              </div>

              {/* Varietal */}
              <div className="h-3 bg-charcoal-200 rounded w-2/5" />

              {/* Metadata chips */}
              <div className="flex gap-1.5 pt-0.5">
                <div className="h-5 bg-charcoal-200 rounded-full w-24" />
                <div className="h-5 bg-charcoal-200 rounded-full w-16" />
              </div>

              {/* Tasting note placeholder */}
              <div className="pt-0.5 pl-2.5 border-l-2 border-charcoal-100 space-y-1">
                <div className="h-3 bg-charcoal-200 rounded w-full" />
                <div className="h-3 bg-charcoal-200 rounded w-4/5" />
              </div>

              {/* Stoplight pill placeholder */}
              <div className="h-6 bg-charcoal-200 rounded-full w-20 mt-1" />
            </div>
          </div>
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
