import {
  COURSE_RULES_2026,
  COURSE_RULES_ACADEMIC_YEAR,
  REGISTRATION_RULES,
} from './courseRules.js';

const WEEKDAYS = Object.freeze(['月', '火', '水', '木', '金', '土', '日']);
const QUARTER_SYMBOLS = Object.freeze({ '①': 1, '②': 2, '③': 3, '④': 4 });

export function normalizeCourseName(value) {
  return String(value || '').replace(/\s+/g, '').replace(/[（）()]/g, '').toLowerCase();
}

export function minimumStudentYearFromTerm(term) {
  const match = String(term || '').match(/^([1-8])/);
  return match ? Number(match[1]) : null;
}

export function academicPeriodsFromTerm(term) {
  const raw = String(term || '');
  const explicitQuarters = [...raw]
    .map(symbol => QUARTER_SYMBOLS[symbol])
    .filter(Boolean);
  if (explicitQuarters.length) return [...new Set(explicitQuarters)];
  if (raw.includes('前')) return [1, 2];
  if (raw.includes('後')) return [3, 4];
  if (raw.includes('通')) return [1, 2, 3, 4];
  return [];
}

export function parseCourseSchedule(schedule) {
  const raw = String(schedule || '').trim();
  if (!raw || raw === '-') {
    return {
      raw,
      status: 'unknown',
      deliveryMode: 'unknown',
      meetingSlots: [],
      conflictFree: false,
    };
  }
  if (raw.includes('オンデマンド')) {
    return {
      raw,
      status: 'on_demand',
      deliveryMode: 'on_demand',
      meetingSlots: [],
      conflictFree: true,
    };
  }
  if (raw.includes('集中')) {
    return {
      raw,
      status: 'intensive',
      deliveryMode: 'intensive_or_irregular',
      meetingSlots: [],
      conflictFree: false,
    };
  }

  const days = WEEKDAYS.filter(day => raw.includes(day));
  const periods = [...new Set((raw.match(/[1-9]/g) || []).map(Number))];
  const meetingSlots = days.flatMap(day => periods.map(period => ({ day, period })));
  const ambiguous = /又は|または|いずれか/.test(raw);
  return {
    raw,
    status: meetingSlots.length ? (ambiguous ? 'ambiguous' : 'scheduled') : 'unknown',
    deliveryMode: 'scheduled',
    meetingSlots,
    conflictFree: false,
  };
}

export function getCourseRule(course, academicYear = COURSE_RULES_ACADEMIC_YEAR) {
  if (Number(academicYear) !== COURSE_RULES_ACADEMIC_YEAR) return null;
  const normalizedName = normalizeCourseName(course?.name || course);
  const entry = Object.entries(COURSE_RULES_2026)
    .find(([name]) => normalizeCourseName(name) === normalizedName);
  return entry ? entry[1] : null;
}

export function describeCourseOffering(course, academicYear = COURSE_RULES_ACADEMIC_YEAR) {
  const rule = getCourseRule(course, academicYear);
  const schedule = parseCourseSchedule(course?.schedule);
  return {
    academicYear,
    minimumStudentYear: rule?.minimumStudentYear ?? minimumStudentYearFromTerm(course?.term),
    allocationMeaning: 'minimum_year',
    academicPeriods: academicPeriodsFromTerm(course?.term),
    schedule: schedule.raw,
    scheduleStatus: schedule.status,
    deliveryMode: rule?.deliveryMode || schedule.deliveryMode,
    meetingSlots: schedule.meetingSlots,
    timedConflictExempt: schedule.conflictFree,
    prerequisites: {
      verificationStatus: rule ? 'verified' : 'not_verified',
      required: [...(rule?.requiredPrerequisites || [])],
      recommended: [...(rule?.recommendedPrerequisites || [])],
      equivalentKnowledgeAllowed: rule?.equivalentKnowledgeAllowed === true,
    },
    ruleSource: rule ? {
      kind: 'official_syllabus',
      syllabusCode: rule.syllabusCode,
      url: rule.sourceUrl,
      verified: true,
    } : {
      kind: 'course_data_and_handbook',
      verified: false,
    },
    notes: [...(rule?.notes || [])],
  };
}

function intersects(left, right) {
  const rightSet = new Set(right);
  return left.filter(value => rightSet.has(value));
}

