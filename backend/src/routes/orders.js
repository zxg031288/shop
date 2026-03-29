const express = require('express');
const router = express.Router();
const { getDB } = require('../db/init');
const { generateOrderNo } = require('../utils/orderNo');

function getSessionId(req) {
    return req.cookies?.session_id || req.headers['x-session-id'] || 'anonymous';
}

// GET /api/v1/orders - 我的订单列表
router.get('/', (req, res) => {
    try {
        const db = getDB();
        const sessionId = getSessionId(req);
        const userId = parseInt(req.cookies?.user_id) || null;

        let orders;
        if (userId) {
            // 登录用户：优先查用户订单，兜底 session
            orders = db.prepare(`
                SELECT * FROM orders
                WHERE user_id = ?
                ORDER BY created_at DESC
            `).all(userId);
            if (orders.length === 0) {
                orders = db.prepare(`
                    SELECT * FROM orders
                    WHERE session_id = ? AND user_id IS NULL
                    ORDER BY created_at DESC
                `).all(sessionId);
            }
        } else {
            orders = db.prepare(`
                SELECT * FROM orders
                WHERE session_id = ?
                ORDER BY created_at DESC
            `).all(sessionId);
        }

        // 附带订单商品
        const result = orders.map(order => {
            const items = db.prepare(
                'SELECT * FROM order_items WHERE order_id = ?'
            ).all(order.id);
            return {
                ...order,
                items: items.map(item => ({
                    ...item,
                    product_image: item.product_image ? JSON.parse(item.product_image) : []
                }))
            };
        });

        res.json({ code: 0, message: 'success', data: result });
    } catch (err) {
        console.error('[Orders] List error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// GET /api/v1/orders/:id - 订单详情
router.get('/:id', (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
        if (!order) {
            return res.status(404).json({ code: 404, message: '订单不存在', data: null });
        }

        const items = db.prepare(
            'SELECT * FROM order_items WHERE order_id = ?'
        ).all(id);

        res.json({
            code: 0,
            message: 'success',
            data: {
                ...order,
                items: items.map(item => ({
                    ...item,
                    product_image: item.product_image ? JSON.parse(item.product_image) : []
                }))
            }
        });
    } catch (err) {
        console.error('[Orders] Detail error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// POST /api/v1/orders - 创建订单（模拟支付）
router.post('/', (req, res) => {
    try {
        const db = getDB();
        const sessionId = getSessionId(req);
        const userId = parseInt(req.cookies?.user_id) || null;
        const { buyer_name, buyer_phone, buyer_addr, buyer_province, buyer_city, buyer_district, pay_method, cart_item_ids } = req.body;

        // 参数校验
        if (!buyer_name || !buyer_phone || !buyer_addr || !pay_method) {
            return res.status(400).json({ code: 400, message: '缺少必填字段', data: null });
        }
        if (!['wechat', 'alipay'].includes(pay_method)) {
            return res.status(400).json({ code: 400, message: '支付方式错误', data: null });
        }

        // 获取购物车商品
        let cartItems;
        if (cart_item_ids && cart_item_ids.length > 0) {
            const placeholders = cart_item_ids.map(() => '?').join(',');
            cartItems = db.prepare(`
                SELECT c.*, p.name, p.price, p.shipping, p.images, p.stock, p.status
                FROM carts c
                JOIN products p ON c.product_id = p.id
                WHERE c.id IN (${placeholders}) AND c.session_id = ?
            `).all(...cart_item_ids, sessionId);
        } else {
            cartItems = db.prepare(`
                SELECT c.*, p.name, p.price, p.shipping, p.images, p.stock, p.status
                FROM carts c
                JOIN products p ON c.product_id = p.id
                WHERE c.session_id = ?
            `).all(sessionId);
        }

        if (cartItems.length === 0) {
            return res.status(400).json({ code: 400, message: '购物车为空', data: null });
        }

        // 检查库存
        for (const item of cartItems) {
            if (item.status !== 'active') {
                return res.status(400).json({
                    code: 400,
                    message: `商品"${item.name}"已下架`,
                    data: null
                });
            }
            if (item.quantity > item.stock) {
                return res.status(400).json({
                    code: 400,
                    message: `商品"${item.name}"库存不足（剩余${item.stock}件）`,
                    data: null
                });
            }
        }

        // 计算总价
        let totalAmount = 0;
        for (const item of cartItems) {
            totalAmount += (item.price + item.shipping) * item.quantity;
        }

        // 生成订单号
        const orderNo = generateOrderNo();

        // 开启事务
        const createOrder = db.transaction(() => {
            // 创建订单，状态为 pending（等支付确认后才改为 paid）
            const orderResult = db.prepare(`
                INSERT INTO orders (order_no, user_id, buyer_name, buyer_phone, buyer_addr,
                    buyer_province, buyer_city, buyer_district, pay_method, status, total_amount, session_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
            `).run(orderNo, userId, buyer_name, buyer_phone, buyer_addr,
                buyer_province || '', buyer_city || '', buyer_district || '',
                pay_method, totalAmount, sessionId);

            const orderId = orderResult.lastInsertRowid;

            // 创建订单明细
            const insertItem = db.prepare(`
                INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price, shipping)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

            for (const item of cartItems) {
                insertItem.run(
                    orderId,
                    item.product_id,
                    item.name,
                    item.images,
                    item.quantity,
                    item.price,
                    item.shipping
                );
                // 扣减库存
                updateStock.run(item.quantity, item.product_id);
            }

            // 清空已结算的购物车项
            if (cart_item_ids && cart_item_ids.length > 0) {
                const placeholders = cart_item_ids.map(() => '?').join(',');
                db.prepare(`DELETE FROM carts WHERE id IN (${placeholders}) AND session_id = ?`)
                    .run(...cart_item_ids, sessionId);
            } else {
                db.prepare('DELETE FROM carts WHERE session_id = ?').run(sessionId);
            }

            return orderId;
        });

        const orderId = createOrder();

        res.json({
            code: 0,
            message: '订单创建成功',
            data: {
                order_id: orderId,
                order_no: orderNo,
                total_amount: totalAmount
            }
        });
    } catch (err) {
        console.error('[Orders] Create error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

module.exports = router;
