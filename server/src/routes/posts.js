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
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count
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

// GET /api/posts/:id — single post with like status
router.get('/:id', optionalAuth, (req, res) => {
  const post = db.prepare(`
    SELECT p.*, u.username, u.avatar,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count
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
router.get('/:id/comments', (req, res) => {
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });

  const comments = db.prepare(`
    SELECT c.*, u.username, u.avatar
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ? ORDER BY c.created_at ASC
  `).all(req.params.id);
  res.json({ comments });
});

// POST /api/posts/:id/comments
router.post('/:id/comments', auth, (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: '评论内容不能为空' });
  }

  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });

  const result = db.prepare(
    'INSERT INTO comments (content, user_id, post_id) VALUES (?, ?, ?)'
  ).run(content, req.user.id, req.params.id);

  const comment = db.prepare(`
    SELECT c.*, u.username, u.avatar
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ comment });
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
