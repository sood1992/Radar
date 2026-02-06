import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ProjectsListPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', client: '', description: '' });
  const [creating, setCreating] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    fetch('/api/projects')
      .then((r) => r.json())
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchProjects, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm({ name: '', client: '', description: '' });
      setShowForm(false);
      fetchProjects();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    fetchProjects();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Projects</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Project name *"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <input
            value={form.client}
            onChange={(e) => setForm({ ...form, client: e.target.value })}
            placeholder="Client (optional)"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)"
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <button
            type="submit"
            disabled={creating || !form.name.trim()}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {creating ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      )}

      {/* Projects grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-zinc-800 rounded w-2/3 mb-3" />
              <div className="h-3 bg-zinc-800 rounded w-1/3 mb-2" />
              <div className="h-3 bg-zinc-800 rounded w-full" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-500 mb-2">No projects yet</p>
          <p className="text-zinc-600 text-sm">Create a project to start saving references</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 transition-colors group relative"
            >
              <Link to={`/projects/${project.id}`} className="block">
                <h3 className="text-base font-semibold text-zinc-200 group-hover:text-orange-400 transition-colors">
                  {project.name}
                </h3>
                {project.client && (
                  <p className="text-sm text-zinc-500 mt-0.5">{project.client}</p>
                )}
                {project.description && (
                  <p className="text-xs text-zinc-600 mt-2 line-clamp-2">{project.description}</p>
                )}
                <p className="text-xs text-zinc-600 mt-3">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </Link>
              <button
                onClick={() => handleDelete(project.id)}
                className="absolute top-3 right-3 text-zinc-700 hover:text-red-400 text-sm transition-colors opacity-0 group-hover:opacity-100"
              >
                &#10005;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
