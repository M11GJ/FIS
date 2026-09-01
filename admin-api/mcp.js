import { McpServer } from '@modelcontextprotocol/server';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import * as z from 'zod/v4';
import courses from '../src/data/courses_info.json' with { type: 'json' };
import {
  getCoursesForEntryYear,
  INFO_GRADUATION_REQUIREMENTS,
  INFO_PROGRAMS,
  SUPPORTED_ENTRY_YEARS,
} from '../shared/curriculum.js';
import { calculateInformationGraduation } from '../shared/graduation.js';
import { registerPlanningTool } from './planningTool.js';

const yearSchema = z.union([z.literal(2024), z.literal(2025), z.literal(2026)]);
const programSchema = z.enum(INFO_PROGRAMS);

function textResult(value) {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
  };
}

function normalizeName(value) {
  return String(value).replace(/\s+/g, '').replace(/[（）()]/g, '').toLowerCase();
}

function publicCourse(course, program) {
  const programType = course.programMapping?.[program.toLowerCase()] || null;
  return {
    id: course.id,
    name: course.name,
    credits: course.credits,
    term: course.term,
    category: course.category,
    required: course.required === true || programType === '必修',
    programType,
  };
}

function resolveCompletedCourses(values, availableCourses) {
  const byId = new Map(availableCourses.map(course => [course.id, course]));
  const byName = new Map(availableCourses.map(course => [normalizeName(course.name), course]));
  const resolvedIds = new Set();
  const unmatched = [];

  values.forEach(value => {
    const candidate = String(value).trim();
    const course = byId.get(candidate) || byName.get(normalizeName(candidate));
    if (course) resolvedIds.add(course.id);
    else if (candidate) unmatched.push(candidate);
  });
  return { courseIds: [...resolvedIds], unmatched };
}

export function createFisMcpServer() {
  const server = new McpServer({ name: 'fis-graduation-checker', version: '2.0.0' });

  server.registerTool('list_supported_entry_years', {
    title: '対応入学年度一覧',
    description: 'FISが情報科学部の卒業要件を判定できる入学年度を返します。',
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async () => textResult({ faculty: '情報科学部', entryYears: SUPPORTED_ENTRY_YEARS }));

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
    notes: ['卒業論文の提出・合格は別途確認が必要です', '最終判断は学生便覧と大学の案内を優先してください'],
  }));

  server.registerTool('search_courses', {
    title: '科目検索',
    description: '指定入学年度の情報科学部科目を、科目名・区分・プログラムで検索します。',
    inputSchema: z.object({
      entryYear: yearSchema,
      program: programSchema.default('DS'),
      query: z.string().max(100).optional(),
      category: z.enum(['general', 'basic', 'basic_english', 'program', 'exercise', 'other', 'teaching']).optional(),
    }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async ({ entryYear, program, query, category }) => {
    const normalizedQuery = normalizeName(query || '');
    const matches = getCoursesForEntryYear(courses, entryYear)
      .filter(course => !category || course.category === category)
      .filter(course => !normalizedQuery || normalizeName(course.name).includes(normalizedQuery))
      .slice(0, 100)
      .map(course => publicCourse(course, program));
    return textResult({ entryYear, program, count: matches.length, courses: matches });
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
