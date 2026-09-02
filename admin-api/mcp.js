import { McpServer } from '@modelcontextprotocol/server';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import * as z from 'zod/v4';
import {
  getCoursesForEntryYear,
  INFO_GRADUATION_REQUIREMENTS,
  INFO_PROGRAMS,
  SUPPORTED_ENTRY_YEARS,
} from '../shared/curriculum.js';
import { calculateInformationGraduation } from '../shared/graduation.js';
import {
  assessCourseEligibility,
  assessProgression,
  describeCourseOffering,
  findScheduleConflicts,
  normalizeCourseName,
} from '../shared/coursePlanning.js';
import {
  COURSE_RULE_SOURCES,
  COURSE_RULES_ACADEMIC_YEAR,
  REGISTRATION_RULES,
} from '../shared/courseRules.js';
import courses from './courseData.js';
import { registerPlanningTool } from './planningTool.js';

const yearSchema = z.union([z.literal(2024), z.literal(2025), z.literal(2026)]);
const academicYearSchema = z.literal(COURSE_RULES_ACADEMIC_YEAR);
const programSchema = z.enum(INFO_PROGRAMS);
const studentYearSchema = z.number().int().min(1).max(4);

function textResult(value) {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
  };
}

function publicCourse(course, program, academicYear = COURSE_RULES_ACADEMIC_YEAR) {
  const programType = course.programMapping?.[program.toLowerCase()] || null;
  return {
    id: course.id,
    name: course.name,
    credits: course.credits,
    term: course.term,
    category: course.category,
    required: course.required === true || programType === '必修',
    programType,
    offering: describeCourseOffering(course, academicYear),
  };
}

function resolveCompletedCourses(values, availableCourses) {
  const byId = new Map(availableCourses.map(course => [course.id, course]));
  const byName = new Map(availableCourses.map(course => [normalizeCourseName(course.name), course]));
  const resolvedIds = new Set();
  const unmatched = [];

  values.forEach(value => {
    const candidate = String(value).trim();
    const course = byId.get(candidate) || byName.get(normalizeCourseName(candidate));
    if (course) resolvedIds.add(course.id);
    else if (candidate) unmatched.push(candidate);
  });
  return {
    courseIds: [...resolvedIds],
    courses: availableCourses.filter(course => resolvedIds.has(course.id)),
    unmatched,
  };
}

function resolveOneCourse(value, availableCourses) {
  const candidate = String(value || '').trim();
  return availableCourses.find(course => (
    course.id === candidate || normalizeCourseName(course.name) === normalizeCourseName(candidate)
  )) || null;
}

