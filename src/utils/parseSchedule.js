/**
 * 授業の開講期が、指定された年・クォーターに該当するか判定します
 */
export function isCourseActiveInQuarter(termStr, targetYear, targetQuarter) {
  if (!termStr) return false;

  // 年度の判定 ("1前" の "1" を抽出)
  const yearMatch = termStr.match(/^(\d)/);
  if (!yearMatch) return false;
  const courseYear = parseInt(yearMatch[1], 10);
  if (courseYear !== targetYear) return false;

  // クォーターの判定
  if (termStr.includes('前') || termStr.includes('①②')) {
    return targetQuarter === 1 || targetQuarter === 2;
  }
  if (termStr.includes('後') || termStr.includes('③④')) {
    return targetQuarter === 3 || targetQuarter === 4;
  }
  if (termStr.includes('通')) {
    return true;
  }
  if (termStr.includes('①')) return targetQuarter === 1;
  if (termStr.includes('②')) return targetQuarter === 2;
  if (termStr.includes('③')) return targetQuarter === 3;
  if (termStr.includes('④')) return targetQuarter === 4;

  return false;
}

/**
 * 曜日・時限の文字列（例: "火23", "月金5"）をパースします
 */
export function parseSchedule(scheduleStr) {
  if (!scheduleStr || scheduleStr === '-' || scheduleStr === 'オンデマンド') {
    return { days: [], periods: [], isOnDemand: scheduleStr === 'オンデマンド' };
  }

  const daysMap = { '月': 1, '火': 2, '水': 3, '木': 4, '金': 5 };
  const days = [];
  const periods = [];

  // 曜日の抽出 (複数対応: 月金など)
  const dayChars = scheduleStr.match(/[月火水木金]/g) || [];
  dayChars.forEach(char => days.push(daysMap[char]));

  // 時限の抽出 (連続対応: 23など)
  const periodMatch = scheduleStr.match(/\d/g) || [];
  periodMatch.forEach(p => periods.push(parseInt(p, 10)));

  return {
    days,
    periods,
    isOnDemand: false
  };
}
