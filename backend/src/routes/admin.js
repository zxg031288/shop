const express = require('express');
const router = express.Router();
const { getDB } = require('../db/init');
const upload = require('../middleware/upload');
const path = require('path');
const XLSX = require('xlsx');

const DEFAULT_HOME_BANNER = {
    titleLine1: '澳洲直邮',
    titleLine2: '限时折扣',
    subtitle: '今日下单享9折优惠',
    badge: '立省 ¥80+',
    emoji: '✈️',
    linkUrl: '',
};

function parseHomeBannerPayload(body) {
    const b = body || {};
    return {
        titleLine1: String(b.titleLine1 ?? DEFAULT_HOME_BANNER.titleLine1).slice(0, 80),
        titleLine2: String(b.titleLine2 ?? DEFAULT_HOME_BANNER.titleLine2).slice(0, 80),
        subtitle: String(b.subtitle ?? DEFAULT_HOME_BANNER.subtitle).slice(0, 200),
        badge: String(b.badge ?? DEFAULT_HOME_BANNER.badge).slice(0, 80),
        emoji: String(b.emoji ?? DEFAULT_HOME_BANNER.emoji).slice(0, 20),
        linkUrl: String(b.linkUrl ?? '').trim().slice(0, 500),
    };
}

// POST /api/v1/admin/login - 商家登录
router.post('/login', (req, res) => {
    try {
        const db = getDB();
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ code: 400, message: '请输入用户名和密码', data: null });
        }

        const admin = db.prepare('SELECT * FROM admins WHERE username = ? AND password = ?')
            .get(username, password);

        if (!admin) {
            return res.status(401).json({ code: 401, message: '用户名或密码错误', data: null });
        }

        res.json({
            code: 0,
            message: '登录成功',
            data: {
                id: admin.id,
                username: admin.username,
                nickname: admin.nickname
            }
        });
    } catch (err) {
        console.error('[Admin] Login error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// POST /api/v1/admin/products - 上传商品（含图片）
router.post('/products', upload.array('images', 6), (req, res) => {
    try {
        const db = getDB();
        const { name, category, price, stock, shipping, origin, description } = req.body;

        if (!name || !price || stock === undefined) {
            return res.status(400).json({ code: 400, message: '缺少必填字段', data: null });
        }

        // 处理图片路径
        const images = (req.files || []).map(file => `/uploads/${file.filename}`);

        const result = db.prepare(`
            INSERT INTO products (name, category, price, stock, shipping, origin, description, images)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            name,
            category || '',
            parseFloat(price),
            parseInt(stock),
            parseFloat(shipping || 0),
            origin || '澳大利亚',
            description || '',
            JSON.stringify(images)
        );

        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);

        res.json({
            code: 0,
            message: '商品已上架',
            data: {
                ...product,
                images: JSON.parse(product.images || '[]')
            }
        });
    } catch (err) {
        console.error('[Admin] Create product error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// PUT /api/v1/admin/products/:id - 编辑商品
router.put('/products/:id', upload.array('images', 6), (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { name, category, price, stock, shipping, origin, description, status } = req.body;

        const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ code: 404, message: '商品不存在', data: null });
        }

        // 如果有新上传的图片，追加到现有图片
        let images = existing.images;
        if (req.files && req.files.length > 0) {
            const existingImages = JSON.parse(existing.images || '[]');
            const newImages = req.files.map(file => `/uploads/${file.filename}`);
            images = JSON.stringify([...existingImages, ...newImages]);
        }

        db.prepare(`
            UPDATE products SET
                name = COALESCE(?, name),
                category = COALESCE(?, category),
                price = COALESCE(?, price),
                stock = COALESCE(?, stock),
                shipping = COALESCE(?, shipping),
                origin = COALESCE(?, origin),
                description = COALESCE(?, description),
                images = ?,
                status = COALESCE(?, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            name || null,
            category || null,
            price !== undefined ? parseFloat(price) : null,
            stock !== undefined ? parseInt(stock) : null,
            shipping !== undefined ? parseFloat(shipping) : null,
            origin || null,
            description || null,
            images,
            status || null,
            id
        );

        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
        res.json({
            code: 0,
            message: '更新成功',
            data: {
                ...product,
                images: JSON.parse(product.images || '[]')
            }
        });
    } catch (err) {
        console.error('[Admin] Update product error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// PUT /api/v1/admin/products/:id/status - 上下架
router.put('/products/:id/status', (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'off'].includes(status)) {
            return res.status(400).json({ code: 400, message: '状态值无效', data: null });
        }

        db.prepare('UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(status, id);

        res.json({ code: 0, message: '状态已更新', data: null });
    } catch (err) {
        console.error('[Admin] Update status error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// DELETE /api/v1/admin/products/:id - 删除商品
router.delete('/products/:id', (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;

        const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ code: 404, message: '商品不存在', data: null });
        }

        const del = db.prepare('DELETE FROM products WHERE id = ?').run(id);
        if (del.changes === 0) {
            return res.status(404).json({ code: 404, message: '商品不存在', data: null });
        }
        res.json({ code: 0, message: '商品已删除（历史订单中的该商品行仍保留名称与价格快照）', data: null });
    } catch (err) {
        console.error('[Admin] Delete product error:', err);
        const msg = err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY'
            ? '无法删除：数据库约束冲突，请联系管理员执行数据库迁移（order_items.product_id 需允许为空）'
            : '服务器错误';
        res.status(500).json({ code: 500, message: msg, data: null });
    }
});

// GET /api/v1/admin/home-banner - 首页活动配置
router.get('/home-banner', (req, res) => {
    try {
        const db = getDB();
        const row = db.prepare('SELECT value FROM site_kv WHERE key = ?').get('home_banner');
        let data;
        if (row?.value) {
            try {
                data = { ...DEFAULT_HOME_BANNER, ...JSON.parse(row.value) };
            } catch {
                data = { ...DEFAULT_HOME_BANNER };
            }
        } else {
            data = { ...DEFAULT_HOME_BANNER };
        }
        res.json({ code: 0, message: 'success', data });
    } catch (err) {
        console.error('[Admin] home-banner get error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// PUT /api/v1/admin/home-banner - 保存首页活动配置
router.put('/home-banner', (req, res) => {
    try {
        const db = getDB();
        const payload = parseHomeBannerPayload(req.body);
        const json = JSON.stringify(payload);
        db.prepare(`
            INSERT INTO site_kv (key, value) VALUES ('home_banner', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `).run(json);
        res.json({ code: 0, message: '已保存', data: payload });
    } catch (err) {
        console.error('[Admin] home-banner put error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// GET /api/v1/admin/products - 商品列表（含全部状态）
router.get('/products', (req, res) => {
    try {
        const db = getDB();
        const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();

        const result = products.map(p => ({
            ...p,
            images: JSON.parse(p.images || '[]')
        }));

        res.json({ code: 0, message: 'success', data: result });
    } catch (err) {
        console.error('[Admin] List error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// POST /api/v1/admin/orders/:id/ship - 标记发货（支持填写物流单号或上传物流图片）
router.post('/orders/:id/ship', upload.single('tracking_image'), (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'paid', 'shipped', 'done'].includes(status)) {
            return res.status(400).json({ code: 400, message: '状态值无效', data: null });
        }

        const tracking_number = (req.body.tracking_number || '').trim().slice(0, 100);
        const tracking_image = req.file ? `/uploads/${req.file.filename}` : ((req.body.tracking_image || '').trim().slice(0, 500));

        db.prepare('UPDATE orders SET status = ?, tracking_number = ?, tracking_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(status, tracking_number, tracking_image, id);

        res.json({ code: 0, message: '订单状态已更新', data: null });
    } catch (err) {
        console.error('[Admin] Ship order error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// GET /api/v1/admin/orders - 订单列表（商家端，不受 session 限制）
router.get('/orders', (req, res) => {
    try {
        const db = getDB();
        const { status } = req.query;

        let sql = 'SELECT * FROM orders';
        const params = [];
        if (status) {
            sql += ' WHERE status = ?';
            params.push(status);
        }
        sql += ' ORDER BY created_at DESC';

        const orders = db.prepare(sql).all(...params);

        const result = orders.map(order => {
            const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
            return {
                ...order,
                tracking_number: order.tracking_number || '',
                tracking_image: order.tracking_image || '',
                items: items.map(item => ({
                    ...item,
                    product_image: item.product_image ? JSON.parse(item.product_image) : []
                }))
            };
        });

        res.json({ code: 0, message: 'success', data: result });
    } catch (err) {
        console.error('[Admin] Orders list error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// GET /api/v1/admin/orders/export - 导出订单 Excel（.xlsx）
router.get('/orders/export', (req, res) => {
    try {
        const db = getDB();
        const { status } = req.query;

        let sql = 'SELECT * FROM orders';
        const params = [];
        if (status) {
            sql += ' WHERE status = ?';
            params.push(status);
        }
        sql += ' ORDER BY created_at DESC';

        const orders = db.prepare(sql).all(...params);

        const statusMap = { pending: '待支付', paid: '已付款', shipped: '已发货', done: '已完成' };
        const payMap = { wechat: '微信支付', alipay: '支付宝' };

        // 构建 Excel 行数据
        const excelRows = [];

        for (const order of orders) {
            const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
            const fullAddr = [order.buyer_province, order.buyer_city, order.buyer_district, order.buyer_addr]
                .filter(Boolean).join('');

            if (items.length === 0) {
                excelRows.push({
                    '订单号': order.order_no,
                    '下单时间': order.created_at,
                    '收货人': order.buyer_name,
                    '联系电话': order.buyer_phone,
                    '收货地址': fullAddr,
                    '支付方式': payMap[order.pay_method] || order.pay_method,
                    '支付订单号': order.pay_transaction_id || '-',
                    '订单状态': statusMap[order.status] || order.status,
                    '商品名称': '',
                    '商品规格': '',
                    '单价(元)': 0,
                    '数量': 0,
                    '运费(元)': 0,
                    '小计(元)': 0,
                    '订单总金额(元)': Number(order.total_amount || 0).toFixed(2),
                    '支付截图': order.pay_screenshot || '-',
                });
            } else {
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const itemSubtotal = (Number(item.price) || 0) + (Number(item.shipping) || 0);
                    excelRows.push({
                        '订单号': i === 0 ? order.order_no : '',
                        '下单时间': i === 0 ? order.created_at : '',
                        '收货人': i === 0 ? order.buyer_name : '',
                        '联系电话': i === 0 ? order.buyer_phone : '',
                        '收货地址': i === 0 ? fullAddr : '',
                        '支付方式': i === 0 ? (payMap[order.pay_method] || order.pay_method) : '',
                        '支付订单号': i === 0 ? (order.pay_transaction_id || '-') : '',
                        '订单状态': i === 0 ? (statusMap[order.status] || order.status) : '',
                        '商品名称': item.product_name,
                        '商品规格': '',
                        '单价(元)': Number(item.price || 0).toFixed(2),
                        '数量': item.quantity,
                        '运费(元)': Number(item.shipping || 0).toFixed(2),
                        '小计(元)': itemSubtotal.toFixed(2),
                        '订单总金额(元)': i === 0 ? Number(order.total_amount || 0).toFixed(2) : '',
                        '物流单号': i === 0 ? (order.tracking_number || '-') : '',
                        '物流图片': i === 0 ? (order.tracking_image || '-') : '',
                        '支付截图': i === 0 ? (order.pay_screenshot || '-') : '',
                    });
                }
            }
        }

        // 生成 Excel 工作簿
        const ws = XLSX.utils.json_to_sheet(excelRows);

        // 设置列宽
        ws['!cols'] = [
            { wch: 22 }, // 订单号
            { wch: 20 }, // 下单时间
            { wch: 10 }, // 收货人
            { wch: 14 }, // 联系电话
            { wch: 30 }, // 收货地址
            { wch: 10 }, // 支付方式
            { wch: 22 }, // 支付订单号
            { wch: 10 }, // 订单状态
            { wch: 28 }, // 商品名称
            { wch: 10 }, // 商品规格
            { wch: 10 }, // 单价
            { wch: 6 },  // 数量
            { wch: 10 }, // 运费
            { wch: 10 }, // 小计
            { wch: 14 }, // 订单总金额
            { wch: 22 }, // 物流单号
            { wch: 30 }, // 物流图片
            { wch: 20 }, // 支付截图
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '销售记录');

        const filename = `月芽湾湾销售记录_${new Date().toISOString().slice(0, 10)}.xlsx`;
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send(buf);
    } catch (err) {
        console.error('[Admin] Orders export error:', err);
        res.status(500).json({ code: 500, message: '导出失败', data: null });
    }
});

// GET /api/v1/admin/stats - 数据概览
router.get('/stats', (req, res) => {
    try {
        const db = getDB();

        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const monthStart = new Date().toISOString().slice(0, 7) + '-01';

        // 今日订单数
        const todayOrders = db.prepare(`
            SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
            FROM orders WHERE DATE(created_at) = ?
        `).get(today);

        // 昨日订单数
        const yesterdayOrders = db.prepare(`
            SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
            FROM orders WHERE DATE(created_at) = ?
        `).get(yesterday);

        // 本月统计
        const monthStats = db.prepare(`
            SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue, COALESCE(AVG(total_amount), 0) as avg_amount
            FROM orders WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
        `).get();

        // 在售商品数
        const activeProducts = db.prepare(`
            SELECT COUNT(*) as count, SUM(CASE WHEN stock <= 5 AND stock > 0 THEN 1 ELSE 0 END) as low_stock
            FROM products WHERE status = 'active'
        `).get();

        // 待发货数
        const pendingOrders = db.prepare(`
            SELECT COUNT(*) as count FROM orders WHERE status = 'paid'
        `).get();

        // TOP 商品销量
        const topProducts = db.prepare(`
            SELECT p.name, p.category, p.origin, SUM(oi.quantity) as total_sales
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            GROUP BY oi.product_id
            ORDER BY total_sales DESC
            LIMIT 5
        `).all();

        res.json({
            code: 0,
            message: 'success',
            data: {
                today: {
                    orders: todayOrders.count,
                    orders_change: todayOrders.count - yesterdayOrders.count,
                    revenue: todayOrders.revenue,
                    revenue_change: todayOrders.revenue - yesterdayOrders.revenue
                },
                month: {
                    orders: monthStats.count,
                    revenue: monthStats.revenue,
                    avg_amount: Math.round(monthStats.avg_amount)
                },
                products: {
                    active: activeProducts.count,
                    low_stock: activeProducts.low_stock || 0
                },
                pending_orders: pendingOrders.count,
                top_products: topProducts
            }
        });
    } catch (err) {
        console.error('[Admin] Stats error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// PUT /api/v1/admin/password - 修改登录密码
router.put('/password', (req, res) => {
    try {
        const db = getDB();
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ code: 400, message: '请填写旧密码和新密码', data: null });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ code: 400, message: '新密码长度不能少于6位', data: null });
        }

        // 用用户名（旧密码）找到记录
        // 从请求体取 username（登录时已验证，这里信任前端传来的 username）
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ code: 400, message: '用户名不能为空', data: null });
        }

        const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
        if (!admin) {
            return res.status(404).json({ code: 404, message: '管理员不存在', data: null });
        }

        if (admin.password !== oldPassword) {
            return res.status(403).json({ code: 403, message: '旧密码不正确', data: null });
        }

        db.prepare('UPDATE admins SET password = ? WHERE username = ?').run(newPassword, username);

        res.json({ code: 0, message: '密码修改成功', data: null });
    } catch (err) {
        console.error('[Admin] Change password error:', err);
        res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

module.exports = router;
