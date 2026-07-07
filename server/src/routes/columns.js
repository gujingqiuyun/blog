const express = require('express');
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const router = express.Router();

// GET /api/columns — user's columns with post counts
router.get('/', auth, (req, res) => {
  const columns = db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM post_columns WHERE column_id = c.id) as post_count
    FROM columns_ c WHERE c.user_id = ? AND c.parent_id IS NULL
    ORDER BY c.sort_order, c.created_at
  `).all(req.user.id);

  const children = db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM post_columns WHERE column_id = c.id) as post_count
    FROM columns_ c WHERE c.user_id = ? AND c.parent_id IS NOT NULL
    ORDER BY c.sort_order, c.created_at
  `).all(req.user.id);

  res.json({ columns: columns.map(c => ({
    ...c,
    children: children.filter(ch => ch.parent_id === c.id)
  })) });
});

// POST /api/columns — create a column
router.post('/', auth, (req, res) => {
  const { name, parent_id } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: '专栏名不能为空' });
  const result = db.prepare(
    'INSERT INTO columns_ (user_id, name, parent_id) VALUES (?, ?, ?)'
  ).run(req.user.id, name.trim(), parent_id || null);
  res.status(201).json({ column: { id: result.lastInsertRowid, name: name.trim(), parent_id: parent_id || null } });
});

// DELETE /api/columns/:id
router.delete('/:id', auth, (req, res) => {
  const c = db.prepare('SELECT * FROM columns_ WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!c) return res.status(404).json({ error: '专栏不存在' });
  db.prepare('DELETE FROM columns_ WHERE id = ?').run(req.params.id);
  res.json({ message: '已删除' });
});

// POST /api/columns/:id/posts — assign post to column
router.post('/:id/posts', auth, (req, res) => {
  const { post_id } = req.body;
  try {
    db.prepare('INSERT INTO post_columns (post_id, column_id) VALUES (?, ?)').run(post_id, req.params.id);
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: '已在专栏中' });
  }
});

// DELETE /api/columns/:id/posts/:postId — remove post from column
router.delete('/:id/posts/:postId', auth, (req, res) => {
  db.prepare('DELETE FROM post_columns WHERE post_id = ? AND column_id = ?').run(req.params.postId, req.params.id);
  res.json({ ok: true });
});

// GET /api/columns/:id/posts — get posts in a column
router.get('/:id/posts', (req, res) => {
  const posts = db.prepare(`
    SELECT p.*, u.username, u.avatar,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      COALESCE(p.views, 0) as view_count
    FROM post_columns pc
    JOIN posts p ON pc.post_id = p.id
    JOIN users u ON p.user_id = u.id
    WHERE pc.column_id = ?
    ORDER BY p.created_at DESC
  `).all(req.params.id);
  res.json({ posts });
});

// DELETE /api/columns/:id/posts/remove — batch remove posts
router.delete('/:id/posts/remove', auth, (req, res) => {
  const { post_ids } = req.body;
  if (!post_ids?.length) return res.status(400).json({ error: 'no post_ids' });
  const stmt = db.prepare('DELETE FROM post_columns WHERE post_id = ? AND column_id = ?');
  for (const pid of post_ids) stmt.run(pid, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
