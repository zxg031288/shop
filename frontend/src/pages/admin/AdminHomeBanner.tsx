import { useState, useEffect } from 'react';
import { adminGetHomeBanner, adminUpdateHomeBanner } from '../../api';
import { useToast } from '../../App';

export default function AdminHomeBanner() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titleLine1, setTitleLine1] = useState('');
  const [titleLine2, setTitleLine2] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('');
  const [emoji, setEmoji] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await adminGetHomeBanner();
        if (res.code === 0 && res.data) {
          const d = res.data;
          setTitleLine1(d.titleLine1 ?? '');
          setTitleLine2(d.titleLine2 ?? '');
          setSubtitle(d.subtitle ?? '');
          setBadge(d.badge ?? '');
          setEmoji(d.emoji ?? '');
          setLinkUrl(d.linkUrl ?? '');
        }
      } catch (err: any) {
        showToast(err.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅挂载时拉取
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminUpdateHomeBanner({
        titleLine1,
        titleLine2,
        subtitle,
        badge,
        emoji,
        linkUrl,
      });
      if (res.code === 0) {
        showToast('已保存，买家首页将显示最新内容');
      }
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="admin-topbar">
        <h1>首页活动</h1>
        <div className="admin-actions">
          <button className="admin-btn primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>

      <div className="admin-panel">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner" style={{ borderTopColor: '#fff' }} />
            加载中...
          </div>
        ) : (
          <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: '0 0 12px' }}>
              对应买家首页橙色活动条：主标题两行、说明文案、角标、右侧图标（可用 Emoji）。可选填写链接，用户点击活动条时在新标签页打开。
            </p>
            <div className="form-group">
              <label className="form-label">主标题第一行</label>
              <input
                className="form-input"
                value={titleLine1}
                onChange={(e) => setTitleLine1(e.target.value)}
                placeholder="澳洲直邮"
              />
            </div>
            <div className="form-group">
              <label className="form-label">主标题第二行</label>
              <input
                className="form-input"
                value={titleLine2}
                onChange={(e) => setTitleLine2(e.target.value)}
                placeholder="限时折扣"
              />
            </div>
            <div className="form-group">
              <label className="form-label">副标题</label>
              <input
                className="form-input"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="今日下单享9折优惠"
              />
            </div>
            <div className="form-group">
              <label className="form-label">角标文案</label>
              <input
                className="form-input"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="立省 ¥80+"
              />
            </div>
            <div className="form-group">
              <label className="form-label">右侧图标（Emoji）</label>
              <input
                className="form-input"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="✈️"
              />
            </div>
            <div className="form-group">
              <label className="form-label">点击跳转链接（可选）</label>
              <input
                className="form-input"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https:// 或留空仅展示"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
