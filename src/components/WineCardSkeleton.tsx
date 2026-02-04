export function WineCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-charcoal-100 p-4 animate-pulse">
      <div className="flex gap-4">
        {/* Image placeholder */}
        <div className="w-16 h-24 bg-charcoal-200 rounded-lg flex-shrink-0" />

        {/* Content placeholder */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title */}
          <div className="h-5 bg-charcoal-200 rounded w-3/4" />

          {/* Subtitle */}
          <div className="h-4 bg-charcoal-200 rounded w-1/2" />

          {/* Region */}
          <div className="h-3 bg-charcoal-200 rounded w-2/3" />

          {/* Tags row */}
          <div className="flex gap-2 pt-1">
            <div className="h-6 bg-charcoal-200 rounded-full w-16" />
            <div className="h-6 bg-charcoal-200 rounded-full w-20" />
          </div>
        </div>

        {/* Quantity badge placeholder */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-charcoal-200 rounded-full" />
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
