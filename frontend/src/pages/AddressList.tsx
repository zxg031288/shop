import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress
} from '../api';
import { useToast } from '../App';

// 简易地图定位（使用浏览器 Geolocation API）
function useGeolocation() {
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState('');

  const locate = () => {
    if (!navigator.geolocation) {
      setError('浏览器不支持定位');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setError('定位失败，请检查权限');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return { locate, locating, location, error };
}

interface AddressForm {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  is_default: number;
}

const PROVINCES = ['北京市', '上海市', '天津市', '重庆市', '广东省', '浙江省', '江苏省', '四川省', '湖北省', '湖南省', '河南省', '河北省', '山东省', '陕西省', '福建省', '辽宁省', '黑龙江省', '吉林省', '安徽省', '江西省', '云南省', '贵州省', '广西壮族自治区', '海南省', '内蒙古自治区', '新疆维吾尔自治区', '宁夏回族自治区', '青海省', '甘肃省', '西藏自治区', '山西省', '香港特别行政区', '澳门特别行政区', '台湾省'];

export default function AddressList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressForm>({
    name: '', phone: '', province: '', city: '', district: '', detail: '', is_default: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const { locate, locating, location, error: locError } = useGeolocation();

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await getAddresses();
      if (res.code === 0) setAddresses(res.data || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', phone: '', province: '', city: '', district: '', detail: '', is_default: 0 });
    setShowForm(true);
  };

  const openEdit = (addr: any) => {
    setEditingId(addr.id);
    setForm({
      name: addr.name,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      detail: addr.detail,
      is_default: addr.is_default,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.detail) {
      showToast('请填写收货人、电话和详细地址');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await updateAddress(editingId, form);
        showToast('更新成功');
      } else {
        await createAddress(form);
        showToast('添加成功');
      }
      setShowForm(false);
      await fetchAddresses();
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该地址？')) return;
    try {
      await deleteAddress(id);
      showToast('已删除');
      await fetchAddresses();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultAddress(id);
      showToast('已设为默认');
      await fetchAddresses();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // 地址选择后自动填入省市区
  const handleLocateSuccess = () => {
    if (!location) return;
    showToast(`已获取位置：${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
    // 提示用户：实际应用中可调用地理编码 API 获取省市区
  };

  if (showForm) {
    return (
      <div className="h5-page">
        <div className="h5-status-bar" />
        <div className="page-header">
          <button className="back-btn" onClick={() => setShowForm(false)}>←</button>
          <h2>{editingId ? '编辑地址' : '新增地址'}</h2>
        </div>
        <div className="order-scroll" style={{ padding: '12px 16px 80px' }}>
          <div className="section-card">
            <h3>📍 地图定位</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button
                onClick={() => { locate(); }}
                disabled={locating}
                style={{
                  flex: 1, padding: '8px 12px', background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8,
                  color: '#60a5fa', fontSize: 12, cursor: 'pointer',
                }}
              >
                {locating ? '定位中...' : '📍 一键定位当前位置'}
              </button>
            </div>
            {location && (
              <div style={{ fontSize: 12, color: 'var(--light)', marginBottom: 4 }}>
                坐标：{location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </div>
            )}
            {locError && (
              <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 4 }}>{locError}</div>
            )}
            <div style={{ fontSize: 11, color: 'var(--light)', marginBottom: 8 }}>
              定位后可复制坐标到地图APP查看位置
            </div>
            {location && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <a
                  href={`https://maps.google.com?q=${location.lat},${location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1, padding: '6px 10px', background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                    color: '#60a5fa', fontSize: 12, textAlign: 'center', textDecoration: 'none',
                  }}
                >
                  🌐 在 Google 地图查看
                </a>
                <a
                  href={`https://maps.apple.com/?ll=${location.lat},${location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1, padding: '6px 10px', background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                    color: '#60a5fa', fontSize: 12, textAlign: 'center', textDecoration: 'none',
                  }}
                >
                  🍎 在 Apple 地图查看
                </a>
              </div>
            )}
          </div>

          <div className="section-card">
            <h3>📝 地址信息</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--mid)', marginBottom: 4 }}>收货人姓名 *</div>
                <input className="h5-form-input" placeholder="请输入收货人姓名" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--mid)', marginBottom: 4 }}>联系电话 *</div>
                <input className="h5-form-input" type="tel" placeholder="请输入手机号码" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--mid)', marginBottom: 4 }}>省份</div>
                <select className="h5-form-input" value={form.province}
                  onChange={e => setForm(f => ({ ...f, province: e.target.value }))}>
                  <option value="">请选择省份</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--mid)', marginBottom: 4 }}>城市</div>
                  <input className="h5-form-input" placeholder="城市" value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--mid)', marginBottom: 4 }}>区县</div>
                  <input className="h5-form-input" placeholder="区县" value={form.district}
                    onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--mid)', marginBottom: 4 }}>详细地址 *</div>
                <textarea className="h5-form-textarea" style={{ minHeight: 60 }}
                  placeholder="街道/门牌号/楼栋/单元等详细地址"
                  value={form.detail}
                  onChange={e => setForm(f => ({ ...f, detail: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="defaultAddr"
                  checked={form.is_default === 1}
                  onChange={e => setForm(f => ({ ...f, is_default: e.target.checked ? 1 : 0 }))}
                  style={{ width: 16, height: 16, accentColor: '#3b82f6' }}
                />
                <label htmlFor="defaultAddr" style={{ fontSize: 13, color: 'var(--mid)', cursor: 'pointer' }}>
                  设为默认收货地址
                </label>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 0 20px' }}>
            <button className="save-btn" onClick={handleSubmit} disabled={submitting} style={{ borderRadius: 26 }}>
              {submitting ? '保存中...' : '保存地址'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h5-page">
      <div className="h5-status-bar" />
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h2>收货地址</h2>
        <button
          onClick={openAdd}
          style={{
            marginLeft: 'auto', background: 'var(--brand)', color: '#fff',
            border: 'none', borderRadius: 20, padding: '4px 14px', fontSize: 12, cursor: 'pointer',
          }}
        >
          + 新增
        </button>
      </div>

      <div className="order-scroll">
        {loading ? (
          <div className="loading"><div className="loading-spinner" />加载中...</div>
        ) : addresses.length === 0 ? (
          <div className="cart-empty" style={{ marginTop: 60 }}>
            <div className="cart-empty-icon">📍</div>
            <p>暂无收货地址</p>
            <button
              onClick={openAdd}
              style={{
                padding: '8px 20px', background: 'var(--brand)', color: '#fff',
                border: 'none', borderRadius: 20, fontSize: 13, cursor: 'pointer', marginTop: 8,
              }}
            >
              添加收货地址
            </button>
          </div>
        ) : (
          addresses.map(addr => (
            <div key={addr.id} className="section-card" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>{addr.name}</span>
                    <span style={{ fontSize: 13, color: 'var(--mid)' }}>{addr.phone}</span>
                    {addr.is_default === 1 && (
                      <span style={{
                        fontSize: 10, background: 'var(--brand)', color: '#fff',
                        padding: '2px 6px', borderRadius: 10,
                      }}>默认</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--light)', lineHeight: 1.6 }}>
                    {[addr.province, addr.city, addr.district, addr.detail].filter(Boolean).join(' ')}
                  </div>
                </div>
              </div>
              <div style={{
                display: 'flex', gap: 8, marginTop: 10, paddingTop: 10,
                borderTop: '1px solid var(--border)',
              }}>
                <button
                  onClick={() => handleSetDefault(addr.id)}
                  style={{
                    flex: 1, padding: '5px 8px', background: addr.is_default === 1 ? 'rgba(255,75,43,0.1)' : 'var(--bg)',
                    border: `1px solid ${addr.is_default === 1 ? 'var(--brand)' : 'var(--border)'}`,
                    borderRadius: 6, fontSize: 11, color: addr.is_default === 1 ? 'var(--brand)' : 'var(--mid)',
                    cursor: 'pointer',
                  }}
                >
                  {addr.is_default === 1 ? '✓ 默认地址' : '设为默认'}
                </button>
                <button
                  onClick={() => openEdit(addr)}
                  style={{
                    padding: '5px 12px', background: 'var(--bg)',
                    border: '1px solid var(--border)', borderRadius: 6,
                    fontSize: 11, color: 'var(--mid)', cursor: 'pointer',
                  }}
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  style={{
                    padding: '5px 12px', background: 'var(--bg)',
                    border: '1px solid var(--border)', borderRadius: 6,
                    fontSize: 11, color: '#ef4444', cursor: 'pointer',
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
