CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY,
  artist_name TEXT NOT NULL CHECK (length(artist_name) BETWEEN 1 AND 80),
  updated_at TEXT NOT NULL
);

INSERT INTO profiles (user_id, artist_name, updated_at)
SELECT owner_id, artist, created_at
FROM recordings AS recording
WHERE recording.id = (
  SELECT latest.id
  FROM recordings AS latest
  WHERE latest.owner_id = recording.owner_id
  ORDER BY latest.created_at DESC, latest.id DESC
  LIMIT 1
);

INSERT INTO profiles (user_id, artist_name, updated_at)
SELECT author_id, author_name, created_at
FROM comments AS comment
WHERE comment.id = (
  SELECT latest.id
  FROM comments AS latest
  WHERE latest.author_id = comment.author_id
  ORDER BY latest.created_at DESC, latest.id DESC
  LIMIT 1
)
ON CONFLICT(user_id) DO UPDATE SET
  artist_name = excluded.artist_name,
  updated_at = excluded.updated_at
WHERE excluded.updated_at > profiles.updated_at;

CREATE TABLE recordings_new (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE RESTRICT,
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
  created_at TEXT NOT NULL
);

INSERT INTO recordings_new (
  id, owner_id, filename, audio_key, audio_type, audio_size,
  artwork_key, artwork_type, artwork_size, duration_seconds, status, created_at
)
SELECT
  id, owner_id, filename, audio_key, audio_type, audio_size,
  artwork_key, artwork_type, artwork_size, duration_seconds, status, created_at
FROM recordings;

DROP TABLE recordings;
ALTER TABLE recordings_new RENAME TO recordings;

CREATE INDEX recordings_status_created_idx
ON recordings (status, created_at DESC, id DESC);

CREATE INDEX recordings_owner_created_idx
ON recordings (owner_id, created_at DESC, id DESC);

CREATE TABLE comments_new (
  id TEXT PRIMARY KEY,
  track_id TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE RESTRICT,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
  created_at TEXT NOT NULL
);

INSERT INTO comments_new (id, track_id, author_id, body, created_at)
SELECT id, track_id, author_id, body, created_at
FROM comments;

DROP TABLE comments;
ALTER TABLE comments_new RENAME TO comments;

CREATE INDEX comments_track_created_idx
ON comments (track_id, created_at, id);

PRAGMA optimize;
