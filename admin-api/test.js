import assert from 'node:assert/strict';
import { getCoursesForEntryYear } from '../shared/curriculum.js';
import { calculateInformationGraduation } from '../shared/graduation.js';
import courses from './courseData.js';

const courses2024 = getCoursesForEntryYear(courses, 2024);
const courses2025 = getCoursesForEntryYear(courses, 2025);
const courses2026 = getCoursesForEntryYear(courses, 2026);
const additions2026 = ['オブジェクト指向プログラミング', '応用数値解析', 'データベース応用', '金融工学'];

assert.equal(courses2024.length, 143);
assert.equal(courses2025.length, 143);
assert.equal(courses2026.length, 147);
[courses2024, courses2025, courses2026].forEach(list => {
  assert.equal(list.every(course => course.id && course.name && Number.isFinite(course.credits) && course.category), true);
});

additions2026.forEach(name => {
  assert.equal(courses2024.some(course => course.name === name), false);
  assert.equal(courses2025.some(course => course.name === name), false);
  assert.equal(courses2026.some(course => course.name === name), true);
});

[courses2024, courses2025, courses2026].forEach(list => {
  ['DS', 'IE', 'BA'].forEach(program => {
    const result = calculateInformationGraduation(list.map(course => course.id), program, list);
    assert.equal(result.status.total.ok, true);
    assert.equal(result.missingList.length, 0);
  });
});

process.env.FIS_DATA_PATH = '/tmp/fis-profile-store-test.json';
const { deleteCourseProfile, getCourseProfile, saveCourseProfile } = await import('./profileStore.js');
await saveCourseProfile('test-sub', { facultyId: 'info', entryYear: 2026, program: 'DS', courseIds: ['c_8a3e0b1c'] });
const stored = await getCourseProfile('test-sub');
assert.deepEqual(stored.identity, { sub: 'test-sub' });
assert.equal(stored.profile.entryYear, 2026);
await deleteCourseProfile('test-sub');
assert.equal(await getCourseProfile('test-sub'), null);

console.log('FIS API tests passed');
