export default function SearchHistory({ searches, onSelect }) {
  if (!searches || searches.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-400 mb-3">Recent Searches</h3>
      <div className="space-y-2">
        {searches.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="w-full text-left bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg px-4 py-3 transition-colors group"
          >
            <p className="text-sm text-zinc-300 group-hover:text-zinc-100 truncate">{s.brief}</p>
            <div className="flex gap-3 mt-1 text-xs text-zinc-600">
              <span>{s.result_count} results</span>
              <span>{new Date(s.created_at).toLocaleDateString()}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
