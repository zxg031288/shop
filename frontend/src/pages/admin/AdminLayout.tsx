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
  const [showPwdModal, setShowPwdModal] = useState(false);

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
            onClick={() => setShowPwdModal(true)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}
            title="修改密码"
          >
            🔑
          </button>
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

      {/* 修改密码弹窗 */}
      {showPwdModal && <PasswordModal admin={admin} onClose={() => setShowPwdModal(false)} />}
    </div>
  );
}

function PasswordModal({ admin, onClose }: { admin: { username: string; nickname: string } | null; onClose: () => void }) {
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTip('');

    if (!oldPwd || !newPwd || !confirmPwd) {
      setTip('请填写所有字段');
      return;
    }
    if (newPwd !== confirmPwd) {
      setTip('两次输入的新密码不一致');
      return;
    }
    if (newPwd.length < 6) {
      setTip('新密码不能少于6位');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: admin?.username, oldPassword: oldPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setTip('✅ ' + data.message);
        setTimeout(() => { setOldPwd(''); setNewPwd(''); setConfirmPwd(''); onClose(); }, 1200);
      } else {
        setTip('❌ ' + data.message);
      }
    } catch {
      setTip('❌ 网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '28px 28px 24px',
        width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 17, color: '#1a1a2e' }}>🔑 修改登录密码</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>旧密码</label>
            <input
              type="password"
              value={oldPwd}
              onChange={e => setOldPwd(e.target.value)}
              placeholder="请输入当前密码"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>新密码</label>
            <input
              type="password"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              placeholder="至少6位"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>确认新密码</label>
            <input
              type="password"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              placeholder="再次输入新密码"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          {tip && <div style={{ fontSize: 13, color: tip.startsWith('✅') ? '#22c55e' : '#ef4444', marginBottom: 14, textAlign: 'center' }}>{tip}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14 }}>取消</button>
            <button type="submit" disabled={loading} style={{ padding: '8px 18px', border: 'none', borderRadius: 8, background: '#6c5ce7', color: '#fff', cursor: 'pointer', fontSize: 14, opacity: loading ? 0.6 : 1 }}>{loading ? '保存中...' : '保存'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
