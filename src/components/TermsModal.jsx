import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Book, MapPinOff, X } from 'lucide-react';

const TermsModal = ({ onAgree, viewOnly = false }) => {
  const [canAgree, setCanAgree] = useState(viewOnly);
  const [isStudent, setIsStudent] = useState(viewOnly);
  const contentRef = useRef(null);

  const handleScroll = () => {
    if (viewOnly) return;
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      // If user scrolled to the bottom (with a small 10px buffer)
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setCanAgree(true);
      }
    }
  };

  useEffect(() => {
    if (viewOnly) {
      setCanAgree(true);
      setIsStudent(true);
      return;
    }
    // Check if the content is short enough that it doesn't need scrolling
    if (contentRef.current) {
      const { scrollHeight, clientHeight } = contentRef.current;
      if (scrollHeight <= clientHeight) {
        setCanAgree(true);
      }
    }
  }, [viewOnly]);

  return (
    <div className="modal-overlay" style={{ zIndex: 9999, backdropFilter: 'blur(8px)' }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '600px', 
          width: '90%', 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', position: 'relative' }}>
          <h2 style={{ color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem' }}>
            <ShieldCheck size={28} />
            利用規約 および プライバシーポリシー
          </h2>
          {viewOnly && (
            <button 
              onClick={onAgree} 
              style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={24} />
            </button>
          )}
        </div>
        
        <div 
          className="modal-body" 
          ref={contentRef}
          onScroll={handleScroll}
          style={{ 
            padding: '1.5rem', 
            overflowY: 'auto', 
            flex: 1, 
            lineHeight: 1.7, 
            color: 'var(--text-main)',
            fontSize: '0.95rem'
          }}
        >
          <p style={{ marginBottom: '1.5rem', fontWeight: 'bold' }}>
            「周南公立大学 卒業要件ポータル」（以下、本ツール）をご利用いただく前に、以下の利用規約およびプライバシーポリシーを必ず最後までお読みいただき、同意の上でご利用ください。
          </p>

          <div style={{ padding: '0.5rem 1rem', background: 'var(--surface-hover)', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>【 利用規約 】</h3>
            
            <section style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                <ShieldCheck size={18} color="var(--primary)" />
                1. 利用対象者
              </h4>
              <p style={{ fontSize: '0.9rem' }}>
                本ツールの利用は、<strong>周南公立大学に在籍する学生および教職員</strong>に限られます。それ以外の方のご利用はご遠慮ください。
              </p>
            </section>

            <section style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                <AlertTriangle size={18} color="var(--primary)" />
                2. 本ツールの位置づけと免責事項
              </h4>
              <p style={{ fontSize: '0.9rem' }}>
                本ツールは、学生が独自に開発した<strong>非公式の支援ツール</strong>であり、周南公立大学が公式に提供・保証するシステムではありません。<br/>
                本ツールが示す判定結果は参考情報です。<strong>最終的な卒業要件の確認および履修登録については、必ず各自の責任において、大学公式の「学生便覧」および「学務課」の案内に基づいて行ってください。</strong>本ツールの利用により生じたいかなる不利益や損害についても、開発者は一切の責任を負いかねます。
              </p>
            </section>
          </div>

          <div style={{ padding: '0.5rem 1rem', background: 'rgba(22, 163, 74, 0.05)', borderRadius: '8px', borderLeft: '4px solid #16a34a', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>【 プライバシーポリシー 】</h3>
            
            <section style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                <ShieldCheck size={18} color="#16a34a" />
                1. データの完全ローカル処理（外部送信なし）
              </h4>
              <p style={{ fontSize: '0.9rem' }}>
                本ツールに入力された成績データやチェック状況は、すべて<strong>利用者自身の端末（スマートフォンやPCのブラウザ内）でのみ計算・処理</strong>されます。成績データがインターネット上のサーバー（GitHub等）に送信されたり、保存されたりすることは一切ありませんので、情報漏洩の心配なく安全にご利用いただけます。
              </p>
            </section>

            <section style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                <MapPinOff size={18} color="#16a34a" />
                2. セキュリティリスクへの配慮
              </h4>
              <p style={{ fontSize: '0.9rem' }}>
                防犯およびプライバシー保護の観点から、教員や学生の居場所を特定できる可能性のある<strong>講義室番号や時間割の物理的な場所に関する情報は、システム内に一切保持・表示いたしません</strong>。
              </p>
            </section>

            <section style={{ marginBottom: '1rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                <Book size={18} color="#16a34a" />
                3. 利用環境のログ収集について
              </h4>
              <p style={{ fontSize: '0.9rem' }}>
                サービスの利便性向上やエラー把握を目的として、アクセスされた端末のブラウザ情報やアクセス状況を収集する場合がありますが、個人や成績を特定できる情報は含まれません。
              </p>
            </section>
          </div>
        </div>

        <div className="modal-footer" style={{ 
          padding: '1.5rem', 
          borderTop: '1px solid var(--border)', 
          background: 'var(--surface-hover)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'center'
        }}>
          {!viewOnly && (
            <div style={{ width: '100%', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 600, color: 'var(--text-main)' }}>
                <input 
                  type="checkbox" 
                  checked={isStudent} 
                  onChange={(e) => setIsStudent(e.target.checked)} 
                  style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                />
                私は周南公立大学に在籍する学生、または教職員です。
              </label>
            </div>
          )}

          {!canAgree && !viewOnly && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ※規約を一番下までスクロールすると同意できるようになります。
            </div>
          )}
          <button 
            onClick={onAgree}
            disabled={!canAgree || !isStudent}
            style={{
              width: '100%', 
              padding: '1rem', 
              background: (canAgree && isStudent) ? 'var(--primary)' : 'var(--border)', 
              color: (canAgree && isStudent) ? 'white' : 'var(--text-muted)',
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 800, 
              fontSize: '1rem',
              cursor: (canAgree && isStudent) ? 'pointer' : 'not-allowed', 
              transition: 'all 0.2s',
              opacity: (canAgree && isStudent) ? 1 : 0.7
            }}
          >
            {viewOnly ? "閉じる" : "以上の利用規約およびプライバシーポリシーに同意して利用する"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
