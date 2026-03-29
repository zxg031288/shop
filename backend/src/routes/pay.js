const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/init');

// Configure multer for payment screenshots
const screenshotStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dataDir = path.join(__dirname, '../../..', 'data', 'screenshots');
    const fs = require('fs');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    cb(null, dataDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `pay_${uuidv4()}${ext}`);
  }
});

const screenshotUpload = multer({
  storage: screenshotStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 JPG/PNG/GIF/WebP 格式'));
    }
  }
});

// POST /api/v1/pay/confirm - 确认支付凭证
router.post('/confirm', screenshotUpload.single('screenshot'), (req, res) => {
  try {
    const db = getDB();
    const { order_no, transaction_id } = req.body;

    if (!order_no) {
      return res.status(400).json({ code: 400, message: '订单号不能为空', data: null });
    }

    if (!transaction_id && !req.file) {
      return res.status(400).json({ code: 400, message: '请填写支付订单号或上传支付截图', data: null });
    }

    // 查找订单
    const order = db.prepare('SELECT * FROM orders WHERE order_no = ?').get(order_no);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在', data: null });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ code: 400, message: '该订单状态已变更，无需重复提交', data: null });
    }

    // 更新订单支付信息
    let screenshot = '';
    if (req.file) {
      screenshot = `/screenshots/${req.file.filename}`;
    }

    db.prepare(`
      UPDATE orders SET
        pay_transaction_id = ?,
        pay_screenshot = ?,
        status = 'paid',
        updated_at = CURRENT_TIMESTAMP
      WHERE order_no = ?
    `).run(transaction_id || '', screenshot, order_no);

    res.json({ code: 0, message: '支付凭证已提交，请等待商家确认', data: { order_no } });
  } catch (err) {
    console.error('[Pay] Confirm error:', err);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// GET /api/v1/pay/status/:orderNo - 查询支付状态
router.get('/status/:orderNo', (req, res) => {
  try {
    const db = getDB();
    const { orderNo } = req.params;
    const order = db.prepare('SELECT status, pay_transaction_id, pay_screenshot FROM orders WHERE order_no = ?').get(orderNo);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在', data: null });
    }
    res.json({ code: 0, message: 'success', data: order });
  } catch (err) {
    console.error('[Pay] Status error:', err);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

module.exports = router;
