import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Handbook from './pages/Handbook';
import Checker from './pages/Checker';
import { BookOpen, CheckSquare, Sun, Moon, ExternalLink, X } from 'lucide-react';
import pkg from '../package.json';
import changelogData from './data/changelog.json';

function App() {
  const [theme, setTheme] = useState(() => {
    // Check local storage or default to light
    return localStorage.getItem('theme') || 'light';
  });
  const [showChangelog, setShowChangelog] = useState(false);
  const [showPdfInfo, setShowPdfInfo] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <HashRouter>
      <div className="app-container">
        <header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1>情報科学部 卒業要件ポータル</h1>
            <button 
              onClick={() => setShowChangelog(true)}
              style={{ 
                fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--surface-hover)', 
                padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                marginTop: '0.2rem'
              }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
              title="更新履歴を表示"
            >
              v{pkg.version}
            </button>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <BookOpen size={18} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
              学生便覧
            </NavLink>
            <NavLink to="/checker" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <CheckSquare size={18} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
              履修チェック
            </NavLink>
            <button 
              onClick={() => setShowPdfInfo(true)}
              className="nav-link"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
              title="公式便覧の確認方法を表示"
            >
              <ExternalLink size={18} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
              公式PDF
            </button>
            <button 
              onClick={toggleTheme} 
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                padding: '0.5rem', borderRadius: '50%', transition: 'all 0.2s'
              }}
              onMouseOver={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--accent-light)'; }}
              onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              title="テーマを切り替える"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Handbook />} />
            <Route path="/checker" element={<Checker />} />
          </Routes>
        </main>

        {showChangelog && (
          <div className="modal-overlay" onClick={() => setShowChangelog(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowChangelog(false)}>
                <X size={20} />
              </button>
              <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>更新履歴</h2>
              {changelogData.map((item, index) => (
                <div key={index} className="changelog-item">
                  <div className="changelog-header">
                    <span className="changelog-version">v{item.version}</span>
                    <span className="changelog-date">{item.date}</span>
                  </div>
                  <ul className="changelog-list">
                    {item.changes.map((change, i) => (
                      <li key={i}>{change}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {showPdfInfo && (
          <div className="modal-overlay" onClick={() => setShowPdfInfo(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowPdfInfo(false)}>
                <X size={20} />
              </button>
              <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ExternalLink size={24} />
                公式便覧の確認方法
              </h2>
              <div style={{ lineHeight: '1.8', color: 'var(--text-main)' }}>
                <p style={{ marginBottom: '1rem', fontWeight: 600, color: '#EF4444' }}>※ActiBookによる公開は廃止されました。</p>
                <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                  <p>学内学外問わず、以下の手順で最新のPDFを確認できます：</p>
                  <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    <li><strong>AAA</strong> にログイン</li>
                    <li>画面左上の<strong>「掲示板」</strong>をクリック</li>
                    <li>一覧の中から<strong>「Webフォルダ」</strong>を選択</li>
                    <li>「学生便覧」フォルダ内のPDFを参照</li>
                  </ol>
                </div>
              </div>
              <button 
                onClick={() => setShowPdfInfo(false)}
                style={{ 
                  marginTop: '1.5rem', width: '100%', padding: '0.75rem', 
                  background: 'var(--primary)', color: 'white', border: 'none', 
                  borderRadius: '6px', fontWeight: 600, cursor: 'pointer' 
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </div>
    </HashRouter>
  );
}

export default App;
