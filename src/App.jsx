import { HashRouter, Routes, Route, NavLink, useLocation, Link, useParams, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Handbook from './pages/Handbook';
import Checker from './pages/Checker';
import Portal from './pages/Portal';
import { BookOpen, CheckSquare, Sun, Moon, ExternalLink, X, ArrowLeft } from 'lucide-react';
import pkg from '../package.json';
import changelogEcon from './data/changelog_econ.json';
import changelogInfo from './data/changelog_info.json';
import changelogPortal from './data/changelog_portal.json';

const FACULTY_INFO = {
  info: { 
    name: '情報科学部', 
    colorName: 'var(--color-info)', 
    pdfUrl: 'https://aaa.shunan-u.ac.jp/' // 仮のURL、実際はモーダル表示などで対応
  },
  econ: { 
    name: '経済経営学部', 
    colorName: 'var(--color-econ)', 
    pdfUrl: 'https://aaa.shunan-u.ac.jp/',
    beta: true
  }
};

function LayoutWrapper({ theme, toggleTheme, showChangelog, setShowChangelog, showPdfInfo, setShowPdfInfo }) {
  const location = useLocation();
  const isPortal = location.pathname === '/';
  
  // URLから学部を特定 (例: /info/checker -> info)
  const facultyMatch = location.pathname.match(/^\/([^/]+)/);
  const faculty = facultyMatch ? facultyMatch[1] : null;
  const info = FACULTY_INFO[faculty] || FACULTY_INFO.info;

  // 表示するバージョンを決定
  const displayVersion = isPortal 
    ? changelogPortal[0]?.version 
    : (faculty === 'econ' ? changelogEcon[0]?.version : changelogInfo[0]?.version);

  useEffect(() => {
    if (!isPortal && faculty && FACULTY_INFO[faculty]) {
      document.documentElement.style.setProperty('--primary', `var(--color-${faculty})`);
      document.documentElement.style.setProperty('--primary-hover', `var(--color-${faculty}-hover)`);
    } else {
      // ポータル画面や未定義の学部の場合は情報科学部のカラーをデフォルトに
      document.documentElement.style.setProperty('--primary', 'var(--color-info)');
      document.documentElement.style.setProperty('--primary-hover', 'var(--color-info-hover)');
    }
  }, [faculty, isPortal]);

  return (
    <div className="app-container">
      <header style={{ borderBottom: isPortal ? '1px solid var(--border)' : `3px solid ${info.colorName}` }}>
        {isPortal ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.4rem' }}>周南公立大学 卒業要件ポータル</h1>
              <button 
                onClick={() => setShowChangelog(true)}
                style={{ 
                  fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--surface-hover)', 
                  padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  marginTop: '0.2rem'
                }}
              >
                v{displayVersion}
              </button>
            </div>
            <button 
              onClick={toggleTheme} 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.5rem' }}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link
                to="/"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600,
                  textDecoration: 'none', transition: 'color 0.15s',
                }}
              >
                <ArrowLeft size={16} />
                戻る
              </Link>
              <h1 style={{ margin: 0, fontSize: '1.2rem', color: info.colorName, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {info.name}
                {info.beta && (
                  <span style={{ 
                    fontSize: '0.65rem', background: info.colorName, color: 'white', 
                    padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800,
                    letterSpacing: '0.05em'
                  }}>BETA</span>
                )}
              </h1>
              <button 
                onClick={() => setShowChangelog(true)}
                style={{ 
                  fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--surface-hover)', 
                  padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                v{displayVersion}
              </button>
            </div>
            
            <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <NavLink to={`/${faculty}/handbook`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <BookOpen size={18} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                便覧
              </NavLink>
              <NavLink to={`/${faculty}/checker`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <CheckSquare size={18} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                チェック
              </NavLink>
              <button 
                onClick={() => setShowPdfInfo(true)}
                className="nav-link"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
              >
                <ExternalLink size={18} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                PDF
              </button>
              <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.5rem' }}>
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </nav>
          </>
        )}
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Portal />} />
          <Route path="/:faculty/handbook" element={<Handbook />} />
          <Route path="/:faculty/checker" element={<Checker />} />
          {/* 旧URLからのリダイレクト設定 */}
          <Route path="/checker" element={<Navigate to="/info/checker" replace />} />
          <Route path="/handbook" element={<Navigate to="/info/handbook" replace />} />
        </Routes>
      </main>
    </div>
  );
}

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

  // モーダル表示時の背景スクロールロック
  useEffect(() => {
    if (showChangelog || showPdfInfo) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showChangelog, showPdfInfo]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <HashRouter>
      <LayoutWrapper 
        theme={theme} 
        toggleTheme={toggleTheme} 
        showChangelog={showChangelog}
        setShowChangelog={setShowChangelog}
        showPdfInfo={showPdfInfo}
        setShowPdfInfo={setShowPdfInfo}
      />
      
      {showChangelog && (
        <div className="modal-overlay" onClick={() => setShowChangelog(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowChangelog(false)}>
              <X size={20} />
            </button>
            <div className="modal-header" style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10, paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ color: 'var(--primary)', margin: 0 }}>更新履歴</h2>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1rem' }}>
              {/* 各学部の履歴を表示 */}
              {(() => {
                const hash = window.location.hash;
                const isEcon = hash.includes('/econ/');
                const isInfo = hash.includes('/info/');
                const isPortal = hash === '#/' || hash === '' || hash === '#';

                const renderSection = (title, data, color) => (
                  <div key={title} style={{ marginBottom: '2rem' }}>
                    <h3 style={{ 
                      color, borderBottom: `2px solid ${color}`, 
                      paddingBottom: '0.4rem', marginBottom: '1rem',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span>{title}</span>
                      <span style={{ fontSize: '0.8rem', opacity: 0.7 }}> 最新: v{data[0]?.version}</span>
                    </h3>
                    {data.map((item, index) => (
                      <div key={index} className="changelog-item">
                        <div className="changelog-header">
                          <span className="changelog-version">v{item.version}</span>
                          <span className="changelog-date">{item.date}</span>
                        </div>
                        {item.description && <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>{item.description}</div>}
                        <ul className="changelog-list">
                          {item.changes.map((change, i) => (
                            <li key={i}>{change}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                );

                if (isPortal) {
                  return renderSection('システム（ポータル）の歩み', changelogPortal, 'var(--primary)');
                }
                
                const sections = [];
                if (isEcon) sections.push(renderSection('経済経営学部', changelogEcon, 'var(--color-econ)'));
                if (isInfo) sections.push(renderSection('情報科学部', changelogInfo, 'var(--color-info)'));
                
                return sections;
              })()}
            </div>
          </div>
        </div>
      )}

      {showPdfInfo && (
        <div className="modal-overlay" onClick={() => setShowPdfInfo(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPdfInfo(false)}>
              <X size={20} />
            </button>
            <div className="modal-header">
              <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <ExternalLink size={24} />
                公式便覧の確認方法
              </h2>
            </div>
            <div className="modal-body">
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
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowPdfInfo(false)}
                style={{ 
                  width: '100%', padding: '0.75rem', 
                  background: 'var(--primary)', color: 'white', border: 'none', 
                  borderRadius: '6px', fontWeight: 600, cursor: 'pointer' 
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </HashRouter>
  );
}

export default App;
