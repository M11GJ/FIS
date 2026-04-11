import { useNavigate } from 'react-router-dom';

import changelogEcon from '../data/changelog_econ.json';
import changelogInfo from '../data/changelog_info.json';

// 各学部の履歴をマージしてお知らせリストを生成
const generateNewsFromChangelogs = () => {
  const econNews = changelogEcon.slice(0, 3).map(item => ({
    date: item.date,
    title: '経済経営学部',
    detail: item.description || item.changes[0]
  }));
  
  const infoNews = changelogInfo.slice(0, 3).map(item => ({
    date: item.date,
    title: '情報科学部',
    detail: item.description || item.changes[0]
  }));

  // 日付順（降順）にソート
  return [...econNews, ...infoNews].sort((a, b) => b.date.localeCompare(a.date));
};

const NEWS = generateNewsFromChangelogs();

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

  return (
    /* app-containerのpadding(3vw)を打ち消し、残りのビューポートいっぱいに表示 */
    <div style={{
      margin: '-2rem -3vw 0',
      height: 'calc(100vh - 72px)',   /* ヘッダー分を引いた残り全体 */
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 3vw',
      boxSizing: 'border-box',
    }}>

      {/* タイトル */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.12em', fontWeight: 600, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
          周南公立大学
        </p>
        <h2 style={{ fontSize: 'clamp(1.3rem, 2vw, 1.9rem)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          あなたの学部を選んでください
        </h2>
      </div>

      {/* カードグリッド — 3列×2行 */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: '1.2rem',
        minHeight: 0,
      }}>
        
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📢</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>お知らせ</h3>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="news-scroll">
            {NEWS.map((item, idx) => (
              <div key={idx} style={{ paddingBottom: '0.8rem', borderBottom: idx !== NEWS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(226, 4, 11, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.date}</span>
                </div>
                <p style={{ fontSize: '0.82rem', margin: 0, lineHeight: 1.5, color: 'var(--text-main)' }}>
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
            <div style={{ fontSize: '2.5rem', lineHeight: 1, marginBottom: '1rem' }}>
              {fac.emoji}
            </div>

            {/* 学部名・説明 — flex: 1 で余白を吸収 */}
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: '1.15rem', fontWeight: 700,
                color: fac.ready ? 'var(--text-main)' : 'var(--text-muted)',
                marginBottom: '0.5rem',
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
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {fac.sub}
                </p>
              )}
            </div>

            {/* ボタン */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.2rem' }}>
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
    </div>
  );
};

export default Portal;
