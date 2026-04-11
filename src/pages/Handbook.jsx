import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import handbookInfo from '../data/handbook_info.json';
import handbookEcon from '../data/handbook_econ.json';
import coursesInfo from '../data/courses_info.json';
import coursesEcon from '../data/courses_economics.json';
import { formatTerm } from '../utils/formatTerm';
import { BookOpen, Calendar, GraduationCap, ListTree, Hash, AlertTriangle } from 'lucide-react';

function Handbook() {
  const { faculty: facultyId = 'info' } = useParams();
  
  const hData = facultyId === 'econ' ? handbookEcon : handbookInfo;
  const cData = facultyId === 'econ' ? coursesEcon : coursesInfo;

  const groupedCourses = useMemo(() => {
    const groups = facultyId === 'econ' ? {
      general: { id: 'cat-general', title: '総合科目', courses: [] },
      specialized_basic: { id: 'cat-spec-basic', title: '専門基礎科目', courses: [] },
      specialized: { id: 'cat-spec', title: '専門科目', courses: [] },
      other_dept: { id: 'cat-other-dept', title: '他学科科目', courses: [] },
      teaching: { id: 'cat-teaching', title: '教職課程', courses: [] },
    } : {
      general: { id: 'cat-general', title: '総合科目', courses: [] },
      basic: { id: 'cat-basic', title: '学科基礎科目等', courses: [] },
      program: { id: 'cat-program', title: 'プログラム科目', courses: [] },
      exercise: { id: 'cat-exercise', title: '演習・ゼミ等', courses: [] },
      other: { id: 'cat-other', title: '他学科専門科目', courses: [] },
      teaching: { id: 'cat-teaching', title: '教職課程関連', courses: [] },
    };

    cData.forEach(c => {
      if (groups[c.category]) {
        groups[c.category].courses.push(c);
      } else {
        groups.general.courses.push(c);
      }
    });

    Object.values(groups).forEach(group => {
      group.courses.sort((a, b) => {
        const getRank = (c) => {
          if (c.marks?.includes('◎')) return 0;
          if (c.category !== 'program' && c.required) return 0;
          if (c.marks?.includes('〇')) return 1;
          return 2;
        };
        const rankA = getRank(a);
        const rankB = getRank(b);
        if (rankA !== rankB) return rankA - rankB;

        // 第2優先順位: ABCD群 / 専門区分の順序
        const subRank = { 
          'intro': 1, 'A': 2, 'B': 3, 'C': 4, 'D': 5, 'intl': 6,
          'econ': 7, 'mgmt': 8, 'global': 9, 'region': 10, 
          'law': 11, 'exercise': 12 
        };
        const sRankA = subRank[a.subCategory] || 99;
        const sRankB = subRank[b.subCategory] || 99;
        if (sRankA !== sRankB) return sRankA - sRankB;

        return 0;
      });
    });
    return groups;
  }, [facultyId, cData]);

  return (
    <div className="handbook-page" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ベータ版警告（経済経営学部のみ） */}
      {facultyId === 'econ' && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
          <AlertTriangle color="#d97706" size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ color: '#92400e', margin: '0 0 0.4rem 0', fontSize: '1rem', fontWeight: 800 }}>
              ベータ版に関するご注意
            </h4>
            <p style={{ color: '#92400e', margin: 0, fontSize: '0.875rem', lineHeight: 1.6 }}>
              経済経営学部の便覧データおよび卒業判定ロジックは現在ベータ版です。
              内容に一部誤りがある可能性があるため、最終的な確認は必ずお手元の学生便覧（PDF等）に基づいて行ってください。
            </p>
          </div>
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        {/* 3つのポリシー Section */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraduationCap size={24} /> 3つのポリシー
          </h2>
          <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1rem' }}>
            {hData.policies.map((policy, idx) => (
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
              <Calendar size={24} /> {hData.semesters.title}
            </h2>
            <p style={{ color: 'var(--text-muted)', background: 'var(--surface-hover)', padding: '1rem', borderRadius: '8px' }}>
              {hData.semesters.content}
            </p>
          </div>

          {/* 専門ゼミ・卒業論文 Section */}
          <div className="glass-panel" style={{ flexGrow: 1 }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={24} /> {hData.seminars.title}
            </h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {hData.seminars.timeline.map((item, idx) => (
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
                            <span className="badge" style={{ background: 'var(--surface-hover)', color: 'var(--text-main)', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                              {formatTerm(course.term)}
                            </span>
                            {course.schedule && (
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginLeft: '0.2rem' }}>
                                {course.schedule}
                              </span>
                            )}
                            {course.room && course.room !== 'オンデマンド' && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>
                                {course.room}教室
                              </span>
                            )}
                            {course.instructor && course.category !== 'teaching' && course.category !== 'exercise' && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.2rem', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: '0.2rem', marginTop: '0.2rem' }}>
                                {course.instructor}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="badge">
                            {course.credits !== null ? `${course.credits}単位` : 'ー'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {course.required && <span className="badge req" style={{ padding: '0.3rem 0.6rem' }}>必修</span>}
                            {facultyId === 'info' && course.category === 'program' && course.programMapping?.ds === '必修' && <span className="badge req" style={{ padding: '0.3rem 0.6rem' }}>DS必修</span>}
                            {facultyId === 'info' && course.category === 'program' && course.programMapping?.ie === '必修' && <span className="badge req" style={{ padding: '0.3rem 0.6rem' }}>IE必修</span>}
                            {facultyId === 'info' && course.category === 'program' && course.programMapping?.ba === '必修' && <span className="badge req" style={{ padding: '0.3rem 0.6rem' }}>BA必修</span>}
                            {course.subCategory && (
                              <span className="badge" style={{ 
                                background: 'var(--surface-hover)', 
                                border: '1px solid var(--primary)', 
                                color: 'var(--primary)',
                                padding: '0.3rem 0.6rem',
                                fontWeight: '600'
                              }}>
                                {facultyId === 'econ' ? (
                                  <>
                                    {course.subCategory === 'A' && 'A群'}
                                    {course.subCategory === 'B' && 'B群'}
                                    {course.subCategory === 'C' && 'C群'}
                                    {course.subCategory === 'D' && 'D群'}
                                    {course.subCategory === 'intro' && '入門'}
                                    {course.subCategory === 'econ' && '経済系統'}
                                    {course.subCategory === 'mgmt' && '経営系統'}
                                    {course.subCategory === 'global' && 'グローバル'}
                                    {course.subCategory === 'region' && '地域デザイン'}
                                    {course.subCategory === 'law' && '法学科目'}
                                    {course.subCategory === 'exercise' && '演習科目'}
                                    {course.subCategory === 'intl' && '留学生'}
                                    {!['A','B','C','D','intro','econ','mgmt','global','region','law','exercise','intl'].includes(course.subCategory) && course.subCategory}
                                  </>
                                ) : (
                                  course.subCategory
                                )}
                              </span>
                            )}
                            {course.marks && !course.marks.includes('◎') && (
                              <span className="badge" style={{ background: 'var(--border)', color: 'var(--text-main)', padding: '0.3rem 0.6rem' }}>
                                {course.marks.replace(/ /g, ' / ')}
                              </span>
                            )}
                            {!course.required && !course.marks && !course.subCategory && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>}
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
