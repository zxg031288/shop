import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetProducts, adminUpdateProductStatus, adminDeleteProduct } from '../../api';
import { useToast } from '../../App';

export default function AdminProductList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await adminGetProducts();
      if (res.code === 0) {
        setProducts(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'off' : 'active';
    try {
      await adminUpdateProductStatus(id, newStatus);
      showToast(newStatus === 'active' ? '已上架' : '已下架');
      await fetchProducts();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除商品「${name}」吗？`)) return;
    try {
      await adminDeleteProduct(id);
      showToast('已删除');
      await fetchProducts();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <span className="badge out">售罄</span>;
    if (stock <= 5) return <span className="badge low-stock">库存紧</span>;
    return <span className="badge in-stock">在售</span>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') return <span className="badge active-badge">上架</span>;
    return <span className="badge off-badge">下架</span>;
  };

  const renderImage = (product: any) => {
    if (product.images && product.images.length > 0) {
      return <img src={product.images[0]} alt={product.name} />;
    }
    return '📦';
  };

  return (
    <div>
      <div className="admin-topbar">
        <h1>商品管理</h1>
        <div className="admin-actions">
          <button className="admin-btn primary" onClick={() => navigate('/admin/upload')}>
            + 上传商品
          </button>
        </div>
      </div>

      <div className="admin-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            共 {products.length} 件商品
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="loading-spinner" style={{ borderTopColor: '#fff' }} />加载中...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>商品</th>
                  <th>价格</th>
                  <th>库存</th>
                  <th>运费</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td>
                      <div className="td-product">
                        <div className="td-img">{renderImage(product)}</div>
                        <div>
                          <div className="td-name">{product.name}</div>
                          <div className="td-cat">{product.category} · {product.origin}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#fff', fontWeight: 600 }}>
                      ¥{Number(product.price).toLocaleString()}
                    </td>
                    <td>
                      <span style={{ color: product.stock === 0 ? '#ef4444' : product.stock <= 5 ? '#fa8c16' : 'rgba(255,255,255,0.7)' }}>
                        {product.stock}
                      </span>
                    </td>
                    <td>¥{product.shipping}</td>
                    <td>
                      {getStockBadge(product.stock)}
                      <div style={{ marginTop: 4 }}>{getStatusBadge(product.status)}</div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="tbl-btn"
                          onClick={() => handleStatusToggle(product.id, product.status)}
                        >
                          {product.status === 'active' ? '下架' : '上架'}
                        </button>
                        <button
                          className="tbl-btn"
                          style={{ color: '#ef4444' }}
                          onClick={() => handleDelete(product.id, product.name)}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>
                      暂无商品，去上传一件吧
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
