export const FACULTY_CONFIG = {
  info: {
    id: 'info',
    name: '情報科学部',
    color: 'var(--color-info)',
    programs: ['DS', 'IE', 'BA'],
    graduationRules: {
      total: 124,
      general: { required: 19 },
      basicAndProgram: { required: 80 },
      practicalEnglish: { required: 4 },
      programSpecific: { required: 22 },
      exercise: { required: 8 },
      other: { required: 4 },
      freeElective: { required: 13 }
    }
  },
  econ: {
    id: 'econ',
    name: '経済経営学部',
    color: 'var(--color-econ)',
    programs: ['なし'], // No specific programs like DS/IE/BA
    graduationRules: {
      total: 124,
      general: { required: 29 }, // A:5+, B:4+, C:4+, D:16+
      specializedBasic: { required: 34 }, // Introductory: 14, ...
      specialized: { required: 28 }, // Exercise: 8...
      freeElective: { required: 33 }
    }
  }
};
