import assert from 'node:assert/strict';
import { getCoursesForEntryYear } from '../shared/curriculum.js';
import { calculateInformationGraduation } from '../shared/graduation.js';
import prerequisiteAudit2026 from '../shared/coursePrerequisites2026.js';
import {
  COURSE_RULE_ALIASES_2026,
  COURSE_RULES_2026,
  COURSE_RULE_SOURCES,
} from '../shared/courseRules.js';
import {
  assessCourseEligibility,
  assessProgression,
  describeCourseOffering,
  findScheduleConflicts,
  normalizeCourseName,
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
assert.equal(COURSE_RULE_SOURCES.auditedSyllabi, 139);
assert.equal(Object.keys(COURSE_RULES_2026).length, 139);
const syllabusCodes = Object.values(prerequisiteAudit2026.courses).map(rule => rule.syllabusCode);
const syllabusUrls = Object.values(prerequisiteAudit2026.courses).map(rule => rule.sourceUrl);
assert.equal(new Set(syllabusCodes).size, 139);
assert.equal(new Set(syllabusUrls).size, 139);
Object.values(prerequisiteAudit2026.courses).forEach(rule => {
  assert.equal(rule.sourceUrl.includes(`sk=2026_2_${rule.syllabusCode}`), true);
  assert.equal(
    [...rule.requiredPrerequisites, ...rule.recommendedPrerequisites]
      .some(name => ['なし', '特に無し'].includes(name)),
    false,
  );
});

const catalogCourseNames = new Set(courses2026.map(course => normalizeCourseName(course.name)));
const unresolvedRequiredPrerequisites = [...new Set(
  Object.values(COURSE_RULES_2026)
    .flatMap(rule => rule.requiredPrerequisites)
    .filter(name => !catalogCourseNames.has(normalizeCourseName(name))),
)];
assert.deepEqual(unresolvedRequiredPrerequisites, []);

const auditedNames = new Set(Object.keys(COURSE_RULES_2026).map(normalizeCourseName));
courses2026.forEach(course => {
  const officialName = COURSE_RULE_ALIASES_2026[course.name] || course.name;
  if (auditedNames.has(normalizeCourseName(officialName))) {
    assert.equal(describeCourseOffering(course).prerequisites.verificationStatus, 'verified');
  }
});
assert.equal(
  Object.values(COURSE_RULES_2026)
    .filter(rule => (
      rule.requiredPrerequisites.length
      || rule.recommendedPrerequisites.length
      || rule.progressionRequirements?.length
    ))
    .length,
  39,
);

const financialEngineeringOffering = describeCourseOffering(find2026('金融工学'));
assert.equal(financialEngineeringOffering.prerequisites.verificationStatus, 'verified');
assert.deepEqual(financialEngineeringOffering.prerequisites.required, ['微分積分基礎', '確率統計基礎']);
assert.equal(financialEngineeringOffering.ruleSource.verifiedAt, '2026-09-25');

const financialDataAnalysisOffering = describeCourseOffering(find2026('金融データ解析'));
assert.equal(financialDataAnalysisOffering.prerequisites.verificationStatus, 'verified');
assert.deepEqual(financialDataAnalysisOffering.prerequisites.required, ['確率統計基礎', '多変量解析']);

assert.equal(describeCourseOffering(find2026('情報科学概論')).prerequisites.verificationStatus, 'verified');
[
  '教養スポーツ実習Ⅰ',
  '教養スポーツ実習Ⅱ',
  '教養ゼミ',
  '特別活動及び総合的な学習の時間',
].forEach(name => {
  assert.equal(describeCourseOffering(find2026(name)).prerequisites.verificationStatus, 'verified');
});
assert.deepEqual(describeCourseOffering(find2026('専門ゼミ１')).prerequisites.required, []);
assert.deepEqual(
  describeCourseOffering(find2026('専門ゼミ１')).prerequisites.progressionRequirements,
  ['2 年次までの必修科目（基礎領域および選択プログラム）の履修'],
);
assert.deepEqual(
  COURSE_RULES_2026['専門ゼミ1'].progressionRequirements,
  ['2 年次までの必修科目（基礎領域および選択プログラム）の履修'],
);

const teachingPracticePrerequisites = assessCourseEligibility({
  course: find2026('教育実習基礎講座Ⅰ'),
  completedCourses: [
    find2026('教師論'),
    find2026('教育方法論Ⅰ(ICT活用の理論及び実践を含む。)'),
    find2026('教育課程論'),
  ],
  studentYear: 3,
});
assert.deepEqual(teachingPracticePrerequisites.prerequisites.missingRequired, []);

const missingFinancialEngineeringPrerequisites = assessCourseEligibility({
  course: find2026('金融工学'),
  completedCourses: [],
  studentYear: 3,
});
assert.equal(missingFinancialEngineeringPrerequisites.status, 'ineligible');
assert.deepEqual(
  missingFinancialEngineeringPrerequisites.prerequisites.missingRequired,
  ['微分積分基礎', '確率統計基礎'],
);

const completedFinancialEngineeringPrerequisites = assessCourseEligibility({
  course: find2026('金融工学'),
  completedCourses: [find2026('微分積分基礎'), find2026('確率統計基礎')],
  studentYear: 3,
});
assert.equal(completedFinancialEngineeringPrerequisites.status, 'eligible');

const externalRecommendedPrerequisite = assessCourseEligibility({
  course: find2026('インターネットマーケティング'),
  completedCourses: [find2026('Python入門')],
  completedPrerequisites: ['機械学習入門'],
  studentYear: 4,
});
assert.deepEqual(externalRecommendedPrerequisite.prerequisites.missingRecommended, []);

const informationScienceOverview = find2026('情報科学概論');
assert.equal(informationScienceOverview.instructor, '小栁 淳二 他');
assert.equal(informationScienceOverview.room, '1142');

const appliedNumericalAnalysis = find2026('応用数値解析');
assert.equal(appliedNumericalAnalysis.schedule, '火金2');
assert.equal(appliedNumericalAnalysis.instructor, '矢敷 達朗');
assert.equal(appliedNumericalAnalysis.room, '525');

assert.equal(find2026('人間とロボットの共生').room, '532');
assert.equal(find2026('解析基礎').room, '1141');
assert.equal(find2026('周南地域と産業').instructor, '渡邉洋心');
assert.equal(find2026('教育実習Ⅰ').instructor, '大坂 遊/渡部 明');
assert.equal(find2026('教育実習Ⅰ').room, '対面');

const mcpModule = await import('./mcp.js');
assert.equal(typeof mcpModule.publicCourse, 'function');
assert.equal(typeof mcpModule.filterExternalPrerequisites, 'function');
if (typeof mcpModule.filterExternalPrerequisites === 'function') {
  assert.deepEqual(
    mcpModule.filterExternalPrerequisites(
      ['微分積分基礎', '機械学習入門'],
      courses2026,
    ),
    {
      accepted: ['機械学習入門'],
      ignoredCatalogCourses: ['微分積分基礎'],
    },
  );
}
if (typeof mcpModule.publicCourse === 'function') {
  const publicInformationScienceOverview = mcpModule.publicCourse(informationScienceOverview, 'DS');
  assert.equal(publicInformationScienceOverview.instructor, '小栁 淳二 他');
  assert.equal(publicInformationScienceOverview.room, '1142');
  assert.equal(mcpModule.publicCourse(find2026('医療情報システム'), 'DS').room, null);
}

const planningModule = await import('./planningTool.js');
assert.equal(typeof planningModule.courseSummary, 'function');
if (typeof planningModule.courseSummary === 'function') {
  const plannedInformationScienceOverview = planningModule.courseSummary(informationScienceOverview, 'DS', 2026);
  assert.equal(plannedInformationScienceOverview.instructor, '小栁 淳二 他');
  assert.equal(plannedInformationScienceOverview.room, '1142');
  assert.equal(planningModule.courseSummary(find2026('医療情報システム'), 'DS', 2026).room, null);
}

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
