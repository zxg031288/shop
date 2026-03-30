import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getCategories, getHomeBanner, addCart } from '../api';
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

const CATEGORY_COLORS: Record<string, string> = {
  '美妆护肤': '#fff0ee',
  '包包': '#f0f7ff',
  '鞋履': '#fffbf0',
  '手表': '#fdf4ff',
  '保健品': '#fff0f0',
  '服饰': '#f0fff4',
  '其他': '#f5f5f5',
};

export default function Home() {
  const navigate = useNavigate();
  const { cartCount, refreshCart } = useCart();
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [banner, setBanner] = useState({
    titleLine1: '澳洲直邮',
    titleLine2: '限时折扣',
    subtitle: '今日下单享9折优惠',
    badge: '立省 ¥80+',
    emoji: '✈️',
    linkUrl: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [activeCategory]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getHomeBanner();
        if (res.code === 0 && res.data) {
          setBanner((prev) => ({ ...prev, ...res.data }));
        }
      } catch {
        /* 使用默认文案 */
      }
    })();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getProducts(activeCategory ? { category: activeCategory } : undefined);
      if (res.code === 0) {
        setProducts(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      if (res.code === 0) {
        setCategories(res.data || []);
      }
    } catch { /* ignore */ }
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
      {/* 顶部状态栏留空 */}
      <div className="h5-status-bar" />
      <div className="h5-top-nav">
        <span className="h5-logo">月芽湾湾日本淘</span>
        <div className="h5-search" onClick={() => navigate('/search')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span style={{ color: '#999', fontSize: 13 }}>搜索海外商品...</span>
        </div>
        <button className="h5-cart-btn" onClick={() => navigate('/cart')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          {cartCount > 0 && <div className="h5-cart-badge">{cartCount}</div>}
        </button>
      </div>

      {/* 分类导航 */}
      <div className="h5-categories">
        <div
          className={`h5-cat-item ${activeCategory === '' ? 'active' : ''}`}
          onClick={() => setActiveCategory('')}
        >
          <div className={`h5-cat-icon ${activeCategory === '' ? 'active' : ''}`} style={{ background: '#fff0ee' }}>🌟</div>
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
              style={{ background: CATEGORY_COLORS[cat.id] || '#f5f5f5' }}
            >
              {CATEGORY_ICONS[cat.id] || '🎁'}
            </div>
            <span className="h5-cat-label">{cat.label}</span>
          </div>
        ))}
      </div>

      {/* Banner（文案由商家后台「首页活动」配置） */}
      <div
        className="h5-banner"
        style={banner.linkUrl ? { cursor: 'pointer' } : undefined}
        onClick={() => {
          const u = (banner.linkUrl || '').trim();
          if (u) window.open(u, '_blank', 'noopener,noreferrer');
        }}
        role={banner.linkUrl ? 'link' : undefined}
      >
        <div className="h5-banner-text">
          <h3>
            {banner.titleLine1}
            <br />
            {banner.titleLine2}
          </h3>
          <p>{banner.subtitle}</p>
        </div>
        <div>
          <div className="h5-banner-tag">{banner.badge}</div>
          <span className="h5-banner-emoji">{banner.emoji || '✈️'}</span>
        </div>
      </div>

      {/* 区块标题 */}
      <div className="h5-section-title">
        <h2>🔥 热卖精选</h2>
        <a href="#" onClick={e => e.preventDefault()}>查看更多</a>
      </div>

      {/* 商品列表 */}
      <div className="h5-product-scroll">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner" />
            加载中...
          </div>
        ) : products.length === 0 ? (
          <div className="loading">暂无商品</div>
        ) : (
          <div className="h5-product-grid">
            {products.map(product => (
              <div key={product.id} className="h5-product-card" onClick={() => navigate(`/product/${product.id}`)}>
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
        <button className="h5-nav-item active" onClick={() => {}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          首页
        </button>
        <button className="h5-nav-item" onClick={() => navigate('/search')}>
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
          {cartCount > 0 && <div className="h5-cart-badge" style={{ position: 'relative', top: '-4px', left: '4px' }}>{cartCount}</div>}
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
