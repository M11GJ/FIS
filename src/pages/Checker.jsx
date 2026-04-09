import React, { useState, useMemo } from 'react';
import coursesData from '../data/courses.json';
import { useGraduationCheck } from '../hooks/useGraduationCheck';
import { formatTerm } from '../utils/formatTerm';
import { CheckCircle2, AlertCircle, ChevronDown, ChevronRight, ClipboardPaste } from 'lucide-react';

const ProgressBar = ({ label, current, target, minRequiredLabel, missingList }) => {
  const percent = Math.min(100, (current / target) * 100);
  const isOk = current >= target && (!missingList || missingList.length === 0);
  
  return (
    <div className="progress-container" style={{ marginBottom: missingList && missingList.length > 0 ? '2rem' : '1.5rem' }}>
      <div className="progress-labels">
        <span>{label} {minRequiredLabel && <span style={{fontSize: '0.75rem', opacity: 0.7}}>({minRequiredLabel})</span>}</span>
        <strong>{current} / {target} 単位</strong>
      </div>
      <div className="progress-track" style={{ background: 'var(--border)' }}>
        <div 
          className={`progress-fill ${isOk ? 'success' : ''}`} 
          style={{ width: `${percent}%`, background: isOk ? '#10B981' : 'var(--primary)' }}
        />
      </div>
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

const CourseAccordion = ({ title, courses, selectedCourses, handleToggle, program, enableYearFilter }) => {
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
        <span style={{ fontSize: '0.85rem', color: selectedCount > 0 ? 'var(--primary)' : 'var(--text-muted)', background: selectedCount > 0 ? 'var(--accent-light)' : 'var(--border)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
          {selectedCount} / {courses.length} 選択中
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
                    boxShadow: selectedYear === year ? '0 2px 4px rgba(226, 4, 27, 0.2)' : 'none'
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
                    <span className="badge" style={{ background: 'var(--surface)' }}>{formatTerm(course.term)}</span>
                    <span className="badge" style={{ background: 'var(--surface)' }}>{course.credits}単位</span>
                    {course.category !== 'program' && course.required && <span className="badge req" style={{ background: 'var(--primary)', color: 'white' }}>必修</span>}
                    {course.category === 'program' && pType === '必修' && <span className="badge req" style={{ background: 'var(--primary)', color: 'white' }}>{program}必修</span>}
                    {course.category === 'program' && pType === '選択' && <span className="badge" style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}>{program}選択</span>}
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

const AutoImportPanel = ({ selectedCourses, setSelectedCourses }) => {
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
      
      if (!parts[0] || !parts[0].startsWith('◆')) return;
      if (parts.length < 2) return;

      const courseNameRaw = parts[1];
      
      const isPassed = parts.some(p => ['秀', '優', '良', '可'].includes(p));
      const isFailed = parts.some(p => p === '不');

      if (isPassed && !isFailed) {
        const normalizedInput = courseNameRaw.replace(/\s+/g,'');
        const course = coursesData.find(c => c.name.replace(/\s+/g,'') === normalizedInput);
        
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
  const [selectedCourses, setSelectedCourses] = useState(new Set());
  const [program, setProgram] = useState('DS');

  const handleToggle = (id) => {
    setSelectedCourses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { status, missingCredits } = useGraduationCheck(Array.from(selectedCourses), program);

  const categories = [
    { key: 'general', title: '総合科目', filter: true },
    { key: 'basic', title: '学科基礎科目', filter: true },
    { key: 'program', title: 'プログラム科目', filter: true },
    { key: 'exercise', title: '演習・ゼミ等', filter: false },
    { key: 'other', title: '他学科専門科目', filter: false },
    { key: 'teaching', title: '教職課程関連', filter: false },
  ];

  return (
    <div className="dashboard-grid">
      {/* Left Column: Input Panel */}
      <div className="glass-panel" style={{ height: 'fit-content' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border)', paddingBottom: '0.75rem' }}>
          <CheckCircle2 /> 修得科目を選択
        </h2>
        
        <AutoImportPanel selectedCourses={selectedCourses} setSelectedCourses={setSelectedCourses} />

        <div style={{ marginBottom: '1.5rem', background: 'var(--surface-hover)', padding: '1rem', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontWeight: 600 }}>所属プログラム</label>
          <select value={program} onChange={e => setProgram(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <option value="DS">データサイエンス (DS)</option>
            <option value="IE">情報エンジニアリング (IE)</option>
            <option value="BA">ビジネスアナリティクス (BA)</option>
          </select>
        </div>

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
            />
          ))}
        </div>
      </div>

      {/* Right Column: Dashboard */}
      <div className="glass-panel sticky-sidebar">
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border)', paddingBottom: '0.75rem' }}>
          卒業要件ダッシュボード
        </h2>
        
        <div style={{ textAlign: 'center', padding: '2rem 1rem', marginBottom: '1.5rem', background: 'var(--surface-hover)', borderRadius: '8px' }}>
          <div style={{ fontSize: '3.5rem', fontWeight: '800', color: status.total.ok ? '#10B981' : 'var(--text-main)', lineHeight: 1 }}>
            {status.total.current} <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)', fontWeight: '500' }}>/ 124</span>
          </div>
          <p style={{ color: status.total.ok ? '#10B981' : (missingCredits === 0 ? '#EF4444' : 'var(--text-muted)'), marginTop: '0.75rem', fontWeight: 600, fontSize: '1.1rem' }}>
            {status.total.ok 
              ? '🎉 卒業要件を見事クリア！' 
              : (missingCredits === 0 
                  ? '⚠️ 単位数は足っていますが、未取得の必修科目があります' 
                  : `卒業まであと ${missingCredits} 単位`
                )
            }
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <ProgressBar label="総合科目" current={status.general.current} target={status.general.required} minRequiredLabel="19単位以上" missingList={status.general.missingList} />
          <ProgressBar label="学科基礎 + プログラム科目" current={status.basicAndProgram.current} target={status.basicAndProgram.required} minRequiredLabel="計80単位以上" missingList={status.basicAndProgram.missingList} />
          <div style={{ paddingLeft: '1.5rem', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
            <ProgressBar label="↳ うち実践英語" current={status.practicalEnglish.current} target={status.practicalEnglish.required} minRequiredLabel="4単位必修" />
          </div>
          <ProgressBar label={`${program}プログラム必修`} current={status.programSpecific.current} target={status.programSpecific.required} minRequiredLabel="22単位以上" missingList={status.programSpecific.missingList} />
          <ProgressBar label="演習科目" current={status.exercise.current} target={status.exercise.required} minRequiredLabel="必修8単位" missingList={status.exercise.missingList} />
          <ProgressBar label="他学科専門科目" current={status.other.current} target={status.other.required} minRequiredLabel="4単位" />
          <ProgressBar label="自由選択枠" current={status.freeElective.current} target={status.freeElective.required} minRequiredLabel="13単位（各分野の超過分等）" />
        </div>
        
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--accent-light)', borderRadius: '8px', borderLeft: '4px solid var(--primary)', display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
          <AlertCircle size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
            ※このシミュレーターは目安です。詳細な必修科目の取りこぼしや、具体的な卒業可否については、所属する学部の教務担当窓口、あるいは学生便覧の最新版を必ず確認してください。
          </p>
        </div>
      </div>
    </div>
  );
}

export default Checker;
