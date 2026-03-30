-- 海淘代购平台数据库建表 SQL

-- 商品表
CREATE TABLE IF NOT EXISTS products (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    category     TEXT    DEFAULT '',
    price        REAL    NOT NULL DEFAULT 0,
    stock        INTEGER DEFAULT 0,
    shipping     REAL    DEFAULT 0,
    origin       TEXT    DEFAULT '澳大利亚',
    description  TEXT    DEFAULT '',
    images       TEXT    DEFAULT '[]',
    status       TEXT    DEFAULT 'active',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户表（买家账号）
CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    UNIQUE NOT NULL,
    password   TEXT    NOT NULL,
    nickname   TEXT    DEFAULT '',
    phone      TEXT    DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户收货地址表
CREATE TABLE IF NOT EXISTS addresses (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    name       TEXT    NOT NULL,
    phone      TEXT    NOT NULL,
    province    TEXT    DEFAULT '',
    city       TEXT    DEFAULT '',
    district   TEXT    DEFAULT '',
    detail     TEXT    NOT NULL DEFAULT '',
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no      TEXT    UNIQUE NOT NULL,
    user_id       INTEGER DEFAULT NULL,
    buyer_name    TEXT    NOT NULL,
    buyer_phone   TEXT    NOT NULL,
    buyer_addr    TEXT    NOT NULL,
    buyer_province TEXT   DEFAULT '',
    buyer_city    TEXT    DEFAULT '',
    buyer_district TEXT   DEFAULT '',
    status        TEXT    DEFAULT 'paid',
    pay_method        TEXT    NOT NULL,
    pay_transaction_id TEXT   DEFAULT '',
    pay_screenshot    TEXT    DEFAULT '',
    total_amount      REAL    NOT NULL DEFAULT 0,
    session_id    TEXT    DEFAULT '',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 订单明细表（product_id 可为 NULL，便于删除商品后仍保留历史订单行快照）
CREATE TABLE IF NOT EXISTS order_items (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id       INTEGER NOT NULL,
    product_id     INTEGER,
    product_name   TEXT    NOT NULL,
    product_image  TEXT    DEFAULT '',
    quantity       INTEGER NOT NULL DEFAULT 1,
    price          REAL    NOT NULL,
    shipping       REAL    DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 站点键值配置（首页活动等）
CREATE TABLE IF NOT EXISTS site_kv (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL DEFAULT ''
);

INSERT OR IGNORE INTO site_kv (key, value) VALUES (
    'home_banner',
    '{"titleLine1":"澳洲直邮","titleLine2":"限时折扣","subtitle":"今日下单享9折优惠","badge":"立省 ¥80+","emoji":"✈️","linkUrl":""}'
);

-- 购物车表
CREATE TABLE IF NOT EXISTS carts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  TEXT    NOT NULL,
    user_id     INTEGER DEFAULT NULL,
    product_id  INTEGER NOT NULL,
    quantity    INTEGER DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 管理员表（简化：单个管理员）
CREATE TABLE IF NOT EXISTS admins (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    username  TEXT    UNIQUE NOT NULL,
    password  TEXT    NOT NULL,
    nickname  TEXT    DEFAULT '商家',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 初始化默认管理员 (密码: admin123)
INSERT OR IGNORE INTO admins (username, password, nickname)
VALUES ('admin', 'admin123', '老板');

-- 插入示例商品数据
INSERT OR IGNORE INTO products (name, category, price, stock, shipping, origin, description, images, status)
VALUES
('澳洲 Aesop 鼠尾草护肤套装', '美妆护肤', 468, 28, 35, '澳大利亚',
 '澳大利亚顶级植物护肤品牌，采用天然草药成分，温和不刺激。套装包含洁面、精华、面霜各一瓶，适合各种肤质。',
 '["/uploads/1.jpg"]', 'active'),

('Coach 经典托特包 棕色', '包包', 1280, 5, 45, '美国',
 'Coach 经典款式，优质牛皮材质，内部隔层设计，容量大，日常上班通勤均适合。',
 '["/uploads/2.jpg"]', 'active'),

('Charlotte Tilbury 奇迹面霜 50ml', '美妆护肤', 659, 41, 40, '英国',
 '英国皇室认证护肤品，胶原蛋白刺激配方，紧致提升肌肤，适合25岁以上女性使用。',
 '["/uploads/3.jpg"]', 'active'),

('Fjällräven Kånken 背包 深蓝', '包包', 398, 0, 38, '瑞典',
 '瑞典国民背包，1978年设计延续至今，防水耐磨，适合通勤旅行，经典款深蓝色。',
 '["/uploads/4.jpg"]', 'active'),

('Grown Alchemist 深层洁面乳', '美妆护肤', 228, 33, 35, '澳大利亚',
 '澳洲有机护肤品牌，深层清洁毛孔，不紧绷，适合油性混合性肌肤每日使用。',
 '["/uploads/5.jpg"]', 'active'),

('Daniel Wellington 手表 玫瑰金', '手表', 780, 12, 30, '瑞典',
 '北欧简约设计，玫瑰金表框，真皮表带，防水30米，适合日常佩戴及商务场合。',
 '["/uploads/6.jpg"]', 'active');
