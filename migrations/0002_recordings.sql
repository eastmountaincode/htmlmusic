CREATE TABLE IF NOT EXISTS recordings (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  artist TEXT NOT NULL,
  audio_key TEXT NOT NULL UNIQUE,
  audio_type TEXT NOT NULL,
  audio_size INTEGER NOT NULL CHECK (audio_size BETWEEN 1 AND 524288000),
  artwork_key TEXT UNIQUE,
  artwork_type TEXT,
  artwork_size INTEGER CHECK (
    artwork_size IS NULL OR artwork_size BETWEEN 1 AND 20971520
  ),
  duration_seconds REAL CHECK (
    duration_seconds IS NULL OR duration_seconds > 0
  ),
  status TEXT NOT NULL CHECK (status IN ('pending', 'ready')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS recordings_status_created_idx
ON recordings (status, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS recordings_owner_created_idx
ON recordings (owner_id, created_at DESC, id DESC);
