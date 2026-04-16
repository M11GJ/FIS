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
      <div className="admin-login-container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-login-card"
        >
          <div className="admin-login-icon">
            <Shield size={48} />
          </div>
          <h1>管理者ログイン</h1>
          <p>卒業要件チェッカー 管理ポータル</p>
          
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input 
                type="password" 
                placeholder="パスワードを入力" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="login-button">
              認証
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Terminal size={24} />
            <span>ADMIN CTRL</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-item active">
            <Activity size={18} />
            <span>ダッシュボード</span>
          </div>
          <button onClick={handleLogout} className="nav-item logout">
            <LogOut size={18} />
            <span>ログアウト</span>
          </button>
        </nav>
      </div>

      <main className="admin-main">
        <header className="admin-header">
          <div className="header-info">
            <h1>システム統計ダッシュボード</h1>
            <p>稼働状況とアクセス分析</p>
          </div>
          <div className="header-actions">
            <div className={`status-badge ${stats ? 'status-online' : 'status-offline'}`}>
              <div className="status-dot"></div>
              {stats ? 'SYSTEM ONLINE' : 'FETCHING DATA...'}
            </div>
          </div>
        </header>

        <section className="stats-grid">
          <StatCard 
            icon={<Users className="text-blue" />} 
            label="合計アクセス" 
            value={stats?.totalHits || 0} 
            sub="累計リクエスト数"
          />
          <StatCard 
            icon={<Monitor className="text-purple" />} 
            label="ユニークIP" 
            value={stats?.uniqueIps || 0} 
            sub="重複なしの接続数"
          />
          <StatCard 
            icon={<RefreshCw className="text-green" />} 
            label="最新更新" 
            value={history.length > 0 ? "SUCCESS" : "NO DATA"} 
            sub={history[0]?.split(']')[0].replace('[', '') || '-'}
          />
        </section>

        <div className="admin-content-layout">
          <div className="content-left">
            <div className="card chart-card">
              <div className="card-header">
                <h3><Activity size={18} /> アクセス推移 (直近24時間)</h3>
              </div>
              <div className="chart-container">
                {stats?.dailyHits && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.dailyHits}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="time" 
                        stroke="var(--text-muted)" 
                        fontSize={12} 
                        tickFormatter={(val) => val.split(':')[1] + '時'} 
                      />
                      <YAxis stroke="var(--text-muted)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--surface)', 
                          border: '1px solid var(--border)',
                          borderRadius: '8px' 
                        }} 
                      />
                      <Bar dataKey="hits" radius={[4, 4, 0, 0]}>
                        {stats.dailyHits.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="var(--primary)" fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="card table-card">
              <div className="card-header">
                <h3><Users size={18} /> 上位接続 IP</h3>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>順位</th>
                      <th>IP アドレス</th>
                      <th>リクエスト数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.topIps?.map((item, idx) => (
                      <tr key={item.ip}>
                        <td>{idx + 1}</td>
                        <td className="font-mono">{item.ip}</td>
                        <td>{item.count}</td>
                      </tr>
                    ))}
                    {(!stats?.topIps || stats.topIps.length === 0) && (
                      <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>データがありません</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="content-right">
            <div className="card timeline-card">
              <div className="card-header">
                <h3><Clock size={18} /> 更新ログ履歴</h3>
              </div>
              <div className="timeline-container">
                <div className="timeline">
                  {history.map((line, idx) => {
                    const isSuccess = line.includes('成功') || line.includes('完了') || line.includes('更新はありませんでした');
                    const isError = line.includes('エラー') || line.includes('失敗');
                    const time = line.match(/\[(.*?)\]/)?.[1] || '';
                    const message = line.replace(/\[.*?\]\s*/, '');
                    
                    return (
                      <div key={idx} className="timeline-item">
                        <div className={`timeline-icon ${isError ? 'bg-red' : (isSuccess ? 'bg-green' : 'bg-gray')}`}>
                          {isError ? <AlertCircle size={14} /> : (isSuccess ? <CheckCircle2 size={14} /> : <Terminal size={14} />)}
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-time">{time}</div>
                          <div className="timeline-msg">{message}</div>
                        </div>
                      </div>
                    );
                  })}
                  {history.length === 0 && <p className="text-center py-4 opacity-50">履歴がありません</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .admin-page {
          display: flex;
          min-height: 100vh;
          background-color: #0f172a;
          color: #f8fafc;
          font-family: 'Inter', sans-serif;
        }

        /* Sidebar */
        .admin-sidebar {
          width: 260px;
          background: #1e293b;
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
        }
        .sidebar-header {
          padding: 2rem;
        }
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 800;
          font-size: 1.25rem;
          color: var(--primary);
          letter-spacing: -0.025em;
        }
        .sidebar-nav {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          color: #94a3b8;
          font-weight: 600;
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
        }
        .nav-item:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }
        .nav-item.active {
          background: var(--primary);
          color: white;
        }
        .nav-item.logout {
          margin-top: auto;
          color: #ef4444;
        }

        /* Main Content */
        .admin-main {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
        }
        .header-info h1 {
          font-size: 1.875rem;
          font-weight: 800;
          margin-bottom: 0.25rem;
        }
        .header-info p {
          color: #94a3b8;
        }

        /* Status Badge */
        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 800;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-online .status-dot { background: #10b981; box-shadow: 0 0 10px #10b981; }
        .status-offline .status-dot { background: #ef4444; }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        /* Card Layout */
        .admin-content-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }
        .card {
          background: #1e293b;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .card-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .card-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Table */
        .table-container { padding: 0.5rem; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 1rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.03); }
        th { font-size: 0.75rem; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
        .font-mono { font-family: 'JetBrains Mono', monospace; color: var(--primary); }

        /* Timeline */
        .timeline-container { padding: 1.5rem; max-height: 600px; overflow-y: auto; }
        .timeline { position: relative; }
        .timeline-item { position: relative; padding-left: 2rem; margin-bottom: 1.5rem; }
        .timeline-item::before {
          content: '';
          position: absolute;
          left: 7px;
          top: 20px;
          bottom: -15px;
          width: 2px;
          background: rgba(255,255,255,0.05);
        }
        .timeline-item:last-child::before { display: none; }
        .timeline-icon {
          position: absolute;
          left: 0;
          top: 0;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }
        .bg-green { background: #10b981; }
        .bg-red { background: #ef4444; }
        .bg-gray { background: #64748b; }
        .timeline-time { font-size: 0.7rem; color: #64748b; margin-bottom: 0.25rem; }
        .timeline-msg { font-size: 0.875rem; line-height: 1.4; color: #cbd5e1; }

        /* Login */
        .admin-login-container {
          min-height: 100vh;
          background: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }
        .admin-login-card {
          background: #1e293b;
          padding: 3rem;
          border-radius: 24px;
          text-align: center;
          width: 100%;
          max-width: 400px;
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .admin-login-icon {
          width: 80px;
          height: 80px;
          background: rgba(226, 4, 18, 0.1);
          color: var(--primary);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
        }
        .admin-login-card h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; }
        .admin-login-card p { color: #64748b; margin-bottom: 2rem; }
        input {
          width: 100%;
          padding: 1rem;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          text-align: center;
          letter-spacing: 0.5em;
          margin-bottom: 1rem;
        }
        .login-button {
          width: 100%;
          padding: 1rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 800;
          cursor: pointer;
        }
        .error-message { color: #ef4444; font-size: 0.875rem; margin-bottom: 1rem; }

        /* Utils */
        .text-blue { color: #3b82f6; }
        .text-purple { color: #a855f7; }
        .text-green { color: #10b981; }

        @media (max-width: 1024px) {
          .admin-content-layout { grid-template-columns: 1fr; }
          .admin-sidebar { display: none; }
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="card" 
    style={{ margin: 0, padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}
  >
    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
      {icon}
    </div>
    <div>
      <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{sub}</div>
    </div>
  </motion.div>
);

export default AdminPortal;
