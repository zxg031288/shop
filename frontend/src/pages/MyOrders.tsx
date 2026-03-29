import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getOrders } from '../api';
import { useToast } from '../App';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待支付', color: '#fa8c16' },
  paid: { label: '待发货', color: '#07c160' },
  shipped: { label: '已发货', color: '#3b82f6' },
  done: { label: '已完成', color: '#888' },
};

export default function MyOrders() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getOrders();
      if (res.code === 0) {
        setOrders(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab);

  const handlePayNow = (order: any) => {
    navigate(`/pay-order?order_no=${order.order_no}&total=${order.total_amount}&pay_method=${order.pay_method}`);
  };

  const renderImage = (item: any) => {
    if (item.product_image && typeof item.product_image === 'string') {
      try {
        const imgs = JSON.parse(item.product_image);
        if (imgs.length > 0) return <img src={imgs[0]} alt={item.product_name} />;
      } catch {}
    }
    return '🛍️';
  };

  return (
    <div className="h5-page">
      <div className="h5-status-bar">
        <span>9:41</span>
        <span>● ● ▌</span>
      </div>

      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h2>我的订单</h2>
      </div>

      {/* 标签页 */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #eee', flexShrink: 0 }}>
        {['all', 'pending', 'paid', 'shipped', 'done'].map(tab => (
          <button
            key={tab}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 20, border: '1px solid',
              borderColor: activeTab === tab ? '#FF4B2B' : '#eee',
              background: activeTab === tab ? '#fff3f0' : '#fff',
              color: activeTab === tab ? '#FF4B2B' : '#888',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'all' ? '全部' : STATUS_MAP[tab]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="loading-spinner" />加载中...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="cart-empty">
          <div className="cart-empty-icon">📋</div>
          <p>暂无订单</p>
        </div>
      ) : (
        <div className="order-list-page">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-list-card">
              <div className="order-list-header">
                <span className="order-list-no">{order.order_no}</span>
                <span
                  className={`order-list-status ${order.status}`}
                  style={{ color: STATUS_MAP[order.status]?.color }}
                >
                  {STATUS_MAP[order.status]?.label}
                </span>
              </div>

              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="order-list-item">
                  <div className="order-list-item-img">{renderImage(item)}</div>
                  <div className="order-list-item-info">
                    <div className="order-list-item-name">{item.product_name}</div>
                    <div className="order-list-item-qty">x{item.quantity}</div>
                  </div>
                  <div className="order-list-item-price">
                    ¥{((Number(item.price) + Number(item.shipping)) * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}

              <div className="order-list-footer">
                <span className="order-list-total">
                  共{order.items?.reduce((s: number, i: any) => s + i.quantity, 0)}件 &nbsp;
                  实付 <span>¥{Number(order.total_amount).toLocaleString()}</span>
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {order.status === 'pending' && (
                    <button
                      style={{
                        padding: '5px 14px', borderRadius: 16, border: 'none',
                        background: '#FF4B2B', color: '#fff', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      onClick={() => handlePayNow(order)}
                    >
                      继续支付
                    </button>
                  )}
                  {order.status === 'shipped' && (
                    <button
                      style={{
                        padding: '5px 12px', borderRadius: 16, border: '1px solid #eee',
                        background: '#fff', color: '#555', fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      确认收货
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 底部导航 */}
      <div className="h5-bottom-nav">
        <button className="h5-nav-item" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          首页
        </button>
        <button className="h5-nav-item" onClick={() => {}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          发现
        </button>
        <button className="h5-nav-item" onClick={() => navigate('/cart')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          购物车
        </button>
        <button className="h5-nav-item active" onClick={() => navigate('/my')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          我的
        </button>
      </div>
    </div>
  );
}
