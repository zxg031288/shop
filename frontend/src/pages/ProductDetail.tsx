import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, addCart } from '../api';
import { useCart, useToast } from '../App';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (id) fetchProduct(parseInt(id));
  }, [id]);

  const fetchProduct = async (productId: number) => {
    setLoading(true);
    try {
      const res = await getProduct(productId);
      if (res.code === 0) {
        setProduct(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await addCart(product.id, quantity);
      showToast('已加入购物车');
      await refreshCart();
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setAddingToCart(false);
    }
  };

  const getOriginFlag = (origin: string) => {
    const flags: Record<string, string> = {
      '澳大利亚': '🇦🇺', '美国': '🇺🇸', '英国': '🇬🇧', '瑞典': '🇸🇪',
      '日本': '🇯🇵', '法国': '🇫🇷', '德国': '🇩🇪',
    };
    return flags[origin] || '🌍';
  };

  const renderImage = () => {
    if (product?.images && product.images.length > 0) {
      return <img src={product.images[0]} alt={product.name} />;
    }
    return '🛍️';
  };

  if (loading) {
    return (
      <div className="h5-page">
        <div className="loading"><div className="loading-spinner" />加载中...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h5-page">
        <div className="loading">商品不存在</div>
      </div>
    );
  }

  return (
    <div className="h5-page">
      {/* 状态栏 */}
      <div className="h5-status-bar">
        <span>9:41</span>
        <span>● ● ▌</span>
      </div>

      {/* 顶部导航 */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span className="detail-title-text">商品详情</span>
      </div>

      {/* 商品图片 */}
      <div className="detail-imgs">{renderImage()}</div>

      {/* 商品信息 */}
      <div className="detail-scroll">
        <div className="detail-main">
          <div className="detail-price-big">
            <small>¥</small>{Number(product.price).toLocaleString()}
          </div>
          <div className="detail-shipping">
            ✈️ 运费 ¥{product.shipping} · 约10-15天到达
          </div>
          <div className="detail-name">{product.name}</div>
          <div className="detail-meta">
            <span className="meta-item">
              产地 <strong>{getOriginFlag(product.origin)} {product.origin}</strong>
            </span>
            <span className="meta-item">
              库存 <strong>{product.stock}件</strong>
            </span>
            <span className="meta-item">
              销量 <strong>{product.sales || 0}+</strong>
            </span>
          </div>

          {/* 数量选择 */}
          <div className="qty-row">
            <span className="qty-label">购买数量</span>
            <div className="qty-ctrl">
              <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
              <span className="qty-num">{quantity}</span>
              <button className="qty-btn" onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}>+</button>
            </div>
          </div>

          {/* 商品描述 */}
          {product.description && (
            <div className="detail-desc">{product.description}</div>
          )}
        </div>
      </div>

      {/* 操作栏 */}
      <div className="detail-actions">
        <button
          className={`btn-cart ${addedToCart ? 'added' : ''}`}
          onClick={handleAddCart}
          disabled={addingToCart}
        >
          {addedToCart ? '✓ 已加入购物车' : addingToCart ? '加入中...' : '加入购物车'}
        </button>
        <button className="btn-buy" onClick={() => navigate('/checkout')}>
          立即购买
        </button>
      </div>
    </div>
  );
}
