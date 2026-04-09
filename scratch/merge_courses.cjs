const fs = require('fs');
const path = require('path');

const coursesPath = path.join(__dirname, '../src/data/courses.json');
const updatePath = path.join(__dirname, './bulk_courses_update.json');

const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
const newData = JSON.parse(fs.readFileSync(updatePath, 'utf8'));

const normalize = (str) => {
    if (!str) return '';
    return str.replace(/\s+/g, '')
              .replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
              .replace(/（/g, '(')
              .replace(/）/g, ')')
              .replace(/ー/g, '-');
};

let matchCount = 0;
courses.forEach(c => {
    const cN = normalize(c.name);
    const match = newData.find(n => {
        const nN = normalize(n.name);
        if (nN === cN) return true;
        // 特殊なエイリアス対応
        if (nN.replace('組み込み', '組込み') === cN.replace('組み込み', '組込み')) return true;
        return false;
    });

    if (match) {
        c.schedule = match.schedule;
        c.room = match.room;
        c.instructor = match.instructor;
        matchCount++;
    }
});

fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2), 'utf8');
console.log(`Successfully updated ${matchCount} courses.`);
