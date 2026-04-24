/**
 * strip-rooms.js
 * GitHub Actions のビルド前に実行し、JSONデータから教室情報(room)を除去するスクリプト。
 * ローカルのファイルには影響しません（CIでのみ実行）。
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

// room フィールドを含む可能性のあるJSONファイル
const targetFiles = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('courses_') && f.endsWith('.json'));

targetFiles.forEach(file => {
  const filePath = path.join(DATA_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (Array.isArray(data)) {
    const stripped = data.map(course => {
      const { room, ...rest } = course;
      return rest;
    });
    fs.writeFileSync(filePath, JSON.stringify(stripped, null, 2) + '\n');
    console.log(`✅ Stripped "room" from ${file} (${stripped.length} courses)`);
  } else {
    console.log(`⏭️  Skipped ${file} (not an array)`);
  }
});

console.log('Done! All classroom data has been removed for deployment.');
