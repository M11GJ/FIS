const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../graduation-checker/src/data/courses_economics.json');
const courses = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const missingCredits = [];
const missingSchedule = [];
const missingRoom = [];
const missingInstructor = [];

courses.forEach(c => {
  if (c.credits === null) missingCredits.push(c.name);
  if (c.schedule === null || c.schedule === '-' || c.schedule === '') missingSchedule.push(c.name);
  if (c.room === null || c.room === '-' || c.room === '') missingRoom.push(c.name);
  if (c.instructor === null || c.instructor === '-' || c.instructor === '' || c.instructor === '未定') missingInstructor.push(c.name);
});

console.log('--- 単位数(credits)が未設定 ---');
console.log(missingCredits.length + '件: ' + missingCredits.slice(0, 10).join(', ') + (missingCredits.length > 10 ? '...' : ''));

console.log('\n--- 曜日・時限(schedule)が未設定 ---');
console.log(missingSchedule.length + '件: ' + missingSchedule.slice(0, 10).join(', ') + (missingSchedule.length > 10 ? '...' : ''));

console.log('\n--- 教室(room)が未設定 ---');
console.log(missingRoom.length + '件: ' + missingRoom.slice(0, 10).join(', ') + (missingRoom.length > 10 ? '...' : ''));

console.log('\n--- 担当教員(instructor)が未設定 ---');
console.log(missingInstructor.length + '件: ' + missingInstructor.slice(0, 10).join(', ') + (missingInstructor.length > 10 ? '...' : ''));

// 全項目が欠落しているものも抽出
const allMissing = courses.filter(c => 
  c.credits === null && 
  (c.schedule === null || c.schedule === '-') && 
  (c.room === null || c.room === '-') && 
  (c.instructor === null || c.instructor === '-' || c.instructor === '未定')
);

console.log('\n--- 全ての詳細情報が未設定の科目 ---');
console.log(allMissing.length + '件: ' + allMissing.map(m => m.name).slice(0, 20).join(', ') + (allMissing.length > 20 ? '...' : ''));
