const express = require('express');
const router = express.Router();
const { getDB } = require('../db/init');

function getSessionId(req) {
    return req.cookies?.session_id || req.headers['x-session-id'] || '';
}

// POST /api/v1/auth/register - 用户注册
router.post('/register', (req, res) => {
    try {
        const db = getDB();
        const { username, password, nickname, phone } = req.body;

        if (!username || !password) {
            return res.status(400).json({ code: 400, message: '用户名和密码不能为空', data: null });
        }
        if (username.length < 3 || username.length > 30) {
            return res.status(400).json({ code: 400, message: '用户名长度为3-30个字符', data: null });
        }
        if (password.length < 6) {
            return res.status(400).json({ code: 400, message: '密码至少6位', data: null });
        }

        // 检查用户名是否已存在
        const exist = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (exist) {
            return res.status(400).json({ code: 400, message: '用户名已被注册', data: null });
        }

        const result = db.prepare(
            'INSERT INTO users (username, password, nickname, phone) VALUES (?, ?, ?, ?)'
        ).run(username, password, nickname || username, phone || '');

        const user = db.prepare('SELECT id, username, nickname, phone FROM users WHERE id = ?').get(result.lastInsertRowid);

        res.json({ code: 0, message: '注册成功', data: user });
    } catch (err) {
        console.error('[Auth] Register error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// POST /api/v1/auth/login - 用户登录
router.post('/login', (req, res) => {
    try {
        const db = getDB();
        const { username, password } = req.body;
        const sessionId = getSessionId(req);

        if (!username || !password) {
            return res.status(400).json({ code: 400, message: '用户名和密码不能为空', data: null });
        }

        const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
        if (!user) {
            return res.status(401).json({ code: 401, message: '用户名或密码错误', data: null });
        }

        // 合并匿名购物车到用户账号
        if (sessionId) {
            db.prepare('UPDATE carts SET user_id = ? WHERE session_id = ? AND user_id IS NULL')
                .run(user.id, sessionId);
        }

        // 与购物车/订单/地址 API 一致：必须写入 Cookie，否则合并后的购物车用 session 查询不到
        res.cookie('user_id', String(user.id), {
            path: '/',
            maxAge: 2592000,
            sameSite: 'lax',
            httpOnly: true,
        });

        // 返回不含密码的用户信息
        const { password: _, ...safeUser } = user;
        res.json({ code: 0, message: '登录成功', data: safeUser });
    } catch (err) {
        console.error('[Auth] Login error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// GET /api/v1/auth/me - 获取当前登录用户
router.get('/me', (req, res) => {
    try {
        const db = getDB();
        const userId = req.cookies?.user_id;
        if (!userId) {
            return res.json({ code: 0, message: '', data: null });
        }
        const user = db.prepare('SELECT id, username, nickname, phone, created_at FROM users WHERE id = ?').get(userId);
        res.json({ code: 0, message: 'success', data: user || null });
    } catch (err) {
        console.error('[Auth] Me error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// POST /api/v1/auth/logout - 退出登录
router.post('/logout', (req, res) => {
    res.clearCookie('user_id', { path: '/' });
    res.clearCookie('session_id', { path: '/' });
    res.json({ code: 0, message: '已退出', data: null });
});

module.exports = router;
