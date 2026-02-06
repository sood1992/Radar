const PLATFORM_COLORS = {
  youtube: 'bg-red-500',
  instagram: 'bg-pink-500',
  tiktok: 'bg-zinc-300',
  pinterest: 'bg-red-600',
  behance: 'bg-blue-500',
  vimeo: 'bg-teal-500',
  'meta-ads': 'bg-blue-600',
};

export default function LoadingState({ count = 8, platformsLoading }) {
  return (
    <div>
      {platformsLoading && platformsLoading.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-sm text-zinc-500">Searching:</span>
          {platformsLoading.map((p) => (
            <span key={p} className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className={`w-2 h-2 rounded-full ${PLATFORM_COLORS[p] || 'bg-zinc-500'} animate-pulse`} />
              {p}
            </span>
          ))}
        </div>
      )}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="break-inside-avoid mb-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden animate-pulse">
              <div className="bg-zinc-800" style={{ height: `${140 + (i % 3) * 60}px` }} />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
                <div className="flex gap-2 mt-3">
                  <div className="h-7 bg-zinc-800 rounded flex-1" />
                  <div className="h-7 bg-zinc-800 rounded flex-1" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
