/**
 * 生成订单号
 * 格式: HT + YYYYMMDD + 6位随机数
 */
function generateOrderNo() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `HT${date}${random}`;
}

module.exports = { generateOrderNo };
