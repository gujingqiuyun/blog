const express = require('express');
const db = require('../config/db');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/posts — list posts
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const posts = db.prepare(`
    SELECT p.*, u.username, u.avatar,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      COALESCE(p.views, 0) as view_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM posts').get().count;

  res.json({
    posts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
});

// GET /api/posts/search?q= — full-text search (must be before /:id)
router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ posts: [] });

  // Escape FTS5 special chars and build a prefix query
  const safe = q.replace(/['"*()]/g, '').split(/\s+/).filter(Boolean).map(w => `"${w}"*`).join(' AND ');
  if (!safe) return res.json({ posts: [] });

  try {
    const posts = db.prepare(`
      SELECT p.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        COALESCE(p.views, 0) as view_count,
        snippet(posts_fts, 1, '<mark>', '</mark>', '...', 48) as snippet
      FROM posts_fts fts
      JOIN posts p ON fts.rowid = p.id
      JOIN users u ON p.user_id = u.id
      WHERE posts_fts MATCH ?
      ORDER BY rank
      LIMIT 20
    `).all(safe);
    if (posts.length > 0) {
      return res.json({ posts });
    }
    // FTS5 returned 0 results — fall through to LIKE
  } catch (e) {
    // FTS5 threw — fall through to LIKE
  }

  // LIKE fallback — works for CJK and partial matches
  try {
    const likeQ = `%${q.replace(/[%_]/g, '')}%`;
    const posts = db.prepare(`
      SELECT p.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        COALESCE(p.views, 0) as view_count,
        NULL as snippet
      FROM posts p JOIN users u ON p.user_id = u.id
      WHERE p.title LIKE ? OR p.content LIKE ? OR p.summary LIKE ?
      ORDER BY p.created_at DESC
      LIMIT 20
    `).all(likeQ, likeQ, likeQ);
    // Generate snippet around the keyword for LIKE results
    const postsWithSnippet = posts.map(p => {
      const idx = p.content.indexOf(q);
      if (idx >= 0) {
        const start = Math.max(0, idx - 30);
        const end = Math.min(p.content.length, idx + q.length + 30);
        const before = (start > 0 ? '...' : '') + p.content.slice(start, idx);
        const after = p.content.slice(idx + q.length, end) + (end < p.content.length ? '...' : '');
        const clean = (text) => text.replace(/[#*>`\-\[\]()!]/g, ' ').replace(/\s+/g, ' ').trim();
        p.snippet = clean(before) + ' <mark>' + q + '</mark> ' + clean(after);
      }
      return p;
    });
    res.json({ posts: postsWithSnippet });
  } catch (e2) {
    res.json({ posts: [], error: '搜索语法错误' });
  }
});

