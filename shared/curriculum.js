export const SUPPORTED_ENTRY_YEARS = Object.freeze([2024, 2025, 2026]);

export const INFO_PROGRAMS = Object.freeze(['DS', 'IE', 'BA']);

export const INFO_GRADUATION_REQUIREMENTS = Object.freeze({
  totalCredits: 124,
  generalCredits: 19,
  basicAndProgramCredits: 80,
  practicalEnglishCredits: 4,
  programCredits: 22,
  exerciseCredits: 8,
  otherDepartmentCredits: 4,
  freeElectiveCredits: 13,
  thesisRequired: true,
});

export function normalizeEntryYear(value, fallback = 2024) {
  const year = Number(value);
  return SUPPORTED_ENTRY_YEARS.includes(year) ? year : fallback;
}

export function isCourseAvailableForEntryYear(course, entryYear) {
  const year = normalizeEntryYear(entryYear);
  return !Array.isArray(course.entryYears) || course.entryYears.includes(year);
}

export function getCoursesForEntryYear(courses, entryYear) {
  return courses.filter(course => isCourseAvailableForEntryYear(course, entryYear));
}
