const express = require('express');
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const avatarStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/avatars'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传 JPG、PNG、GIF、WebP 格式的图片'));
    }
  }
});

// PUT /api/users/me — update profile (must be before /:id)
router.put('/me', auth, (req, res) => {
  const { username } = req.body;
  if (!username || !username.trim()) {
    return res.status(400).json({ error: '用户名不能为空' });
  }

  const existing = db.prepare(
    'SELECT id FROM users WHERE username = ? AND id != ?'
  ).get(username.trim(), req.user.id);
  if (existing) {
    return res.status(400).json({ error: '用户名已被占用' });
  }

  db.prepare(
    'UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(username.trim(), req.user.id);

  const user = db.prepare(
    'SELECT id, username, email, avatar, created_at FROM users WHERE id = ?'
  ).get(req.user.id);

  res.json({ user });
});

// POST /api/users/me/avatar — upload profile picture (must be before /:id)
router.post('/me/avatar', auth, (req, res) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: '图片大小不能超过 2MB' });
      }
      return res.status(400).json({ error: err.message || '上传失败' });
    }

    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的图片' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Delete old avatar file
    const oldUser = db.prepare('SELECT avatar FROM users WHERE id = ?').get(req.user.id);
    if (oldUser && oldUser.avatar) {
      const oldPath = path.join(__dirname, '../..', oldUser.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    db.prepare('UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(avatarUrl, req.user.id);

    const user = db.prepare(
      'SELECT id, username, email, avatar, created_at FROM users WHERE id = ?'
    ).get(req.user.id);

    res.json({ user });
  });
});

// DELETE /api/users/me — delete account (must be before /:id)
router.delete('/me', auth, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  res.json({ message: '账号已删除' });
});

// GET /api/users — list all users with post counts
router.get('/', (req, res) => {
  const users = db.prepare(`
    SELECT id, username, avatar, created_at,
      (SELECT COUNT(*) FROM posts WHERE user_id = users.id) as post_count
    FROM users
    ORDER BY post_count DESC, created_at ASC
  `).all();
  res.json({ users });
});

// GET /api/users/:id — user profile + their posts
router.get('/:id', (req, res) => {
  const user = db.prepare(`
    SELECT id, username, avatar, created_at,
      (SELECT COUNT(*) FROM posts WHERE user_id = users.id) as post_count
    FROM users WHERE id = ?
  `).get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const posts = db.prepare(`
    SELECT p.*, u.username, u.avatar,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `).all(req.params.id);

  res.json({ user, posts });
});

module.exports = router;
