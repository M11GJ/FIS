import { useMemo } from 'react';
import coursesData from '../data/courses.json';

export function useGraduationCheck(selectedCourseIds, targetProgram) {
  return useMemo(() => {
    let generalCredits = 0;
    let basicCredits = 0;
    let programCredits = 0;
    let exerciseCredits = 0;
    let otherCredits = 0;
    let practicalEnglishCredits = 0;
    
    const selectedSet = new Set(selectedCourseIds);
    const missingGeneral = coursesData.filter(c => c.category === 'general' && c.required && !selectedSet.has(c.id)).map(c => c.name);
    const missingBasic = coursesData.filter(c => (c.category === 'basic' || c.category === 'basic_english') && c.required && !selectedSet.has(c.id)).map(c => c.name);
    const missingProgram = coursesData.filter(c => c.category === 'program' && c.programMapping && c.programMapping[targetProgram.toLowerCase()] === '必修' && !selectedSet.has(c.id)).map(c => c.name);
    const missingExercise = coursesData.filter(c => c.category === 'exercise' && c.required && !selectedSet.has(c.id)).map(c => c.name);

    // Calculate credits from selected courses
    selectedCourseIds.forEach(id => {
      const course = coursesData.find(c => c.id === id);
      if (!course) return;

      if (course.category === 'general') {
        generalCredits += course.credits;
      } else if (course.category === 'basic' || course.category === 'basic_english') {
        basicCredits += course.credits;
        if (course.name.startsWith('実践英語')) {
          practicalEnglishCredits += course.credits;
        }
      } else if (course.category === 'program') {
        const pKey = targetProgram.toLowerCase();
        if (course.programMapping && course.programMapping[pKey]) {
          programCredits += course.credits;
        } else {
          basicCredits += course.credits;
        }
      } else if (course.category === 'exercise') {
        exerciseCredits += course.credits;
      } else if (course.category === 'other') {
        otherCredits += course.credits;
      }
    });

    const totalProgramAndBasic = basicCredits + programCredits;
    const totalCredits = generalCredits + totalProgramAndBasic + exerciseCredits + otherCredits;

    const freeElectiveCredits = Math.max(0, generalCredits - 19) + 
                                Math.max(0, totalProgramAndBasic - 80) + 
                                Math.max(0, exerciseCredits - 8) + 
                                Math.max(0, otherCredits - 4);

    return {
      status: {
        total: { current: totalCredits, required: 124, ok: totalCredits >= 124 && missingGeneral.length === 0 && missingBasic.length === 0 && missingProgram.length === 0 && missingExercise.length === 0 },
        general: { current: generalCredits, required: 19, ok: generalCredits >= 19 && missingGeneral.length === 0, missingList: missingGeneral },
        basicAndProgram: { current: totalProgramAndBasic, required: 80, ok: totalProgramAndBasic >= 80 && missingBasic.length === 0 && missingProgram.length === 0, missingList: [...missingBasic, ...missingProgram] },
        practicalEnglish: { current: practicalEnglishCredits, required: 4, ok: practicalEnglishCredits >= 4 },
        programSpecific: { current: programCredits, required: 22, ok: programCredits >= 22 && missingProgram.length === 0, missingList: missingProgram },
        exercise: { current: exerciseCredits, required: 8, ok: exerciseCredits >= 8 && missingExercise.length === 0, missingList: missingExercise },
        other: { current: otherCredits, required: 4, ok: otherCredits >= 4 },
        freeElective: { current: freeElectiveCredits, required: 13, ok: freeElectiveCredits >= 13 }
      },
      missingCredits: Math.max(0, 124 - totalCredits)
    };
  }, [selectedCourseIds, targetProgram]);
}