// GET /api/posts/:id — single post with like status
router.get('/:id', optionalAuth, (req, res) => {
  const post = db.prepare(`
    SELECT p.*, u.username, u.avatar,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      COALESCE(p.views, 0) as view_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!post) {
    return res.status(404).json({ error: '文章不存在' });
  }

  let liked = false;
  if (req.user) {
    const like = db.prepare(
      'SELECT id FROM likes WHERE user_id = ? AND post_id = ?'
    ).get(req.user.id, post.id);
    liked = !!like;
  }

  res.json({ post: { ...post, liked } });
});

// POST /api/posts — create
router.post('/', auth, (req, res) => {
  const { title, content, summary } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: '标题和内容都是必填的' });
  }

  const result = db.prepare(
    'INSERT INTO posts (title, content, summary, user_id) VALUES (?, ?, ?, ?)'
  ).run(title, content, summary || '', req.user.id);

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ post });
});

// PUT /api/posts/:id — update
router.put('/:id', auth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });
  if (post.user_id !== req.user.id) {
    return res.status(403).json({ error: '只能编辑自己的文章' });
  }

  const { title, content, summary } = req.body;
  db.prepare(
    'UPDATE posts SET title = ?, content = ?, summary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(
    title ?? post.title,
    content ?? post.content,
    summary !== undefined ? summary : post.summary,
    post.id
  );

  const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(post.id);
  res.json({ post: updated });
});

// DELETE /api/posts/:id
router.delete('/:id', auth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });
  if (post.user_id !== req.user.id) {
    return res.status(403).json({ error: '只能删除自己的文章' });
  }

  db.prepare('DELETE FROM posts WHERE id = ?').run(post.id);
  res.json({ message: '删除成功' });
});

// GET /api/posts/:id/comments
router.get('/:id/comments', optionalAuth, (req, res) => {
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });

  const comments = db.prepare(`
    SELECT c.*, u.username, u.avatar,
      (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as like_count,
      (SELECT COUNT(*) FROM comments AS replies WHERE replies.parent_id = c.id) as reply_count
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ? AND c.parent_id IS NULL
    ORDER BY c.created_at ASC
  `).all(req.params.id);

  // Fetch replies & like status
  const uid = req.user?.id;
  const result = comments.map(c => {
    const replies = db.prepare(`
      SELECT c2.*, u2.username, u2.avatar,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c2.id) as like_count
      FROM comments c2 JOIN users u2 ON c2.user_id = u2.id
      WHERE c2.parent_id = ? ORDER BY c2.created_at ASC
    `).all(c.id);

    const liked = uid ? !!db.prepare(
      'SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?'
    ).get(uid, c.id) : false;

    const repliesWithLikes = replies.map(r => ({
      ...r,
      liked: uid ? !!db.prepare(
        'SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?'
      ).get(uid, r.id) : false
    }));

    return { ...c, liked, replies: repliesWithLikes };
  });

  res.json({ comments: result });
});

// POST /api/posts/:id/comments
router.post('/:id/comments', auth, (req, res) => {
  const { content, parent_id } = req.body;
  if (!content) {
    return res.status(400).json({ error: '评论内容不能为空' });
  }

  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });

  if (parent_id) {
    const parent = db.prepare('SELECT id FROM comments WHERE id = ? AND post_id = ?').get(parent_id, req.params.id);
    if (!parent) return res.status(400).json({ error: '被回复的评论不存在' });
  }

  const result = db.prepare(
    'INSERT INTO comments (content, user_id, post_id, parent_id) VALUES (?, ?, ?, ?)'
  ).run(content, req.user.id, req.params.id, parent_id || null);

  const comment = db.prepare(`
    SELECT c.*, u.username, u.avatar
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ comment });
});

// POST /api/posts/:id/comments/:commentId/like — toggle comment like
router.post('/:id/comments/:commentId/like', auth, (req, res) => {
  const comment = db.prepare(
    'SELECT id FROM comments WHERE id = ? AND post_id = ?'
  ).get(req.params.commentId, req.params.id);

  if (!comment) return res.status(404).json({ error: '评论不存在' });

  const existing = db.prepare(
    'SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?'
  ).get(req.user.id, req.params.commentId);

  if (existing) {
    db.prepare('DELETE FROM comment_likes WHERE id = ?').run(existing.id);
    res.json({ liked: false });
  } else {
    db.prepare('INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)').run(req.user.id, req.params.commentId);
    res.json({ liked: true });
  }
});

// DELETE /api/posts/:id/comments/:commentId
router.delete('/:id/comments/:commentId', auth, (req, res) => {
  const comment = db.prepare(
    'SELECT * FROM comments WHERE id = ? AND post_id = ?'
  ).get(req.params.commentId, req.params.id);

  if (!comment) return res.status(404).json({ error: '评论不存在' });
  if (comment.user_id !== req.user.id) {
    return res.status(403).json({ error: '只能删除自己的评论' });
  }

  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.commentId);
  res.json({ message: '删除成功' });
});

// POST /api/posts/:id/view — record a view
router.post('/:id/view', (req, res) => {
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });
  db.prepare('UPDATE posts SET views = COALESCE(views, 0) + 1 WHERE id = ?').run(post.id);
  res.json({ ok: true });
});

// POST /api/posts/:id/like — toggle like
router.post('/:id/like', auth, (req, res) => {
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });

  const existing = db.prepare(
    'SELECT id FROM likes WHERE user_id = ? AND post_id = ?'
  ).get(req.user.id, req.params.id);

  if (existing) {
    db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
    res.json({ liked: false });
  } else {
    db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(req.user.id, req.params.id);
    res.json({ liked: true });
  }
});

module.exports = router;
