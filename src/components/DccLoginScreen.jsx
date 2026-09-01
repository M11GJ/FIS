import { AlertTriangle, KeyRound, RefreshCw, ShieldCheck } from 'lucide-react';
import { useDccAuth } from '../auth/DccAuthContext';

export default function DccLoginScreen() {
  const { status, error, isConfigured, login, clearError } = useDccAuth();

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '55vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.75rem' }} />
          <div>DCC Loginを確認しています…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '2rem 1rem' }}>
      <section className="glass-panel" style={{ width: 'min(100%, 480px)', padding: '2rem' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent-light)', color: 'var(--primary)', display: 'grid', placeItems: 'center', marginBottom: '1.25rem' }}>
          <ShieldCheck size={30} />
        </div>
        <h2 style={{ margin: '0 0 0.75rem', color: 'var(--text-main)' }}>DCC Loginで本人確認</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          単位チェックと今後のデータ連携は個人情報を扱うため、DCC部員向け共通ログインを使用します。
          DCC Discordサーバーへの所属と <strong>@member</strong> ロールが必要です。
        </p>

        {error && (
          <div style={{ display: 'flex', gap: '0.65rem', padding: '0.9rem', borderRadius: 8, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.9rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <div>
              {error}
              <button onClick={clearError} style={{ display: 'block', marginTop: '0.4rem', border: 0, padding: 0, background: 'transparent', color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>
                メッセージを閉じる
              </button>
            </div>
          </div>
        )}

        {!isConfigured && (
          <div style={{ display: 'flex', gap: '0.65rem', padding: '0.9rem', borderRadius: 8, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#92400e', marginBottom: '1rem', fontSize: '0.9rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            DCC LoginのクライアントIDが未設定です。管理者が連携アプリを登録する必要があります。
          </div>
        )}

        <button
          type="button"
          disabled={!isConfigured}
          onClick={() => login(window.location.hash || '#/info/checker')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.9rem 1rem', borderRadius: 8, border: 0, background: isConfigured ? 'var(--primary)' : 'var(--border)', color: isConfigured ? 'white' : 'var(--text-muted)', fontWeight: 800, cursor: isConfigured ? 'pointer' : 'not-allowed' }}
        >
          <KeyRound size={20} />
          DCC Loginでログイン
        </button>

        <p style={{ margin: '1rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          FISがDiscordやパスキーの認証情報を受け取ることはありません。認証は id.shu-dcc.net 上で行われます。
        </p>
      </section>
    </div>
  );
}
