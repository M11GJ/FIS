import { isCourseActiveInQuarter, parseSchedule } from '../src/utils/parseSchedule.js';

const tests = [
  { term: '1前', year: 1, q: 1, expected: true },
  { term: '1前', year: 1, q: 2, expected: true },
  { term: '1前', year: 1, q: 3, expected: false },
  { term: '1①', year: 1, q: 1, expected: true },
  { term: '1①', year: 1, q: 2, expected: false },
  { term: '2後', year: 2, q: 3, expected: true },
  { term: '2後', year: 2, q: 4, expected: true },
  { term: '1通', year: 1, q: 1, expected: true },
  { term: '1通', year: 1, q: 4, expected: true },
];

console.log('--- Testing isCourseActiveInQuarter ---');
tests.forEach(t => {
  const result = isCourseActiveInQuarter(t.term, t.year, t.q);
  console.log(`Term: ${t.term}, Year: ${t.year}, Q: ${t.q} | Result: ${result} | Expected: ${t.expected} | ${result === t.expected ? '✅' : '❌'}`);
});

const scheduleTests = [
  { str: '火23', expectedDays: [2], expectedPeriods: [2, 3] },
  { str: '月金5', expectedDays: [1, 5], expectedPeriods: [5] },
  { str: '水45', expectedDays: [3], expectedPeriods: [4, 5] },
  { str: 'オンデマンド', expectedOnDemand: true },
];

console.log('\n--- Testing parseSchedule ---');
scheduleTests.forEach(t => {
  const result = parseSchedule(t.str);
  console.log(`Input: ${t.str} | Result: ${JSON.stringify(result)}`);
});
