import React, { useState, useMemo, useRef, useEffect } from 'react';
import { isCourseActiveInQuarter, parseSchedule } from '../utils/parseSchedule';
import { Calendar, Clock, Plus, Check, Zap, Milestone } from 'lucide-react';

const DAYS = ['月', '火', '水', '木', '金'];
const PERIODS = [1, 2, 3, 4, 5];

export default function Timetable({ facultyId, selectedCourseIds, handleToggle, program, onBatchSelectMandatory, coursesData }) {
  const [selectedYear, setSelectedYear] = useState(1);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  
  // ホバー中のスロット（曜日・時限）の状態
  const [hoveredSlot, setHoveredSlot] = useState(null); // { day, period, x, y, side: 'left' | 'right' }
  const popoverRef = useRef(null);
  const leaveTimer = useRef(null);
  const enterTimer = useRef(null);

  const [isLocked, setIsLocked] = useState(false);

  // 選択中のクォーターに該当する登録済み科目を抽出
  const activeSelectedCourses = useMemo(() => {
    if (!coursesData) return [];
    return coursesData.filter(c => 
      selectedCourseIds.has(c.id) && 
      isCourseActiveInQuarter(c.term, selectedYear, selectedQuarter)
    );
  }, [coursesData, selectedCourseIds, selectedYear, selectedQuarter]);

  // グリッドデータの構築 (登録済み科目のみ)
  const grid = useMemo(() => {
    const table = Array(5).fill(null).map(() => Array(5).fill(null));
    const onDemandList = [];
    const seasonalList = [];

    activeSelectedCourses.forEach(course => {
      const schedule = parseSchedule(course.schedule);
      if (schedule.isOnDemand) {
        onDemandList.push(course);
      } else if (schedule.days.length > 0 && schedule.periods.length > 0) {
        schedule.days.forEach(day => {
          schedule.periods.forEach(period => {
            if (day >= 1 && day <= 5 && period >= 1 && period <= 5) {
              if (!table[period - 1][day - 1]) table[period - 1][day - 1] = [];
              table[period - 1][day - 1].push(course);
            }
          });
        });
      } else if (course.schedule !== '-') {
        seasonalList.push(course);
      }
    });

    return { table, onDemandList, seasonalList };
  }, [activeSelectedCourses]);

  // 全スロットの開講科目数を事前に計算（グレーアウト判定用）
  const availabilityMap = useMemo(() => {
    const map = {};
    for (let d = 1; d <= 5; d++) {
      map[d] = {};
      for (let p = 1; p <= 5; p++) {
        const count = coursesData ? coursesData.filter(c => {
          if (!isCourseActiveInQuarter(c.term, selectedYear, selectedQuarter)) return false;
          const schedule = parseSchedule(c.schedule);
          return schedule.days.includes(d) && schedule.periods.includes(p);
        }).length : 0;
        map[d][p] = count;
      }
    }
    return map;
  }, [coursesData, selectedYear, selectedQuarter]);

  // ホバー中のスロットで選択可能な全科目を抽出
  const availableCoursesForHovered = useMemo(() => {
    if (!hoveredSlot || !coursesData) return [];
    
    return coursesData.filter(c => {
      if (!isCourseActiveInQuarter(c.term, selectedYear, selectedQuarter)) return false;
      const schedule = parseSchedule(c.schedule);
      return schedule.days.includes(hoveredSlot.day) && schedule.periods.includes(hoveredSlot.period);
    });
  }, [hoveredSlot, coursesData, selectedYear, selectedQuarter]);

  const handleCellMouseEnter = (e, day, period) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    if (enterTimer.current) clearTimeout(enterTimer.current);

    // ロック中なら他のマスのホバーを完全に無視
    if (isLocked) return;

    const container = e.currentTarget.closest('.timetable-container');
    const containerRect = container.getBoundingClientRect();
    const rect = e.currentTarget.getBoundingClientRect();
    const side = (rect.left - containerRect.left) > (containerRect.width / 2) ? 'left' : 'right';

    // 0.15秒の「待ち」を入れて、通過中マスの誤反応を防ぐ
    enterTimer.current = setTimeout(() => {
      setHoveredSlot({
        day,
        period,
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        side
      });
    }, 150);
  };

  const getAvailableCoursesAt = (day, period) => {
    if (!coursesData) return [];
    return coursesData.filter(c => {
      if (!isCourseActiveInQuarter(c.term, selectedYear, selectedQuarter)) return false;
      const schedule = parseSchedule(c.schedule);
      return schedule.days.includes(day) && schedule.periods.includes(period);
    });
  };

  const handleCellClick = (day, period) => {
    const available = getAvailableCoursesAt(day, period);
    
    if (available.length === 1) {
      // 候補が1つなら即座に登録・解除
      handleToggle(available[0].id);
      setIsLocked(false);
    } else if (available.length > 1) {
      // 複数あればポップアップを固定
      if (isLocked && hoveredSlot?.day === day && hoveredSlot?.period === period) {
        setIsLocked(false);
      } else {
        setIsLocked(true);
      }
    }
  };

  const handleMouseLeave = () => {
    if (enterTimer.current) clearTimeout(enterTimer.current);
    if (isLocked) return;
    leaveTimer.current = setTimeout(() => {
      setHoveredSlot(null);
    }, 1000);
  };

  const handlePopoverMouseEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  };

  // 画面クリックでロック解除
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isLocked && !e.target.closest('.timetable-cell') && !e.target.closest('.timetable-popover')) {
        setIsLocked(false);
        setHoveredSlot(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLocked]);

  const categoryLabels = facultyId === 'econ' ? {
    general: '総合',
    specialized_basic: '専基',
    specialized: '専門',
    exercise: '演習',
    other_dept: '他',
    teaching: '教職',
  } : {
    general: '総合',
    basic: '基礎',
    program: '専門',
    exercise: '演習',
    other: '他',
    teaching: '教職',
  };

  // 一括登録ボタンの状態判定
  const { allGlobalMandatorySelected, allQuarterMandatorySelected } = useMemo(() => {
    if (!coursesData) return { allGlobalMandatorySelected: false, allQuarterMandatorySelected: false };

    const pKey = program?.toLowerCase();
    
    // 全学年の必修
    const globalMandatory = coursesData.filter(c => {
      if (facultyId === 'info') {
        const isProgramCourse = c.category === 'program';
        const isProgramMandatory = isProgramCourse && c.programMapping?.[pKey] === '必修';
        const isGlobalMandatory = !isProgramCourse && c.required === true;
        return isGlobalMandatory || isProgramMandatory;
      } else {
        return c.required === true;
      }
    });
    const allGlobal = globalMandatory.length > 0 && globalMandatory.every(c => selectedCourseIds.has(c.id));

    // 現在のクォーターの必修
    const quarterMandatory = globalMandatory.filter(c => 
      isCourseActiveInQuarter(c.term, selectedYear, selectedQuarter)
    );
    
    const quarterSpecificMandatory = quarterMandatory.filter(c => !c.term.includes('通'));
    const allQuarter = quarterMandatory.length > 0 && (
      quarterSpecificMandatory.length > 0 
        ? quarterSpecificMandatory.every(c => selectedCourseIds.has(c.id))
        : quarterMandatory.every(c => selectedCourseIds.has(c.id))
    );

    return { allGlobalMandatorySelected: allGlobal, allQuarterMandatorySelected: allQuarter };
  }, [coursesData, selectedCourseIds, selectedYear, selectedQuarter, program, facultyId]);

  // 時間割グリッド外（オンデマンド、集中講義等）の開講科目を抽出
  const availableExtraCourses = useMemo(() => {
    if (!coursesData) return [];
    return coursesData.filter(c => {
      if (!isCourseActiveInQuarter(c.term, selectedYear, selectedQuarter)) return false;
      const schedule = parseSchedule(c.schedule);
      return schedule.isOnDemand || (schedule.days.length === 0 && schedule.periods.length === 0);
    });
  }, [coursesData, selectedYear, selectedQuarter]);

  return (
    <div className="timetable-container" onMouseLeave={handleMouseLeave}>
      {/* セレクターボックス（左右分割レイアウト） */}
      <div className="timetable-selectors-container">
        <div className="selectors-left">
          <div className="selector-group">
            <label>学年</label>
            <div className="button-row">
              {[1, 2, 3, 4].map(y => (
                <button 
                   key={y} 
                  onClick={() => setSelectedYear(y)}
                  className={selectedYear === y ? 'active' : ''}
                >
                  {y}年
                </button>
              ))}
            </div>
          </div>
          <div className="selector-group">
            <label>クォーター</label>
            <div className="button-row">
              {[1, 2, 3, 4].map(q => (
                <button 
                  key={q} 
                  onClick={() => setSelectedQuarter(q)}
                  className={selectedQuarter === q ? 'active' : ''}
                >
                  {q}Q
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="selectors-right">
          <div className="grid-legend">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <div key={key} className="legend-item">
                <span className={`legend-dot cat-${key}`}></span>
                <span className="legend-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 一括登録ボタン */}
      <div className="batch-actions-row">
        <button 
          className={`batch-btn-full ${allGlobalMandatorySelected ? 'accent' : 'secondary'}`} 
          onClick={() => onBatchSelectMandatory(null)}
        >
          <Milestone size={16} /> 全学年の必修を{allGlobalMandatorySelected ? '解除' : '一括登録'}
        </button>
        <button 
          className={`batch-btn-full ${allQuarterMandatorySelected ? 'accent' : 'secondary'}`} 
          onClick={() => onBatchSelectMandatory(selectedYear, selectedQuarter)}
        >
          <Zap size={16} /> 第{selectedYear}学年 {selectedQuarter}Qの必修を{allQuarterMandatorySelected ? '解除' : '一括登録'}
        </button>
      </div>

      {/* 時間割グリッド */}
      <div className="timetable-grid-wrapper">
        <table className="timetable-grid">
          <thead>
            <tr>
              <th className="dimmed"><Clock size={14} /></th>
              {DAYS.map(day => <th key={day}>{day}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map(period => (
              <tr key={period}>
                <td className="period-label">{period}</td>
                {DAYS.map((dayName, dayIndex) => {
                  const dayNum = dayIndex + 1;
                  const courses = grid.table[period - 1][dayIndex];
                  const isHovered = hoveredSlot?.day === dayNum && hoveredSlot?.period === period;
                  
                  return (
                    <td 
                      key={dayIndex} 
                      className={`timetable-cell ${isHovered ? 'hovered' : ''} ${isHovered && isLocked ? 'locked' : ''} ${availabilityMap[dayNum][period] === 0 ? 'is-empty' : ''}`}
                      onMouseEnter={(e) => handleCellMouseEnter(e, dayNum, period)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleCellClick(dayNum, period)}
                    >
                      {courses && courses.map(course => (
                        <div key={course.id} className={`course-card-mini cat-${course.category}`} title={course.name}>
                          <span className="course-name">{course.name}</span>
                          <span className="course-room">{course.room}</span>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* クイック登録ポップオーバー */}
      {hoveredSlot && (
        <div 
          className={`timetable-popover side-${hoveredSlot.side} ${isLocked ? 'locked' : ''}`}
          style={{ 
            left: hoveredSlot.side === 'right' 
              ? `${hoveredSlot.x + hoveredSlot.width + 10}px` 
              : `${hoveredSlot.x - 270}px`,
            top: `${hoveredSlot.y}px`
          }}
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="popover-body">
            {availableCoursesForHovered.length > 0 ? (
              availableCoursesForHovered.map(course => {
                const isSelected = selectedCourseIds.has(course.id);
                const isMandatory = facultyId === 'info' 
                  ? (course.required || (course.category === 'program' && course.programMapping && course.programMapping[program?.toLowerCase()] === '必修'))
                  : course.required;

                return (
                  <div 
                    key={course.id} 
                    className={`popover-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleToggle(course.id)}
                  >
                    <div className="item-status">
                      {isSelected ? <Check size={14} /> : <Plus size={14} />}
                    </div>
                    <div className="item-info">
                      <div className="item-title-row">
                        <span className="item-name">{course.name}</span>
                        {isMandatory && <span className="mandatory-tag">必修</span>}
                      </div>
                      <span className="item-meta">
                        <span className={`badge-dot cat-${course.category}`}></span>
                        {course.room || '教室不明'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="popover-empty">開講科目なし</div>
            )}
          </div>
        </div>
      )}

      {/* グリッド外の科目登録セクション */}
      {availableExtraCourses.length > 0 && (
        <div className="timetable-extra-registration">
          <div className="extra-header">
            <Plus size={18} />
            <span>時間外科目（オンデマンド・集中講義など）</span>
          </div>
          <div className="extra-grid">
            {availableExtraCourses.map(course => {
              const isSelected = selectedCourseIds.has(course.id);
              const isMandatory = facultyId === 'info' 
                ? (course.required || (course.category === 'program' && course.programMapping && course.programMapping[program?.toLowerCase()] === '必修'))
                : course.required;
              
              return (
                <div 
                  key={course.id} 
                  className={`extra-card ${isSelected ? 'selected' : ''} cat-border-${course.category}`}
                  onClick={() => handleToggle(course.id)}
                >
                  <div className="extra-card-info">
                    <div className="extra-card-top">
                      <span className="extra-card-name">{course.name}</span>
                      {isMandatory && <span className="mandatory-tag-mini">必修</span>}
                    </div>
                    <div className="extra-card-meta">
                      <span className={`badge-dot cat-${course.category}`}></span>
                      <span className="extra-type">{course.schedule === 'オンデマンド' ? 'オンデマンド' : '集中/他'}</span>
                    </div>
                  </div>
                  <div className="extra-card-action">
                    {isSelected ? <Check size={16} /> : <Plus size={16} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
