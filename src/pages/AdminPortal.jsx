import { useState, useEffect } from 'react';
import { 
  Shield, 
  Activity, 
  Users, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Terminal,
  LogOut,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_PASSWORD = 'admin'; // あなたが指定したパスワード

const AdminPortal = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ログイン状態の復元
  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // データの定期取得
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // 30秒ごとに更新
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, historyRes] = await Promise.all([
        fetch('/shu-binran/api/admin/stats'),
        fetch('/shu-binran/api/admin/history')
      ]);
      const statsData = await statsRes.json();
      const historyData = await historyRes.json();
      setStats(statsData);
      setHistory(historyData.history);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      setError('');
    } else {
      setError('パスワードが正しくありません');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-fullscreen">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="admin-login-glass"
        >
          <div className="admin-brand">
            <div className="brand-icon">
              <Shield size={32} />
            </div>
            <h2>ADMIN PORTAL</h2>
            <p>System Command Center</p>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-glow-wrapper">
              <input 
                type="password" 
                placeholder="ACCESS PASSWORD" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <div className="input-glow"></div>
            </div>
            {error && (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="error-text"
              >
                {error}
              </motion.p>
            )}
            <button type="submit" className="neon-button">
              認証開始
            </button>
          </form>
        </motion.div>
        
        <style jsx>{`
          .admin-login-fullscreen {
            position: fixed;
            inset: 0;
            background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: 'Inter', sans-serif;
          }
          .admin-login-glass {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 3rem;
            border-radius: 32px;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .admin-brand { margin-bottom: 2.5rem; text-align: center; }
          .brand-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, var(--primary) 0%, #ef4444 100%);
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            box-shadow: 0 0 20px rgba(226, 4, 18, 0.3);
            color: white;
          }
          .admin-brand h2 { font-size: 1.5rem; font-weight: 900; letter-spacing: 0.1em; color: white; margin-bottom: 0.5rem; }
          .admin-brand p { color: #64748b; font-size: 0.875rem; font-weight: 600; }
          
          .input-glow-wrapper { position: relative; margin-bottom: 1.5rem; }
          input {
            width: 100%;
            padding: 1.25rem;
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            color: white;
            font-size: 1.1rem;
            text-align: center;
            letter-spacing: 0.25em;
            transition: all 0.3s;
            position: relative;
            z-index: 2;
          }
          input:focus { border-color: var(--primary); outline: none; }
          .input-glow {
            position: absolute;
            inset: -2px;
            background: linear-gradient(90deg, var(--primary), #ef4444);
            border-radius: 18px;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 1;
          }
          input:focus + .input-glow { opacity: 0.3; }
          
          .neon-button {
            width: 100%;
            padding: 1.25rem;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 16px;
            font-weight: 800;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(226, 4, 18, 0.3);
          }
          .neon-button:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(226, 4, 18, 0.4); }
          .error-text { color: #ef4444; font-size: 0.875rem; margin-bottom: 1.5rem; font-weight: 600; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-root">
      <aside className="dashboard-sidebar">
        <div className="sidebar-top">
          <div className="brand-box">
            <Terminal size={20} />
            <span>CORE OPS</span>
          </div>
        </div>
        
        <nav className="sidebar-menu">
          <div className="menu-group">
            <label>SYSTEM</label>
            <div className="menu-item active">
              <Activity size={18} />
              <span>ダッシュボード</span>
            </div>
            <div className="menu-item disabled">
              <Users size={18} />
              <span>部員管理</span>
            </div>
          </div>
        </nav>

        <div className="sidebar-bottom">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            <span>システム切断</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-content">
        <header className="content-header">
          <div className="header-titles">
            <h1>Analytics Overview</h1>
            <p>システムの稼働状況と、重複を排除した正確な訪問統計です</p>
          </div>
          <div className="header-meta">
            <div className="live-status">
              <span className="pulse"></span>
              LIVE DATA FEED
            </div>
            <button onClick={fetchData} className="refresh-icon-btn" title="データを更新">
              <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
            </button>
          </div>
        </header>

        <div className="grid-summary">
          <PremiumStatCard 
            title="Page Views" 
            value={stats?.totalHits || 0} 
            icon={<Monitor />} 
            color="#3b82f6"
            description="重複を除いた純粋なアクセス"
          />
          <PremiumStatCard 
            title="Unique Visitors" 
            value={stats?.uniqueIps || 0} 
            icon={<Users />} 
            color="#a855f7"
            description="接続された固有のIPアドレス数"
          />
          <PremiumStatCard 
            title="Sync Status" 
            value="SYNCED" 
            icon={<CheckCircle2 />} 
            color="#10b981"
            description={history[0]?.split(']')[0].replace('[', '') || 'WAITING'}
          />
        </div>

        <div className="grid-main">
          <div className="main-left">
            <div className="glass-card chart-view">
              <div className="card-top">
                <h3><Activity size={16} /> アクセス推移（1時間毎）</h3>
              </div>
              <div className="chart-wrapper">
                {stats?.dailyHits && (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={stats.dailyHits}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      />
                      <Bar dataKey="hits" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="glass-card ip-rank">
              <div className="card-top">
                <h3><Users size={16} /> 接続 IP ランキング</h3>
              </div>
              <div className="rank-list">
                {stats?.topIps?.map((item, idx) => (
                  <div key={item.ip} className="rank-item">
                    <span className="idx">{idx + 1}</span>
                    <span className="ip">{item.ip}</span>
                    <div className="bar-bg">
                      <div className="bar-fill" style={{ width: `${(item.count / stats.topIps[0].count) * 100}%` }}></div>
                    </div>
                    <span className="val">{item.count} PV</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="main-right">
            <div className="glass-card history-feed">
              <div className="card-top">
                <h3><Clock size={16} /> システム更新履歴</h3>
              </div>
              <div className="feed-list">
                {history.map((line, idx) => {
                  const isSuccess = line.includes('成功') || line.includes('完了') || line.includes('更新はありませんでした');
                  const isError = line.includes('エラー') || line.includes('失敗');
                  const time = line.match(/\[(.*?)\]/)?.[1] || '';
                  const message = line.replace(/\[.*?\]\s*/, '');
                  
                  return (
                    <div key={idx} className="feed-item">
                      <div className={`dot ${isError ? 'err' : (isSuccess ? 'ok' : 'pending')}`}></div>
                      <div className="feed-body">
                        <span className="time">{time}</span>
                        <p className="msg">{message}</p>
                      </div>
                    </div>
                  );
                })}
                {history.length === 0 && <p className="empty">ログが空です</p>}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .admin-dashboard-root {
          display: flex;
          height: 100vh;
          background: #020617;
          color: #f1f5f9;
          font-family: 'Inter', sans-serif;
          overflow: hidden;
        }

        /* Sidebar */
        .dashboard-sidebar {
          width: 240px;
          background: #0f172a;
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
        }
        .brand-box {
          display: flex; align-items: center; gap: 0.75rem; 
          font-weight: 900; font-size: 1.1rem; color: var(--primary);
          margin-bottom: 3rem;
        }
        .sidebar-menu { flex: 1; }
        .menu-group label { font-size: 0.65rem; font-weight: 800; color: #475569; letter-spacing: 0.1em; }
        .menu-item {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.8rem 1rem; margin-top: 0.5rem; border-radius: 12px;
          cursor: pointer; color: #94a3b8; font-weight: 600; font-size: 0.9rem;
        }
        .menu-item.active { background: rgba(226, 4, 18, 0.1); color: var(--primary); }
        .menu-item.disabled { opacity: 0.3; cursor: not-allowed; }
        .logout-btn {
          display: flex; align-items: center; gap: 0.75rem;
          width: 100%; padding: 0.8rem; border-radius: 12px;
          background: rgba(239, 68, 68, 0.1); color: #ef4444;
          border: none; font-weight: 700; cursor: pointer; transition: 0.2s;
        }
        .logout-btn:hover { background: #ef4444; color: white; }

        /* Content */
        .dashboard-content { flex: 1; padding: 2.5rem; overflow-y: auto; }
        .content-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 2.5rem;
        }
        .header-titles h1 { font-size: 2rem; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 0.5rem; }
        .header-titles p { color: #64748b; font-weight: 500; }
        
        .header-meta { display: flex; align-items: center; gap: 1rem; }
        .live-status {
          display: flex; align-items: center; gap: 0.5rem;
          background: #1e293b; padding: 0.5rem 1rem; border-radius: 99px;
          font-size: 0.75rem; font-weight: 800; color: #10b981;
        }
        .pulse {
          width: 8px; height: 8px; background: #10b981; border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .refresh-icon-btn { 
          background: #1e293b; border: none; color: white; padding: 0.6rem; 
          border-radius: 10px; cursor: pointer; 
        }
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Stats cards */
        .grid-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; }

        /* Layout Main */
        .grid-main { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
        .glass-card {
          background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 24px; padding: 1.5rem;
        }
        .card-top h3 { 
          display: flex; align-items: center; gap: 0.6rem;
          font-size: 0.9rem; font-weight: 800; color: #94a3b8; margin-bottom: 1.5rem;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        
        /* IP Rank */
        .rank-list { display: flex; flex-direction: column; gap: 1.25rem; }
        .rank-item { display: flex; align-items: center; gap: 1rem; font-size: 0.875rem; }
        .rank-item .idx { width: 24px; height: 24px; background: #1e293b; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; color: #64748b; }
        .rank-item .ip { font-family: 'JetBrains Mono', monospace; width: 120px; font-weight: 600; }
        .bar-bg { flex: 1; height: 6px; background: #0f172a; border-radius: 3px; overflow: hidden; }
        .bar-fill { height: 100%; background: var(--primary); }
        .rank-item .val { font-weight: 800; width: 60px; text-align: right; }

        /* History */
        .feed-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .feed-item { display: flex; gap: 1rem; }
        .feed-item .dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
        .dot.ok { background: #10b981; box-shadow: 0 0 10px rgba(16,185,129,0.3); }
        .dot.err { background: #ef4444; }
        .dot.pending { background: #64748b; }
        .feed-body .time { font-size: 0.7rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem; display: block; }
        .feed-body .msg { font-size: 0.85rem; line-height: 1.5; color: #cbd5e1; }
      `}</style>
    </div>
  );
};

const PremiumStatCard = ({ title, value, icon, color, description }) => (
  <motion.div 
    whileHover={{ y: -4, backgroundColor: 'rgba(30, 41, 59, 0.6)' }}
    className="glass-card" 
    style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ color }}>{icon}</div>
      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>STATS</div>
    </div>
    <div>
      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem' }}>{title}</h4>
      <div style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>{description}</p>
    </div>
  </motion.div>
);

export default AdminPortal;
