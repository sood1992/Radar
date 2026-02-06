import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import PlatformToggles from '../components/PlatformToggles';
import TemplateSelector from '../components/TemplateSelector';
import SearchHistory from '../components/SearchHistory';

const DEFAULT_PLATFORMS = {
  youtube: true,
  instagram: true,
  tiktok: true,
  pinterest: true,
  behance: true,
  vimeo: true,
  'meta-ads': true,
};

export default function SearchPage() {
  const navigate = useNavigate();
  const [brief, setBrief] = useState('');
  const [platforms, setPlatforms] = useState(DEFAULT_PLATFORMS);
  const [templates, setTemplates] = useState([]);
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => {});

    fetch('/api/search')
      .then((r) => r.json())
      .then(setSearches)
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!brief.trim()) return;
    setLoading(true);
    setError(null);

    const enabledPlatforms = Object.entries(platforms)
      .filter(([, v]) => v)
      .map(([k]) => k);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: brief.trim(), platforms: enabledPlatforms }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Search failed');
      }

      const data = await res.json();
      navigate(`/results/${data.search_id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
          What are you looking for?
        </h1>
        <p className="text-zinc-400 text-base">
          Describe your creative brief and we'll search across 7 platforms
        </p>
      </div>

      {/* Search */}
      <div className="space-y-4">
        <SearchBar
          value={brief}
          onChange={setBrief}
          onSubmit={handleSubmit}
          loading={loading}
        />
        <PlatformToggles platforms={platforms} onChange={setPlatforms} />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Templates */}
      <TemplateSelector templates={templates} onSelect={setBrief} />

      {/* History */}
      <SearchHistory searches={searches} onSelect={(id) => navigate(`/results/${id}`)} />
    </div>
  );
}
