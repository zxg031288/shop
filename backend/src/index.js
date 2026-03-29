const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const { getDB } = require('./db/init');

// 确保 data 和 uploads 目录存在
const dataDir = process.env.NODE_ENV === 'production'
    ? '/data'
    : path.join(__dirname, '..', '..', 'data');
const uploadsDir = process.env.UPLOAD_DIR || path.join(dataDir, 'uploads');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session ID 中间件（为每个访客生成会话 ID）
app.use((req, res, next) => {
    let sessionId = req.cookies?.session_id || req.headers['x-session-id'];
    if (!sessionId) {
        sessionId = uuidv4();
        res.setHeader('Set-Cookie', `session_id=${sessionId}; Path=/; Max-Age=2592000; SameSite=Lax`);
    }
    req.sessionId = sessionId;
    next();
});

// 用户登录 cookie 中间件
app.use((req, res, next) => {
    // user_id cookie 在 auth 登录时设置
    next();
});

// 静态文件服务
app.use('/uploads', express.static(uploadsDir));
// 支付截图目录
app.use('/screenshots', express.static(path.join(dataDir, 'screenshots')));
// 支付二维码图片（客户提供的收款码）
const playDir = path.join(__dirname, '../../..', 'play');
if (fs.existsSync(playDir)) {
    app.use('/play', express.static(playDir));
}

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api/v1/products', require('./routes/products'));
app.use('/api/v1/cart', require('./routes/cart'));
app.use('/api/v1/orders', require('./routes/orders'));
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/addresses', require('./routes/addresses'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/pay', require('./routes/pay'));

// 前端 SPA fallback
app.get('*', (req, res) => {
    const frontendDist = path.join(__dirname, '../../frontend/dist/index.html');
    if (fs.existsSync(frontendDist)) {
        res.sendFile(frontendDist);
    } else {
        res.json({ message: 'Shop API Server Running', version: '1.0.0' });
    }
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('[Server Error]', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ code: 400, message: '图片大小不能超过10MB', data: null });
    }
    if (err.message && err.message.includes('只支持')) {
        return res.status(400).json({ code: 400, message: err.message, data: null });
    }
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`[Shop API] 服务器已启动，监听端口 ${PORT}`);
    console.log(`[Shop API] 数据库路径: ${process.env.DB_PATH || path.join(dataDir, 'shop.db')}`);
    console.log(`[Shop API] 上传目录: ${uploadsDir}`);
});
