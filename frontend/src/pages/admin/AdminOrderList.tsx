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
  const [shipModal, setShipModal] = useState<{ orderId: number } | null>(null);

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

  const handleShip = (id: number, currentStatus: string) => {
    if (currentStatus === 'shipped') {
      // shipped → done 不需要物流
      doShip(id, 'done');
    } else {
      // paid → shipped 弹出填写物流信息
      setShipModal({ orderId: id });
    }
  };

  const doShip = async (
    id: number,
    status: 'shipped' | 'done',
    tracking_number?: string,
    tracking_image?: File | null,
  ) => {
    try {
      await adminShipOrder(id, status, tracking_number, tracking_image);
      showToast(`已标记为${STATUS_LABEL[status]}`);
      setShipModal(null);
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
                    {order.tracking_number && (
                      <div style={{ marginTop: 3, fontSize: 11, color: '#4ade80' }}>
                        📦 物流单号：{order.tracking_number}
                      </div>
                    )}
                    {order.tracking_image && (
                      <a
                        href={order.tracking_image}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#4ade80', fontSize: 11, display: 'block', marginTop: 2 }}
                      >
                        📦 查看物流图片
                      </a>
                    )}
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

      {/* 发货弹窗 */}
      {shipModal && (
        <ShipModal
          orderId={shipModal.orderId}
          onClose={() => setShipModal(null)}
          onConfirm={(tracking_number, tracking_image) =>
            doShip(shipModal.orderId, 'shipped', tracking_number, tracking_image)
          }
        />
      )}
    </div>
  );
}

function ShipModal({ orderId, onClose, onConfirm }: {
  orderId: number;
  onClose: () => void;
  onConfirm: (tracking_number: string, tracking_image: File | null) => void;
}) {
  const [tracking_number, setTracking_number] = useState('');
  const [tracking_image, setTracking_image] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setTracking_image(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 至少填写一项
    if (!tracking_number.trim() && !tracking_image) {
      return;
    }
    onConfirm(tracking_number.trim(), tracking_image);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '28px 28px 24px', width: 400,
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
      }}>
        <h3 style={{ margin: '0 0 6px', color: '#fff', fontSize: 17 }}>📦 填写物流信息</h3>
        <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
          订单 #{orderId} — 至少填写物流单号或上传一张物流图片
        </p>

        <form onSubmit={handleSubmit}>
          {/* 物流单号 */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
              物流单号
            </label>
            <input
              type="text"
              value={tracking_number}
              onChange={e => setTracking_number(e.target.value)}
              placeholder="请输入快递单号"
              style={{
                width: '100%', padding: '9px 12px',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)', color: '#fff',
                fontSize: 14, boxSizing: 'border-box', outline: 'none',
              }}
            />
          </div>

          {/* 分割线 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>或</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* 物流图片 */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8 }}>
              物流图片（快递单/物流截图）
            </label>
            <label style={{
              display: 'block', cursor: 'pointer', borderRadius: 8,
              border: '1.5px dashed rgba(255,255,255,0.15)',
              overflow: 'hidden', position: 'relative',
            }}>
              {preview ? (
                <img src={preview} alt="预览" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{
                  height: 120, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 6,
                  color: 'rgba(255,255,255,0.3)', fontSize: 13,
                }}>
                  <span style={{ fontSize: 28 }}>📷</span>
                  点击上传图片
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
            {preview && (
              <button
                type="button"
                onClick={() => { setTracking_image(null); setPreview(null); }}
                style={{
                  marginTop: 6, background: 'none', border: 'none',
                  color: '#ef4444', fontSize: 12, cursor: 'pointer', padding: 0,
                }}
              >
                移除图片
              </button>
            )}
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 20px', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, background: 'transparent', color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', fontSize: 14,
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!tracking_number.trim() && !tracking_image}
              style={{
                padding: '9px 20px', border: 'none', borderRadius: 8,
                background: '#6c5ce7', color: '#fff', cursor: 'pointer', fontSize: 14,
                opacity: (!tracking_number.trim() && !tracking_image) ? 0.45 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              确认发货
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
