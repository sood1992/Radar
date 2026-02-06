import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ResultGrid from '../components/ResultGrid';
import ContentFilters from '../components/ContentFilters';
import PlatformToggles from '../components/PlatformToggles';
import SaveToProject from '../components/SaveToProject';
import LoadingState from '../components/LoadingState';

export default function ResultsPage() {
  const { searchId } = useParams();
  const [search, setSearch] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [contentFilter, setContentFilter] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [platformFilter, setPlatformFilter] = useState({});
  const [hiddenIds, setHiddenIds] = useState(new Set());

  // Save modal
  const [saveModal, setSaveModal] = useState({ open: false, resultId: null });
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/search/${searchId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Search not found');
        return r.json();
      })
      .then((data) => {
        setSearch(data);
        setResults(data.results || []);
        // Initialize platform filter — all platforms present in results enabled
        const platforms = {};
        for (const r of data.results || []) {
          platforms[r.platform] = true;
        }
        setPlatformFilter(platforms);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    fetch('/api/projects')
      .then((r) => r.json())
      .then(setProjects)
      .catch(() => {});
  }, [searchId]);

  const filtered = useMemo(() => {
    let items = results.filter((r) => !hiddenIds.has(r.id));

    if (contentFilter) {
      items = items.filter((r) => r.content_type === contentFilter);
    }

    items = items.filter((r) => platformFilter[r.platform] !== false);

    if (sortBy === 'views') {
      items.sort((a, b) => ((b.engagement?.views || 0) - (a.engagement?.views || 0)));
    } else if (sortBy === 'newest') {
      items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      items.sort((a, b) => (b.ai_relevance_score || 0) - (a.ai_relevance_score || 0));
    }

    return items;
  }, [results, contentFilter, platformFilter, sortBy, hiddenIds]);

  const platformCounts = useMemo(() => {
    const counts = {};
    for (const r of results) {
      counts[r.platform] = (counts[r.platform] || 0) + 1;
    }
    return counts;
  }, [results]);

  const handleSave = (result) => {
    setSaveModal({ open: true, resultId: result.id });
  };

  const handleSaveToProject = async (projectId, resultId, notes) => {
    try {
      await fetch(`/api/projects/${projectId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result_id: resultId, notes }),
      });
      // Refresh projects
      const res = await fetch('/api/projects');
      setProjects(await res.json());
    } catch {
      // ignore
    }
  };

  const handleHide = (id) => {
    setHiddenIds((prev) => new Set([...prev, id]));
  };

  if (loading) {
    return (
      <div className="py-8">
        <LoadingState count={12} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Link to="/" className="text-orange-400 hover:underline text-sm">
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Link to="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-2 inline-block">
            &larr; New search
          </Link>
          <h1 className="text-xl font-semibold text-zinc-100 leading-snug">
            {search?.brief}
          </h1>
        </div>
        <div className="text-sm text-zinc-500 shrink-0">
          {filtered.length} of {results.length} results
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        {Object.entries(platformCounts).map(([platform, count]) => (
          <span key={platform} className="capitalize">{platform}: {count}</span>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <ContentFilters selected={contentFilter} onChange={setContentFilter} />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="relevance">Sort: Relevance</option>
          <option value="views">Sort: Most Views</option>
          <option value="newest">Sort: Newest</option>
        </select>
      </div>

      {/* Platform toggles as filters */}
      {Object.keys(platformFilter).length > 1 && (
        <PlatformToggles platforms={platformFilter} onChange={setPlatformFilter} />
      )}

      {/* Results grid */}
      <ResultGrid results={filtered} onSave={handleSave} onHide={handleHide} />

      {/* Save modal */}
      <SaveToProject
        isOpen={saveModal.open}
        onClose={() => setSaveModal({ open: false, resultId: null })}
        resultId={saveModal.resultId}
        projects={projects}
        onSave={handleSaveToProject}
      />
    </div>
  );
}
