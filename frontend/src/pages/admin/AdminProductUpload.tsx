import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminCreateProduct } from '../../api';
import { useToast } from '../../App';

const CATEGORIES = ['美妆护肤', '包包', '鞋履', '手表', '保健品', '服饰', '其他'];
const ORIGINS = ['澳大利亚', '美国', '英国', '日本', '法国', '德国', '瑞典'];

export default function AdminProductUpload() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    shipping: '35',
    origin: '澳大利亚',
    description: '',
  });
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 6 - images.length;
    const toAdd = files.slice(0, remaining);

    const newImages = toAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages(prev => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (idx: number) => {
    setImages(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || form.stock === '') {
      showToast('请填写必填项（名称、价格、库存）');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('category', form.category);
      fd.append('price', String(form.price));
      fd.append('stock', String(form.stock));
      fd.append('shipping', String(form.shipping));
      fd.append('origin', form.origin);
      fd.append('description', form.description);
      images.forEach(img => fd.append('images', img.file));

      const res = await adminCreateProduct(fd);
      if (res.code === 0) {
        setSuccess(true);
        showToast('商品已上架！');
        setTimeout(() => {
          setSuccess(false);
          setForm({ name: '', category: '', price: '', stock: '', shipping: '35', origin: '澳大利亚', description: '' });
          setImages([]);
        }, 2500);
      }
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="admin-topbar">
        <h1>上传商品</h1>
        <div className="admin-actions">
          <button className="admin-btn secondary" onClick={() => navigate('/admin/products')}>
            商品管理
          </button>
        </div>
      </div>

      <div className="admin-panel">
        {/* 上传区域 */}
        <div
          className="upload-area"
          onClick={() => images.length < 6 && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
          <div className="upload-icon">📷</div>
          <p><strong>点击上传商品图片</strong></p>
          <p style={{ marginTop: 4 }}>支持拍照上传 · JPG/PNG · 最多6张（已上传 {images.length}/6）</p>
        </div>

        {/* 图片预览 */}
        {images.length > 0 && (
          <div className="img-preview-row">
            {images.map((img, idx) => (
              <div key={idx} className="img-thumb">
                <img src={img.preview} alt={`预览${idx + 1}`} />
                <button className="del" onClick={() => removeImage(idx)}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* 表单 */}
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">商品名称 *</label>
            <input
              className="form-input"
              placeholder="例：澳洲 Aesop 护肤套装"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">商品分类 *</label>
            <select
              className="form-input"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              <option value="">选择分类</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">售价 (¥) *</label>
            <input
              className="form-input"
              type="number"
              placeholder="0.00"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">库存数量 *</label>
            <input
              className="form-input"
              type="number"
              placeholder="0"
              value={form.stock}
              onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
            />
          </div>
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">国际运费 (¥)</label>
            <input
              className="form-input"
              type="number"
              placeholder="35"
              value={form.shipping}
              onChange={e => setForm(f => ({ ...f, shipping: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">商品产地</label>
            <select
              className="form-input"
              value={form.origin}
              onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
            >
              {ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label">商品描述</label>
          <textarea
            className="form-input"
            placeholder="描述商品特点、规格、使用方法等..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        <button className="save-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? '保存中...' : '✓ 保存并上架商品'}
        </button>

        {success && (
          <div className="save-success">
            ✓ 商品已成功上架！买家现在可以看到这件商品了
          </div>
        )}
      </div>
    </div>
  );
}
