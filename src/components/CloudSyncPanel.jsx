import { useState } from 'react';
import { Cloud, Download, LogIn, LogOut, Save, Trash2 } from 'lucide-react';
import { useDccAuth } from '../auth/DccAuthContext';

const profileEndpoint = `${import.meta.env.BASE_URL}api/me/course-profile`;

export default function CloudSyncPanel({ entryYear, program, selectedCourses, onLoadProfile }) {
  const auth = useDccAuth();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const request = async (method, body) => {
    const token = auth.getAccessToken();
    if (!token) throw new Error('認証の有効期限が切れました。もう一度ログインしてください。');
    const response = await fetch(profileEndpoint, {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    if (response.status === 204) return null;
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 404) throw new Error('保存済みの履修情報はありません。');
      throw new Error(result.error || `クラウド操作に失敗しました (${response.status})`);
    }
    return result;
  };

  const run = async operation => {
    setBusy(true);
    setMessage('');
    try {
      await operation();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
      setConfirmation(null);
    }
  };

  if (auth.status === 'loading') return null;

  return (
    <div style={{ marginBottom: '1.25rem', padding: '0.9rem', borderRadius: '8px', background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
        <Cloud size={18} color="var(--primary)" /> 任意のクラウド保存
      </div>

      {!auth.isAuthenticated ? (
        <>
          <p style={{ margin: '0 0 0.7rem', color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.5 }}>
            端末をまたいで履修情報を使う場合だけDCC Loginで連携します。ログインしても自動送信はしません。
          </p>
          <button type="button" disabled={!auth.isConfigured || busy} onClick={() => auth.login(window.location.hash)} style={buttonStyle(true)}>
            <LogIn size={15} /> DCC Loginで連携
          </button>
          {!auth.isConfigured && <small style={{ display: 'block', color: '#b45309', marginTop: '0.5rem' }}>運用側でDCC LoginのClient ID設定が必要です。</small>}
        </>
      ) : (
        <>
          <p style={{ margin: '0 0 0.7rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            {auth.user?.name || auth.user?.preferred_username || 'DCC部員'}として連携中。保存対象は入学年度・プログラム・選択科目IDだけです。
          </p>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button type="button" disabled={busy} onClick={() => run(async () => {
              const stored = await request('GET');
              onLoadProfile(stored.profile);
              setMessage('クラウドの履修情報をこの画面へ読み込みました。');
            })} style={buttonStyle(false)}><Download size={15} /> 読み込む</button>
            <button type="button" disabled={busy} onClick={() => setConfirmation('save')} style={buttonStyle(true)}><Save size={15} /> 保存する</button>
            <button type="button" disabled={busy} onClick={() => setConfirmation('delete')} style={buttonStyle(false)}><Trash2 size={15} /> 削除</button>
            <button type="button" disabled={busy} onClick={auth.logout} style={buttonStyle(false)}><LogOut size={15} /> ログアウト</button>
          </div>
        </>
      )}

      {confirmation === 'save' && (
        <Confirm text="現在の画面内容でクラウドデータを上書きします。" actionLabel="上書き保存" onCancel={() => setConfirmation(null)} onConfirm={() => run(async () => {
          await request('PUT', { facultyId: 'info', entryYear, program, courseIds: [...selectedCourses] });
          setMessage('クラウドへ保存しました。');
        })} />
      )}
      {confirmation === 'delete' && (
        <Confirm text="DCCアカウントに紐づくクラウドデータを削除します。端末内の選択は残ります。" actionLabel="クラウドデータを削除" danger onCancel={() => setConfirmation(null)} onConfirm={() => run(async () => {
          await request('DELETE');
          setMessage('クラウドデータを削除しました。');
        })} />
      )}
      {(message || auth.error) && <div style={{ marginTop: '0.65rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>{message || auth.error}</div>}
    </div>
  );
}

function Confirm({ text, actionLabel, danger = false, onCancel, onConfirm }) {
  return (
    <div style={{ marginTop: '0.75rem', padding: '0.65rem', border: `1px solid ${danger ? '#ef4444' : 'var(--primary)'}`, borderRadius: '6px', fontSize: '0.76rem' }}>
      <div style={{ marginBottom: '0.55rem' }}>{text}</div>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <button type="button" onClick={onConfirm} style={buttonStyle(true, danger)}>{actionLabel}</button>
        <button type="button" onClick={onCancel} style={buttonStyle(false)}>キャンセル</button>
      </div>
    </div>
  );
}

function buttonStyle(primary, danger = false) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.45rem 0.65rem',
    borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600,
    background: primary ? (danger ? '#dc2626' : 'var(--primary)') : 'var(--surface)',
    color: primary ? 'white' : 'var(--text-muted)', fontSize: '0.74rem',
  };
}
