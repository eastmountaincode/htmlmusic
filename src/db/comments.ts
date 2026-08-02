import "server-only";

import { queryD1, runD1 } from "@/db/d1";

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
  const rows = await queryD1<CommentRow>(
    `SELECT
       comment.id,
       comment.track_id,
       comment.author_id,
       profile.artist_name AS author_name,
       comment.body,
       comment.created_at
     FROM comments AS comment
     INNER JOIN profiles AS profile ON profile.user_id = comment.author_id
     WHERE comment.track_id = ?
     ORDER BY comment.created_at ASC, comment.id ASC
     LIMIT 100`,
    [trackId],
  );

  return rows.map(fromCommentRow);
}

export async function createComment(
  comment: Omit<RiverComment, "authorName">,
) {
  await runD1(
    `INSERT INTO comments
     (id, track_id, author_id, body, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      comment.id,
      comment.trackId,
      comment.authorId,
      comment.body,
      comment.createdAt,
    ],
  );

  return comment;
}
