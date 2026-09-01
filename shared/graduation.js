import { INFO_GRADUATION_REQUIREMENTS } from './curriculum.js';

export function calculateInformationGraduation(selectedCourseIds, targetProgram, coursesData) {
  if (!Array.isArray(coursesData) || coursesData.length === 0) return null;

  const program = String(targetProgram || 'DS').toLowerCase();
  const selectedSet = new Set(selectedCourseIds);
  const selectedCourses = coursesData.filter(course => selectedSet.has(course.id));
  let generalCredits = 0;
  let basicCredits = 0;
  let programCredits = 0;
  let exerciseCredits = 0;
  let otherCredits = 0;
  let practicalEnglishCredits = 0;

  const missingGeneral = coursesData.filter(course => course.category === 'general' && course.required && !selectedSet.has(course.id)).map(course => course.name);
  const missingBasic = coursesData.filter(course => ['basic', 'basic_english'].includes(course.category) && course.required && !selectedSet.has(course.id)).map(course => course.name);
  const missingProgram = coursesData.filter(course => course.category === 'program' && course.programMapping?.[program] === '必修' && !selectedSet.has(course.id)).map(course => course.name);
  const missingExercise = coursesData.filter(course => course.category === 'exercise' && course.required && !selectedSet.has(course.id)).map(course => course.name);

  selectedCourses.forEach(course => {
    if (course.category === 'general') generalCredits += course.credits;
    else if (['basic', 'basic_english'].includes(course.category)) {
      basicCredits += course.credits;
      if (course.name.startsWith('実践英語')) practicalEnglishCredits += course.credits;
    } else if (course.category === 'program') {
      if (course.programMapping?.[program]) programCredits += course.credits;
      else basicCredits += course.credits;
    } else if (course.category === 'exercise') exerciseCredits += course.credits;
    else if (course.category === 'other') otherCredits += course.credits;
  });

  const requirements = INFO_GRADUATION_REQUIREMENTS;
  const basicAndProgramCredits = basicCredits + programCredits;
  const totalCredits = generalCredits + basicAndProgramCredits + exerciseCredits + otherCredits;
  const freeElectiveCredits = Math.max(0, generalCredits - requirements.generalCredits)
    + Math.max(0, basicAndProgramCredits - requirements.basicAndProgramCredits)
    + Math.max(0, exerciseCredits - requirements.exerciseCredits)
    + Math.max(0, otherCredits - requirements.otherDepartmentCredits);
  const missingList = [...missingGeneral, ...missingBasic, ...missingProgram, ...missingExercise];

  return {
    status: {
      total: { current: totalCredits, required: requirements.totalCredits, ok: totalCredits >= requirements.totalCredits
          && generalCredits >= requirements.generalCredits
          && basicAndProgramCredits >= requirements.basicAndProgramCredits
          && practicalEnglishCredits >= requirements.practicalEnglishCredits
          && programCredits >= requirements.programCredits
          && exerciseCredits >= requirements.exerciseCredits
          && otherCredits >= requirements.otherDepartmentCredits
          && freeElectiveCredits >= requirements.freeElectiveCredits
          && missingList.length === 0 },
      general: { current: generalCredits, required: requirements.generalCredits, ok: generalCredits >= requirements.generalCredits && missingGeneral.length === 0, missingList: missingGeneral },
      basicAndProgram: { current: basicAndProgramCredits, required: requirements.basicAndProgramCredits, ok: basicAndProgramCredits >= requirements.basicAndProgramCredits && missingBasic.length === 0 && missingProgram.length === 0, missingList: [...missingBasic, ...missingProgram] },
      practicalEnglish: { current: practicalEnglishCredits, required: requirements.practicalEnglishCredits, ok: practicalEnglishCredits >= requirements.practicalEnglishCredits },
      programSpecific: { current: programCredits, required: requirements.programCredits, ok: programCredits >= requirements.programCredits && missingProgram.length === 0, missingList: missingProgram },
      exercise: { current: exerciseCredits, required: requirements.exerciseCredits, ok: exerciseCredits >= requirements.exerciseCredits && missingExercise.length === 0, missingList: missingExercise },
      other: { current: otherCredits, required: requirements.otherDepartmentCredits, ok: otherCredits >= requirements.otherDepartmentCredits },
      freeElective: { current: freeElectiveCredits, required: requirements.freeElectiveCredits, ok: freeElectiveCredits >= requirements.freeElectiveCredits },
    },
    missingList,
    missingCredits: Math.max(0, requirements.totalCredits - totalCredits),
    notes: requirements.thesisRequired ? ['卒業論文の提出・合格は単位チェックとは別に必要です'] : [],
  };
}
