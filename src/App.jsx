import { HashRouter, Routes, Route, NavLink, useLocation, Link, useParams, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Handbook from './pages/Handbook';
import Checker from './pages/Checker';
import Portal from './pages/Portal';
import AdminPortal from './pages/AdminPortal';
import { BookOpen, CheckSquare, Sun, Moon, ExternalLink, X, ArrowLeft, AlertTriangle, Hammer } from 'lucide-react';
import pkg from '../package.json';
import changelogEcon from './data/changelog_econ.json';
import changelogInfo from './data/changelog_info.json';
import changelogPortal from './data/changelog_portal.json';
import TermsModal from './components/TermsModal';

// --- メンテナンスモード設定 ---
// true にするとメンテナンス画面が表示されます
const MAINTENANCE_MODE = false;

const MaintenanceScreen = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--background)',
    color: 'var(--text-main)',
    textAlign: 'center',
    padding: '2rem',
    fontFamily: 'Inter, "Noto Sans JP", sans-serif'
  }}>
    <div style={{ 
      background: 'var(--surface)', 
      padding: '3rem 2rem', 
      borderRadius: '24px', 
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      border: '1px solid var(--border)',
      maxWidth: '500px',
      width: '100%'
    }}>
      <div style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '80px', 
        height: '80px', 
        borderRadius: '20px', 
        background: 'var(--accent-light)', 
        color: 'var(--primary)',
        marginBottom: '2rem'
      }}>
        <Hammer size={40} />
      </div>
      <h1 style={{ 
        fontSize: '1.8rem', 
        fontWeight: 800, 
        color: 'var(--text-main)', 
        marginBottom: '1rem',
        letterSpacing: '-0.02em'
      }}>
        現在メンテナンス中です
      </h1>
      <p style={{ 
        fontSize: '1rem', 
        color: 'var(--text-muted)', 
        lineHeight: 1.6,
        marginBottom: '0'
      }}>
        より良いサービス提供のため、システムメンテナンスを実施しております。<br />
        恐れ入りますが、終了までしばらくお待ちください。
      </p>
    </div>
    <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)', opacity: 0.6 }}>
      {/* 削除 */}
    </div>
  </div>
);

const FACULTY_INFO = {
  info: { 
    name: '情報科学部', 
    colorName: 'var(--color-info)', 
    rgb: '226, 4, 27',
    pdfUrl: 'https://aaa.shunan-u.ac.jp/' // 仮のURL、実際はモーダル表示などで対応
  },
  econ: { 
    name: '経済経営学部', 
    colorName: 'var(--color-econ)', 
    rgb: '18, 118, 54',
    pdfUrl: 'https://aaa.shunan-u.ac.jp/',
    beta: true
  }
};

