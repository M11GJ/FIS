export const COURSE_RULES_ACADEMIC_YEAR = 2026;

export const COURSE_RULE_SOURCES = Object.freeze({
  handbook: Object.freeze({
    2024: '（情報科学部）2024年度入学生用学生便覧.pdf',
    2025: '令和7(2025)年度入学生学生便覧.pdf',
    2026: '令和8(2026)年度入学生学生便覧.pdf',
  }),
  syllabusSearchUrl: 'https://aaaweb.shunan-u.ac.jp/aa_web/syllabus/se0010.aspx?me=EU&opi=mt0010',
  verifiedAt: '2026-09-02',
});
export const REGISTRATION_RULES = Object.freeze({
  annualCreditCap: 48,
  prerequisiteCompletionRequired: true,
  duplicateCompletedCourseAllowed: false,
  overlappingTimedCoursesAllowed: false,
  notes: Object.freeze([
    '年間履修登録上限は原則48単位です。成績等による例外は大学の最新案内を確認してください。',
    '単位修得済み科目は再履修できません。',
    '授業時間が重複する科目は原則として同時履修できません。',
    '先修条件を満たしていない科目は履修できません。',
  ]),
});

const syllabusUrl = code => (
  `https://aaaweb.shunan-u.ac.jp/aa_web/syllabus/se0032.aspx?me=EU&opi=mt0010&sk=2026_2_${code}&opi=se0021&syw=1`
);

export const COURSE_RULES_2026 = Object.freeze({
  'コミュニケーション英語Ⅰ': Object.freeze({
    syllabusCode: '1101200A',
    minimumStudentYear: 1,
    deliveryMode: 'on_demand',
    requiredPrerequisites: Object.freeze([]),
    recommendedPrerequisites: Object.freeze([]),
    sourceUrl: syllabusUrl('1101200A'),
  }),
  'コミュニケーション英語Ⅱ': Object.freeze({
    syllabusCode: '1101400A',
    minimumStudentYear: 1,
    deliveryMode: 'on_demand',
    requiredPrerequisites: Object.freeze(['コミュニケーション英語Ⅰ']),
    recommendedPrerequisites: Object.freeze([]),
    sourceUrl: syllabusUrl('1101400A'),
  }),
  'コミュニケーション英語Ⅲ': Object.freeze({
    syllabusCode: '1101600A',
    minimumStudentYear: 2,
    deliveryMode: 'on_demand',
    requiredPrerequisites: Object.freeze(['コミュニケーション英語Ⅰ', 'コミュニケーション英語Ⅱ']),
    recommendedPrerequisites: Object.freeze([]),
    sourceUrl: syllabusUrl('1101600A'),
  }),
  'コミュニケーション英語Ⅳ': Object.freeze({
    syllabusCode: '1101700A',
    minimumStudentYear: 2,
    deliveryMode: 'on_demand',
    requiredPrerequisites: Object.freeze([
      'コミュニケーション英語Ⅰ',
      'コミュニケーション英語Ⅱ',
      'コミュニケーション英語Ⅲ',
    ]),
    recommendedPrerequisites: Object.freeze([]),
    sourceUrl: syllabusUrl('1101700A'),
  }),
  Python応用: Object.freeze({
    syllabusCode: '2100400A',
    minimumStudentYear: 1,
    deliveryMode: 'on_demand',
    requiredPrerequisites: Object.freeze(['Python入門']),
    recommendedPrerequisites: Object.freeze([]),
    equivalentKnowledgeAllowed: true,
    notes: Object.freeze([
      '1年生はPython入門の単位認定前に履修登録するため、授業開始時点で同科目修得相当の知識・技術が必要です。',
    ]),
    sourceUrl: syllabusUrl('2100400A'),
  }),
  データの可視化: Object.freeze({
    syllabusCode: '2100800A',
    minimumStudentYear: 1,
    deliveryMode: 'on_demand',
    requiredPrerequisites: Object.freeze(['Python入門']),
    recommendedPrerequisites: Object.freeze([]),
    sourceUrl: syllabusUrl('2100800A'),
  }),
  データベース応用: Object.freeze({
    syllabusCode: '2022710A',
    minimumStudentYear: 3,
    deliveryMode: 'hyflex',
    requiredPrerequisites: Object.freeze(['データベース']),
    recommendedPrerequisites: Object.freeze([]),
    sourceUrl: syllabusUrl('2022710A'),
  }),
  オブジェクト指向プログラミング: Object.freeze({
    syllabusCode: '2102310A',
    minimumStudentYear: 3,
    deliveryMode: 'on_demand',
    requiredPrerequisites: Object.freeze([]),
    recommendedPrerequisites: Object.freeze(['Javaプログラミング']),
    sourceUrl: syllabusUrl('2102310A'),
  }),
  ソフトウェア工学: Object.freeze({
    syllabusCode: '2103900A',
    minimumStudentYear: 2,
    deliveryMode: 'hyflex',
    requiredPrerequisites: Object.freeze([]),
    recommendedPrerequisites: Object.freeze(['計算機概論', '情報エンジニアリング概論', 'データベース']),
    sourceUrl: syllabusUrl('2103900A'),
  }),
});
