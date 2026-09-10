export default function BookingsLoading() {
  return (
    <div className="space-y-4 pb-24">
      {/* Toolbar Skeleton */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box Skeleton */}
          <div className="relative flex-1">
            <div className="w-full h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          </div>

          {/* View Mode Toggle Skeleton */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 gap-1">
            <div className="h-8 w-24 rounded-lg bg-white dark:bg-zinc-900 shadow-xs animate-pulse" />
            <div className="h-8 w-20 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 animate-pulse" />
            <div className="h-8 w-24 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>

        {/* Filter Chips Skeleton */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="h-7 w-14 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-7 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-7 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-7 w-20 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-16 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="w-28 h-4 bg-zinc-300 dark:bg-zinc-700 rounded" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                <div className="w-24 h-4 bg-zinc-200 dark:bg-zinc-800 rounded hidden md:block" />
                <div className="w-16 h-4 bg-zinc-200 dark:bg-zinc-800 rounded hidden sm:block" />
                <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