export function findScheduleConflicts(courseList, academicYear = COURSE_RULES_ACADEMIC_YEAR) {
  const described = courseList.map(course => ({
    course,
    offering: describeCourseOffering(course, academicYear),
  }));
  const conflicts = [];
  const unconfirmed = described
    .filter(({ offering }) => ['unknown', 'intensive'].includes(offering.scheduleStatus))
    .map(({ course, offering }) => ({
      id: course.id,
      name: course.name,
      schedule: offering.schedule,
      academicPeriods: offering.academicPeriods,
      reason: offering.scheduleStatus === 'intensive'
        ? '集中講義等の実施日時は個別確認が必要です。'
        : '曜日・時限が未確定のため重複判定できません。',
    }));

  for (let leftIndex = 0; leftIndex < described.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < described.length; rightIndex += 1) {
      const left = described[leftIndex];
      const right = described[rightIndex];
      if (left.offering.timedConflictExempt || right.offering.timedConflictExempt) continue;
      const periods = intersects(left.offering.academicPeriods, right.offering.academicPeriods);
      if (!periods.length) continue;
      const rightSlots = new Set(right.offering.meetingSlots.map(slot => `${slot.day}${slot.period}`));
      const slots = left.offering.meetingSlots.filter(slot => rightSlots.has(`${slot.day}${slot.period}`));
      if (!slots.length) continue;
      const possible = [left.offering.scheduleStatus, right.offering.scheduleStatus].includes('ambiguous');
      conflicts.push({
        severity: possible ? 'possible_conflict' : 'conflict',
        left: { id: left.course.id, name: left.course.name, schedule: left.offering.schedule },
        right: { id: right.course.id, name: right.course.name, schedule: right.offering.schedule },
        overlappingAcademicPeriods: periods,
        overlappingSlots: slots,
        reason: possible
          ? '選択制の曜日・時限を含むため、実際のクラス指定を確認してください。'
          : '同じ開講期間の同一曜日・時限です。原則として両方は履修できません。',
      });
    }
  }

  return {
    academicYear,
    conflicts,
    unconfirmed,
    hasBlockingConflict: conflicts.some(conflict => conflict.severity === 'conflict'),
  };
}

export function assessCourseEligibility({
  course,
  completedCourses,
  equivalentPrerequisites = [],
  otherPlannedCourses = [],
  studentYear,
  plannedCreditsThisAcademicYear = 0,
  academicYear = COURSE_RULES_ACADEMIC_YEAR,
}) {
  const offering = describeCourseOffering(course, academicYear);
  const completedIds = new Set(completedCourses.map(item => item.id));
  const completedNames = new Set(completedCourses.map(item => normalizeCourseName(item.name)));
  const equivalentNames = new Set(equivalentPrerequisites.map(normalizeCourseName));
  const alreadyCompleted = completedIds.has(course.id) || completedNames.has(normalizeCourseName(course.name));
  const missingRequiredPrerequisites = offering.prerequisites.required.filter(name => {
    if (completedNames.has(normalizeCourseName(name))) return false;
    return !(offering.prerequisites.equivalentKnowledgeAllowed && equivalentNames.has(normalizeCourseName(name)));
  });
  const missingRecommendedPrerequisites = offering.prerequisites.recommended
    .filter(name => !completedNames.has(normalizeCourseName(name)));
  const yearEligible = offering.minimumStudentYear === null || studentYear >= offering.minimumStudentYear;
  const scheduleResult = findScheduleConflicts([course, ...otherPlannedCourses], academicYear);
  const targetConflicts = scheduleResult.conflicts.filter(conflict => (
    conflict.left.id === course.id || conflict.right.id === course.id
  ));
  const totalAfterRegistration = plannedCreditsThisAcademicYear + course.credits;
  const creditCapExceeded = totalAfterRegistration > REGISTRATION_RULES.annualCreditCap;
  const hardRequirementsSatisfied = (
    yearEligible
    && !alreadyCompleted
    && missingRequiredPrerequisites.length === 0
    && !targetConflicts.some(conflict => conflict.severity === 'conflict')
    && !creditCapExceeded
  );
  const targetAcademicPeriods = new Set(offering.academicPeriods);
  const requiresScheduleConfirmation = (
    targetConflicts.some(conflict => conflict.severity === 'possible_conflict')
    || scheduleResult.unconfirmed.some(item => (
      item.id === course.id
      || item.academicPeriods.some(period => targetAcademicPeriods.has(period))
    ))
  );
  const status = !hardRequirementsSatisfied
    ? 'ineligible'
    : (requiresScheduleConfirmation ? 'requires_confirmation' : 'eligible');

  return {
    status,
    eligible: status === 'eligible',
    provisionallyEligible: hardRequirementsSatisfied,
    requiresScheduleConfirmation,
    studentYear,
    minimumStudentYear: offering.minimumStudentYear,
    yearEligible,
    laterYearEnrollment: offering.minimumStudentYear !== null && studentYear > offering.minimumStudentYear,
    laterYearEnrollmentPolicy: yearEligible
      ? '配当年は最低学年を表すため、上級年次からの履修は原則可能です。'
      : '配当年に達していないため履修できません。',
    alreadyCompleted,
    prerequisites: {
      ...offering.prerequisites,
      missingRequired: missingRequiredPrerequisites,
      missingRecommended: missingRecommendedPrerequisites,
    },
    schedule: {
      ...scheduleResult,
      conflicts: targetConflicts,
    },
    annualCreditCap: {
      cap: REGISTRATION_RULES.annualCreditCap,
      before: plannedCreditsThisAcademicYear,
      after: totalAfterRegistration,
      exceeded: creditCapExceeded,
      exceptionMayApply: creditCapExceeded,
    },
    offering,
  };
}

