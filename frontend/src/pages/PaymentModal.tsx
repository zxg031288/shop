import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { confirmPayment } from '../api';
import { useToast } from '../App';

interface PaymentModalProps {
  orderNo: string;
  totalAmount: number;
  payMethod: 'wechat' | 'alipay';
  onClose: () => void;
}

const WECHAT_QR = '/play/微信.jpg';
const ALIPAY_QR = '/play/支付宝.jpg';

export default function PaymentModal({ orderNo, totalAmount, payMethod, onClose }: PaymentModalProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'qr' | 'done'>('qr');
  const fileRef = useRef<HTMLInputElement>(null);

  const isWechat = payMethod === 'wechat';
  const qrSrc = isWechat ? WECHAT_QR : ALIPAY_QR;
  const qrTitle = isWechat ? '微信支付' : '支付宝支付';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
  };

  const handleSubmit = async () => {
    if (!transactionId.trim() && !screenshot) {
      showToast('请填写支付订单号或上传支付截图');
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('order_no', orderNo);
      if (transactionId.trim()) form.append('transaction_id', transactionId.trim());
      if (screenshot) form.append('screenshot', screenshot);

      await confirmPayment(form);
      showToast('支付凭证已提交！');
      setStep('done');
    } catch (err: any) {
      showToast(err.message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    navigate(`/order-success?order_no=${orderNo}&total=${totalAmount}&pay_method=${payMethod}`);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: 20,
          width: '100%',
          maxWidth: 380,
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '16px 16px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 16, cursor: 'pointer', marginRight: 12,
            }}
          >←</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', flex: 1 }}>
            {step === 'qr' ? '扫码支付' : '支付凭证已提交'}
          </span>
        </div>

        {/* Step 1: QR Code */}
        {step === 'qr' && (
          <div style={{ padding: '16px 16px 20px' }}>
            {/* Order info */}
            <div style={{
              background: 'rgba(255,75,43,0.12)',
              border: '1px solid rgba(255,75,43,0.25)',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                订单号
              </div>
              <div style={{ fontSize: 14, color: '#fff', fontFamily: 'DM Sans', fontWeight: 600 }}>
                {orderNo}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>应付金额</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#FF4B2B', fontFamily: 'DM Sans' }}>
                  ¥{Number(totalAmount).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment method label */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 12, padding: '8px 12px',
              background: isWechat ? 'rgba(7,193,96,0.12)' : 'rgba(22,119,255,0.12)',
              borderRadius: 10,
              border: `1px solid ${isWechat ? 'rgba(7,193,96,0.3)' : 'rgba(22,119,255,0.3)'}`,
            }}>
              <span style={{ fontSize: 20 }}>{isWechat ? '💚' : '🔵'}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{qrTitle}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }}>
                请使用{qrTitle}扫码支付
              </span>
            </div>

            {/* QR Code */}
            <div style={{
              borderRadius: 16, overflow: 'hidden',
              background: '#fff', padding: 12, textAlign: 'center', marginBottom: 16,
            }}>
              <img
                src={qrSrc}
                alt={`${qrTitle}收款码`}
                style={{
                  width: '100%',
                  maxWidth: 260,
                  objectFit: 'contain',
                  borderRadius: 8,
                  display: 'block',
                  margin: '0 auto',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div style="padding:40px 20px;color:#666;font-size:13px;text-align:center;">
                        <div style="font-size:60px;margin-bottom:12px;">${isWechat ? '💚' : '🔵'}</div>
                        <div style="font-weight:600;margin-bottom:4px;">${qrTitle}</div>
                        <div>请截图保存，在${qrTitle}中扫码支付</div>
                        <div style="margin-top:12px;font-size:20px;font-weight:700;color:#FF4B2B;">
                          ¥${Number(totalAmount).toLocaleString()}
                        </div>
                      </div>
                    `;
                  }
                }}
              />
            </div>

            {/* Payment proof section */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '14px 12px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                📋 支付凭证（必填一项）
              </div>

              {/* Transaction ID */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                  支付订单号（微信/支付宝账单中可查看）
                </div>
                <input
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${transactionId ? 'rgba(255,75,43,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 8, padding: '9px 12px', color: '#fff',
                    fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  placeholder="请输入支付订单号"
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                />
              </div>

              {/* Divider */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
              }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>或</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {/* Screenshot upload */}
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                  上传支付截图（选填）
                </div>
                <div
                  style={{
                    border: `2px dashed ${preview ? 'rgba(7,193,96,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 10, padding: '16px', textAlign: 'center', cursor: 'pointer',
                    background: preview ? 'rgba(7,193,96,0.05)' : 'rgba(255,255,255,0.03)',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => fileRef.current?.click()}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="支付截图预览"
                      style={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 6 }}
                    />
                  ) : (
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                      <div>点击上传支付截图</div>
                      <div style={{ fontSize: 11, marginTop: 2, color: 'rgba(255,255,255,0.2)' }}>
                        支持 JPG/PNG/GIF/WebP，不超过 5MB
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                {preview && (
                  <button
                    onClick={() => { setScreenshot(null); setPreview(''); }}
                    style={{
                      width: '100%', marginTop: 6, padding: '6px',
                      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 6, color: '#ef4444', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    移除图片
                  </button>
                )}
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: '100%', marginTop: 16, padding: '13px',
                background: submitting ? 'rgba(255,75,43,0.5)' : 'var(--brand, #FF4B2B)',
                color: '#fff', border: 'none', borderRadius: 26,
                fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {submitting ? '提交中...' : '已支付，提交凭证'}
            </button>

            <div style={{
              textAlign: 'center', marginTop: 10,
              fontSize: 11, color: 'rgba(255,255,255,0.25)',
            }}>
              支付后请提交凭证，商家确认后订单生效
            </div>
          </div>
        )}

        {/* Step 2: Done */}
        {step === 'done' && (
          <div style={{ padding: '32px 20px 28px', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #07c160, #00e676)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, color: '#fff', margin: '0 auto 20px',
            }}>
              ✓
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
              凭证已提交！
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 8 }}>
              您的支付凭证已提交<br />
              商家确认后订单将立即生效<br />
              预计 10-15 个工作日送达
            </p>
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '10px 16px', margin: '16px 0 24px',
              fontSize: 12, color: 'rgba(255,255,255,0.4)',
            }}>
              订单号：<span style={{ color: '#fff', fontFamily: 'DM Sans', fontWeight: 600 }}>{orderNo}</span>
            </div>
            <button
              onClick={handleDone}
              style={{
                width: '100%', padding: '13px',
                background: 'var(--brand, #FF4B2B)',
                color: '#fff', border: 'none', borderRadius: 26,
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              完成
            </button>
            <button
              onClick={() => navigate('/my/orders')}
              style={{
                width: '100%', marginTop: 10, padding: '11px',
                background: 'transparent',
                color: 'rgba(255,255,255,0.4)', border: 'none', borderRadius: 26,
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              查看我的订单 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
