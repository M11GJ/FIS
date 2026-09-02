import * as z from 'zod/v4';
import { getCoursesForEntryYear } from '../shared/curriculum.js';
import { calculateInformationGraduation } from '../shared/graduation.js';
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

function courseSummary(course, program) {
  return {
    id: course.id,
    name: course.name,
    credits: course.credits,
    term: course.term,
    category: course.category,
    programType: course.programMapping?.[program.toLowerCase()] || null,
  };
}

export function registerPlanningTool(server) {
  server.registerTool('plan_remaining_courses', {
    title: '残り履修計画の材料',
    description: '未修得の必修科目を配当年次別に整理し、区分別の不足単位と選択科目候補を返します。時間割や開講保証ではありません。',
    inputSchema: z.object({
      entryYear: yearSchema,
      program: programSchema,
      completedCourses: z.array(z.string().min(1).max(200)).max(300),
    }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async ({ entryYear, program, completedCourses }) => {
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
      requiredByYear[key].push(courseSummary(course, program));
    });

    const result = calculateInformationGraduation([...selected], program, availableCourses);
    const remainingMinimumCredits = Object.fromEntries(
      Object.entries(result.status)
        .filter(([key]) => key !== 'total')
        .map(([key, value]) => [key, Math.max(0, value.required - value.current)]),
    );
    const electiveCandidates = availableCourses
      .filter(course => !selected.has(course.id) && !isRequired(course) && course.category !== 'teaching')
      .map(course => courseSummary(course, program));

    const output = {
      faculty: '情報科学部',
      entryYear,
      program,
      unmatchedCourses: unmatched,
      missingRequiredByAcademicYear: requiredByYear,
      remainingMinimumCredits,
      electiveCandidates,
      currentStatus: result,
      cautions: [
        '配当年次は学生便覧上の目安であり、実際の年度・曜日・開講有無は最新の時間割で確認してください。',
        '卒業論文の提出・合格は別途必要です。',
      ],
    };
    return {
      content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
      structuredContent: output,
    };
  });
}
