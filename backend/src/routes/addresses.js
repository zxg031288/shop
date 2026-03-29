const express = require('express');
const router = express.Router();
const { getDB } = require('../db/init');

function getUserId(req) {
    return parseInt(req.cookies?.user_id) || null;
}

// GET /api/v1/addresses - 获取用户地址列表
router.get('/', (req, res) => {
    try {
        const db = getDB();
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ code: 401, message: '请先登录', data: null });
        }
        const addresses = db.prepare(
            'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC'
        ).all(userId);
        res.json({ code: 0, message: 'success', data: addresses });
    } catch (err) {
        console.error('[Addresses] List error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// POST /api/v1/addresses - 新增收货地址
router.post('/', (req, res) => {
    try {
        const db = getDB();
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ code: 401, message: '请先登录', data: null });
        }

        const { name, phone, province, city, district, detail, is_default } = req.body;
        if (!name || !phone || !detail) {
            return res.status(400).json({ code: 400, message: '收货人、电话、详细地址不能为空', data: null });
        }

        // 如果设为默认，先取消其他默认
        if (is_default) {
            db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId);
        }

        // 如果是第一个地址，自动设为默认
        const count = db.prepare('SELECT COUNT(*) as c FROM addresses WHERE user_id = ?').get(userId);
        const setDefault = is_default || count.c === 0 ? 1 : 0;

        const result = db.prepare(
            'INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(userId, name, phone, province || '', city || '', district || '', detail, setDefault);

        const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(result.lastInsertRowid);
        res.json({ code: 0, message: '添加成功', data: address });
    } catch (err) {
        console.error('[Addresses] Create error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// PUT /api/v1/addresses/:id - 更新地址
router.put('/:id', (req, res) => {
    try {
        const db = getDB();
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ code: 401, message: '请先登录', data: null });
        }

        const { id } = req.params;
        const { name, phone, province, city, district, detail, is_default } = req.body;

        // 检查归属
        const addr = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(id, userId);
        if (!addr) {
            return res.status(404).json({ code: 404, message: '地址不存在', data: null });
        }

        if (is_default) {
            db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId);
        }

        db.prepare(
            'UPDATE addresses SET name=?, phone=?, province=?, city=?, district=?, detail=?, is_default=? WHERE id=?'
        ).run(
            name, phone, province || '', city || '', district || '', detail,
            is_default ? 1 : 0, id
        );

        const updated = db.prepare('SELECT * FROM addresses WHERE id = ?').get(id);
        res.json({ code: 0, message: '更新成功', data: updated });
    } catch (err) {
        console.error('[Addresses] Update error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// DELETE /api/v1/addresses/:id - 删除地址
router.delete('/:id', (req, res) => {
    try {
        const db = getDB();
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ code: 401, message: '请先登录', data: null });
        }

        const { id } = req.params;
        const addr = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(id, userId);
        if (!addr) {
            return res.status(404).json({ code: 404, message: '地址不存在', data: null });
        }

        db.prepare('DELETE FROM addresses WHERE id = ?').run(id);

        // 如果删除的是默认地址，自动将第一个设为默认
        if (addr.is_default) {
            const first = db.prepare('SELECT id FROM addresses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(userId);
            if (first) {
                db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').run(first.id);
            }
        }

        res.json({ code: 0, message: '删除成功', data: null });
    } catch (err) {
        console.error('[Addresses] Delete error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// PUT /api/v1/addresses/:id/default - 设为默认地址
router.put('/:id/default', (req, res) => {
    try {
        const db = getDB();
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ code: 401, message: '请先登录', data: null });
        }

        const { id } = req.params;
        db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId);
        db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?').run(id, userId);

        res.json({ code: 0, message: '设置成功', data: null });
    } catch (err) {
        console.error('[Addresses] Set default error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

module.exports = router;
