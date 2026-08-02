export const commentsTableSql = `
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    track_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
    created_at TEXT NOT NULL
  )
`;

export const commentsTrackCreatedIndexSql = `
  CREATE INDEX IF NOT EXISTS comments_track_created_idx
  ON comments (track_id, created_at, id)
`;
