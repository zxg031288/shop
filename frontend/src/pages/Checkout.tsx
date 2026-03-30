import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, createOrder, getAddresses } from '../api';
import { useToast, useUser } from '../App';
import PaymentModal from './PaymentModal';

interface PendingOrder {
  order_no: string;
  total_amount: number;
  pay_method: 'wechat' | 'alipay';
}

export default function Checkout() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = useUser();
  const [items, setItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [form, setForm] = useState({
    buyer_name: '',
    buyer_phone: '',
    buyer_province: '',
    buyer_city: '',
    buyer_district: '',
    buyer_addr: '',
    pay_method: 'wechat' as 'wechat' | 'alipay',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getCart();
        if (cancelled) return;
        if (res.code === 0) setItems(res.data || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // user 由 /auth/me 异步恢复，须在登录态就绪后再拉地址，避免首屏 user 为空漏请求
  useEffect(() => {
    if (!user) {
      setAddresses([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const addrRes = await getAddresses();
        if (cancelled || addrRes.code !== 0) return;
        setAddresses(addrRes.data || []);
        const def = (addrRes.data || []).find((a: any) => a.is_default === 1);
        if (def) {
          setForm(f => ({
            ...f,
            buyer_name: def.name,
            buyer_phone: def.phone,
            buyer_province: def.province,
            buyer_city: def.city,
            buyer_district: def.district,
            buyer_addr: def.detail,
          }));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const totalGoods = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const totalShipping = items.reduce((sum, item) => sum + (Number(item.shipping) * item.quantity), 0);
  const grandTotal = totalGoods + totalShipping;
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async () => {
    if (!form.buyer_name || !form.buyer_phone || !form.buyer_addr) {
      showToast('请填写完整的收货信息');
      return;
    }
    if (items.length === 0) {
      showToast('购物车为空');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createOrder({
        buyer_name: form.buyer_name,
        buyer_phone: form.buyer_phone,
        buyer_addr: form.buyer_addr,
        buyer_province: form.buyer_province,
        buyer_city: form.buyer_city,
        buyer_district: form.buyer_district,
        pay_method: form.pay_method,
        cart_item_ids: items.map(i => i.id),
      });
      if (res.code === 0) {
        // 显示支付弹窗
        setPendingOrder({
          order_no: res.data.order_no,
          total_amount: res.data.total_amount,
          pay_method: form.pay_method,
        });
      }
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClosePayment = () => {
    setPendingOrder(null);
    showToast('可在订单详情页继续完成支付');
    navigate('/my/orders');
  };

  const renderImage = (item: any) => {
    if (item.images && item.images.length > 0) {
      return <img src={item.images[0]} alt={item.name} />;
    }
    return '🛍️';
  };

  if (loading) {
    return (
      <div className="h5-page">
        <div className="loading"><div className="loading-spinner" />加载中...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h5-page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <h2>确认订单</h2>
        </div>
        <div className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <p>购物车是空的</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h5-page">
      <div className="h5-status-bar" />

      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h2>确认订单</h2>
      </div>

      <div className="order-scroll">
        {/* 收货地址 */}
        <div className="section-card">
          <h3>📍 收货地址</h3>
          {user && addresses.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {addresses.map(addr => (
                  <button
                    key={addr.id}
                    onClick={() => setForm(f => ({
                      ...f,
                      buyer_name: addr.name,
                      buyer_phone: addr.phone,
                      buyer_province: addr.province,
                      buyer_city: addr.city,
                      buyer_district: addr.district,
                      buyer_addr: addr.detail,
                    }))}
                    style={{
                      padding: '4px 10px',
                      background: form.buyer_name === addr.name ? 'rgba(255,75,43,0.12)' : 'var(--bg)',
                      border: `1px solid ${form.buyer_name === addr.name ? 'var(--brand)' : 'var(--border)'}`,
                      borderRadius: 16,
                      color: form.buyer_name === addr.name ? 'var(--brand)' : 'var(--mid)',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    {addr.name} · {addr.province || '未设置'}
                    {addr.is_default === 1 ? ' ★' : ''}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: 'var(--light)', marginTop: 4 }}>
                点击上方地址卡片快速填充，或手动填写下方信息
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              className="h5-form-input"
              placeholder="收货人姓名 *"
              value={form.buyer_name}
              onChange={e => setForm(f => ({ ...f, buyer_name: e.target.value }))}
            />
            <input
              className="h5-form-input"
              type="tel"
              placeholder="联系电话 *"
              value={form.buyer_phone}
              onChange={e => setForm(f => ({ ...f, buyer_phone: e.target.value }))}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              <input
                className="h5-form-input h5-form-input--sm"
                placeholder="省"
                value={form.buyer_province}
                onChange={e => setForm(f => ({ ...f, buyer_province: e.target.value }))}
              />
              <input
                className="h5-form-input h5-form-input--sm"
                placeholder="市"
                value={form.buyer_city}
                onChange={e => setForm(f => ({ ...f, buyer_city: e.target.value }))}
              />
              <input
                className="h5-form-input h5-form-input--sm"
                placeholder="区"
                value={form.buyer_district}
                onChange={e => setForm(f => ({ ...f, buyer_district: e.target.value }))}
              />
            </div>
            <textarea
              className="h5-form-textarea"
              style={{ resize: 'none' }}
              placeholder="详细收货地址（街道/门牌号/楼栋）"
              value={form.buyer_addr}
              onChange={e => setForm(f => ({ ...f, buyer_addr: e.target.value }))}
            />
          </div>
        </div>

        {/* 商品清单 */}
        <div className="section-card">
          <h3>📦 商品清单</h3>
          {items.map(item => (
            <div key={item.id} className="order-item">
              <div className="oi-img">{renderImage(item)}</div>
              <div className="oi-info">
                <div className="oi-name">{item.name}</div>
                <div className="oi-qty">
                  x{item.quantity} · {item.origin === '澳大利亚' ? '🇦🇺' : item.origin === '美国' ? '🇺🇸' :
                   item.origin === '英国' ? '🇬🇧' : item.origin === '瑞典' ? '🇸🇪' : '🌍'} {item.origin}
                </div>
              </div>
              <div className="oi-price">
                ¥{((Number(item.price) + Number(item.shipping)) * item.quantity).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* 支付方式 */}
        <div className="section-card">
          <h3>💳 支付方式</h3>
          <div className="pay-methods">
            <div
              className={`pay-option ${form.pay_method === 'wechat' ? 'selected' : ''}`}
              onClick={() => setForm(f => ({ ...f, pay_method: 'wechat' }))}
            >
              <div className="pay-logo" style={{ background: '#07c160' }}>💚</div>
              <div>
                <div className="pay-name">微信支付</div>
                <div className="pay-desc">推荐使用，安全快捷</div>
              </div>
              <div className={`pay-radio ${form.pay_method === 'wechat' ? 'on' : ''}`} />
            </div>
            <div
              className={`pay-option ${form.pay_method === 'alipay' ? 'selected' : ''}`}
              onClick={() => setForm(f => ({ ...f, pay_method: 'alipay' }))}
            >
              <div className="pay-logo" style={{ background: '#1677ff' }}>🔵</div>
              <div>
                <div className="pay-name">支付宝</div>
                <div className="pay-desc">花呗/余额支付</div>
              </div>
              <div className={`pay-radio ${form.pay_method === 'alipay' ? 'on' : ''}`} />
            </div>
          </div>
        </div>

        {/* 费用明细 */}
        <div className="section-card">
          <h3>🧾 费用明细</h3>
          <div className="fee-row"><span>商品金额</span><span>¥{totalGoods.toLocaleString()}</span></div>
          <div className="fee-row"><span>国际运费</span><span>¥{totalShipping.toLocaleString()}</span></div>
          <div className="fee-row"><span>代购服务费</span><span>¥0</span></div>
          <div className="fee-row grand"><span>实付款</span><span>¥{grandTotal.toLocaleString()}</span></div>
        </div>
      </div>

      {/* 底部提交栏 */}
      <div className="pay-bar">
        <div>
          <div className="pay-total-label">合计</div>
          <div className="pay-total-amt">¥{grandTotal.toLocaleString()}</div>
        </div>
        <button className="pay-now-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? '提交中...' : '提交订单'}
        </button>
      </div>

      {/* 支付弹窗 */}
      {pendingOrder && (
        <PaymentModal
          orderNo={pendingOrder.order_no}
          totalAmount={pendingOrder.total_amount}
          payMethod={pendingOrder.pay_method}
          onClose={handleClosePayment}
        />
      )}
    </div>
  );
}
