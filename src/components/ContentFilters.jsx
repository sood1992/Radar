const TYPES = ['All', 'Video', 'Reel', 'Short', 'Image', 'Pin', 'Carousel', 'Ad'];

export default function ContentFilters({ selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TYPES.map((type) => (
        <button
          key={type}
          onClick={() => onChange(type === 'All' ? '' : type.toLowerCase())}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            (type === 'All' && !selected) || selected === type.toLowerCase()
              ? 'bg-orange-500 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
