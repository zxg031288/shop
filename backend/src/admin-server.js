const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Separate Express server for the admin panel on port 3001
const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

const FRONTEND_ADMIN_DIST = path.join(__dirname, '../../frontend/dist');
const DATA_DIR = path.join(__dirname, '../../data');
const PLAY_DIR = path.join(__dirname, '../../play');

// CORS - allow frontend dev server
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Static file middleware: serve uploads, screenshots, and play folder
app.use('/uploads', express.static(path.join(DATA_DIR, 'uploads')));
app.use('/screenshots', express.static(path.join(DATA_DIR, 'screenshots')));
if (fs.existsSync(PLAY_DIR)) {
    app.use('/play', express.static(PLAY_DIR));
}

// Proxy API calls to backend (localhost:3000)
app.use('/api', (req, res) => {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: req.originalUrl,
        method: req.method,
        headers: {
            ...req.headers,
            host: 'localhost:3000',
        }
    };
    const proxyReq = http.request(options, (proxyRes) => {
        res.status(proxyRes.statusCode || 500);
        proxyRes.pipe(res);
    });
    proxyReq.on('error', () => {
        res.status(502).json({ code: 502, message: '无法连接后端服务，请确保后端已启动', data: null });
    });
    req.pipe(proxyReq);
});

// Serve admin static files
if (fs.existsSync(FRONTEND_ADMIN_DIST)) {
    app.use(express.static(FRONTEND_ADMIN_DIST));
    const adminHtmlPath = path.join(FRONTEND_ADMIN_DIST, 'admin.html');
    if (fs.existsSync(adminHtmlPath)) {
        app.get('/admin', (req, res) => res.sendFile(adminHtmlPath));
        app.get('/admin/*', (req, res) => res.sendFile(adminHtmlPath));
        app.get('*', (req, res) => res.sendFile(adminHtmlPath));
    }
} else {
    app.get('*', (req, res) => {
        res.send(`
            <html>
            <head><meta charset="utf-8"><title>月芽湾湾 商家管理</title></head>
            <body style="font-family:sans-serif;padding:40px;background:#0f172a;color:#fff;min-height:100vh;margin:0">
                <h1>月芽湾湾 商家管理系统</h1>
                <p style="color:#94a3b8">请先构建前端：</p>
                <pre style="background:#1e293b;padding:16px;border-radius:8px;color:#60a5fa">cd frontend && npm install && npm run build</pre>
                <p style="color:#94a3b8;margin-top:24px">开发模式启动：</p>
                <pre style="background:#1e293b;padding:16px;border-radius:8px;color:#60a5fa"># 终端1
cd backend && npm start

# 终端2
cd backend && npm run admin

# 终端3
cd frontend && npm run dev</pre>
                <p style="margin-top:24px;color:#94a3b8">后端API: <a href="http://localhost:3000" style="color:#60a5fa">http://localhost:3000</a></p>
            </body>
            </html>
        `);
    });
}

app.listen(PORT, () => {
    console.log(`[Admin Server] 月芽湾湾商家管理系统已启动`);
    console.log(`[Admin Server] 访问地址: http://localhost:${PORT}/admin`);
    console.log(`[Admin Server] API 代理到: http://localhost:3000`);
});
