import { useState } from 'react';

export default function SaveToProject({ isOpen, onClose, resultId, projects, onSave }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [notes, setNotes] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (selectedProject) {
      onSave(selectedProject, resultId, notes);
      setNotes('');
      setSelectedProject(null);
      onClose();
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const project = await res.json();
      onSave(project.id, resultId, notes);
      setNewName('');
      setNotes('');
      onClose();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md mx-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Save to Project</h2>

        {projects && projects.length > 0 && (
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedProject === p.id
                    ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300'
                    : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-zinc-600'
                }`}
              >
                <span className="font-medium">{p.name}</span>
                {p.client && <span className="text-zinc-500 ml-2">— {p.client}</span>}
              </button>
            ))}
          </div>
        )}

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-orange-500 mb-3"
        />

        {selectedProject && (
          <button
            onClick={handleSave}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded-lg text-sm transition-colors mb-3"
          >
            Save
          </button>
        )}

        <div className="border-t border-zinc-800 pt-3">
          <p className="text-xs text-zinc-500 mb-2">Or create a new project</p>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Project name"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-200 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Create & Save
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 text-lg"
        >
          &#10005;
        </button>
      </div>
    </div>
  );
}
