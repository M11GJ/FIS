import React, { useMemo } from 'react';
import handbookData from '../data/handbook.json';
import coursesData from '../data/courses.json';
import { formatTerm } from '../utils/formatTerm';
import { BookOpen, Calendar, GraduationCap, ListTree, Hash } from 'lucide-react';

function Handbook() {
  const groupedCourses = useMemo(() => {
    const groups = {
      general: { id: 'cat-general', title: '総合科目', courses: [] },
      basic: { id: 'cat-basic', title: '学科基礎科目等', courses: [] },
      exercise: { id: 'cat-exercise', title: '演習・ゼミ等', courses: [] },
      teaching: { id: 'cat-teaching', title: '教職課程関連', courses: [] },
    };
    coursesData.forEach(c => {
      if (groups[c.category]) {
        groups[c.category].courses.push(c);
      } else {
        groups.general.courses.push(c);
      }
    });
    return groups;
  }, []);

  return (
    <div className="handbook-page" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        {/* 3つのポリシー Section */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraduationCap size={24} /> 3つのポリシー
          </h2>
          <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1rem' }}>
            {handbookData.policies.map((policy, idx) => (
              <div key={idx} style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                  {policy.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', whiteSpace: 'pre-line', fontSize: '0.9rem' }}>{policy.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* 学期の考え方 Section */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={24} /> {handbookData.semesters.title}
            </h2>
            <p style={{ color: 'var(--text-muted)', background: 'var(--surface-hover)', padding: '1rem', borderRadius: '8px' }}>
              {handbookData.semesters.content}
            </p>
          </div>

          {/* 専門ゼミ・卒業論文 Section */}
          <div className="glass-panel" style={{ flexGrow: 1 }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={24} /> {handbookData.seminars.title}
            </h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {handbookData.seminars.timeline.map((item, idx) => (
                <li key={idx} style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flexShrink: 0, background: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
                    {item.year}
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>{item.event}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 総合的な科目一覧 Section */}
      <div className="glass-panel" style={{ padding: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.8rem' }}>
          <ListTree size={32} /> 授業科目 シラバス一覧
        </h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }}>
          {Object.values(groupedCourses).map(group => (
            <button 
              key={group.id} 
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(group.id);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                background: 'var(--surface-hover)', border: '1px solid var(--border)', 
                color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.2s', cursor: 'pointer'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--border)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--surface-hover)'}
            >
              <Hash size={14} /> {group.title} <span style={{opacity: 0.8}}>({group.courses.length})</span>
            </button>
          ))}
        </div>

        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', padding: '1rem', background: 'var(--surface-hover)', borderRadius: '8px' }}>
          本学で開講されているすべての授業の総合リストです。「◎」は必修、「〇」はプログラム必修・選択等を示します。
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          {Object.values(groupedCourses).map(group => (
            <div key={group.title} id={group.id} style={{ scrollMarginTop: '100px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 700 }}>
                  {group.title}
                </h3>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', background: 'var(--surface-hover)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                  {group.courses.length} 講義
                </span>
              </div>
              
              <div className="course-table-wrapper">
                <table className="course-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>授業科目名</th>
                      <th style={{ width: '15%' }}>配当学期</th>
                      <th style={{ width: '15%' }}>単位数</th>
                      <th style={{ width: '30%' }}>備考・指定</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.courses.map(course => (
                      <tr key={course.id}>
                        <td style={{ fontWeight: 600 }}>{course.name}</td>
                        <td>
                          <span className="badge" style={{ background: 'var(--surface-hover)', color: 'var(--text-main)', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                            {formatTerm(course.term)}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                            {course.credits}単位
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {course.required && <span className="badge req" style={{ padding: '0.3rem 0.6rem' }}>必修</span>}
                            {course.marks && course.marks !== "◎" && (
                              <span className="badge" style={{ background: 'var(--border)', color: 'var(--text-main)', padding: '0.3rem 0.6rem' }}>
                                {course.marks.replace(/ /g, ' / ')}
                              </span>
                            )}
                            {!course.required && !course.marks && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Handbook;
