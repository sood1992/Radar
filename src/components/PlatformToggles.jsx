const PLATFORMS = [
  { key: 'youtube', label: 'YouTube', color: 'bg-red-500' },
  { key: 'instagram', label: 'Instagram', color: 'bg-pink-500' },
  { key: 'tiktok', label: 'TikTok', color: 'bg-zinc-300' },
  { key: 'pinterest', label: 'Pinterest', color: 'bg-red-600' },
  { key: 'behance', label: 'Behance', color: 'bg-blue-500' },
  { key: 'vimeo', label: 'Vimeo', color: 'bg-teal-500' },
  { key: 'meta-ads', label: 'Meta Ads', color: 'bg-blue-600' },
];

export default function PlatformToggles({ platforms, onChange }) {
  const toggle = (key) => {
    onChange({ ...platforms, [key]: !platforms[key] });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {PLATFORMS.map(({ key, label, color }) => (
        <button
          key={key}
          onClick={() => onChange && toggle(key)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
            platforms[key]
              ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
              : 'bg-transparent border-zinc-700 text-zinc-500'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${color} ${platforms[key] ? '' : 'opacity-40'}`} />
          {label}
        </button>
      ))}
    </div>
  );
}
