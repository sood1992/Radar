export default function SearchBar({ value, onChange, onSubmit, loading }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      onSubmit();
    }
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe what you're looking for... e.g., 'Find cinematic hotel property tour reels — luxury feel, warm color grading, smooth gimbal movements'"
        rows={4}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-4 text-zinc-100 placeholder-zinc-500 text-base resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[120px]"
        disabled={loading}
      />
      <button
        onClick={onSubmit}
        disabled={loading || !value.trim()}
        className="absolute bottom-4 right-4 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 text-sm"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Searching...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </>
        )}
      </button>
      <p className="text-xs text-zinc-500 mt-2">Press Ctrl+Enter to search</p>
    </div>
  );
}
