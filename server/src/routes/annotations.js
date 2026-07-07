const express = require('express');
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const router = express.Router();

// GET /api/annotations?post_id= — get user's annotations for a post
router.get('/', auth, (req, res) => {
  const annotations = db.prepare(
    'SELECT * FROM annotations WHERE user_id = ? AND post_id = ? ORDER BY start_offset'
  ).all(req.user.id, req.query.post_id);
  res.json({ annotations });
});

// POST /api/annotations — save an annotation
router.post('/', auth, (req, res) => {
  const { post_id, selected_text, start_offset, type, color, style } = req.body;
  if (!post_id || !selected_text) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  const result = db.prepare(
    'INSERT INTO annotations (user_id, post_id, selected_text, start_offset, type, color, style) VALUES (?,?,?,?,?,?,?)'
  ).run(req.user.id, post_id, selected_text, start_offset || 0, type || 'highlight', color || '#fef08a', style || 'solid');
  res.status(201).json({ annotation: { id: result.lastInsertRowid } });
});

// DELETE /api/annotations/:id
router.delete('/:id', auth, (req, res) => {
  const a = db.prepare('SELECT * FROM annotations WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!a) return res.status(404).json({ error: '标注不存在' });
  db.prepare('DELETE FROM annotations WHERE id = ?').run(req.params.id);
  res.json({ message: '已删除' });
});

// DELETE /api/annotations — delete by post_id + text
router.delete('/', auth, (req, res) => {
  const { post_id, text } = req.body;
  if (!post_id || !text) return res.status(400).json({ error: '缺少参数' });
  db.prepare('DELETE FROM annotations WHERE user_id = ? AND post_id = ? AND selected_text = ?').run(req.user.id, post_id, text);
  res.json({ ok: true });
});

module.exports = router;
