import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getOrder, getOrders } from '../api';
import PaymentModal from './PaymentModal';

export default function PayOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderNo = searchParams.get('order_no') || '';
  const totalAmount = parseFloat(searchParams.get('total') || '0');
  const payMethod = (searchParams.get('pay_method') || 'wechat') as 'wechat' | 'alipay';
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNo) {
      navigate('/my/orders');
      return;
    }
    // 从订单列表中找对应订单
    getOrders().then(res => {
      if (res.code === 0) {
        const found = (res.data || []).find((o: any) => o.order_no === orderNo);
        setOrder(found || null);
      }
    }).catch(() => {
      navigate('/my/orders');
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h5-page">
        <div className="loading"><div className="loading-spinner" />加载中...</div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <PaymentModal
      orderNo={orderNo}
      totalAmount={totalAmount || Number(order.total_amount)}
      payMethod={payMethod}
      onClose={() => navigate('/my/orders')}
    />
  );
}
