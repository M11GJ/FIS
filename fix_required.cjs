const fs = require('fs');
const path = require('path');

const coursesPath = path.join(__dirname, 'src/data/courses.json');
let courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));

const requiredList = [
  // 総合科目
  "周南Well-being創生入門", "教養スポーツ実習Ⅰ", "周南Well-being創生論",
  "教養ゼミ", "Python入門", "コミュニケーション英語Ⅰ", "キャリア形成活動Ⅰ",
  "コミュニケーション英語Ⅱ", "情報倫理", "情報社会論", "コミュニケーション英語Ⅲ", "コミュニケーション英語Ⅳ",
  // 学科基礎
  "情報科学概論", "実社会とデータ分析", "計算機概論", "Python応用", "データ分析基礎", "線形代数基礎", "微分積分基礎", "確率統計基礎",
  // 演習
  "専門ゼミ１", "専門ゼミ２", "卒業研究"
];

let updatedCount = 0;

courses = courses.map(course => {
  // Fix the category of 教養ゼミ from exercise to general explicitly if it's there
  if (course.name === '教養ゼミ') {
    course.category = 'general';
  }
  
  if (requiredList.includes(course.name.trim())) {
    course.required = true;
    updatedCount++;
  }
  return course;
});

fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2));
console.log(`Successfully updated ${updatedCount} required courses.`);
