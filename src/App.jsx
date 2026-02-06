import { Routes, Route, Link, useLocation } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import ResultsPage from './pages/ResultsPage';
import ProjectsListPage from './pages/ProjectsListPage';
import ProjectPage from './pages/ProjectPage';

function NavBar() {
  const location = useLocation();
  const isActive = (path) =>
    location.pathname === path
      ? 'text-orange-400 border-b-2 border-orange-400'
      : 'text-zinc-400 hover:text-zinc-200';

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Neofox" className="h-7 w-7" />
            <span className="text-lg font-bold text-zinc-100 tracking-tight">
              Creative Radar
            </span>
          </Link>
          <div className="flex gap-6 text-sm font-medium">
            <Link to="/" className={`pb-0.5 transition-colors ${isActive('/')}`}>
              Search
            </Link>
            <Link
              to="/projects"
              className={`pb-0.5 transition-colors ${isActive('/projects')}`}
            >
              Projects
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/results/:searchId" element={<ResultsPage />} />
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/projects/:id" element={<ProjectPage />} />
        </Routes>
      </main>
    </div>
  );
}
