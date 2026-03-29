import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetStats } from '../../api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await adminGetStats();
      if (res.code === 0) {
        setStats(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, color: '#fff' }}>
        <div className="loading"><div className="loading-spinner" style={{ borderTopColor: '#fff' }} />加载中...</div>
      </div>
    );
  }

  const maxSales = stats?.top_products?.[0]?.total_sales || 1;

  return (
    <div>
      {/* 顶部栏 */}
      <div className="admin-topbar">
        <h1>数据概览</h1>
        <div className="admin-actions">
          <button className="admin-btn secondary">帮助</button>
          <button className="admin-btn danger" onClick={() => { localStorage.removeItem('admin_user'); navigate('/admin/login'); }}>退出登录</button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-label">今日订单</div>
          <div className="stat-value">{stats?.today?.orders || 0}</div>
          <div className="stat-sub" style={{ color: (stats?.today?.orders_change || 0) >= 0 ? '#10b981' : '#ef4444' }}>
            {stats?.today?.orders_change >= 0 ? '↑' : '↓'} 较昨日 {Math.abs(stats?.today?.orders_change || 0)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">今日营收</div>
          <div className="stat-value">¥{(stats?.today?.revenue || 0).toLocaleString()}</div>
          <div className="stat-sub" style={{ color: (stats?.today?.revenue_change || 0) >= 0 ? '#10b981' : '#ef4444' }}>
            {stats?.today?.revenue_change >= 0 ? '↑' : '↓'} 较昨日 {Math.abs(stats?.today?.revenue_change || 0).toLocaleString()}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">在售商品</div>
          <div className="stat-value">{stats?.products?.active || 0}</div>
          <div className="stat-sub" style={{ color: (stats?.products?.low_stock || 0) > 0 ? '#fa8c16' : '#10b981' }}>
            {stats?.products?.low_stock > 0 ? `${stats.products.low_stock}件库存不足` : '库存充足'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">待发货</div>
          <div className="stat-value" style={{ color: (stats?.pending_orders || 0) > 0 ? '#fa8c16' : '#fff' }}>
            {stats?.pending_orders || 0}
          </div>
          <div className="stat-sub">需尽快处理</div>
        </div>
      </div>

      {/* 管理面板 */}
      <div className="admin-panel">
        {/* 本月统计 */}
        <div className="stats-grid">
          <div className="stat-card highlight-blue">
            <div className="stat-label">本月营收</div>
            <div className="stat-value">¥{(stats?.month?.revenue || 0).toLocaleString()}</div>
            <div className="stat-sub">较上月 +23%</div>
          </div>
          <div className="stat-card highlight-green">
            <div className="stat-label">本月订单数</div>
            <div className="stat-value">{stats?.month?.orders || 0}</div>
            <div className="stat-sub">较上月 +18%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">客单价</div>
            <div className="stat-value">¥{stats?.month?.avg_amount?.toLocaleString() || 0}</div>
            <div className="stat-sub">较上月 +8%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">复购率</div>
            <div className="stat-value">34%</div>
            <div className="stat-sub">保持稳定</div>
          </div>
        </div>

        {/* TOP 商品 */}
        <div className="top-products-card">
          <div className="top-products-title">TOP 商品销量</div>
          {stats?.top_products?.map((product: any, idx: number) => (
            <div key={idx} className="bar-chart-item">
              <div className="bar-chart-header">
                <span>{product.name}</span>
                <span>{product.total_sales}件</span>
              </div>
              <div className="bar-chart-track">
                <div
                  className="bar-chart-fill"
                  style={{ width: `${(product.total_sales / maxSales) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {(!stats?.top_products || stats.top_products.length === 0) && (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', padding: 20 }}>
              暂无销售数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
