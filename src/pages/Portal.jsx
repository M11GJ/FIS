import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

import changelogEcon from '../data/changelog_econ.json';
import changelogInfo from '../data/changelog_info.json';

const FACULTIES = [
  {
    id: 'info',
    emoji: '💻',
    name: '情報科学部',
    sub: 'データサイエンス / 情報エンジニアリング / ビジネスアナリティクス',
    color: 'var(--color-info)',
    colorRgb: '226, 4, 27',
    ready: true,
  },
  {
    id: 'econ',
    emoji: '📊',
    name: '経済経営学部',
    sub: '地域社会・経済 / 経営学の理論と実践',
    color: 'var(--color-econ)',
    colorRgb: '18, 118, 54',
    ready: true,
    beta: true
  },
  {
    id: 'welfare',
    emoji: '🤝',
    name: '福祉情報学部',
    sub: null,
    color: '#94a3b8',
    colorRgb: '148, 163, 184',
    ready: false,
  },
  {
    id: 'nursing',
    emoji: '🏥',
    name: '看護学部',
    sub: null,
    color: '#94a3b8',
    colorRgb: '148, 163, 184',
    ready: false,
  },
  {
    id: 'health',
    emoji: '🏃',
    name: '人間健康科学部',
    sub: null,
    color: '#94a3b8',
    colorRgb: '148, 163, 184',
    ready: false,
  },
];

