import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Handbook from './pages/Handbook';
import Checker from './pages/Checker';
import { BookOpen, CheckSquare, Sun, Moon } from 'lucide-react';

function App() {
  const [theme, setTheme] = useState(() => {
    // Check local storage or default to light
    return localStorage.getItem('theme') || 'light';
  });

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
          <h1>情報科学部 卒業要件ポータル</h1>
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
      </div>
    </HashRouter>
  );
}

export default App;
