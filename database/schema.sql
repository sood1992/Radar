CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    client TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brief TEXT NOT NULL,
    parsed_brief JSON,
    platforms TEXT DEFAULT 'youtube,instagram,tiktok,pinterest,behance,vimeo,meta-ads',
    result_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    search_id INTEGER REFERENCES searches(id),
    platform TEXT NOT NULL,
    content_type TEXT,
    external_id TEXT,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    media_url TEXT,
    title TEXT,
    description TEXT,
    author TEXT,
    author_url TEXT,
    engagement JSON,
    ai_relevance_score REAL,
    ai_analysis TEXT,
    ai_tags JSON,
    raw_data JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    result_id INTEGER REFERENCES results(id),
    notes TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, result_id)
);

CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    brief_template TEXT NOT NULL,
    default_platforms TEXT DEFAULT 'youtube,instagram,tiktok,pinterest,behance,vimeo,meta-ads',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