const Portal = () => {
  const navigate = useNavigate();
  const [showNewsModal, setShowNewsModal] = useState(false);

  // 各学部の履歴をマージしてお知らせリストを生成
  const NEWS = useMemo(() => {
    const econNews = changelogEcon.map(item => ({
      date: item.date,
      title: '経済経営学部',
      type: 'econ',
      detail: item.description || item.changes[0]
    }));
    
    const infoNews = changelogInfo.map(item => ({
      date: item.date,
      title: '情報科学部',
      type: 'info',
      detail: item.description || item.changes[0]
    }));

    // 日付順（降順）にソート
    return [...econNews, ...infoNews].sort((a, b) => b.date.localeCompare(a.date));
  }, []);

  // お知らせモーダルコンポーネント
  const NewsModal = () => (
    <div className="modal-overlay" onClick={() => setShowNewsModal(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowNewsModal(false)}>
          <X size={20} />
        </button>
        <div className="modal-header">
          <h2 style={{ color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📢</span> お知らせ一覧
          </h2>
        </div>
        <div className="modal-body">
          {NEWS.map((item, idx) => (
            <div key={idx} style={{ paddingBottom: '1rem', marginBottom: '1rem', borderBottom: idx !== NEWS.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ 
                  fontSize: '0.75rem', fontWeight: 700, 
                  color: item.type === 'econ' ? 'var(--color-econ)' : 'var(--color-info)', 
                  background: item.type === 'econ' ? 'rgba(18, 118, 54, 0.1)' : 'rgba(226, 4, 11, 0.08)', 
                  padding: '2px 8px', borderRadius: '4px' 
                }}>
                  {item.title}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.date}</span>
              </div>
              <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.6, color: 'var(--text-main)' }}>
                {item.detail}
              </p>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn-checker-sm" style={{ width: '100%', padding: '0.8rem' }} onClick={() => setShowNewsModal(false)}>閉じる</button>
        </div>
      </div>
    </div>
  );

  return (
    /* app-containerのpadding(3vw)を打ち消し、残りのビューポートいっぱいに表示 */
    <div className="portal-container">

      {/* タイトル */}
      {/* タイトルエリアは削除しました */}

      {/* モバイル版 お知らせ行 (学部リストと同じデザイン・同じ高さ) */}
      <div className="portal-faculty-row mobile-only" style={{ marginBottom: '1.5rem', border: '2px solid var(--accent-light)' }}>
        <span className="faculty-icon-sm">📢</span>
        <div className="faculty-name-sm" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', overflow: 'hidden' }}>
          <span style={{ fontWeight: 800, flexShrink: 0 }}>お知らせ</span>
          <span className="news-preview">
            {NEWS[0].title}: {NEWS[0].detail}
          </span>
        </div>
        <div className="faculty-actions-sm">
          <button className="news-detail-btn" onClick={() => setShowNewsModal(true)}>詳細</button>
        </div>
      </div>

      {/* モバイル版 学部リスト (一行形式・補助情報なし) */}
      <div className="portal-mobile-list mobile-only">
        {FACULTIES.map(fac => (
          <div key={fac.id} className="portal-faculty-row" style={{ opacity: fac.ready ? 1 : 0.6 }}>
            <span className="faculty-icon-sm">{fac.emoji}</span>
            <div className="faculty-name-sm">
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{fac.name}</span>
              {fac.beta && <span style={{ fontSize: '0.6rem', flexShrink: 0, color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '1px 4px', borderRadius: '3px', background: 'var(--surface-hover)' }}>BETA</span>}
            </div>
            <div className="faculty-actions-sm">
              {fac.ready ? (
                <>
                  <button 
                    className="btn-checker-sm" 
                    onClick={() => navigate(`/${fac.id}/checker`)}
                    style={{ background: fac.color }}
                  >
                    ✓ チェック
                  </button>
                  <button 
                    className="btn-handbook-sm" 
                    onClick={() => navigate(`/${fac.id}/handbook`)} 
                    title="学生便覧"
                    style={{ 
                      color: fac.color, 
                      background: `rgba(${fac.colorRgb}, 0.08)`,
                      borderColor: `rgba(${fac.colorRgb}, 0.1)`
                    }}
                  >
                    📖
                  </button>
                </>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>準備中</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* デスクトップ版 カードグリッド — 3列×2行 */}
      <div className="portal-grid desktop-only">
        
        {/* ニュースフィードカード */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.8rem 1.5rem 1.5rem',
          border: '2px solid var(--border)',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📢</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>お知らせ</h3>
            </div>
            <button 
              onClick={() => setShowNewsModal(true)}
              style={{
                background: 'var(--accent-light)', border: 'none', color: 'var(--primary)', 
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                padding: '0.3rem 0.6rem', borderRadius: '6px',
                display: 'flex', alignItems: 'center', gap: '0.2rem', transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.15)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--accent-light)'}
            >
              一覧 <span>›</span>
            </button>
          </div>
          
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '0.4rem' }} className="news-scroll">
            {NEWS.slice(0, 8).map((item, idx) => (
              <div key={idx} className="portal-news-item" style={{ paddingBottom: '0.5rem', borderBottom: idx !== Math.min(NEWS.length, 8) - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.1rem' }}>
                  <span style={{ 
                    fontSize: '0.6rem', fontWeight: 800, 
                    color: item.type === 'econ' ? 'var(--color-econ)' : 'var(--color-info)', 
                    background: item.type === 'econ' ? 'rgba(18, 118, 54, 0.1)' : 'rgba(226, 4, 11, 0.08)', 
                    padding: '1px 5px', borderRadius: '3px' 
                  }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.date}</span>
                </div>
                <p style={{ fontSize: '0.78rem', margin: 0, lineHeight: 1.35, color: 'var(--text-main)' }}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 学部カード */}
        {FACULTIES.map((fac) => (
          <div
            key={fac.id}
            style={{
              background: 'var(--surface)',
              borderRadius: '16px',
              border: `2px solid ${fac.ready ? 'transparent' : 'var(--border)'}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              opacity: fac.ready ? 1 : 0.5,
              display: 'flex',
              flexDirection: 'column',
              padding: '1.8rem 1.5rem 1.5rem',
              position: 'relative',
              overflow: 'hidden',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseOver={e => {
              if (!fac.ready) return;
              e.currentTarget.style.borderColor = fac.color;
              e.currentTarget.style.boxShadow = `0 8px 32px rgba(${fac.colorRgb}, 0.18)`;
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
            }}
          >
            {/* 背景グロー */}
            {fac.ready && (
              <div style={{
                position: 'absolute', top: '-40px', right: '-40px',
                width: '100px', height: '100px', borderRadius: '50%',
                background: `rgba(${fac.colorRgb}, 0.08)`,
                pointerEvents: 'none',
              }} />
            )}

            {/* アイコン */}
            <div className="faculty-card-emoji" style={{ fontSize: '2.5rem', lineHeight: 1, marginBottom: '1rem' }}>
              {fac.emoji}
            </div>

            {/* 学部名・説明 — flex: 1 で余白を吸収 */}
            <div style={{ flex: 1, minHeight: 0 }}>
              <h3 className="faculty-card-title" style={{
                fontSize: '1.1rem', fontWeight: 700,
                color: fac.ready ? 'var(--text-main)' : 'var(--text-muted)',
                marginBottom: '0.4rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                {fac.name}
                {fac.beta && (
                  <span style={{ 
                    fontSize: '0.6rem', background: 'var(--border)', color: 'var(--text-muted)', 
                    padding: '0.05rem 0.3rem', borderRadius: '4px', border: '1px solid var(--border)'
                  }}>BETA</span>
                )}
              </h3>
              {fac.sub && (
                <p className="faculty-sub-text">
                  {fac.sub}
                </p>
              )}
            </div>

            {/* ボタン */}
            <div className="faculty-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.2rem' }}>
              {fac.ready ? (
                <>
                  <button
                    onClick={() => navigate(`/${fac.id}/checker`)}
                    style={{
                      width: '100%', padding: '0.65rem 0',
                      background: fac.color, color: 'white',
                      border: 'none', borderRadius: '8px',
                      fontWeight: 700, fontSize: '0.9rem',
                      cursor: 'pointer', transition: 'opacity 0.15s',
                    }}
                    onMouseOver={e => e.currentTarget.style.opacity = 0.85}
                    onMouseOut={e => e.currentTarget.style.opacity = 1}
                  >
                    ✓ 履修チェック
                  </button>
                  <button
                    onClick={() => navigate(`/${fac.id}/handbook`)}
                    style={{
                      width: '100%', padding: '0.65rem 0',
                      background: 'transparent',
                      color: fac.color,
                      border: `1.5px solid ${fac.color}`,
                      borderRadius: '8px',
                      fontWeight: 700, fontSize: '0.9rem',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = `rgba(${fac.colorRgb}, 0.08)`}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    📖 学生便覧
                  </button>
                </>
              ) : (
                <div style={{
                  textAlign: 'center', padding: '0.6rem 0',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600,
                }}>
                  準備中
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* お知らせモーダル */}
      {showNewsModal && <NewsModal />}
    </div>
  );
};

export default Portal;
