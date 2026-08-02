import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export type RiverComment = {
  id: string;
  trackId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

type CommentRow = {
  id: string;
  track_id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

function getCommentsDb() {
  return getCloudflareContext().env.DB;
}

function fromCommentRow(row: CommentRow): RiverComment {
  return {
    id: row.id,
    trackId: row.track_id,
    authorId: row.author_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function listComments(trackId: string) {
  const result = await getCommentsDb()
    .prepare(
      `SELECT id, track_id, author_id, author_name, body, created_at
       FROM comments
       WHERE track_id = ?
       ORDER BY created_at ASC, id ASC
       LIMIT 100`,
    )
    .bind(trackId)
    .all<CommentRow>();

  return result.results.map(fromCommentRow);
}

export async function createComment(comment: RiverComment) {
  await getCommentsDb()
    .prepare(
      `INSERT INTO comments
       (id, track_id, author_id, author_name, body, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      comment.id,
      comment.trackId,
      comment.authorId,
      comment.authorName,
      comment.body,
      comment.createdAt,
    )
    .run();

  return comment;
}

export async function updateCommentAuthorName(
  authorId: string,
  authorName: string,
) {
  await getCommentsDb()
    .prepare(
      `UPDATE comments
       SET author_name = ?
       WHERE author_id = ?`,
    )
    .bind(authorName, authorId)
    .run();
}
