/**
 * 教室情報のローカルマージユーティリティ
 * rooms.json が存在する場合（ローカル環境）のみ、コースデータに教室情報を付与する。
 * Web版（GitHub Pages）では rooms.json が存在しないため、教室情報は表示されない。
 */

let roomsData = null;

try {
  roomsData = import.meta.glob('../data/rooms.json', { eager: true });
  const key = Object.keys(roomsData)[0];
  roomsData = key ? roomsData[key].default || roomsData[key] : null;
} catch {
  roomsData = null;
}

/**
 * コース配列に教室情報をマージする
 * @param {Array} courses - コースデータの配列
 * @returns {Array} - room フィールドが付与されたコース配列（rooms.jsonがなければそのまま返す）
 */
export function mergeRooms(courses) {
  if (!roomsData) return courses;
  return courses.map(course => ({
    ...course,
    room: roomsData[course.id] || course.room || null,
  }));
}
