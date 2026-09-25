/**
 * 教室情報の任意ローカル上書きユーティリティ
 * 公開データの room を通常使用し、rooms.json が存在する環境だけ値を上書きする。
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
 * @returns {Array} - rooms.jsonがあれば教室を上書きしたコース配列
 */
export function mergeRooms(courses) {
  if (!roomsData) return courses;
  return courses.map(course => ({
    ...course,
    room: roomsData[course.id] || course.room || null,
  }));
}
