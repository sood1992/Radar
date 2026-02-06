export default function TemplateSelector({ templates, onSelect }) {
  if (!templates || templates.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-400 mb-3">Quick Templates</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.brief_template)}
            className="text-left bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-lg px-3 py-2.5 transition-colors group"
          >
            <span className="text-sm text-zinc-200 group-hover:text-orange-400 font-medium block truncate">
              {t.name}
            </span>
            <span className="text-xs text-zinc-500 block mt-0.5">{t.category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
