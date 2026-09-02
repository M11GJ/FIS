import assert from 'node:assert/strict';
import { getCoursesForEntryYear } from '../shared/curriculum.js';
import { calculateInformationGraduation } from '../shared/graduation.js';
import {
  assessCourseEligibility,
  assessProgression,
  describeCourseOffering,
  findScheduleConflicts,
} from '../shared/coursePlanning.js';
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

const find2026 = name => courses2026.find(course => course.name === name);
const communicationEnglish4 = find2026('コミュニケーション英語Ⅳ');
const communicationPrerequisites = [
  find2026('コミュニケーション英語Ⅰ'),
  find2026('コミュニケーション英語Ⅱ'),
  find2026('コミュニケーション英語Ⅲ'),
];
const fourthYearEligibility = assessCourseEligibility({
  course: communicationEnglish4,
  completedCourses: communicationPrerequisites,
  studentYear: 4,
  plannedCreditsThisAcademicYear: 20,
});
assert.equal(fourthYearEligibility.yearEligible, true);
assert.equal(fourthYearEligibility.laterYearEnrollment, true);
assert.equal(fourthYearEligibility.eligible, true);
assert.equal(fourthYearEligibility.status, 'eligible');

const firstSemesterCapEligibility = assessCourseEligibility({
  course: find2026('周南Well-being創生入門'),
  completedCourses: [],
  studentYear: 4,
  plannedCreditsThisAcademicYear: 23,
  plannedCreditsFirstSemester: 23,
  plannedCreditsSecondSemester: 0,
});
assert.equal(firstSemesterCapEligibility.status, 'ineligible');
assert.equal(firstSemesterCapEligibility.semesterCreditCap.targetSemester, 'first');
assert.equal(firstSemesterCapEligibility.semesterCreditCap.first.after, 25);
assert.equal(firstSemesterCapEligibility.semesterCreditCap.first.exceeded, true);
assert.equal(firstSemesterCapEligibility.semesterCreditCap.second.after, 0);

const annualCapEligibility = assessCourseEligibility({
  course: find2026('周南Well-being創生入門'),
  completedCourses: [],
  studentYear: 4,
  plannedCreditsThisAcademicYear: 47,
  plannedCreditsFirstSemester: 20,
  plannedCreditsSecondSemester: 27,
});
assert.equal(annualCapEligibility.status, 'ineligible');
assert.equal(annualCapEligibility.annualCreditCap.after, 49);
assert.equal(annualCapEligibility.annualCreditCap.exceeded, true);

const gpaCapExceptionEligibility = assessCourseEligibility({
  course: find2026('周南Well-being創生入門'),
  completedCourses: [],
  studentYear: 4,
  plannedCreditsThisAcademicYear: 48,
  plannedCreditsFirstSemester: 24,
  previousYearGpa: 3.5,
});
assert.equal(gpaCapExceptionEligibility.status, 'eligible');
assert.equal(gpaCapExceptionEligibility.capException.applied, true);
assert.deepEqual(gpaCapExceptionEligibility.capException.reasons, ['previous_year_gpa']);
assert.equal(gpaCapExceptionEligibility.annualCreditCap.exceeded, true);
assert.equal(gpaCapExceptionEligibility.annualCreditCap.blocking, false);

const teachingCapExceptionEligibility = assessCourseEligibility({
  course: find2026('情報社会と職業'),
  completedCourses: [],
  studentYear: 3,
  plannedCreditsThisAcademicYear: 48,
  plannedCreditsFirstSemester: 24,
});
assert.equal(teachingCapExceptionEligibility.status, 'eligible');
assert.equal(teachingCapExceptionEligibility.capException.applied, true);
assert.equal(teachingCapExceptionEligibility.capException.reasons.includes('teaching_course'), true);

const missingPrerequisiteEligibility = assessCourseEligibility({
  course: communicationEnglish4,
  completedCourses: communicationPrerequisites.slice(0, 2),
  studentYear: 2,
});
assert.equal(missingPrerequisiteEligibility.eligible, false);
assert.deepEqual(missingPrerequisiteEligibility.prerequisites.missingRequired, ['コミュニケーション英語Ⅲ']);

const onDemandOffering = describeCourseOffering(communicationEnglish4);
assert.equal(onDemandOffering.deliveryMode, 'on_demand');
assert.equal(onDemandOffering.timedConflictExempt, true);

const timedConflict = findScheduleConflicts([
  find2026('周南Well-being創生入門'),
  find2026('ワークショップデザインⅠ'),
]);
assert.equal(timedConflict.hasBlockingConflict, true);
assert.deepEqual(timedConflict.conflicts[0].overlappingSlots, [{ day: '火', period: 3 }]);

const noOnDemandConflict = findScheduleConflicts([
  find2026('周南Well-being創生入門'),
  find2026('コミュニケーション英語Ⅰ'),
]);
assert.equal(noOnDemandConflict.conflicts.length, 0);

const unknownScheduleEligibility = assessCourseEligibility({
  course: find2026('医療情報システム'),
  completedCourses: [],
  studentYear: 4,
});
assert.equal(unknownScheduleEligibility.status, 'requires_confirmation');
assert.equal(unknownScheduleEligibility.provisionallyEligible, true);

const emptyProgression = assessProgression({
  completedCourses: [],
  courses: courses2026,
  studentYear: 2,
});
assert.equal(emptyProgression.professionalSeminar1.eligible, false);
assert.equal(emptyProgression.risks.some(risk => risk.milestone === '専門ゼミ１'), true);

const completedProgression = assessProgression({
  completedCourses: courses2026,
  courses: courses2026,
  studentYear: 4,
});
assert.equal(completedProgression.professionalSeminar1.eligible, true);
assert.equal(completedProgression.graduationResearch.eligible, true);
assert.equal(completedProgression.risks.length, 0);

process.env.FIS_DATA_PATH = '/tmp/fis-profile-store-test.json';
const { deleteCourseProfile, getCourseProfile, saveCourseProfile } = await import('./profileStore.js');
await saveCourseProfile('test-sub', { facultyId: 'info', entryYear: 2026, program: 'DS', courseIds: ['c_8a3e0b1c'] });
const stored = await getCourseProfile('test-sub');
assert.deepEqual(stored.identity, { sub: 'test-sub' });
assert.equal(stored.profile.entryYear, 2026);
await deleteCourseProfile('test-sub');
assert.equal(await getCourseProfile('test-sub'), null);

console.log('FIS API tests passed');
