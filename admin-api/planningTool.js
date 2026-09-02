import * as z from 'zod/v4';
import { getCoursesForEntryYear } from '../shared/curriculum.js';
import { calculateInformationGraduation } from '../shared/graduation.js';
import { describeCourseOffering } from '../shared/coursePlanning.js';
import { COURSE_RULES_ACADEMIC_YEAR, REGISTRATION_RULES } from '../shared/courseRules.js';
import courses from './courseData.js';

const yearSchema = z.union([z.literal(2024), z.literal(2025), z.literal(2026)]);
const programSchema = z.enum(['DS', 'IE', 'BA']);

const normalizeName = value => String(value).replace(/\s+/g, '').replace(/[（）()]/g, '').toLowerCase();

function resolve(values, availableCourses) {
  const byId = new Map(availableCourses.map(course => [course.id, course]));
  const byName = new Map(availableCourses.map(course => [normalizeName(course.name), course]));
  const selected = new Set();
  const unmatched = [];
  values.forEach(value => {
    const raw = String(value).trim();
    const course = byId.get(raw) || byName.get(normalizeName(raw));
    if (course) selected.add(course.id);
    else if (raw) unmatched.push(raw);
  });
  return { selected, unmatched };
}

function courseSummary(course, program, academicYear) {
  return {
    id: course.id,
    name: course.name,
    credits: course.credits,
    term: course.term,
    category: course.category,
    programType: course.programMapping?.[program.toLowerCase()] || null,
    offering: describeCourseOffering(course, academicYear),
  };
}

export function registerPlanningTool(server) {
  server.registerTool('plan_remaining_courses', {
    title: '残り履修計画の材料',
    description: '未修得の必修科目を最低配当年次別に整理し、区分別の不足単位、2026年度の時間割・先修条件、選択科目候補を返します。',
    inputSchema: z.object({
      entryYear: yearSchema,
      academicYear: z.literal(COURSE_RULES_ACADEMIC_YEAR).default(COURSE_RULES_ACADEMIC_YEAR),
      program: programSchema,
      completedCourses: z.array(z.string().min(1).max(200)).max(300),
      electiveCandidateLimit: z.number().int().min(0).max(100).default(30),
    }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async ({ entryYear, academicYear, program, completedCourses, electiveCandidateLimit }) => {
    const availableCourses = getCoursesForEntryYear(courses, entryYear);
    const { selected, unmatched } = resolve(completedCourses, availableCourses);
    const programKey = program.toLowerCase();
    const isRequired = course => (
      (course.category !== 'program' && course.required === true)
      || (course.category === 'program' && course.programMapping?.[programKey] === '必修')
    );
    const missingRequired = availableCourses.filter(course => isRequired(course) && !selected.has(course.id));
    const requiredByYear = { 1: [], 2: [], 3: [], 4: [], other: [] };
    missingRequired.forEach(course => {
      const year = Number.parseInt(String(course.term).charAt(0), 10);
      const key = [1, 2, 3, 4].includes(year) ? year : 'other';
      requiredByYear[key].push(courseSummary(course, program, academicYear));
    });

    const result = calculateInformationGraduation([...selected], program, availableCourses);
    const remainingMinimumCredits = Object.fromEntries(
      Object.entries(result.status)
        .filter(([key]) => key !== 'total')
        .map(([key, value]) => [key, Math.max(0, value.required - value.current)]),
    );
    const allElectiveCandidates = availableCourses
      .filter(course => !selected.has(course.id) && !isRequired(course) && course.category !== 'teaching')
      .map(course => courseSummary(course, program, academicYear));
    const electiveCandidates = allElectiveCandidates.slice(0, electiveCandidateLimit);

    const output = {
      faculty: '情報科学部',
      entryYear,
      academicYear,
      program,
      unmatchedCourses: unmatched,
      missingRequiredByAcademicYear: requiredByYear,
      remainingMinimumCredits,
      electiveCandidateTotal: allElectiveCandidates.length,
      electiveCandidates,
      electiveCandidatesTruncated: electiveCandidates.length < allElectiveCandidates.length,
      currentStatus: result,
      registrationRules: REGISTRATION_RULES,
      cautions: [
        '配当年次は最低学年です。上級年次から下級年次配当科目を履修することは原則可能ですが、先修条件・時間割・既修得を確認してください。',
        '履修登録上限は原則として半期24単位・年間48単位です。個別科目の判定にはcheck_course_eligibilityを使用してください。',
        '曜日・時限は2026年度データです。開講変更やクラス指定は最新の時間割で確認してください。',
        '卒業論文の提出・合格は別途必要です。',
      ],
    };
    return {
      content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
      structuredContent: output,
    };
  });
}