export function assessProgression({
  completedCourses,
  courses,
  studentYear,
  additionalRecognizedCredits = 0,
}) {
  const completedIds = new Set(completedCourses.map(course => course.id));
  const basicRequired = courses.filter(course => course.category === 'basic' && course.required === true);
  const missingBasicRequired = basicRequired.filter(course => !completedIds.has(course.id));
  const completedBasicRequiredCredits = basicRequired
    .filter(course => completedIds.has(course.id))
    .reduce((sum, course) => sum + course.credits, 0);
  const catalogCourseCredits = courses
    .filter(course => completedIds.has(course.id) && course.category !== 'teaching')
    .reduce((sum, course) => sum + course.credits, 0);
  const completedTotalCredits = catalogCourseCredits + additionalRecognizedCredits;
  const programGates = ['DS', 'IE', 'BA'].map(program => {
    const key = program.toLowerCase();
    const requiredCourses = courses.filter(course => (
      course.category === 'program' && course.programMapping?.[key] === '必修'
    ));
    const missing = requiredCourses.filter(course => !completedIds.has(course.id));
    const credits = requiredCourses
      .filter(course => completedIds.has(course.id))
      .reduce((sum, course) => sum + course.credits, 0);
    return {
      program,
      completedCredits: credits,
      requiredCredits: 8,
      missingCourses: missing.map(course => course.name),
      ok: credits >= 8 && missing.length === 0,
    };
  });
  const seminar1 = courses.find(course => normalizeCourseName(course.name) === normalizeCourseName('専門ゼミ１'));
  const seminar2 = courses.find(course => normalizeCourseName(course.name) === normalizeCourseName('専門ゼミ２'));
  const foundationSeminar = courses.find(course => normalizeCourseName(course.name) === normalizeCourseName('教養ゼミ'));
  const foundationSeminarCompleted = Boolean(foundationSeminar && completedIds.has(foundationSeminar.id));
  const professionalSeminar1Eligible = (
    missingBasicRequired.length === 0
    && completedBasicRequiredCredits >= 16
    && programGates.some(gate => gate.ok)
    && completedTotalCredits >= 64
  );
  const graduationResearchEligible = Boolean(
    seminar1 && seminar2 && completedIds.has(seminar1.id) && completedIds.has(seminar2.id)
  );
  const risks = [];
  if (!foundationSeminarCompleted && studentYear >= 2) {
    risks.push({
      severity: studentYear >= 3 ? 'high' : 'warning',
      milestone: '2年次への進行',
      reason: '教養ゼミが未修得です。便覧上の2年次は教養ゼミ修得後と定義されています。',
    });
  }
  if (!professionalSeminar1Eligible && studentYear >= 2) {
    risks.push({
      severity: studentYear >= 3 ? 'high' : 'warning',
      milestone: '専門ゼミ１',
      reason: '専門ゼミ１の履修開始前までに64単位・学科基礎必修16単位・いずれか1プログラムの必修8単位が必要です。',
    });
  }
  if (!graduationResearchEligible && studentYear >= 3) {
    risks.push({
      severity: studentYear >= 4 ? 'high' : 'warning',
      milestone: '卒業研究',
      reason: '卒業研究の履修には専門ゼミ１と専門ゼミ２の両方の修得が必要です。',
    });
  }

  return {
    studentYear,
    handbookYearDefinition: '情報科学部の年次は修得状況で定義され、入学年度と直接は一致しません。',
    foundationSeminar: {
      completed: foundationSeminarCompleted,
      course: foundationSeminar?.name || '教養ゼミ',
    },
    professionalSeminar1: {
      eligible: professionalSeminar1Eligible,
      totalCredits: {
        current: completedTotalCredits,
        catalogCourseCredits,
        additionalRecognizedCredits,
        required: 64,
        ok: completedTotalCredits >= 64,
      },
      requiredBasic: {
        currentCredits: completedBasicRequiredCredits,
        requiredCredits: 16,
        missingCourses: missingBasicRequired.map(course => course.name),
        ok: missingBasicRequired.length === 0 && completedBasicRequiredCredits >= 16,
      },
      programRequired: {
        requirement: 'いずれか1プログラムの必修科目8単位をすべて修得',
        qualifyingPrograms: programGates.filter(gate => gate.ok).map(gate => gate.program),
        programs: programGates,
        ok: programGates.some(gate => gate.ok),
      },
    },
    graduationResearch: {
      eligible: graduationResearchEligible,
      requiredCourses: ['専門ゼミ１', '専門ゼミ２'],
      missingCourses: [seminar1, seminar2]
        .filter(course => course && !completedIds.has(course.id))
        .map(course => course.name),
    },
    risks,
    hasGraduationDelayRisk: risks.some(risk => risk.severity === 'high'),
  };
}
