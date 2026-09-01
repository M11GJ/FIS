import DccLoginScreen from './DccLoginScreen';
import { useDccAuth } from '../auth/DccAuthContext';

export default function RequireDccLogin({ children }) {
  const { status, isAuthenticated, user, logout } = useDccAuth();
  if (status !== 'ready' || !isAuthenticated) return <DccLoginScreen />;
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <span>DCC Login: {user?.preferred_username || user?.name || '認証済み'}</span>
        <button type="button" onClick={logout} style={{ border: '1px solid var(--border)', borderRadius: 999, background: 'var(--surface)', color: 'var(--text-main)', padding: '0.3rem 0.65rem', cursor: 'pointer', fontSize: '0.75rem' }}>
          ログアウト
        </button>
      </div>
      {children}
    </>
  );
}