const EconWarningModal = ({ onClose }) => (
  <div className="modal-overlay" style={{ zIndex: 1100 }}>
    <div className="modal-content" style={{ maxWidth: '450px', border: '3px solid #d97706' }}>
      <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ color: '#d97706', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={28} /> ベータ版のご注意
        </h2>
      </div>
      <div className="modal-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.1rem' }}>
          経済経営学部の判定機能は現在調整中（ベータ版）です。
        </p>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.9rem' }}>
          判定結果や科目データに一部誤りがある可能性があるため、最終的な判定結果は必ずお手元の<strong style={{ color: 'var(--primary)' }}>学生便覧（PDF）</strong>および学務課の案内に基づいて判断してください。
        </p>
      </div>
      <div className="modal-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
        <button 
          onClick={onClose}
          style={{
            width: '100%', padding: '1rem', background: '#d97706', color: 'white',
            border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '1rem',
            cursor: 'pointer', transition: 'filter 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.filter = 'brightness(0.9)'}
          onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
        >
          内容を理解して利用する
        </button>
      </div>
    </div>
  </div>
);

function LayoutWrapper({ theme, toggleTheme, showChangelog, setShowChangelog, showPdfInfo, setShowPdfInfo, setShowTerms }) {
  const [showEconWarning, setShowEconWarning] = useState(false);
  const location = useLocation();
  const isPortal = location.pathname === '/';

  // URLが変わった時に経済学部の警告を出すか判定
  useEffect(() => {
    const isEcon = location.pathname.includes('/econ/');
    const hasSeen = sessionStorage.getItem('seenEconWarning');
    
    if (isEcon && !hasSeen) {
      setShowEconWarning(true);
    }
  }, [location.pathname]);

  const handleCloseEconWarning = () => {
    setShowEconWarning(false);
    sessionStorage.setItem('seenEconWarning', 'true');
  };
  
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
      document.documentElement.style.setProperty('--primary-rgb', FACULTY_INFO[faculty].rgb);
    } else {
      // ポータル画面や未定義の学部の場合はポータル専用カラー（ブラック）をデフォルトに
      document.documentElement.style.setProperty('--primary', 'var(--color-portal)');
      document.documentElement.style.setProperty('--primary-hover', 'var(--color-portal-hover)');
      document.documentElement.style.setProperty('--primary-rgb', '17, 24, 39'); // Slate 900
    }
  }, [faculty, isPortal]);

  // 管理画面（/admin）の場合はヘッダー・フッターを含まない独立したレイアウトにする
  if (location.pathname === '/admin') {
    return (
      <main style={{ padding: 0 }}>
        <Routes>
          <Route path="/admin" element={<AdminPortal />} />
        </Routes>
      </main>
    );
  }

  return (
    <div className="app-container">
      <header style={{ borderBottom: isPortal ? '1px solid var(--border)' : `3px solid ${info.colorName}` }}>
        {isPortal ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
              <h1 className="header-title-portal">
                周南公立大学 卒業要件ポータル
              </h1>
              <button 
                onClick={() => setShowChangelog(true)}
                className="version-badge"
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
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/:faculty/handbook" element={<Handbook />} />
          <Route path="/:faculty/checker" element={<Checker />} />
          {/* 旧URLからのリダイレクト設定 */}
          <Route path="/checker" element={<Navigate to="/info/checker" replace />} />
          <Route path="/handbook" element={<Navigate to="/info/handbook" replace />} />
        </Routes>
      </main>

      <footer className="site-footer" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Developed by KosukeGuntani using Gemini 3 Flash</span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <button 
            onClick={() => setShowTerms(true)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
          >
            利用規約・プライバシーポリシー
          </button>
        </div>
        <Link to="/admin" style={{ opacity: 0, position: 'absolute', right: 0, cursor: 'default' }}>.</Link>
      </footer>
    </div>
  );
}

function App() {
  const [agreedToTos, setAgreedToTos] = useState(() => {
    return localStorage.getItem('agreedToTos') === 'true';
  });
  const [theme, setTheme] = useState(() => {
    // Check local storage or default to light
    return localStorage.getItem('theme') || 'light';
  });
  const [showChangelog, setShowChangelog] = useState(false);
  const [showPdfInfo, setShowPdfInfo] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

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
    if (showChangelog || showPdfInfo || (!agreedToTos && !showTerms) || showTerms) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showChangelog, showPdfInfo, agreedToTos, showTerms]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleAgreeToTos = () => {
    localStorage.setItem('agreedToTos', 'true');
    setAgreedToTos(true);
  };

  if (MAINTENANCE_MODE) {
    return <MaintenanceScreen />;
  }

  return (
    <HashRouter>
      {(!agreedToTos || showTerms) && (
        <TermsModal 
          onAgree={() => {
            if (!agreedToTos) handleAgreeToTos();
            setShowTerms(false);
          }} 
          viewOnly={agreedToTos} 
        />
      )}
      <LayoutWrapper 
        theme={theme} 
        toggleTheme={toggleTheme} 
        showChangelog={showChangelog}
        setShowChangelog={setShowChangelog}
        showPdfInfo={showPdfInfo}
        setShowPdfInfo={setShowPdfInfo}
        setShowTerms={setShowTerms}
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

      {/* 経済学部ベータ版警告ポップアップ */}
      {/* LayoutWrapper内で管理するため、ここからは削除 */}

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
