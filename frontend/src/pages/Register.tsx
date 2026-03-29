import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userRegister } from '../api';
import { useToast } from '../App';

export default function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      showToast('用户名和密码不能为空');
      return;
    }
    if (form.username.length < 3) {
      showToast('用户名至少3个字符');
      return;
    }
    if (form.password.length < 6) {
      showToast('密码至少6位');
      return;
    }
    if (form.password !== form.confirmPassword) {
      showToast('两次密码输入不一致');
      return;
    }
    setLoading(true);
    try {
      const res = await userRegister({
        username: form.username,
        password: form.password,
        nickname: form.nickname || form.username,
        phone: form.phone,
      });
      if (res.code === 0) {
        showToast('注册成功，请登录');
        navigate('/login');
      }
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '9px 12px',
    color: '#fff',
    fontSize: 13,
    width: '100%',
    outline: 'none',
    fontFamily: 'inherit',
  } as React.CSSProperties;

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✨</div>
          <div className="login-logo">创建账号</div>
          <div className="login-sub">加入月芽湾湾，开始购物</div>
        </div>

        <div className="login-form">
          {[
            { key: 'username', label: '用户名', type: 'text', placeholder: '3-30个字符，字母或数字', col: 'username' },
            { key: 'password', label: '密码', type: 'password', placeholder: '至少6位', col: 'password' },
            { key: 'confirmPassword', label: '确认密码', type: 'password', placeholder: '再次输入密码', col: 'confirmPassword' },
            { key: 'nickname', label: '昵称（选填）', type: 'text', placeholder: '如何称呼您', col: 'nickname' },
            { key: 'phone', label: '手机号（选填）', type: 'tel', placeholder: '用于接收物流通知', col: 'phone' },
          ].map(item => (
            <div key={item.key}>
              <div className="form-label" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>{item.label}</div>
              <input
                style={inputStyle}
                type={item.type}
                placeholder={item.placeholder}
                value={(form as any)[item.key]}
                onChange={e => setForm(f => ({ ...f, [item.key]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          ))}

          <button className="login-btn" onClick={handleSubmit} disabled={loading} style={{ marginTop: 8 }}>
            {loading ? '注册中...' : '注册'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              已有账号？
            </span>
            <Link to="/login" style={{ color: '#60a5fa', fontSize: 13, marginLeft: 4 }}>
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
