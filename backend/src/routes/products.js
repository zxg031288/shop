const express = require('express');
const router = express.Router();
const { getDB } = require('../db/init');

const DEFAULT_HOME_BANNER = {
    titleLine1: '澳洲直邮',
    titleLine2: '限时折扣',
    subtitle: '今日下单享9折优惠',
    badge: '立省 ¥80+',
    emoji: '✈️',
    linkUrl: '',
};

function parseHomeBannerRow(raw) {
    try {
        const parsed = JSON.parse(raw || '{}');
        return { ...DEFAULT_HOME_BANNER, ...parsed };
    } catch {
        return { ...DEFAULT_HOME_BANNER };
    }
}

function parseProductImages(raw) {
    try {
        const v = JSON.parse(raw || '[]');
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
}

// GET /api/v1/products - 商品列表
router.get('/', (req, res) => {
    try {
        const db = getDB();
        const { category, keyword, status = 'active' } = req.query;

        let sql = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }
        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }
        if (keyword) {
            sql += ' AND (name LIKE ? OR description LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        sql += ' ORDER BY created_at DESC';

        const products = db.prepare(sql).all(...params);

        // 解析 images JSON
        const result = products.map(p => ({
            ...p,
            images: parseProductImages(p.images),
        }));

        res.json({ code: 0, message: 'success', data: result });
    } catch (err) {
        console.error('[Products] List error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// GET /api/v1/products/meta/home-banner - 首页活动区（公开）
router.get('/meta/home-banner', (req, res) => {
    try {
        const db = getDB();
        const row = db.prepare('SELECT value FROM site_kv WHERE key = ?').get('home_banner');
        const data = row ? parseHomeBannerRow(row.value) : { ...DEFAULT_HOME_BANNER };
        res.json({ code: 0, message: 'success', data });
    } catch (err) {
        console.error('[Products] Home banner error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// GET /api/v1/products/:id - 商品详情
router.get('/:id', (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;

        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
        if (!product) {
            return res.status(404).json({ code: 404, message: '商品不存在', data: null });
        }

        // 查询销量（从订单中统计）
        const sales = db.prepare(`
            SELECT COALESCE(SUM(quantity), 0) as total
            FROM order_items
            WHERE product_id = ?
        `).get(id);

        res.json({
            code: 0,
            message: 'success',
            data: {
                ...product,
                images: parseProductImages(product.images),
                sales: sales.total
            }
        });
    } catch (err) {
        console.error('[Products] Detail error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// GET /api/v1/categories - 分类列表
router.get('/meta/categories', (req, res) => {
    const categories = [
        { id: '美妆护肤', label: '美妆护肤', emoji: '💄' },
        { id: '包包', label: '包包', emoji: '👜' },
        { id: '鞋履', label: '鞋履', emoji: '👟' },
        { id: '手表', label: '手表', emoji: '⌚' },
        { id: '保健品', label: '保健品', emoji: '💊' },
        { id: '服饰', label: '服饰', emoji: '👗' },
        { id: '其他', label: '其他', emoji: '🎁' }
    ];
    res.json({ code: 0, message: 'success', data: categories });
});

module.exports = router;
