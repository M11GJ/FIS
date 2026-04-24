import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useSearchParams } from 'react-router-dom';
import coursesInfo from '../data/courses_info.json';
import coursesEcon from '../data/courses_economics.json';
import { useGraduationCheck } from '../hooks/useGraduationCheck';
import { formatTerm } from '../utils/formatTerm';
import { isCourseActiveInQuarter } from '../utils/parseSchedule';
import { mergeRooms } from '../utils/mergeRooms';
import { CheckCircle2, AlertCircle, ChevronDown, ChevronRight, ClipboardPaste, Layout, Calendar, Share2, Info, AlertTriangle } from 'lucide-react';
import Timetable from '../components/Timetable';

const ProgressBar = ({ label, current, target, minRequiredLabel, missingList, detail, subStatus, color }) => {
  const percent = target ? Math.min(100, (current / target) * 100) : 0;
  const isOk = target ? (current >= target && (!missingList || missingList.length === 0)) : false;
  
  return (
    <div className="progress-container" style={{ marginBottom: missingList && missingList.length > 0 ? '2rem' : '1.5rem' }}>
      <div className="progress-labels">
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {label} 
          {minRequiredLabel && <span style={{fontSize: '0.75rem', opacity: 0.7}}>({minRequiredLabel})</span>}
          {detail && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>{detail}</span>}
        </span>
        <strong>{current}{target ? ` / ${target}` : ''} 単位</strong>
      </div>
      <div className="progress-track" style={{ background: 'var(--border)' }}>
        <div 
          className={`progress-fill ${isOk ? 'success' : ''}`} 
          style={{ 
            width: target ? `${percent}%` : '0%', 
            background: isOk ? '#10B981' : (color || 'var(--primary)') 
          }}
        />
      </div>
      {subStatus && subStatus.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
          {subStatus.map((ss, idx) => (
            <div key={idx} style={{ 
              fontSize: '0.7rem', 
              padding: '0.1rem 0.5rem', 
              borderRadius: '12px', 
              background: ss.ok ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              color: ss.ok ? '#059669' : 'var(--text-muted)',
              border: `1px solid ${ss.ok ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}>
              {ss.ok && <CheckCircle2 size={10} />}
              <span>{ss.label}: {ss.current}/{ss.target}</span>
            </div>
          ))}
        </div>
      )}
      {missingList && missingList.length > 0 && (
        <div style={{ marginTop: '0.5rem', color: '#EF4444', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>不足している必修: {missingList.join(', ')}</span>
        </div>
      )}
    </div>
  );
};

const getYear = (termStr) => {
  const match = termStr && termStr.match(/^(\d)/);
  return match ? `${match[1]}年` : 'その他';
};

// 科目名の正規化（AAA読み込みの安定性向上・名称変更対応）
const normalizeCourseName = (name) => {
  if (!name) return '';
  return name.replace(/\s+/g, '')
             .replace(/[（）()]/g, '')
             .replace(/[ⅠI]/g, '1')
             .replace(/[ⅡII]/g, '2')
             .replace(/[ⅢIII]/g, '3')
             .replace('大学が独自に設定する科目', '')
             .replace('※通年', ''); // 経済学部便覧用
};

// URL共有用の固定順ソート済みリスト生成関数
const getSortedCourses = (courses) => [...courses].sort((a, b) => a.id.localeCompare(b.id));

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const encodeBits = (selectedIds, sortedCourses) => {
  let bits = '';
  sortedCourses.forEach(c => {
    bits += selectedIds.has(c.id) ? '1' : '0';
  });
  let encoded = '';
  for (let i = 0; i < bits.length; i += 6) {
    const segment = bits.substring(i, i + 6).padEnd(6, '0');
    encoded += B64_CHARS[parseInt(segment, 2)];
  }
  return encoded;
};

const decodeBits = (encoded, sortedCourses) => {
  let bits = '';
  for (let i = 0; i < encoded.length; i++) {
    const val = B64_CHARS.indexOf(encoded[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(6, '0');
  }
  
  const selectedIds = new Set();
  sortedCourses.forEach((c, index) => {
    if (bits[index] === '1') {
      selectedIds.add(c.id);
    }
  });
  return selectedIds;
};

const CourseAccordion = ({ title, courses, selectedCourses, handleToggle, program, enableYearFilter, onBatchToggle, facultyId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState('すべて');
  
  const selectedCount = courses.filter(c => selectedCourses.has(c.id)).length;

  const filteredCourses = useMemo(() => {
    let result = courses;
    if (enableYearFilter && selectedYear !== 'すべて') {
      result = courses.filter(c => getYear(c.term) === selectedYear);
    }
    
    const pKey = program.toLowerCase();
    const resultWithIndex = result.map((c, i) => ({ course: c, index: i }));
    
    resultWithIndex.sort((a, b) => {
      const aType = a.course.programMapping ? a.course.programMapping[pKey] : null;
      const bType = b.course.programMapping ? b.course.programMapping[pKey] : null;

      const getRank = (course, type) => {
        if (type === '必修') return 0;
        if (type === '選択') return 1;
        if (course.category !== 'program' && course.required) return 0;
        return 2;
      };

      const rankA = getRank(a.course, aType);
      const rankB = getRank(b.course, bType);

      if (rankA !== rankB) return rankA - rankB;

      // 第2優先順位: ABCD群 / 専門区分の順序
      const subRank = { 
        'intro': 1, 'A': 2, 'B': 3, 'C': 4, 'D': 5, 'intl': 6,
        'econ': 7, 'mgmt': 8, 'global': 9, 'region': 10, 
        'law': 11, 'exercise': 12,
        'econ_s': 7, 'mgmt_s': 8, 'global_s': 9, 'region_s': 10, 
        'law_s': 11, 'exercise_s': 12
      };
      const sRankA = subRank[a.course.subCategory] || 99;
      const sRankB = subRank[b.course.subCategory] || 99;
      if (sRankA !== sRankB) return sRankA - sRankB;

      return a.index - b.index;
    });
    
    return resultWithIndex.map(item => item.course);
  }, [courses, selectedYear, enableYearFilter, program]);

  const availableYears = useMemo(() => {
    if (!enableYearFilter) return [];
    const years = new Set(courses.map(c => getYear(c.term)));
    return ['すべて', '1年', '2年', '3年', '4年', 'その他'].filter(y => y === 'すべて' || years.has(y));
  }, [courses, enableYearFilter]);

  return (
    <div style={{ marginBottom: '1rem', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1rem', background: isOpen ? 'var(--surface-hover)' : 'var(--surface)', border: 'none', cursor: 'pointer',
          color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 600, transition: 'background 0.2s'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isOpen ? <ChevronDown size={20} color="var(--primary)" /> : <ChevronRight size={20} color="var(--text-muted)" />}
          {title}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
          {onBatchToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBatchToggle();
              }}
              style={{
                fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px',
                background: courses.every(c => selectedCourses.has(c.id)) ? 'var(--primary)' : 'var(--surface)',
                color: courses.every(c => selectedCourses.has(c.id)) ? 'white' : 'var(--text-muted)',
                border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s',
                fontWeight: 600
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; if (courses.every(c => selectedCourses.has(c.id))) e.currentTarget.style.color = 'white'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; if (!courses.every(c => selectedCourses.has(c.id))) e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              {courses.every(c => selectedCourses.has(c.id)) ? '全て解除' : '全て履修'}
            </button>
          )}
          <span style={{ fontSize: '0.85rem', color: selectedCount > 0 ? 'var(--primary)' : 'var(--text-muted)', background: selectedCount > 0 ? 'var(--accent-light)' : 'var(--border)', padding: '0.2rem 0.6rem', borderRadius: '12px', whiteSpace: 'nowrap' }}>
            {selectedCount} / {courses.length} 選択中
          </span>
        </span>
      </button>
      
      {isOpen && (
        <div style={{ padding: '1rem', background: 'var(--surface-hover)', borderTop: '1px solid var(--border)' }}>
          {enableYearFilter && availableYears.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              {availableYears.map(year => (
                <button 
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  style={{ 
                    padding: '0.35rem 0.8rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: selectedYear === year ? 'var(--primary)' : 'var(--surface)',
                    color: selectedYear === year ? 'white' : 'var(--text-main)',
                    boxShadow: selectedYear === year ? '0 2px 4px rgba(var(--primary-rgb), 0.2)' : 'none'
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '450px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {filteredCourses.map(course => {
              const pKey = program.toLowerCase();
              const pType = course.programMapping ? course.programMapping[pKey] : null;
              return (
              <label key={course.id} className="course-checkbox" style={{ 
                background: selectedCourses.has(course.id) ? 'var(--accent-light)' : 'var(--background)',
                border: `1px solid ${selectedCourses.has(course.id) ? 'var(--primary)' : 'var(--border)'}`
              }}>
                <input 
                  type="checkbox" 
                  checked={selectedCourses.has(course.id)}
                  onChange={() => handleToggle(course.id)}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.95rem', color: selectedCourses.has(course.id) ? 'var(--primary)' : 'var(--text-main)', fontWeight: selectedCourses.has(course.id) ? 600 : 400 }}>
                    {course.name}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                    {course.category !== 'program' && course.required && <span className="badge req" style={{ background: 'var(--primary)', color: 'white' }}>必修</span>}
                    {course.category === 'program' && pType === '必修' && <span className="badge req" style={{ background: 'var(--primary)', color: 'white' }}>{program}必修</span>}
                    {course.category === 'program' && pType === '選択' && <span className="badge" style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}>{program}選択</span>}
                    
                    {/* 経済学部の詳細区分バッジ */}
                    {facultyId === 'econ' && course.subCategory && (
                      <span className="badge" style={{ 
                        background: 'var(--surface-hover)', 
                        border: '1px solid var(--primary)', 
                        color: 'var(--primary)',
                        fontWeight: '600'
                      }}>
                        {course.subCategory === 'A' && 'A群'}
                        {course.subCategory === 'B' && 'B群'}
                        {course.subCategory === 'C' && 'C群'}
                        {course.subCategory === 'D' && 'D群'}
                        {course.subCategory === 'intro' && '入門'}
                        {(course.subCategory === 'econ' || course.subCategory === 'econ_s') && '経済系統'}
                        {(course.subCategory === 'mgmt' || course.subCategory === 'mgmt_s') && '経営系統'}
                        {(course.subCategory === 'global' || course.subCategory === 'global_s') && 'グローバル'}
                        {(course.subCategory === 'region' || course.subCategory === 'region_s') && '地域デザイン'}
                        {(course.subCategory === 'law' || course.subCategory === 'law_s') && '法学科目'}
                        {(course.subCategory === 'exercise' || course.subCategory === 'exercise_s') && '演習科目'}
                        {course.subCategory === 'intl' && '留学生'}
                        {!['A','B','C','D','intro','econ','econ_s','mgmt','mgmt_s','global','global_s','region','region_s','law','law_s','exercise','exercise_s','intl'].includes(course.subCategory) && course.subCategory}
                      </span>
                    )}

                    <span className="badge" style={{ background: 'var(--surface)' }}>{formatTerm(course.term)}</span>
                    {course.category !== 'teaching' && (
                      <span className="badge">
                        {course.credits !== null ? `${course.credits}単位` : 'ー'}
                      </span>
                    )}
                    {course.schedule && <span className="badge" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>{course.schedule}</span>}
                    {course.room && course.room !== 'オンデマンド' && <span className="badge" style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)' }}>{course.room}教室</span>}
                    {course.instructor && course.category !== 'teaching' && course.category !== 'exercise' && (
                      <span className="badge" style={{ background: 'transparent', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>
                        {course.instructor}
                      </span>
                    )}
                  </div>
                </div>
              </label>
            )})}
          </div>
          
          {filteredCourses.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
              該当する科目がありません
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const AutoImportPanel = ({ facultyId, selectedCourses, setSelectedCourses, coursesData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState('');

  const handleImport = () => {
    if (!importText.trim()) return;

    let importedCount = 0;
    const lines = importText.split('\n');
    const newSelected = new Set(selectedCourses);

    lines.forEach(line => {
      const parts = line.split('\t').map(s => s.trim());
      
      // AAAのコピー形式判定
      const hasBullet = parts.some(p => p.startsWith('◆')); // 文理共通
      if (!hasBullet && parts.length < 2) return;

      const courseNameRaw = parts.find(p => p.length > 2 && !p.startsWith('◆') && !'秀優良可不'.includes(p));
      if (!courseNameRaw) return;
      
      const isPassed = parts.some(p => ['秀', '優', '良', '可'].includes(p));
      const isFailed = parts.some(p => p === '不');

      if (isPassed && !isFailed) {
        const normalizedInput = normalizeCourseName(courseNameRaw);
        const course = coursesData.find(c => normalizeCourseName(c.name) === normalizedInput);
        
        if (course && !newSelected.has(course.id)) {
          newSelected.add(course.id);
          importedCount++;
        }
      }
    });

    setSelectedCourses(newSelected);
    setImportResult(`${importedCount} 件の合格科目を新たに自動チェックしました！🎉`);
    setImportText('');
  };

  return (
    <div style={{ marginBottom: '1.5rem', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '1rem', background: isOpen ? 'var(--surface-hover)' : 'var(--surface)', border: 'none', cursor: 'pointer',
          color: 'var(--primary)', fontSize: '1rem', fontWeight: 600, transition: 'background 0.2s'
        }}
      >
        <ClipboardPaste size={20} /> 成績システム (AAA) から自動読み込み
        <span style={{ marginLeft: 'auto' }}>
          {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </span>
      </button>
      
      {isOpen && (
        <div style={{ padding: '1rem', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            AAAなどの教務システムで成績一覧の表をコピーし、下のテキストボックスに貼り付けてください。「秀・優・良・可」の授業のみが自動判別されます。
          </p>
          <textarea 
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={"◆ リテラシー科目群 ◆	コミュニケーション英語Ⅰ	...	秀\n..."}
            style={{ 
              width: '100%', height: '120px', padding: '0.75rem', borderRadius: '6px', 
              border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)',
              resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem', marginBottom: '1rem'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button 
              onClick={handleImport}
              style={{
                background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1.5rem',
                borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = 0.9}
              onMouseOut={e => e.currentTarget.style.opacity = 1}
            >
              読み込み実行
            </button>
            {importResult && (
              <span style={{ color: '#10B981', fontWeight: 600, fontSize: '0.9rem' }}>
                {importResult}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function Checker() {
  const { faculty: facultyParam } = useParams();
  const [searchParams] = useSearchParams();
  const facultyId = facultyParam || 'info';
  
  const coursesData = useMemo(() => {
    const raw = facultyId === 'econ' ? coursesEcon : coursesInfo;
    return mergeRooms(raw);
  }, [facultyId]);

  const sortedCourses = useMemo(() => getSortedCourses(coursesData), [coursesData]);

  const [selectedCourses, setSelectedCourses] = useState(new Set());
  const [program, setProgram] = useState('DS');
  const [activeTab, setActiveTab] = useState('progress');
  const [shareCopied, setShareCopied] = useState(false);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);

  // URL共有データの復元
  useEffect(() => {
    const sParam = searchParams.get('s');
    const pParam = searchParams.get('p');

    if (pParam) {
      setProgram(pParam.toUpperCase());
    }

    if (sParam) {
      try {
        const decodedSet = decodeBits(sParam, sortedCourses);
        if (decodedSet.size > 0) {
          setSelectedCourses(decodedSet);
        }
      } catch (err) {
        console.error('Failed to decode share URL:', err);
      }
    }
  }, [searchParams, sortedCourses]);

  const handleToggle = (id) => {
    setSelectedCourses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchToggleCategory = (courses) => {
    setSelectedCourses(prev => {
      const next = new Set(prev);
      const allSelected = courses.every(c => next.has(c.id));
      
      if (allSelected) {
        courses.forEach(c => next.delete(c.id));
      } else {
        courses.forEach(c => next.add(c.id));
      }
      return next;
    });
  };

  const handleBatchSelectMandatory = (targetYear = null, targetQuarter = null) => {
    const mandatoryFullList = coursesData.filter(course => {
      if (targetYear && targetQuarter) {
        if (!isCourseActiveInQuarter(course.term, targetYear, targetQuarter)) return false;
      } else if (targetYear) {
        if (!course.term.startsWith(targetYear.toString())) return false;
      }

      if (facultyId === 'info') {
        const isProgramCourse = course.category === 'program';
        const isProgramMandatory = isProgramCourse && 
                                  course.programMapping && 
                                  course.programMapping[program.toLowerCase()] === '必修';
        const isGlobalMandatory = !isProgramCourse && course.required === true;
        return isGlobalMandatory || isProgramMandatory;
      } else {
        // 経済学部はフラグのみ
        return course.required === true;
      }
    });

    const mandatoryIds = mandatoryFullList.map(c => c.id);
    if (mandatoryIds.length === 0) return;

    setSelectedCourses(prev => {
      const next = new Set(prev);
      let shouldUnregister = false;
      if (targetYear && targetQuarter) {
        const specificIds = mandatoryFullList.filter(c => !c.term.includes('通')).map(c => c.id);
        if (specificIds.length > 0) {
          shouldUnregister = specificIds.every(id => next.has(id));
        } else {
          shouldUnregister = mandatoryIds.every(id => next.has(id));
        }
      } else {
        shouldUnregister = mandatoryIds.every(id => next.has(id));
      }
      
      if (shouldUnregister) {
        mandatoryIds.forEach(id => next.delete(id));
      } else {
        mandatoryIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleShare = () => {
    const shardData = encodeBits(selectedCourses, sortedCourses);
    const p = program;
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}#/${facultyId}/checker?p=${p}&s=${shardData}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy URL:', err);
    });
  };

  const { status, missingCredits, missingList } = useGraduationCheck(facultyId, Array.from(selectedCourses), program, coursesData) || { status: null, missingCredits: 0 };

  const categories = useMemo(() => {
    if (facultyId === 'econ') {
      return [
        { key: 'general', title: '総合科目', filter: true },
        { key: 'specialized_basic', title: '専門基礎科目', filter: true },
        { key: 'specialized', title: '専門科目', filter: true },
        { key: 'other_dept', title: '他学科科目（自由科目枠）', filter: false },
        { key: 'teaching', title: '教職課程', filter: false },
      ];
    }
    return [
      { key: 'general', title: '総合科目', filter: true },
      { key: 'basic', title: '学科基礎科目', filter: true },
      { key: 'program', title: 'プログラム科目', filter: true },
      { key: 'exercise', title: '演習・ゼミ等', filter: false },
      { key: 'other', title: '他学科専門科目', filter: false },
      { key: 'teaching', title: '教職課程関連', filter: false },
    ];
  }, [facultyId]);

  if (!status) return <div style={{ padding: '2rem', textAlign: 'center' }}>読み込み中...</div>;

  return (
    <div className="dashboard-grid">
      {/* ベータ版警告（経済経営学部のみ） */}
      {facultyId === 'econ' && (
        <div style={{
          gridColumn: '1 / -1',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
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
              経済経営学部の卒業要件判定は現在調整中のため、判定結果や科目データに一部誤りがある可能性があります。
              最終的な卒業判定の確認は、必ずお手元の学生便覧および学務の案内に基づいて行ってください。
            </p>
          </div>
        </div>
      )}
      {/* Left Column: Input Panel */}
      <div className="glass-panel" style={{ height: 'fit-content' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border)', paddingBottom: '0.75rem' }}>
          <CheckCircle2 /> 修得科目を選択
        </h2>
        
        <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleShare}
            className="glass-button"
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.75rem', borderRadius: '8px', background: shareCopied ? '#10B981' : 'var(--accent-light)',
              color: shareCopied ? 'white' : 'var(--primary)', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.3s'
            }}
          >
            <Share2 size={18} />
            {shareCopied ? 'コピーしました！' : '現在の履修状況を共有'}
          </button>
        </div>

        <AutoImportPanel facultyId={facultyId} selectedCourses={selectedCourses} setSelectedCourses={setSelectedCourses} coursesData={coursesData} />

        {facultyId === 'info' && (
          <div style={{ marginBottom: '1.5rem', background: 'var(--surface-hover)', padding: '1rem', borderRadius: '8px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontWeight: 600 }}>所属プログラム</label>
            <select value={program} onChange={e => setProgram(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <option value="DS">データサイエンス (DS)</option>
              <option value="IE">情報エンジニアリング (IE)</option>
              <option value="BA">ビジネスアナリティクス (BA)</option>
            </select>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {categories.map(cat => (
            <CourseAccordion 
              key={cat.key} 
              title={cat.title} 
              courses={coursesData.filter(c => c.category === cat.key)} 
              selectedCourses={selectedCourses} 
              handleToggle={handleToggle}
              program={program}
              enableYearFilter={cat.filter}
              facultyId={facultyId}
              onBatchToggle={null}
            />
          ))}
        </div>
      </div>

      {/* Right Column: Dashboard */}
      <div className="glass-panel sticky-sidebar">
        <div className="dashboard-tabs">
          <button 
            className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            <Layout size={18} /> 単位進捗
          </button>
          <button 
            className={`tab-button ${activeTab === 'timetable' ? 'active' : ''}`}
            onClick={() => setActiveTab('timetable')}
          >
            <Calendar size={18} /> 時間割
          </button>
        </div>

        {activeTab === 'progress' ? (
          <>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border)', paddingBottom: '0.75rem' }}>
              卒業要件ダッシュボード
            </h2>
            
            <div style={{ textAlign: 'center', padding: '2rem 1rem', marginBottom: '1.5rem', background: 'var(--surface-hover)', borderRadius: '8px' }}>
              <div style={{ fontSize: '3rem', fontWeight: '800', color: status.total.ok ? '#10B981' : 'var(--text-main)', lineHeight: 1 }}>
                {status.total.current} <span style={{ fontSize: '1.3rem', color: 'var(--text-muted)', fontWeight: '500' }}>/ 124</span>
              </div>
              <p style={{ color: status.total.ok ? '#10B981' : (missingCredits === 0 ? '#EF4444' : 'var(--text-muted)'), marginTop: '0.75rem', fontWeight: 600, fontSize: '1rem' }}>
                {status.total.ok 
                  ? '🎉 卒業要件を見事クリア！' 
                  : (missingCredits === 0 && missingList.length > 0
                      ? '⚠️ 単位数は足っていますが、未取得の必修科目があります' 
                      : `卒業まであと ${missingCredits} 単位`
                    )
                }
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {facultyId === 'info' ? (
                <>
                  <ProgressBar label="総合科目" current={status.general.current} target={status.general.required} minRequiredLabel="19単位以上" missingList={status.general.missingList} />
                  <ProgressBar label="学科基礎 + プログラム科目" current={status.basicAndProgram.current} target={status.basicAndProgram.required} minRequiredLabel="計80単位以上" missingList={status.basicAndProgram.missingList} />
                  <div style={{ paddingLeft: '1.5rem', marginTop: '-0.3rem', marginBottom: '0.3rem' }}>
                    <ProgressBar label="↳ うち実践英語" current={status.practicalEnglish.current} target={status.practicalEnglish.required} minRequiredLabel="4単位必修" />
                  </div>
                  <ProgressBar label={`${program}プログラム必修`} current={status.programSpecific.current} target={status.programSpecific.required} minRequiredLabel="22単位以上" missingList={status.programSpecific.missingList} />
                  <ProgressBar label="演習科目" current={status.exercise.current} target={status.exercise.required} minRequiredLabel="必修8単位" missingList={status.exercise.missingList} />
                  <ProgressBar label="他学科専門科目" current={status.other.current} target={status.other.required} minRequiredLabel="4単位" />
                  <ProgressBar label="自由選択枠" current={status.freeElective.current} target={status.freeElective.required} minRequiredLabel="13単位（各分野の超過分等）" />
                </>
              ) : (
                <>
                  <ProgressBar label="総合科目" current={status.general.current} target={status.general.required} minRequiredLabel="29単位以上" subStatus={status.general.subStatus} />
                  <ProgressBar label="専門基礎科目" current={status.specBasic.current} target={status.specBasic.required} minRequiredLabel="34単位以上" subStatus={status.specBasic.subStatus} />
                  <ProgressBar label="専門科目" current={status.specialized.current} target={status.specialized.required} minRequiredLabel="28単位以上 (演習8含む)" subStatus={status.specialized.subStatus} />
                  <ProgressBar label="自由科目枠" current={status.freeElective.current} target={status.freeElective.required} minRequiredLabel="33単位" />
                  

                </>
              )}
            </div>
            
            {missingList && missingList.length > 0 && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ color: '#EF4444', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={18} /> 未取得の必修科目
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {missingList.map(name => (
                    <span key={name} style={{ fontSize: '0.8rem', background: '#EF4444', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{name}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--accent-light)', borderRadius: '8px', borderLeft: '4px solid var(--primary)', display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
              <Info size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                ※このシミュレーターは目安です。詳細な必修科目の取りこぼしや、具体的な卒業可否については、所属学部の教務窓口、あるいは学生便覧の最新版を必ず確認してください。
              </p>
            </div>
          </>
        ) : (
          <Timetable 
            facultyId={facultyId}
            selectedCourseIds={selectedCourses} 
            handleToggle={handleToggle} 
            program={program}
            onBatchSelectMandatory={handleBatchSelectMandatory}
            coursesData={coursesData}
          />
        )}
      </div>
      {/* Mobile-only Status Drawer (createPortal for stability) */}
      {createPortal(
        <div className={`mobile-status-drawer ${isDrawerExpanded ? 'expanded' : ''}`}>
          <div 
            className="drawer-header" 
            onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
            style={{ 
              padding: '1rem 1.25rem', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                {status.total.current}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {status.total.ok ? '卒業OK' : `あと ${missingCredits} 単位`}
              </span>
            </div>
            <ChevronDown 
              size={24} 
              style={{ 
                transform: isDrawerExpanded ? 'rotate(180deg)' : 'none', 
                transition: 'transform 0.3s',
                color: 'var(--text-muted)'
              }} 
            />
          </div>
          
          {isDrawerExpanded && (
            <div style={{ 
              padding: '0 1.25rem 1.25rem', 
              maxHeight: '60vh', 
              overflowY: 'auto' 
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {facultyId === 'info' ? (
                  <>
                    <ProgressBar label="総合" current={status.general.current} target={status.general.required} />
                    <ProgressBar label="基礎+専" current={status.basicAndProgram.current} target={status.basicAndProgram.required} />
                    <ProgressBar label="必修" current={status.programSpecific.current} target={status.programSpecific.required} />
                  </>
                ) : (
                  <>
                    <ProgressBar label="総合" current={status.general.current} target={status.general.required} />
                    <ProgressBar label="専基" current={status.specBasic.current} target={status.specBasic.required} />
                    <ProgressBar label="専門" current={status.specialized.current} target={status.specialized.required} />
                  </>
                )}
                <button 
                  onClick={() => setIsDrawerExpanded(false)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    background: 'var(--accent-light)', 
                    color: 'var(--primary)', 
                    border: 'none', 
                    borderRadius: '8px',
                    fontWeight: 700,
                    marginTop: '0.5rem'
                  }}
                >
                  閉じる
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

export default Checker;
