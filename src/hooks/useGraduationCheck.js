import { useMemo } from 'react';

export function useGraduationCheck(facultyId, selectedCourseIds, targetProgram, coursesData) {
  return useMemo(() => {
    if (!coursesData || coursesData.length === 0) return null;

    const selectedSet = new Set(selectedCourseIds);
    const selectedCourses = selectedCourseIds.map(id => coursesData.find(c => c.id === id)).filter(Boolean);

    if (facultyId === 'econ') {
      // 経済経営学部の判定ルール
      let generalCredits = 0;
      let specBasicCredits = 0;
      let specCredits = 0; // 専門+演習の合計
      let otherDeptCredits = 0; // 自由科目扱い
      let teachingCredits = 0; // 卒業要件外（集計のみ）

      // 詳細カテゴリ別（経済独自のサブカテゴリ）
      const subCategoryCredits = {
        'A': 0, 'B': 0, 'C': 0, 'D': 0, // 総合
        'intro': 0, // 専門基礎-入門
        'econ': 0, 'mgmt': 0, 'global': 0, 'region': 0, // 専門基礎-基礎
        // 専門科目の系統別
        'econ_s': 0, 'mgmt_s': 0, 'global_s': 0, 'region_s': 0, 'law_s': 0, 'exercise_s': 0
      };

      selectedCourses.forEach(c => {
        const cat = c.category;
        const sub = c.subCategory;

        if (cat === 'general') {
          generalCredits += c.credits;
          if (sub && subCategoryCredits[sub] !== undefined) subCategoryCredits[sub] += c.credits;
        } else if (cat === 'specialized_basic') {
          specBasicCredits += c.credits;
          if (sub && subCategoryCredits[sub] !== undefined) subCategoryCredits[sub] += c.credits;
        } else if (cat === 'specialized' || cat === 'exercise') {
          // 便覧上「専門科目」に包含される
          specCredits += c.credits;
          if (sub && subCategoryCredits[sub] !== undefined) subCategoryCredits[sub] += c.credits;
        } else if (cat === 'teaching') {
          teachingCredits += c.credits;
        } else if (cat === 'other_dept') {
          otherDeptCredits += c.credits;
        }
      });

      const missingMandatory = coursesData
        .filter(c => c.required && !selectedSet.has(c.id))
        .map(c => c.name);

      const totalSpec = specCredits;
      
      // 自由科目枠の計算（教職単位を除外）
      const freeElectiveCredits = 
        Math.max(0, generalCredits - 29) + 
        Math.max(0, specBasicCredits - 34) + 
        Math.max(0, totalSpec - 28) + 
        otherDeptCredits;

      // 卒業要件にカウントされる合計単位（教職単位を除外）
      const totalCredits = generalCredits + specBasicCredits + totalSpec + otherDeptCredits;

      // 各カテゴリの判定
      const isGeneralOk = generalCredits >= 29 && 
                         subCategoryCredits.A >= 5 && 
                         subCategoryCredits.B >= 4 && 
                         subCategoryCredits.C >= 4 && 
                         subCategoryCredits.D >= 16 && 
                         missingMandatory.filter(n => coursesData.find(c => c.name === n).category === 'general').length === 0;

      const isSpecBasicOk = specBasicCredits >= 34 && 
                           subCategoryCredits.intro >= 14 && 
                           subCategoryCredits.econ >= 6 && 
                           subCategoryCredits.mgmt >= 6 && 
                           subCategoryCredits.global >= 2 && 
                           subCategoryCredits.region >= 2 && 
                           missingMandatory.filter(n => coursesData.find(c => c.name === n).category === 'specialized_basic').length === 0;

      const isSpecializedOk = totalSpec >= 28 && 
                              missingMandatory.filter(n => {
                                const c = coursesData.find(x => x.name === n);
                                return c && (c.category === 'specialized' || c.category === 'exercise');
                              }).length === 0;

      const isFreeElectiveOk = freeElectiveCredits >= 33;

      return {
        status: {
          total: { 
            current: totalCredits, 
            required: 124, 
            ok: totalCredits >= 124 && 
                missingMandatory.length === 0 && 
                isGeneralOk && 
                isSpecBasicOk && 
                isSpecializedOk && 
                isFreeElectiveOk
          },
          general: { 
            current: generalCredits, 
            required: 29, 
            ok: isGeneralOk,
            subStatus: [
              { label: 'A 人間形成', current: subCategoryCredits.A, target: 5, ok: subCategoryCredits.A >= 5 },
              { label: 'B 地域社会', current: subCategoryCredits.B, target: 4, ok: subCategoryCredits.B >= 4 },
              { label: 'C リベラルアーツ', current: subCategoryCredits.C, target: 4, ok: subCategoryCredits.C >= 4 },
              { label: 'D リテラシー', current: subCategoryCredits.D, target: 16, ok: subCategoryCredits.D >= 16 },
            ]
          },
          specBasic: { 
            current: specBasicCredits, 
            required: 34, 
            ok: isSpecBasicOk,
            subStatus: [
              { label: '入門', current: subCategoryCredits.intro, target: 14, ok: subCategoryCredits.intro >= 14 },
              { label: '経済学', current: subCategoryCredits.econ, target: 6, ok: subCategoryCredits.econ >= 6 },
              { label: '経営学', current: subCategoryCredits.mgmt, target: 6, ok: subCategoryCredits.mgmt >= 6 },
              { label: 'グローバル', current: subCategoryCredits.global, target: 2, ok: subCategoryCredits.global >= 2 },
              { label: '地域デザイン', current: subCategoryCredits.region, target: 2, ok: subCategoryCredits.region >= 2 },
            ]
          },
          specialized: { 
            current: totalSpec, 
            required: 28, 
            ok: isSpecializedOk,
            subStatus: [
              { label: '専門ゼミ(演習)', current: subCategoryCredits.exercise_s, target: 8, ok: subCategoryCredits.exercise_s >= 8 },
            ]
          },
          freeElective: { 
            current: freeElectiveCredits, 
            required: 33, 
            ok: isFreeElectiveOk
          }
        },
        missingList: missingMandatory,
        missingCredits: Math.max(0, 124 - totalCredits)
      };
    } else {
      // 情報科学部の判定ルール (従来通り)
      let generalCredits = 0;
      let basicCredits = 0;
      let programCredits = 0;
      let exerciseCredits = 0;
      let otherCredits = 0;
      let practicalEnglishCredits = 0;
      
      const missingGeneral = coursesData.filter(c => c.category === 'general' && c.required && !selectedSet.has(c.id)).map(c => c.name);
      const missingBasic = coursesData.filter(c => (c.category === 'basic' || c.category === 'basic_english') && c.required && !selectedSet.has(c.id)).map(c => c.name);
      const missingProgram = coursesData.filter(c => c.category === 'program' && c.programMapping && c.programMapping[targetProgram.toLowerCase()] === '必修' && !selectedSet.has(c.id)).map(c => c.name);
      const missingExercise = coursesData.filter(c => c.category === 'exercise' && c.required && !selectedSet.has(c.id)).map(c => c.name);

      selectedCourses.forEach(course => {
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
        missingList: [...missingGeneral, ...missingBasic, ...missingProgram, ...missingExercise],
        missingCredits: Math.max(0, 124 - totalCredits)
      };
    }
  }, [facultyId, selectedCourseIds, targetProgram, coursesData]);
}
