const PLATFORM_STYLES = {
  youtube: 'bg-red-600 text-white',
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  tiktok: 'bg-zinc-800 text-zinc-200 border border-zinc-600',
  pinterest: 'bg-red-700 text-white',
  behance: 'bg-blue-600 text-white',
  vimeo: 'bg-teal-600 text-white',
  'meta-ads': 'bg-blue-700 text-white',
};

const PLATFORM_LABELS = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
  behance: 'Behance',
  vimeo: 'Vimeo',
  'meta-ads': 'Meta Ads',
};

export default function PlatformBadge({ platform }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
        PLATFORM_STYLES[platform] || 'bg-zinc-700 text-zinc-300'
      }`}
    >
      {PLATFORM_LABELS[platform] || platform}
    </span>
  );
}
