const express = require('express');
const router = express.Router();
const { getDB } = require('../db/init');

function parseProductImages(raw) {
    try {
        const v = JSON.parse(raw || '[]');
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
}

function getSessionId(req) {
    return req.cookies?.session_id || req.headers['x-session-id'] || 'anonymous';
}

function getUserId(req) {
    return parseInt(req.cookies?.user_id) || null;
}

function cartCondition(db, sessionId, userId) {
    // 优先匹配 user_id（已登录用户），其次匹配 session_id（匿名用户）
    if (userId) {
        const sessionItems = db.prepare(
            'SELECT id FROM carts WHERE user_id = ?'
        ).all(userId);
        const sessionItems2 = db.prepare(
            'SELECT id FROM carts WHERE session_id = ? AND user_id IS NULL'
        ).all(sessionId);
        return { userMatch: sessionItems.map(i => i.id), sessionMatch: sessionItems2.map(i => i.id) };
    }
    return null;
}

// GET /api/v1/cart - 获取购物车
router.get('/', (req, res) => {
    try {
        const db = getDB();
        const sessionId = getSessionId(req);
        const userId = getUserId(req);

        let items;
        if (userId) {
            items = db.prepare(`
                SELECT c.*, p.name, p.price, p.shipping, p.images, p.stock, p.status
                FROM carts c
                JOIN products p ON c.product_id = p.id
                WHERE c.user_id = ?
                ORDER BY c.created_at DESC
            `).all(userId);
        } else {
            items = db.prepare(`
                SELECT c.*, p.name, p.price, p.shipping, p.images, p.stock, p.status
                FROM carts c
                JOIN products p ON c.product_id = p.id
                WHERE c.session_id = ? AND c.user_id IS NULL
                ORDER BY c.created_at DESC
            `).all(sessionId);
        }

        const result = items.map(item => ({
            ...item,
            images: parseProductImages(item.images),
        }));

        res.json({ code: 0, message: 'success', data: result });
    } catch (err) {
        console.error('[Cart] Get error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// POST /api/v1/cart - 加入购物车
router.post('/', (req, res) => {
    try {
        const db = getDB();
        const sessionId = getSessionId(req);
        const userId = getUserId(req);
        const { product_id, quantity = 1 } = req.body;

        if (!product_id) {
            return res.status(400).json({ code: 400, message: '缺少商品ID', data: null });
        }

        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
        if (!product) {
            return res.status(404).json({ code: 404, message: '商品不存在', data: null });
        }
        if (product.status !== 'active') {
            return res.status(400).json({ code: 400, message: '商品已下架', data: null });
        }
        if (product.stock < quantity) {
            return res.status(400).json({ code: 400, message: '库存不足', data: null });
        }

        // 已登录用户用 user_id，未登录用 session_id
        const matchCol = userId ? 'user_id' : 'session_id';
        const matchVal = userId || sessionId;

        const existing = db.prepare(
            `SELECT * FROM carts WHERE ${matchCol} = ? AND product_id = ?`
        ).get(matchVal, product_id);

        if (existing) {
            const newQty = existing.quantity + quantity;
            if (newQty > product.stock) {
                return res.status(400).json({ code: 400, message: '库存不足', data: null });
            }
            db.prepare('UPDATE carts SET quantity = ? WHERE id = ?').run(newQty, existing.id);
        } else {
            db.prepare(
                'INSERT INTO carts (session_id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)'
            ).run(sessionId, userId, product_id, quantity);
        }

        res.json({ code: 0, message: '已加入购物车', data: null });
    } catch (err) {
        console.error('[Cart] Add error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// PUT /api/v1/cart/:id - 更新购物车数量
router.put('/:id', (req, res) => {
    try {
        const db = getDB();
        const sessionId = getSessionId(req);
        const userId = getUserId(req);
        const { id } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ code: 400, message: '数量必须大于0', data: null });
        }

        let item;
        if (userId) {
            item = db.prepare(
                'SELECT c.*, p.stock FROM carts c JOIN products p ON c.product_id = p.id WHERE c.id = ? AND c.user_id = ?'
            ).get(id, userId);
        } else {
            item = db.prepare(
                'SELECT c.*, p.stock FROM carts c JOIN products p ON c.product_id = p.id WHERE c.id = ? AND c.session_id = ? AND c.user_id IS NULL'
            ).get(id, sessionId);
        }

        if (!item) {
            return res.status(404).json({ code: 404, message: '购物车项不存在', data: null });
        }
        if (quantity > item.stock) {
            return res.status(400).json({ code: 400, message: '库存不足', data: null });
        }

        db.prepare('UPDATE carts SET quantity = ? WHERE id = ?').run(quantity, id);
        res.json({ code: 0, message: '更新成功', data: null });
    } catch (err) {
        console.error('[Cart] Update error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// DELETE /api/v1/cart/:id - 删除购物车项
router.delete('/:id', (req, res) => {
    try {
        const db = getDB();
        const sessionId = getSessionId(req);
        const userId = getUserId(req);
        const { id } = req.params;

        if (userId) {
            db.prepare('DELETE FROM carts WHERE id = ? AND user_id = ?').run(id, userId);
        } else {
            db.prepare('DELETE FROM carts WHERE id = ? AND session_id = ? AND user_id IS NULL').run(id, sessionId);
        }
        res.json({ code: 0, message: '已删除', data: null });
    } catch (err) {
        console.error('[Cart] Delete error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// DELETE /api/v1/cart - 清空购物车
router.delete('/', (req, res) => {
    try {
        const db = getDB();
        const sessionId = getSessionId(req);
        const userId = getUserId(req);

        if (userId) {
            db.prepare('DELETE FROM carts WHERE user_id = ?').run(userId);
        } else {
            db.prepare('DELETE FROM carts WHERE session_id = ? AND user_id IS NULL').run(sessionId);
        }
        res.json({ code: 0, message: '购物车已清空', data: null });
    } catch (err) {
        console.error('[Cart] Clear error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

module.exports = router;