export function createFisMcpServer() {
  const server = new McpServer({ name: 'fis-graduation-checker', version: '2.1.0' });

  server.registerTool('list_supported_entry_years', {
    title: '対応入学年度一覧',
    description: 'FISが情報科学部の卒業要件を判定できる入学年度を返します。',
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async () => textResult({
    faculty: '情報科学部',
    entryYears: SUPPORTED_ENTRY_YEARS,
    scheduleAcademicYears: [COURSE_RULES_ACADEMIC_YEAR],
    distinction: 'entryYearは卒業要件、academicYearは実際の開講・時間割、studentYearは修得状況上の年次です。',
  }));

  server.registerTool('get_graduation_requirements', {
    title: '卒業要件の取得',
    description: '指定した入学年度とプログラムに対する情報科学部の卒業要件を返します。',
    inputSchema: z.object({ entryYear: yearSchema, program: programSchema }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async ({ entryYear, program }) => textResult({
    faculty: '情報科学部',
    entryYear,
    program,
    requirements: INFO_GRADUATION_REQUIREMENTS,
    registrationRules: REGISTRATION_RULES,
    notes: [
      '卒業論文の提出・合格は別途確認が必要です。',
      '情報科学部の年次は修得状況で定義され、入学年度と直接は一致しません。',
      '最終判断は学生便覧・シラバスと大学の案内を優先してください。',
    ],
  }));

  server.registerTool('search_courses', {
    title: '科目検索',
    description: '指定入学年度の情報科学部科目を、科目名・区分・プログラムで検索します。',
    inputSchema: z.object({
      entryYear: yearSchema,
      academicYear: academicYearSchema.default(COURSE_RULES_ACADEMIC_YEAR),
      program: programSchema.default('DS'),
      query: z.string().max(100).optional(),
      category: z.enum(['general', 'basic', 'basic_english', 'program', 'exercise', 'other', 'teaching']).optional(),
      offset: z.number().int().min(0).default(0),
      limit: z.number().int().min(1).max(200).default(50),
    }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async ({ entryYear, academicYear, program, query, category, offset, limit }) => {
    const normalizedQuery = normalizeCourseName(query || '');
    const filtered = getCoursesForEntryYear(courses, entryYear)
      .filter(course => !category || course.category === category)
      .filter(course => !normalizedQuery || normalizeCourseName(course.name).includes(normalizedQuery));
    const matches = filtered
      .slice(offset, offset + limit)
      .map(course => publicCourse(course, program, academicYear));
    return textResult({
      entryYear,
      academicYear,
      program,
      total: filtered.length,
      offset,
      limit,
      count: matches.length,
      hasMore: offset + matches.length < filtered.length,
      courses: matches,
    });
  });

  server.registerTool('check_course_eligibility', {
    title: '科目の履修可否確認',
    description: '配当年次、既修得、先修条件、年間48単位上限、同時に計画する科目との時間重複から、指定科目の履修可否を確認します。4年次から2年次配当科目を履修する場合も判定できます。',
    inputSchema: z.object({
      entryYear: yearSchema,
      academicYear: academicYearSchema.default(COURSE_RULES_ACADEMIC_YEAR),
      studentYear: studentYearSchema,
      program: programSchema.default('DS'),
      course: z.string().min(1).max(200),
      completedCourses: z.array(z.string().min(1).max(200)).max(300).default([]),
      equivalentPrerequisites: z.array(z.string().min(1).max(200)).max(20).default([])
        .describe('シラバスが同等知識を認める場合に、本人が修得相当と申告する先修科目名'),
      otherPlannedCourses: z.array(z.string().min(1).max(200)).max(50).default([]),
      plannedCreditsThisAcademicYear: z.number().min(0).max(100).default(0)
        .describe('判定対象科目を追加する前の当該年度の履修計画単位数'),
    }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async ({
    entryYear,
    academicYear,
    studentYear,
    program,
    course: courseInput,
    completedCourses,
    equivalentPrerequisites,
    otherPlannedCourses,
    plannedCreditsThisAcademicYear,
  }) => {
    const availableCourses = getCoursesForEntryYear(courses, entryYear);
    const target = resolveOneCourse(courseInput, availableCourses);
    if (!target) {
      return textResult({
        found: false,
        course: courseInput,
        entryYear,
        message: '指定した入学年度の科目IDまたは完全な科目名に一致しません。search_coursesで確認してください。',
      });
    }
    const completed = resolveCompletedCourses(completedCourses, availableCourses);
    const planned = resolveCompletedCourses(otherPlannedCourses, availableCourses);
    return textResult({
      faculty: '情報科学部',
      entryYear,
      academicYear,
      program,
      course: publicCourse(target, program, academicYear),
      unmatchedCompletedCourses: completed.unmatched,
      unmatchedPlannedCourses: planned.unmatched,
      assessment: assessCourseEligibility({
        course: target,
        completedCourses: completed.courses,
        equivalentPrerequisites,
        otherPlannedCourses: planned.courses.filter(course => course.id !== target.id),
        studentYear,
        plannedCreditsThisAcademicYear,
        academicYear,
      }),
      disclaimer: '参考判定です。例外承認、休学・留学、クラス指定、最新の開講変更は教務課・最新シラバスへ確認してください。',
    });
  });

  server.registerTool('check_schedule_conflicts', {
    title: '時間割重複チェック',
    description: '2026年度の開講期・曜日・時限から科目間の重複を確認します。オンデマンドは通常の時限重複から除外し、集中講義・未定・選択時限は要確認として返します。',
    inputSchema: z.object({
      entryYear: yearSchema,
      academicYear: academicYearSchema.default(COURSE_RULES_ACADEMIC_YEAR),
      program: programSchema.default('DS'),
      courses: z.array(z.string().min(1).max(200)).min(1).max(50),
    }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async ({ entryYear, academicYear, program, courses: courseInputs }) => {
    const availableCourses = getCoursesForEntryYear(courses, entryYear);
    const resolved = resolveCompletedCourses(courseInputs, availableCourses);
    return textResult({
      faculty: '情報科学部',
      entryYear,
      academicYear,
      program,
      matchedCourses: resolved.courses.map(course => publicCourse(course, program, academicYear)),
      unmatchedCourses: resolved.unmatched,
      result: findScheduleConflicts(resolved.courses, academicYear),
      disclaimer: '2026年度データによる参考判定です。クラス指定・補講・開講変更は最新時間割で確認してください。',
    });
  });

  server.registerTool('assess_progression_risk', {
    title: '進級・卒業遅延リスク判定',
    description: '情報科学部独自の年次定義、専門ゼミ1の64単位・基礎必修16単位・1プログラム必修8単位、卒業研究の先修条件から、次の節目を妨げる不足を返します。',
    inputSchema: z.object({
      entryYear: yearSchema,
      studentYear: studentYearSchema,
      program: programSchema,
      completedCourses: z.array(z.string().min(1).max(200)).max(300),
      additionalRecognizedCredits: z.number().min(0).max(124).default(0)
        .describe('科目一覧に一致しないが大学に認定済みで、専門ゼミ1の合計64単位へ算入できる単位数'),
    }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async ({ entryYear, studentYear, program, completedCourses, additionalRecognizedCredits }) => {
    const availableCourses = getCoursesForEntryYear(courses, entryYear);
    const completed = resolveCompletedCourses(completedCourses, availableCourses);
    return textResult({
      faculty: '情報科学部',
      entryYear,
      studentYear,
      program,
      unmatchedCourses: completed.unmatched,
      progression: assessProgression({
        completedCourses: completed.courses,
        courses: availableCourses,
        studentYear,
        additionalRecognizedCredits,
      }),
      graduationStatus: calculateInformationGraduation(completed.courseIds, program, availableCourses),
      sources: {
        handbook: COURSE_RULE_SOURCES.handbook[entryYear],
        syllabusAcademicYear: COURSE_RULES_ACADEMIC_YEAR,
        syllabusVerifiedAt: COURSE_RULE_SOURCES.verifiedAt,
      },
      disclaimer: '「留年」の確定判定ではなく、専門ゼミ・卒業研究・4年卒業が遅れる可能性を示す参考情報です。最終判断は大学へ確認してください。',
    });
  });

  registerPlanningTool(server);

  server.registerTool('check_graduation', {
    title: '卒業要件判定',
    description: '科目IDまたは完全な科目名の一覧から、指定年度の情報科学部卒業要件を決定論的に判定します。入力内容は保存しません。',
    inputSchema: z.object({
      entryYear: yearSchema,
      program: programSchema,
      completedCourses: z.array(z.string().min(1).max(200)).max(300),
    }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async ({ entryYear, program, completedCourses }) => {
    const availableCourses = getCoursesForEntryYear(courses, entryYear);
    const { courseIds, unmatched } = resolveCompletedCourses(completedCourses, availableCourses);
    const result = calculateInformationGraduation(courseIds, program, availableCourses);
    return textResult({
      faculty: '情報科学部',
      entryYear,
      program,
      matchedCourseCount: courseIds.length,
      unmatchedCourses: unmatched,
      result,
      disclaimer: '参考判定です。最終的な卒業可否は大学へ確認してください。',
    });
  });

  return server;
}

export async function handleMcpRequest(req, res) {
  const server = createFisMcpServer();
  const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => void server.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
