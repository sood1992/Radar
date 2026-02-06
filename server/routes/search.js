import { Router } from 'express';
import { getDb } from '../db.js';
import * as claude from '../services/claude.js';
import * as aggregator from '../services/aggregator.js';

const router = Router();

// POST / — Main search endpoint
router.post('/', async (req, res) => {
  try {
    const { brief, platforms } = req.body;

    if (!brief || typeof brief !== 'string') {
      return res.status(400).json({ error: 'brief is required and must be a string' });
    }

    const db = getDb();

    // Parse the brief using Claude
    const parsedBrief = await claude.parseBrief(brief);

    // Determine which platforms to search
    const platformList =
      !platforms || platforms === 'all'
        ? 'youtube,instagram,tiktok,pinterest,behance,vimeo,meta-ads'
        : Array.isArray(platforms)
          ? platforms.join(',')
          : platforms;

    // Save search to DB
    const insertSearch = db.prepare(
      'INSERT INTO searches (brief, parsed_brief, platforms) VALUES (?, ?, ?)'
    );
    const searchResult = insertSearch.run(brief, JSON.stringify(parsedBrief), platformList);
    const searchId = searchResult.lastInsertRowid;

    // Search all platforms (returns per-platform envelopes)
    const platformResults = await aggregator.searchAll(parsedBrief, platformList.split(','));
    const allResults = platformResults.flatMap((pr) => pr.results || []);

    // Score results using Claude
    const scores = await claude.scoreResults(allResults, parsedBrief.scoring_criteria);

    // Merge scores into results
    const scoredResults = allResults.map((result, i) => ({
      ...result,
      ai_relevance_score: scores[i]?.relevance_score ?? 0,
      ai_analysis: scores[i]?.analysis ?? '',
      ai_tags: scores[i]?.tags ?? [],
    }));

    // Save results to DB
    const insertResult = db.prepare(`
      INSERT INTO results (
        search_id, platform, content_type, external_id, url, thumbnail_url,
        media_url, title, description, author, author_url, engagement,
        ai_relevance_score, ai_analysis, ai_tags, raw_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((results) => {
      for (const r of results) {
        insertResult.run(
          searchId,
          r.platform,
          r.content_type,
          r.external_id,
          r.url,
          r.thumbnail_url,
          r.media_url,
          r.title,
          r.description,
          r.author,
          r.author_url,
          JSON.stringify(r.engagement),
          r.ai_relevance_score,
          r.ai_analysis,
          JSON.stringify(r.ai_tags),
          JSON.stringify(r.raw_data)
        );
      }
    });

    insertMany(scoredResults);

    // Update search result_count
    db.prepare('UPDATE searches SET result_count = ? WHERE id = ?').run(
      scoredResults.length,
      searchId
    );

    // Sort by relevance score descending
    scoredResults.sort((a, b) => (b.ai_relevance_score ?? 0) - (a.ai_relevance_score ?? 0));

    res.json({
      search_id: searchId,
      parsed_brief: parsedBrief,
      results: scoredResults,
    });
  } catch (err) {
    console.error('[search] POST / error:', err);
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

// GET / — Recent searches
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const searches = db
      .prepare('SELECT * FROM searches ORDER BY created_at DESC LIMIT 20')
      .all();

    // Parse JSON fields
    const parsed = searches.map((s) => ({
      ...s,
      parsed_brief: s.parsed_brief ? JSON.parse(s.parsed_brief) : null,
    }));

    res.json(parsed);
  } catch (err) {
    console.error('[search] GET / error:', err);
    res.status(500).json({ error: 'Failed to fetch searches', details: err.message });
  }
});

// GET /:id — Specific search with results
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const search = db.prepare('SELECT * FROM searches WHERE id = ?').get(req.params.id);

    if (!search) {
      return res.status(404).json({ error: 'Search not found' });
    }

    const results = db
      .prepare('SELECT * FROM results WHERE search_id = ? ORDER BY ai_relevance_score DESC')
      .all(req.params.id);

    // Parse JSON fields
    const parsedResults = results.map((r) => ({
      ...r,
      engagement: r.engagement ? JSON.parse(r.engagement) : null,
      ai_tags: r.ai_tags ? JSON.parse(r.ai_tags) : [],
      raw_data: r.raw_data ? JSON.parse(r.raw_data) : null,
    }));

    res.json({
      ...search,
      parsed_brief: search.parsed_brief ? JSON.parse(search.parsed_brief) : null,
      results: parsedResults,
    });
  } catch (err) {
    console.error('[search] GET /:id error:', err);
    res.status(500).json({ error: 'Failed to fetch search', details: err.message });
  }
});

export default router;
