import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userLogin } from '../api';
import { useToast } from '../App';

interface Props {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: Props) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      showToast('请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      const res = await userLogin(form.username, form.password);
      if (res.code === 0) {
        localStorage.setItem('user', JSON.stringify(res.data));
        showToast('登录成功');
        onLogin(res.data);
        navigate('/');
      }
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🛍️</div>
          <div className="login-logo">月芽湾湾日本淘</div>
          <div className="login-sub">欢迎回来</div>
        </div>

        <div className="login-form">
          <div>
            <div className="form-label" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>用户名</div>
            <input
              className="form-input"
              style={{ width: '100%' }}
              placeholder="请输入用户名"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div>
            <div className="form-label" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>密码</div>
            <input
              className="form-input"
              type="password"
              style={{ width: '100%' }}
              placeholder="请输入密码"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <button className="login-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              还没有账号？
            </span>
            <Link to="/register" style={{ color: '#60a5fa', fontSize: 13, marginLeft: 4 }}>
              立即注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
