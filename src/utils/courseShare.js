const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export const COURSE_SHARE_VERSION = '2';

const LEGACY_RESTRICTED_COURSE_IDS = new Set([
  'c_14751b09',
  'c_3016f954',
  'c_3c3e2630',
  'c_8a3e0b1c',
]);

export const getSortedCourses = courses => [...courses].sort((a, b) => a.id.localeCompare(b.id));

export function encodeCourseSelection(selectedIds, sortedCourses) {
  const bits = sortedCourses.map(course => (selectedIds.has(course.id) ? '1' : '0')).join('');
  let encoded = '';
  for (let index = 0; index < bits.length; index += 6) {
    const segment = bits.substring(index, index + 6).padEnd(6, '0');
    encoded += B64_CHARS[Number.parseInt(segment, 2)];
  }
  return encoded;
}

export function decodeCourseSelection(encoded, sortedCourses) {
  const bits = [...encoded]
    .map(character => B64_CHARS.indexOf(character))
    .filter(value => value >= 0)
    .map(value => value.toString(2).padStart(6, '0'))
    .join('');

  return new Set(sortedCourses
    .filter((_course, index) => bits[index] === '1')
    .map(course => course.id));
}

export function getShareDecodingCourses(courses, { entryYear, version, encoded }) {
  const isLegacyRestrictedCatalog = (
    version !== COURSE_SHARE_VERSION
    && [2024, 2025].includes(Number(entryYear))
    && encoded.length === 24
  );
  return getSortedCourses(isLegacyRestrictedCatalog
    ? courses.filter(course => !LEGACY_RESTRICTED_COURSE_IDS.has(course.id))
    : courses);
}
