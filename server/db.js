import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'creative-radar.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Initialize schema
    const schema = readFileSync(join(__dirname, '..', 'database', 'schema.sql'), 'utf-8');
    db.exec(schema);

    // Seed templates if empty
    const count = db.prepare('SELECT COUNT(*) as count FROM templates').get();
    if (count.count === 0) {
      seedTemplates(db);
    }
  }
  return db;
}

function seedTemplates(db) {
  const insert = db.prepare(
    'INSERT INTO templates (name, category, brief_template, default_platforms) VALUES (?, ?, ?, ?)'
  );

  const templates = [
    {
      name: 'Hotel / Hospitality',
      category: 'hospitality',
      brief_template: 'Find {content_type} references for a luxury hotel — {style} visual style. Brand reference: {brand}. Focus: {focus_areas}',
      default_platforms: 'youtube,instagram,tiktok,pinterest,behance,vimeo,meta-ads',
    },
    {
      name: 'FMCG Product',
      category: 'fmcg',
      brief_template: 'Find references for a {product_type} brand — {style} product photography/video. Elements: {elements}',
      default_platforms: 'youtube,instagram,tiktok,pinterest,behance,vimeo,meta-ads',
    },
    {
      name: 'Automotive Campaign',
      category: 'automotive',
      brief_template: 'Find references for automotive campaign — {vehicle_type}, {style} feel. Shot types: {shots}. Brand level: {brand}',
      default_platforms: 'youtube,instagram,tiktok,pinterest,behance,vimeo,meta-ads',
    },
    {
      name: 'Festival / Event',
      category: 'events',
      brief_template: 'Find references for {event_type} coverage — {style} style. Focus: {elements}. Scale: {scale}',
      default_platforms: 'youtube,instagram,tiktok,pinterest,behance,vimeo,meta-ads',
    },
    {
      name: 'Wedding Film',
      category: 'wedding',
      brief_template: 'Find wedding film references — {style} style, {setting}. Elements: {elements}. Tier: {tier}',
      default_platforms: 'youtube,instagram,tiktok,pinterest,behance,vimeo,meta-ads',
    },
    {
      name: 'Competitor Ads',
      category: 'ads',
      brief_template: 'Find active ads from {competitor} and similar brands in {industry}. Focus on {ad_format} creatives. Market: {market}',
      default_platforms: 'meta-ads,instagram,youtube',
    },
    {
      name: 'Social Media Trends',
      category: 'trends',
      brief_template: 'Find trending {content_type} in {niche} — what formats and styles are performing right now. Platforms: {platforms}',
      default_platforms: 'instagram,tiktok,youtube',
    },
  ];

  const insertMany = db.transaction((templates) => {
    for (const t of templates) {
      insert.run(t.name, t.category, t.brief_template, t.default_platforms);
    }
  });

  insertMany(templates);
}

export default { getDb };
