import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, updateCart, deleteCart } from '../api';
import { useCart, useToast } from '../App';

export default function Cart() {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await getCart();
      if (res.code === 0) {
        setItems(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQty = async (id: number, qty: number) => {
    try {
      await updateCart(id, qty);
      await fetchCart();
      await refreshCart();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCart(id);
      showToast('已删除');
      await fetchCart();
      await refreshCart();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const totalGoods = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const totalShipping = items.reduce((sum, item) => sum + (Number(item.shipping) * item.quantity), 0);
  const grandTotal = totalGoods + totalShipping;
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  const renderImage = (item: any) => {
    if (item.images && item.images.length > 0) {
      return <img src={item.images[0]} alt={item.name} />;
    }
    return '🛍️';
  };

  return (
    <div className="h5-page">
      <div className="h5-status-bar" />

      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h2>购物车</h2>
      </div>

      {loading ? (
        <div className="loading"><div className="loading-spinner" />加载中...</div>
      ) : items.length === 0 ? (
        <div className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <p>购物车是空的</p>
          <button
            className="btn-buy"
            style={{ maxWidth: 200, flex: 'none', marginTop: 8 }}
            onClick={() => navigate('/')}
          >
            去逛逛
          </button>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-img">{renderImage(item)}</div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-origin">
                    {item.origin === '澳大利亚' ? '🇦🇺' : item.origin === '美国' ? '🇺🇸' :
                     item.origin === '英国' ? '🇬🇧' : item.origin === '瑞典' ? '🇸🇪' : '🌍'}
                    {' '}{item.origin}直邮
                  </div>
                  <div className="cart-item-price">
                    ¥{Number(item.price).toLocaleString()}
                  </div>
                  <div className="cart-qty">
                    <button className="cqty-btn" onClick={() => {
                      if (item.quantity > 1) handleUpdateQty(item.id, item.quantity - 1);
                    }}>−</button>
                    <span className="cart-item-qty-text">{item.quantity}</span>
                    <button className="cqty-btn" onClick={() => handleUpdateQty(item.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <button className="cart-item-del" onClick={() => handleDelete(item.id)}>×</button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>商品合计</span>
              <span>¥{totalGoods.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>运费</span>
              <span>¥{totalShipping.toLocaleString()}</span>
            </div>
            <div className="summary-row total">
              <span>合计</span>
              <span>¥{grandTotal.toLocaleString()}</span>
            </div>
            <button className="checkout-btn" onClick={() => navigate('/checkout')}>
              结算 ({totalQty}件)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
