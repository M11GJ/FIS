const fs = require('fs');
const path = require('path');

const coursesPath = path.join(__dirname, '../src/data/courses.json');
const updatePath = path.join(__dirname, './bulk_courses_update_v2.json');

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
    
    // 1. 完全一致（正規化後）
    let matches = newData.filter(n => normalize(n.name) === cN);
    
    // 2. 特殊対応: 組込み / 組み込み
    if (matches.length === 0) {
        const altCN = cN.replace('組込み', '組み込み');
        matches = newData.filter(n => normalize(n.name) === altCN);
    }

    // 3. 前方一致対応 (教養ゼミ, 教養スポーツ実習等)
    if (matches.length === 0) {
        matches = newData.filter(n => normalize(n.name).startsWith(cN));
    }

    if (matches.length > 0) {
        // 代表的な1つを選択、またはマージ
        const best = matches[0];
        c.schedule = best.schedule;
        c.room = best.room;
        
        if (matches.length > 1) {
            // 複数の候補がある場合（教養ゼミなど）
            c.instructor = '複数教員';
            if (best.room.includes('各演習室') || matches.some(m => m.room !== best.room)) {
                c.room = '各演習室 / 他';
            }
        } else {
            c.instructor = best.instructor;
        }
        matchCount++;
    }
});

fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2), 'utf8');
console.log(`Successfully updated ${matchCount} courses using final bulk data.`);
