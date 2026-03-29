import { useNavigate } from 'react-router-dom';
import { useUser, useToast } from '../App';
import { userLogout } from '../api';

interface Props {
  onLogout: () => void;
}

export default function MyPage({ onLogout }: Props) {
  const navigate = useNavigate();
  const user = useUser();
  const { showToast } = useToast();

  const handleLogout = async () => {
    if (!confirm('确定退出登录吗？')) return;
    try {
      await userLogout();
    } catch {
      /* 仍清理本地态 */
    }
    localStorage.removeItem('user');
    onLogout();
    showToast('已退出登录');
    navigate('/');
  };

  const userAvatar = user?.nickname?.[0] || user?.username?.[0] || '👤';
  const userName = user?.nickname || user?.username || '海淘用户';

  return (
    <div className="h5-page">
      <div className="h5-status-bar">
        <span>9:41</span>
        <span>● ● ▌</span>
      </div>

      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h2>个人中心</h2>
      </div>

      <div className="my-page">
        {/* 用户信息区 */}
        <div className="my-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="my-avatar">{userAvatar}</div>
          <div style={{ flex: 1 }}>
            <div className="my-nickname">{userName}</div>
            {user ? (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                @{user.username}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    padding: '3px 10px', background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20,
                    color: '#fff', fontSize: 11, cursor: 'pointer',
                  }}
                >
                  登录
                </button>
                <button
                  onClick={() => navigate('/register')}
                  style={{
                    padding: '3px 10px', background: 'var(--brand)',
                    border: 'none', borderRadius: 20,
                    color: '#fff', fontSize: 11, cursor: 'pointer',
                  }}
                >
                  注册
                </button>
              </div>
            )}
          </div>
          {user && (
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8, color: 'rgba(255,255,255,0.8)', fontSize: 11,
                padding: '4px 10px', cursor: 'pointer',
              }}
            >
              退出
            </button>
          )}
        </div>

        {/* 收货地址入口 */}
        {user && (
          <div style={{ margin: '-10px 16px 0' }}>
            <div
              style={{
                background: '#fff', borderRadius: 14, padding: '12px 16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
              onClick={() => navigate('/addresses')}
            >
              <span style={{ fontSize: 20 }}>📍</span>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--dark)' }}>收货地址管理</span>
              <span style={{ color: '#ccc', fontSize: 14 }}>→</span>
            </div>
          </div>
        )}

        <div className="my-orders-section">
          <div className="my-orders-title">
            <span>我的订单</span>
            <a href="#" onClick={e => { e.preventDefault(); navigate('/my/orders'); }} style={{ fontSize: 12, color: '#888' }}>
              全部订单 →
            </a>
          </div>
          <div className="my-orders-tabs">
            <button className="my-order-tab" onClick={() => navigate('/my/orders?tab=paid')}>
              <span className="tab-icon">⏳</span>
              待发货
            </button>
            <button className="my-order-tab" onClick={() => navigate('/my/orders?tab=shipped')}>
              <span className="tab-icon">📦</span>
              已发货
            </button>
            <button className="my-order-tab" onClick={() => navigate('/my/orders?tab=done')}>
              <span className="tab-icon">✅</span>
              已完成
            </button>
          </div>
        </div>

        {/* 快捷入口（商家后台请使用独立端口访问，见 README） */}
        <div style={{ margin: '16px' }}>
          <div
            style={{
              background: '#fff', borderRadius: 14, padding: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', textAlign: 'center',
            }}
            onClick={() => navigate('/my/orders')}
          >
            <div style={{ fontSize: 28 }}>📋</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>我的订单</div>
          </div>
        </div>
      </div>

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
        <button className="h5-nav-item active" onClick={() => {}}>
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
