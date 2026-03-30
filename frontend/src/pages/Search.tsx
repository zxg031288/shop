import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getProducts, getCategories, addCart } from '../api';
import { useCart, useToast } from '../App';

const CATEGORY_ICONS: Record<string, string> = {
  '美妆护肤': '💄',
  '包包': '👜',
  '鞋履': '👟',
  '手表': '⌚',
  '保健品': '💊',
  '服饰': '👗',
  '其他': '🎁',
};

export default function Search() {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCategories().then(res => {
      if (res.code === 0) setCategories(res.data || []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getProducts({
        ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
        ...(activeCategory ? { category: activeCategory } : {}),
      });
      if (res.code === 0) {
        setProducts(res.data || []);
      }
    } catch {
      showToast('搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    fetchProducts();
  };

  const handleAddCart = async (e: React.MouseEvent, productId: number) => {
    e.stopPropagation();
    setAddingId(productId);
    try {
      await addCart(productId, 1);
      showToast('已加入购物车');
      await refreshCart();
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setTimeout(() => setAddingId(null), 300);
    }
  };

  const renderProductImage = (product: any) => {
    if (product.images && product.images.length > 0) {
      return <img src={product.images[0]} alt={product.name} loading="lazy" />;
    }
    return '🛍️';
  };

  return (
    <div className="h5-page">
      {/* 状态栏 */}
      <div className="h5-status-bar">
        <span>9:41</span>
        <span>● ● ▌</span>
      </div>

      {/* 顶部导航 + 搜索框 */}
      <div className="h5-top-nav">
        <button
          className="back-btn"
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '0 4px' }}
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <form className="h5-search" onSubmit={handleSearch} style={{ flex: 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            placeholder="搜索海外商品..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button
            type="submit"
            style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 14, cursor: 'pointer', padding: '0 4px' }}
          >
            搜索
          </button>
        </form>
        <div style={{ width: 36 }} />
      </div>

      {/* 分类筛选 */}
      <div className="h5-categories" style={{ padding: '10px 12px 4px' }}>
        <div
          className={`h5-cat-item ${activeCategory === '' ? 'active' : ''}`}
          onClick={() => setActiveCategory('')}
        >
          <div className={`h5-cat-icon ${activeCategory === '' ? 'active' : ''}`} style={{ background: '#fff0ee', width: 36, height: 36 }}>🌟</div>
          <span className="h5-cat-label">全部</span>
        </div>
        {categories.map(cat => (
          <div
            key={cat.id}
            className={`h5-cat-item ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <div
              className={`h5-cat-icon ${activeCategory === cat.id ? 'active' : ''}`}
              style={{ background: 'var(--light)', width: 36, height: 36 }}
            >
              {CATEGORY_ICONS[cat.id] || '🎁'}
            </div>
            <span className="h5-cat-label">{cat.label}</span>
          </div>
        ))}
      </div>

      {/* 商品列表 */}
      <div style={{ padding: '8px 12px 80px' }}>
        <div style={{ color: '#888', fontSize: 12, marginBottom: 10 }}>
          {loading ? '搜索中...' : `${products.length} 个结果`}
          {keyword && !loading && <span>（关键词："{keyword}"）</span>}
        </div>

        {loading ? (
          <div className="loading">
            <div className="loading-spinner" />
            加载中...
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 14 }}>没有找到相关商品</div>
            <div style={{ fontSize: 12, marginTop: 6, color: '#ccc' }}>试试其他关键词或分类</div>
          </div>
        ) : (
          <div className="h5-product-grid">
            {products.map(product => (
              <div
                key={product.id}
                className="h5-product-card"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="h5-product-img">
                  {renderProductImage(product)}
                </div>
                <div className="h5-product-info">
                  <div className="h5-product-name">{product.name}</div>
                  <div className="h5-product-origin">
                    {product.origin === '澳大利亚' ? '🇦🇺' :
                     product.origin === '美国' ? '🇺🇸' :
                     product.origin === '英国' ? '🇬🇧' :
                     product.origin === '瑞典' ? '🇸🇪' :
                     product.origin === '日本' ? '🇯🇵' :
                     product.origin === '法国' ? '🇫🇷' :
                     product.origin === '德国' ? '🇩🇪' : '🌍'}
                    {' '}{product.origin}直邮
                  </div>
                  <div className="h5-product-price-row">
                    <div className="h5-product-price">
                      <span>¥</span>{Number(product.price).toLocaleString()}
                    </div>
                    <button
                      className="h5-add-btn"
                      onClick={e => handleAddCart(e, product.id)}
                      style={{
                        transform: addingId === product.id ? 'scale(1.4)' : 'scale(1)',
                        background: addingId === product.id ? '#ff6b35' : undefined,
                      }}
                    >
                      {addingId === product.id ? '✓' : '+'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
        <button className="h5-nav-item active" onClick={() => {}}>
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
        <button className="h5-nav-item" onClick={() => navigate('/my')}>
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
