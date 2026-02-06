import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ResultCard from '../components/ResultCard';

export default function ProjectPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', client: '', description: '' });

  const fetchProject = () => {
    setLoading(true);
    fetch(`/api/projects/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Project not found');
        return r.json();
      })
      .then((data) => {
        setProject(data);
        setItems(data.items || []);
        setForm({ name: data.name, client: data.client || '', description: data.description || '' });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchProject, [id]);

  const handleUpdate = async () => {
    await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setEditing(false);
    fetchProject();
  };

  const handleRemoveItem = async (itemId) => {
    await fetch(`/api/projects/${id}/items/${itemId}`, { method: 'DELETE' });
    fetchProject();
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-16 text-center">
        <p className="text-zinc-500 mb-4">Project not found</p>
        <Link to="/projects" className="text-orange-400 hover:underline text-sm">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/projects" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-3 inline-block">
          &larr; All projects
        </Link>

        {editing ? (
          <div className="space-y-3 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-lg font-semibold text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <input
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
              placeholder="Client"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">{project.name}</h1>
              {project.client && (
                <p className="text-sm text-zinc-400 mt-0.5">{project.client}</p>
              )}
              {project.description && (
                <p className="text-sm text-zinc-500 mt-2">{project.description}</p>
              )}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Items count */}
      <p className="text-sm text-zinc-500">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>

      {/* Items grid */}
      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-500 mb-2">No items saved yet</p>
          <Link to="/" className="text-orange-400 hover:underline text-sm">
            Start a search to find references
          </Link>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
          {items.map((item) => (
            <div key={item.item_id} className="break-inside-avoid mb-4">
              <div className="relative">
                <ResultCard result={item} />
                {item.notes && (
                  <div className="bg-zinc-800 border border-zinc-700 rounded-b-xl px-3 py-2 -mt-1">
                    <p className="text-xs text-zinc-400">{item.notes}</p>
                  </div>
                )}
                <button
                  onClick={() => handleRemoveItem(item.item_id)}
                  className="absolute top-2 right-2 bg-zinc-900/80 text-zinc-500 hover:text-red-400 text-xs px-2 py-1 rounded transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
