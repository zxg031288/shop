const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let db = null;

function getDB() {
    if (db) return db;

    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../..', 'data', 'shop.db');
    const dbDir = path.dirname(dbPath);

    // 确保目录存在
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    initDB();
    return db;
}

function initDB() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // 分割并执行每个语句
    const statements = schema.split(';').filter(s => s.trim());
    for (const stmt of statements) {
        try {
            db.exec(stmt);
        } catch (err) {
            // 忽略 IGNORE 语句的错误
            if (!stmt.includes('INSERT OR IGNORE')) {
                console.error('SQL Error:', err.message);
            }
        }
    }

    // 迁移：为已有数据库添加新字段
    try {
        const cols = db.prepare("PRAGMA table_info(orders)").all();
        const colNames = cols.map((c) => c.name);
        if (!colNames.includes('pay_transaction_id')) {
            db.exec("ALTER TABLE orders ADD COLUMN pay_transaction_id TEXT DEFAULT ''");
            console.log('[DB] 已添加 pay_transaction_id 列');
        }
        if (!colNames.includes('pay_screenshot')) {
            db.exec("ALTER TABLE orders ADD COLUMN pay_screenshot TEXT DEFAULT ''");
            console.log('[DB] 已添加 pay_screenshot 列');
        }
    } catch (err) {
        // 列可能已存在，忽略
    }

    // 迁移：order_items.product_id 改为可空（否则 ON DELETE SET NULL 与 NOT NULL 冲突，有订单时无法删商品）
    try {
        const oiCols = db.prepare('PRAGMA table_info(order_items)').all();
        const pidCol = oiCols.find((c) => c.name === 'product_id');
        if (pidCol && pidCol.notnull === 1) {
            db.exec('PRAGMA foreign_keys = OFF');
            db.exec(`
                BEGIN;
                CREATE TABLE order_items_migrate (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_id INTEGER NOT NULL,
                    product_id INTEGER,
                    product_name TEXT NOT NULL,
                    product_image TEXT DEFAULT '',
                    quantity INTEGER NOT NULL DEFAULT 1,
                    price REAL NOT NULL,
                    shipping REAL DEFAULT 0,
                    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
                );
                INSERT INTO order_items_migrate SELECT id, order_id, product_id, product_name, product_image, quantity, price, shipping FROM order_items;
                DROP TABLE order_items;
                ALTER TABLE order_items_migrate RENAME TO order_items;
                COMMIT;
            `);
            db.exec('PRAGMA foreign_keys = ON');
            console.log('[DB] 已迁移 order_items：product_id 允许为空，支持删除已下单商品');
        }
    } catch (err) {
        console.error('[DB] order_items 迁移失败:', err.message);
    }

    // 确保 site_kv 与默认首页活动存在
    try {
        db.exec(`
            CREATE TABLE IF NOT EXISTS site_kv (
                key TEXT PRIMARY KEY NOT NULL,
                value TEXT NOT NULL DEFAULT ''
            );
        `);
        const defaultBanner = JSON.stringify({
            titleLine1: '澳洲直邮',
            titleLine2: '限时折扣',
            subtitle: '今日下单享9折优惠',
            badge: '立省 ¥80+',
            emoji: '✈️',
            linkUrl: '',
        });
        db.prepare(
            `INSERT OR IGNORE INTO site_kv (key, value) VALUES ('home_banner', ?)`
        ).run(defaultBanner);
    } catch (err) {
        console.error('[DB] site_kv 初始化失败:', err.message);
    }

    console.log('[DB] 数据库初始化完成');
}

function closeDB() {
    if (db) {
        db.close();
        db = null;
    }
}

module.exports = { getDB, closeDB };
