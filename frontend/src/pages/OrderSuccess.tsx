import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useCart } from '../App';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshCart } = useCart();

  const orderNo = searchParams.get('order_no') || '—';
  const total = searchParams.get('total') || '0';
  const payMethod = searchParams.get('pay_method') || 'wechat';
  const payMethodName = payMethod === 'wechat' ? '微信支付' : '支付宝支付';
  const payMethodIcon = payMethod === 'wechat' ? '💚' : '🔵';

  useEffect(() => {
    refreshCart();
  }, []);

  return (
    <div className="h5-page">
      <div className="h5-status-bar">
        <span>9:41</span>
        <span>● ● ▌</span>
      </div>

      <div className="success-page">
        <div className="success-circle">✓</div>
        <h2>订单已提交！</h2>
        <p>
          请使用{payMethodName}扫码支付<br />
          支付完成后提交凭证，商家确认后立即发货<br />
          预计 10-15 个工作日送达
        </p>
        <div className="order-no-display">
          订单号：{orderNo}
        </div>
        <div style={{ fontSize: 13, color: '#888', width: '100%', textAlign: 'center' }}>
          应付金额：<span style={{ color: '#FF4B2B', fontWeight: 700, fontFamily: 'DM Sans' }}>
            ¥{Number(total).toLocaleString()}
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.06)', borderRadius: 10,
          padding: '8px 14px', fontSize: 12, color: 'rgba(255,255,255,0.5)',
        }}>
          <span>{payMethodIcon}</span>
          <span>支付方式：{payMethodName}</span>
        </div>
        <button className="continue-btn" onClick={() => navigate('/')}>
          继续购物
        </button>
        <button
          style={{
            width: '100%', padding: '12px', background: 'transparent', color: '#888',
            border: 'none', borderRadius: 26, fontSize: 14, cursor: 'pointer', marginTop: 4,
          }}
          onClick={() => navigate('/my/orders')}
        >
          查看我的订单 →
        </button>
      </div>
    </div>
  );
}
