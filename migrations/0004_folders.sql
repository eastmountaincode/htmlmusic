CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX folders_owner_name_idx
ON folders (owner_id, name COLLATE NOCASE);

CREATE TABLE recordings_new (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE RESTRICT,
  folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
  folder_added_at TEXT,
  filename TEXT NOT NULL,
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
  created_at TEXT NOT NULL,
  CHECK (
    (folder_id IS NULL AND folder_added_at IS NULL) OR
    (folder_id IS NOT NULL AND folder_added_at IS NOT NULL)
  )
);

INSERT INTO recordings_new (
  id, owner_id, folder_id, folder_added_at, filename,
  audio_key, audio_type, audio_size, artwork_key, artwork_type,
  artwork_size, duration_seconds, status, created_at
)
SELECT
  id, owner_id, NULL, NULL, filename,
  audio_key, audio_type, audio_size, artwork_key, artwork_type,
  artwork_size, duration_seconds, status, created_at
FROM recordings;

DROP TABLE recordings;
ALTER TABLE recordings_new RENAME TO recordings;

CREATE INDEX recordings_status_created_idx
ON recordings (status, created_at DESC, id DESC);

CREATE INDEX recordings_owner_created_idx
ON recordings (owner_id, created_at DESC, id DESC);

CREATE INDEX recordings_folder_activity_idx
ON recordings (folder_id, status, folder_added_at DESC, id DESC);

PRAGMA optimize;
