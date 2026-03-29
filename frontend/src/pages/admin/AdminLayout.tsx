import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  {
    key: 'home-banner',
    label: '首页活动',
    path: '/admin/home-banner',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    key: 'dashboard',
    label: '数据概览',
    path: '/admin/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    key: 'upload',
    label: '上传商品',
    path: '/admin/upload',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  },
  {
    key: 'products',
    label: '商品管理',
    path: '/admin/products',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
      </svg>
    ),
  },
  {
    key: 'orders',
    label: '订单管理',
    path: '/admin/orders',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState<{ username: string; nickname: string } | null>(null);

  useEffect(() => {
    // 简单检查是否登录（从 localStorage）
    const savedAdmin = localStorage.getItem('admin_user');
    if (!savedAdmin) {
      navigate('/admin/login');
    } else {
      setAdmin(JSON.parse(savedAdmin));
    }
  }, []);

  const activeKey = NAV_ITEMS.find(item =>
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  )?.key || 'dashboard';

  const handleLogout = () => {
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      {/* 侧边栏 */}
      <div className="admin-sidebar">
        <div className="admin-logo">
          <div className="logo">月芽湾湾</div>
          <div className="sub">商家管理系统 v1.0</div>
        </div>

        <div className="admin-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`admin-nav-item ${activeKey === item.key ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="admin-user">
          <div className="admin-avatar">{admin?.nickname?.[0] || '管'}</div>
          <span className="admin-name">{admin?.nickname || '管理员'} · 商家</span>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontSize: 16, padding: '0 4px',
            }}
            title="退出登录"
          >
            ⿻
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
