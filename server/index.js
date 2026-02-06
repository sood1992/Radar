import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';
import searchRoutes from './routes/search.js';
import projectRoutes from './routes/projects.js';
import templateRoutes from './routes/templates.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/search', searchRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/templates', templateRoutes);

// Production: serve static files and SPA routing
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(distPath, 'index.html'));
    }
  });
}

// Initialize database and start server
getDb();
app.listen(PORT, () => {
  console.log(`[server] Creative Radar running on http://localhost:${PORT}`);
});
