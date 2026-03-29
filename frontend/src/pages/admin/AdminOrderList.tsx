import { useState, useEffect } from 'react';
import { adminGetOrders, adminShipOrder, adminExportOrders, confirmPayment } from '../../api';
import { useToast } from '../../App';

const STATUS_TABS = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待支付' },
  { key: 'paid', label: '待发货' },
  { key: 'shipped', label: '已发货' },
  { key: 'done', label: '已完成' },
];

const STATUS_LABEL: Record<string, string> = {
  pending: '待支付',
  paid: '已付款',
  shipped: '已发货',
  done: '已完成',
};

export default function AdminOrderList() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await adminGetOrders(activeTab || undefined);
      if (res.code === 0) {
        setOrders(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShip = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'paid' ? 'shipped' : 'done';
    try {
      await adminShipOrder(id, nextStatus);
      showToast(`已标记为${STATUS_LABEL[nextStatus]}`);
      await fetchOrders();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleConfirmPayment = async (id: number) => {
    setConfirmingId(id);
    try {
      await adminShipOrder(id, 'paid');
      showToast('已确认收款，订单待发货');
      await fetchOrders();
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleExport = async () => {
    try {
      const params = activeTab ? `?status=${activeTab}` : '';
      const timestamp = new Date().toISOString().slice(0, 10);
      // 直接通过 window.location 触发下载，让浏览器处理文件类型
      const link = document.createElement('a');
      link.href = `/api/v1/admin/orders/export${params}`;
      link.download = `月芽湾湾销售记录_${timestamp}.xlsx`;
      link.target = '_blank';
      // 触发下载（需要带上 cookie）
      const res = await fetch(link.href, { credentials: 'include' });
      if (!res.ok) throw new Error('导出失败');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showToast('导出成功！');
    } catch (err: any) {
      showToast(err.message || '导出失败，请重试');
    }
  };

  const renderImage = (item: any) => {
    if (item.product_image) {
      try {
        const imgs = typeof item.product_image === 'string' ? JSON.parse(item.product_image) : item.product_image;
        if (imgs && imgs.length > 0) return <img src={imgs[0]} alt={item.product_name} />;
      } catch {}
    }
    return '📦';
  };

  const getPayIcon = (method: string) => method === 'wechat' ? '💚' : '🔵';
  const getPayName = (method: string) => method === 'wechat' ? '微信支付' : '支付宝';

  return (
    <div>
      <div className="admin-topbar">
        <h1>订单管理</h1>
        <div className="admin-actions">
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            共 {orders.length} 个订单
          </span>
          <button
            className="admin-btn secondary"
            onClick={handleExport}
            title="导出为 Excel 文件"
          >
            📥 导出 Excel
          </button>
        </div>
      </div>

      {/* 标签页 */}
      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 8, flexShrink: 0 }}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              border: 'none',
              background: activeTab === tab.key ? 'var(--admin-accent)' : 'rgba(255,255,255,0.08)',
              color: activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: 12,
              cursor: 'pointer',
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-panel">
        {loading ? (
          <div className="loading"><div className="loading-spinner" style={{ borderTopColor: '#fff' }} />加载中...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>
            暂无订单
          </div>
        ) : (
          <div className="order-list">
            {orders.map(order => (
              <div key={order.id} className="order-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                {/* 订单头 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
                  <div>
                    <div className="order-no-text">{order.order_no}</div>
                    <div className="order-customer">
                      {order.buyer_name} · {order.buyer_phone}
                    </div>
                    <div className="order-customer">{order.buyer_addr}</div>
                    <div className="order-goods" style={{ marginTop: 2 }}>
                      {getPayIcon(order.pay_method)} {getPayName(order.pay_method)}
                      {order.pay_transaction_id && (
                        <span style={{ color: '#60a5fa', marginLeft: 8 }}>
                          流水号: {order.pay_transaction_id}
                        </span>
                      )}
                    </div>
                    {order.pay_screenshot && (
                      <a
                        href={order.pay_screenshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#60a5fa', fontSize: 11, display: 'block', marginTop: 2 }}
                      >
                        📎 查看支付截图
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span className={`status-badge ${order.status}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                    <div className="order-amount">¥{Number(order.total_amount).toLocaleString()}</div>
                    {order.status === 'pending' && (
                      <button
                        className="ship-btn"
                        onClick={() => handleConfirmPayment(order.id)}
                        disabled={confirmingId === order.id}
                        style={{ background: '#fa8c16' }}
                      >
                        {confirmingId === order.id ? '确认中...' : '✓ 确认收款'}
                      </button>
                    )}
                    {order.status === 'paid' && (
                      <button
                        className="ship-btn"
                        onClick={() => handleShip(order.id, order.status)}
                      >
                        标记发货
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <button
                        className="tbl-btn ship"
                        onClick={() => handleShip(order.id, order.status)}
                      >
                        标记完成
                      </button>
                    )}
                  </div>
                </div>
                {/* 商品明细 */}
                <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div className="td-img" style={{ width: 36, height: 36, fontSize: 16 }}>
                        {renderImage(item)}
                      </div>
                      <div style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                        <div style={{ color: '#fff', fontWeight: 500 }}>{item.product_name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                          x{item.quantity} · ¥{Number(item.price).toLocaleString()}/件 · 运费¥{item.shipping}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#60a5fa', fontFamily: 'DM Sans' }}>
                        ¥{((Number(item.price) + Number(item.shipping)) * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
