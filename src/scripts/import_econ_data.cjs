const fs = require('fs');
const path = require('path');

/**
 * 経済経営学部 科目データインポートスクリプト (最終同期版)
 * ユーザー提供の単位数・必修フラグリストを反映し、不足科目を追加します。
 */

const econDataPath = path.join(__dirname, '..', 'data', 'courses_economics.json');
const econData = JSON.parse(fs.readFileSync(econDataPath, 'utf8'));

// ユーザー提供の最新リストに基づくオーバーライド設定
const overrides = {
  "周南Well-being創生入門": { "credits": 2, "required": true },
  "異文化コミュニケーション": { "credits": 2, "required": false },
  "周南Well-being創生論": { "credits": 2, "required": true },
  "教養スポーツ実習Ⅰ": { "credits": 1, "required": true },
  "教養スポーツ実習Ⅱ": { "credits": 1, "required": false },
  "健康と福祉": { "credits": 2, "required": false, "instructor": "北村　光子", "room": "1125", "schedule": "水4", "marks": "前期", "term": "2前" },
  "持続可能な社会とダイバーシティ": { "credits": 2, "required": false },
  "健康とスポーツ": { "credits": 2, "required": false },
  "メンタルヘルス入門": { "credits": 1, "required": false },
  "人の健康生活": { "credits": 1, "required": false },
  "デザインシンキング": { "credits": 1, "required": false },
  "地域ゼミ": { "credits": 2, "required": true, "subCategory": "B" },
  "ワークショップデザインⅡ": { "credits": 1, "required": false },
  "ワークショップデザインⅢ": { "credits": 1, "required": false },
  "地域づくり論": { "credits": 2, "required": false },
  "ワークショップデザインⅠ": { "credits": 1, "required": false },
  "周南地域文化講座": { "credits": 2, "required": false },
  "社会調査法入門": { "credits": 2, "required": false },
  "ソーシャルアントレプレナーシップ": { "credits": 2, "required": false },
  "周南地域と産業": { "credits": 2, "required": false },
  "アントレプレナーシップ入門": { "credits": 2, "required": false },
  "倫理学Ⅰ": { "credits": 2, "required": false },
  "倫理学Ⅱ": { "credits": 2, "required": false },
  "日本史Ⅰ": { "credits": 2, "required": false },
  "日本史Ⅱ": { "credits": 2, "required": false },
  "地誌学Ⅰ": { "credits": 2, "required": false },
  "地誌学Ⅱ": { "credits": 2, "required": false },
  "哲学": { "credits": 2, "required": false },
  "心理学Ⅱ": { "credits": 2, "required": false },
  "外国史Ⅰ": { "credits": 2, "required": false },
  "外国史Ⅱ": { "credits": 2, "required": false },
  "日本国憲法": { "credits": 2, "required": false },
  "中国語Ⅰ": { "credits": 2, "required": false },
  "人文地理学Ⅰ": { "credits": 2, "required": false },
  "人文地理学Ⅱ": { "credits": 2, "required": false },
  "心理学Ⅰ": { "credits": 2, "required": false },
  "韓国語Ⅰ": { "credits": 2, "required": false },
  "中国語Ⅱ": { "credits": 2, "required": false },
  "社会学": { "credits": 2, "required": false },
  "ドイツ語Ⅰ": { "credits": 2, "required": false },
  "韓国語Ⅱ": { "credits": 2, "required": false },
  "数学": { "credits": 2, "required": false },
  "ドイツ語Ⅱ": { "credits": 2, "required": false },
  "キャリア形成活動Ⅰ": { "credits": 1, "required": true, "instructor": "寺田 篤史・中嶋 克成", "schedule": "金3", "room": "1125" },
  "キャリア形成活動Ⅱ": { "credits": 1, "required": true, "instructor": "寺田 篤史・中嶋 克成", "schedule": "金3又は4", "room": "1125" },
  "総合英語中上級Ⅰ": { "credits": 1, "required": false, "term": "3前", "schedule": "月2", "marks": "前期" },
  "総合英語中上級": { "credits": 1, "required": false },
  "教養ゼミ": { "credits": 2, "required": true, "instructor": "人による", "schedule": "月2又は3", "marks": "前期", "term": "1前" },
  "データサイエンス入門": { "credits": 2, "required": true, "instructor": "呉 靭", "schedule": "オンデマンド", "room": "オンデマンド" },
  "総合英語初中級Ⅰ": { "credits": 1, "required": true, "term": "2前", "schedule": "金2又は4", "marks": "前期" },
  "総合英語初中級Ⅱ": { "credits": 1, "required": true, "term": "2後", "schedule": "金2又は4", "marks": "後期" },
  "グローバル英語": { "credits": 2, "required": false },
  "情報リテラシー": { "credits": 2, "required": true, "instructor": "日置 智子", "schedule": "オンデマンド", "room": "オンデマンド" },
  "総合英語初級Ⅱ": { "credits": 1, "required": true, "term": "1後", "schedule": "月2又は3", "marks": "後期" },
  "情報社会論": { "credits": 2, "required": false },
  "ビジネス英作文": { "credits": 1, "required": false },
  "総合英語初級Ⅰ": { "credits": 1, "required": true, "term": "1前", "schedule": "月2又は3", "marks": "前期" },
  "英会話初級Ⅱ": { "credits": 1, "required": true, "instructor": "Darcy　Dwyer", "room": "1121", "schedule": "水1", "marks": "後期", "term": "1後" },
  "ビジネス英会話": { "credits": 2, "required": false },
  "英会話初級Ⅰ": { "credits": 1, "required": true, "instructor": "Darcy　Dwyer", "room": "1121", "schedule": "水1", "marks": "前期", "term": "1前" },
  "アカデミックライティング": { "credits": 2, "required": false },
  "Python入門": { "credits": 2, "required": false, "instructor": "酒井　徹也", "room": "オンデマンド", "schedule": "オンデマンド", "marks": "前期", "term": "1前" },
  "留学英語": { "credits": 1, "required": false },
  "中級日本語": { "credits": 4, "required": true },
  "日本語会話中上級Ⅰ": { "credits": 1, "required": true },
  "中上級日本語Ⅰ": { "credits": 1, "required": false },
  "中上級日本語Ⅲ": { "credits": 1, "required": false },
  "日本語表現法Ⅰ": { "credits": 1, "required": true },
  "日本語会話中上級Ⅱ": { "credits": 1, "required": false },
  "中上級日本語Ⅱ": { "credits": 1, "required": false },
  "上級日本語Ⅲ": { "credits": 1, "required": false },
  "日本語表現法Ⅱ": { "credits": 1, "required": false },
  "上級日本語Ⅰ": { "credits": 1, "required": false },
  "ビジネス日本語Ⅱ": { "credits": 1, "required": false },
  "上級日本語Ⅱ": { "credits": 1, "required": false },
  "日本語口頭表現": { "credits": 1, "required": false },
  "ビジネス日本語Ⅰ": { "credits": 1, "required": false },
  "経済学・経営学の視点を学ぶ": { "credits": 2, "required": true },
  "経済学入門Ⅱ": { "credits": 2, "required": true, "marks": "後期", "term": "1後" },
  "ミクロ経済学Ⅰ": { "credits": 2, "required": true },
  "経済学入門Ⅰ": { "credits": 2, "required": true, "instructor": "石谷　康人", "room": "1125", "schedule": "木3", "marks": "前期", "term": "1前" },
  "経営学入門Ⅱ": { "credits": 2, "required": true, "instructor": "石谷　康人", "room": "1125", "schedule": "木1", "marks": "後期", "term": "1後" },
  "マクロ経済学Ⅰ": { "credits": 2, "required": true, "instructor": "長澤　賢一", "room": "オンデマンド", "schedule": "オンデマンド", "marks": "前期", "term": "2前" },
  "経営学入門Ⅰ": { "credits": 2, "required": true, "instructor": "石谷　康人", "room": "1125", "schedule": "木3", "marks": "前期", "term": "1前" },
  "経済史Ⅰ": { "credits": 2, "required": false, "instructor": "長濱　幸一", "room": "S1301", "schedule": "水5", "marks": "前期", "term": "1前" },
  "日本経済概論": { "credits": 2, "required": false },
  "財政学": { "credits": 2, "required": false },
  "ミクロ経済学Ⅱ": { "credits": 2, "required": false },
  "統計学基礎Ⅰ": { "credits": 2, "required": false },
  "金融論": { "credits": 2, "required": false },
  "マクロ経済学Ⅱ": { "credits": 2, "required": false, "instructor": "高山　寛", "room": "S1302", "schedule": "水3", "marks": "後期", "term": "2後" },
  "経済政策": { "credits": 2, "required": false },
  "地域経済論Ⅰ": { "credits": 2, "required": false },
  "ファイナンス論": { "credits": 2, "required": false },
  "簿記初級Ⅰ": { "credits": 2, "required": false },
  "マーケティング論Ⅰ": { "credits": 2, "required": false },
  "経営管理論": { "credits": 2, "required": false },
  "流通論": { "credits": 2, "required": false },
  "企業概論Ⅰ": { "credits": 2, "required": false },
  "経営史Ⅰ": { "credits": 2, "required": false, "instructor": "呉　贇", "room": "オンライン", "schedule": "木1", "marks": "前期", "term": "2前" },
  "商業学": { "credits": 2, "required": false },
  "経営組織論Ⅰ": { "credits": 2, "required": false },
  "経営戦略論Ⅰ": { "credits": 2, "required": false },
  "国際経済学Ⅰ": { "credits": 2, "required": false, "instructor": "村岡　浩次", "room": "1125", "schedule": "月3", "marks": "後期", "term": "2後" },
  "アジア経済学": { "credits": 2, "required": false },
  "国際政治経済学Ⅰ": { "credits": 2, "required": false },
  "グローバルビジネス論": { "credits": 2, "required": false },
  "創造的問題解決": { "credits": 2, "required": false },
  "都市計画論": { "credits": 2, "required": false },
  "地域デザイン実践": { "credits": 2, "required": false },
  "地域コンテンツデザイン": { "credits": 2, "required": false },
  "経済史Ⅱ": { "credits": 2, "required": false },
  "社会保障論Ⅰ": { "credits": 2, "required": false },
  "ミクロ・マクロ経済学演習": { "credits": 2, "required": false, "instructor": "村岡　浩次", "room": "S1301", "schedule": "水1", "marks": "後期", "term": "2後" },
  "行動経済学": { "credits": 2, "required": false },
  "都市経済学演習": { "credits": 2, "required": false, "instructor": "伏木　貞文", "room": "524", "schedule": "金2", "marks": "後期", "term": "3後" },
  "統計学基礎Ⅱ": { "credits": 2, "required": false },
  "日本経済史": { "credits": 2, "required": false },
  "社会保障論Ⅱ": { "credits": 2, "required": false },
  "都市経済学": { "credits": 2, "required": false },
  "環境経済学": { "credits": 2, "required": false },
  "経済統計": { "credits": 2, "required": false },
  "地域経済と金融": { "credits": 2, "required": false },
  "租税論": { "credits": 2, "required": false, "instructor": "高山　寛", "room": "601", "schedule": "水3", "marks": "前期", "term": "3前" },
  "公共経済学": { "credits": 2, "required": false },
  "中級統計学": { "credits": 2, "required": false },
  "地域政策論": { "credits": 2, "required": false },
  "地方財政論": { "credits": 2, "required": false },
  "社会政策": { "credits": 2, "required": false },
  "自治体の業務を学ぶ": { "credits": 2, "required": false },
  "地域経済論Ⅱ": { "credits": 2, "required": false },
  "経済地理学": { "credits": 2, "required": false },
  "証券投資論": { "credits": 2, "required": false },
  "計量経済学": { "credits": 2, "required": false },
  "簿記初級Ⅱ": { "credits": 2, "required": false },
  "財務会計論": { "credits": 2, "required": false },
  "経営史Ⅱ": { "credits": 2, "required": false },
  "人的資源管理論": { "credits": 2, "required": false },
  "環境経営": { "credits": 2, "required": false },
  "企業概論Ⅱ": { "credits": 2, "required": false },
  "簿記中級Ⅰ": { "credits": 2, "required": false },
  "経営組織論Ⅱ": { "credits": 2, "required": false, "instructor": "髙橋　真実", "room": "522", "schedule": "火2", "marks": "後期", "term": "2後" },
  "財務管理論": { "credits": 2, "required": false },
  "管理工学": { "credits": 2, "required": false },
  "中小企業論": { "credits": 2, "required": false },
  "経営戦略論Ⅱ": { "credits": 2, "required": false, "instructor": "石谷　康人", "room": "S1303/S1304", "schedule": "木3", "marks": "後期", "term": "2後" },
  "マーケティング・リサーチ": { "credits": 2, "required": false },
  "税務会計論": { "credits": 2, "required": false },
  "マーケティング論Ⅱ": { "credits": 2, "required": false },
  "管理会計論": { "credits": 2, "required": false },
  "簿記上級Ⅱ": { "credits": 2, "required": false },
  "原価計算論": { "credits": 2, "required": false },
  "簿記上級Ⅰ": { "credits": 2, "required": false },
  "簿記中級Ⅱ": { "credits": 2, "required": false },
  "国際ビジネス特論Ⅰ": { "credits": 2, "required": false },
  "政治制度論": { "credits": 2, "required": false },
  "中国経済論": { "credits": 2, "required": false },
  "開発途上国論": { "credits": 2, "required": false },
  "国際ビジネス特論Ⅱ": { "credits": 2, "required": false },
  "外国書購読（英語）": { "credits": 2, "required": false },
  "経済統合論": { "credits": 2, "required": false },
  "国際経済学Ⅱ": { "credits": 2, "required": false },
  "アジアビジネス論": { "credits": 2, "required": false },
  "国際政治経済学Ⅱ": { "credits": 2, "required": false },
  "グローバル企業分析": { "credits": 2, "required": false },
  "国際マーケティング論": { "credits": 2, "required": false },
  "アントレプレナーシップ実践": { "credits": 2, "required": false },
  "デジタルファブリケーション演習": { "credits": 2, "required": false },
  "コンテクストデザイン実践": { "credits": 2, "required": false },
  "法律学Ⅰ": { "credits": 2, "required": false },
  "民法Ⅰ": { "credits": 2, "required": false },
  "民法Ⅱ": { "credits": 2, "required": false },
  "法律学Ⅱ": { "credits": 2, "required": false },
  "商法Ⅰ": { "credits": 2, "required": false },
  "商法Ⅱ": { "credits": 2, "required": false },
  "専門ゼミⅠ": { "credits": 4, "required": true, "instructor": "人による", "room": "人による", "schedule": "木5 / 火3 / 木3 / 水3", "term": "3通", "subCategory": "exercise" },
  "専門ゼミⅡ": { "credits": 4, "required": true, "subCategory": "exercise" },
  "スポーツ産業論": { "credits": 2, "required": false },
  "スポーツマネジメント": { "credits": 2, "required": false },
  "地域スポーツ文化論": { "credits": 2, "required": false },
  "スポーツツーリズム論": { "credits": 2, "required": false },
  "看護政策論": { "credits": 2, "required": false },
  "医療経済学": { "credits": 2, "required": false },
  "社会福祉の原理と政策Ⅰ": { "credits": 2, "required": false },
  "社会福祉の原理と政策Ⅱ": { "credits": 2, "required": false },
  "地域マネジメント論": { "credits": 2, "required": false },
  "社会福祉調査の基礎": { "credits": 2, "required": false },
  "地域観光まちづくり論": { "credits": 2, "required": false },
  "健康まちづくり論": { "credits": 2, "required": false },
  "地域福祉経済論": { "credits": 2, "required": false },
  "地域公共政策論": { "credits": 2, "required": false },
  "実社会とデータ分析": { "credits": 2, "required": false, "instructor": "矢島 安敏", "schedule": "水12", "room": "1142" },
  "地方創生とDX": { "credits": 2, "required": false },
  "Webアプリケーション開発": { "credits": 2, "required": false, "instructor": "児玉 満", "schedule": "月木3", "room": "1142" },
  "金融データ解析": { "credits": 2, "required": false, "instructor": "中山 季之", "schedule": "月木4", "room": "524" },
  "AI、コンピュータと人間": { "credits": 2, "required": false, "instructor": "児玉／立部／酒井／渡部", "schedule": "集中講義等", "room": "対面" },
  "多変量解析": { "credits": 2, "required": false, "instructor": "大島 和裕", "schedule": "火金4", "room": "1142" },
  "経営と数理モデル": { "credits": 2, "required": false, "instructor": "小栁 淳二", "schedule": "火金3", "room": "1142" },
  "インターネットマーケティング": { "credits": 2, "required": false, "instructor": "西郷 彰", "schedule": "オンデマンド", "room": "オンデマンド・対面" },
  "シミュレーション": { "credits": 2, "required": false, "instructor": "矢敷 達朗", "schedule": "月木3", "room": "535" },
  "アジア経済論": { "instructor": "岡本　次郎", "room": "532", "schedule": "水3", "marks": "前期", "term": "3前" }
};

const otherDeptSubjects = [
  "スポーツ産業論", "スポーツマネジメント", "地域スポーツ文化論", "スポーツツーリズム論",
  "看護政策論", "医療経済学", "社会福祉の原理と政策Ⅰ", "社会福祉の原理と政策Ⅱ",
  "地域マネジメント論", "社会福祉調査の基礎", "地域観光まちづくり論", "健康まちづくり論",
  "地域福祉経済論", "地域公共政策論", "実社会とデータ分析", "地方創生とDX",
  "Webアプリケーション開発", "金融データ解析", "AI、コンピュータと人間", "多変量解析",
  "経営と数理モデル", "インターネットマーケティング", "シミュレーション"
];

const exerciseSubjects = [
  "地域ゼミ", "教養ゼミ", "ミクロ・マクロ経済学演習", "都市経済学演習",
  "デジタルファブリケーション演習", "専門ゼミⅠ", "専門ゼミⅡ"
];

// 専門基礎科目の詳細判定用のリスト
const specializedBasisMapping = {
  econ: ["ミクロ経済学Ⅱ", "マクロ経済学Ⅱ"],
  mgmt: [
    "企業概論Ⅰ", "マーケティング論Ⅰ", "経営史Ⅰ", "経営組織論Ⅰ", "経営戦略論Ⅰ", 
    "経営管理論", "商業学", "流通論", "簿記初級Ⅰ"
  ],
  region: ["地域経済論Ⅰ", "都市計画論", "地域デザイン実践", "地域コンテンツデザイン"]
};

// 専門科目の系統別マッピング（今回提供されたリストに基づく）
const specializedSystemMapping = {
  econ_s: [
    "経済史Ⅱ", "社会保障論Ⅰ", "ミクロ・マクロ経済学演習", "行動経済学", "都市経済学演習", 
    "統計学基礎Ⅱ", "日本経済史", "社会保障論Ⅱ", "都市経済学", "環境経済学", 
    "経済統計", "地域経済と金融", "租税論", "公共経済学", "中級統計学", 
    "地域政策論", "地方財政論", "社会政策", "自治体の業務を学ぶ", "地域経済論Ⅱ", 
    "経済地理学", "証券投資論", "計量経済学"
  ],
  mgmt_s: [
    "簿記初級Ⅱ", "財務会計論", "経営史Ⅱ", "人的資源管理論", "環境経営", 
    "企業概論Ⅱ", "簿記中級Ⅰ", "経営組織論Ⅱ", "財務管理論", "管理工学", 
    "中小企業論", "経営戦略論Ⅱ", "マーケティング・リサーチ", "税務会計論", 
    "マーケティング論Ⅱ", "管理会計論", "簿記上級Ⅱ", "原価計算論", "簿記上級Ⅰ", "簿記中級Ⅱ"
  ],
  global_s: [
    "国際ビジネス特論Ⅰ", "政治制度論", "中国経済論", "開発途上国論", "国際ビジネス特論Ⅱ", 
    "外国書購読（英語）", "経済統合論", "国際経済学Ⅱ", "アジアビジネス論", 
    "国際政治経済学Ⅱ", "グローバル企業分析", "国際マーケティング論"
  ],
  region_s: ["アントレプレナーシップ実践", "デジタルファブリケーション演習", "コンテクストデザイン実践"],
  law_s: ["法律学Ⅰ", "民法Ⅰ", "民法Ⅱ", "法律学Ⅱ", "商法Ⅰ", "商法Ⅱ"],
  exercise_s: ["専門ゼミⅠ", "専門ゼミⅡ"]
};

// 新規科目のリスト
const newCourses = [
  { name: "総合英語中上級", credits: 1, required: false, category: "general", term: "3前" },
  { name: "アジア経済学", credits: 2, required: false, category: "specialized", term: "3前" },
  { name: "外国書購読（英語）", credits: 2, required: false, category: "specialized", term: "2通" }
];

// マッピング処理
let updatedData = econData.map(c => {
  const override = overrides[c.name];
  const isOtherDept = otherDeptSubjects.includes(c.name);
  
  // 便覧の体系に基づく親カテゴリの決定
  let targetCategory = c.category;
  if (['地域ゼミ', '教養ゼミ'].includes(c.name)) {
    targetCategory = 'general';
  } else if (['専門ゼミⅠ', '専門ゼミⅡ', 'ミクロ・マクロ経済学演習', '都市経済学演習', 'デジタルファブリケーション演習'].includes(c.name)) {
    targetCategory = 'specialized';
  }

  // 専門基礎科目の詳細区分の上書き
  let targetSubCategory = override?.subCategory || c.subCategory;
  if (c.category === 'specialized_basic') {
    if (specializedBasisMapping.econ.includes(c.name)) targetSubCategory = 'econ';
    if (specializedBasisMapping.mgmt.includes(c.name)) targetSubCategory = 'mgmt';
    if (specializedBasisMapping.region.includes(c.name)) targetSubCategory = 'region';
  }

  // 専門科目の系統別区分の上書き
  if (targetCategory === 'specialized') {
    for (const [sys, list] of Object.entries(specializedSystemMapping)) {
      if (list.includes(c.name)) {
        targetSubCategory = sys;
        break;
      }
    }
  }

  return {
    ...c,
    term: override?.term || c.term,
    credits: override?.credits !== undefined ? override.credits : (isOtherDept ? 2 : (targetCategory === 'specialized' ? 2 : c.credits)),
    required: override?.required !== undefined ? override.required : c.required,
    category: isOtherDept ? 'other_dept' : targetCategory,
    subCategory: targetSubCategory,
    schedule: override?.schedule || c.schedule,
    room: override?.room || c.room,
    instructor: override?.instructor || c.instructor,
    marks: override?.marks || c.marks
  };
});

// 新規科目の追加
const existingNames = new Set(updatedData.map(c => c.name));
newCourses.forEach(nc => {
  if (!existingNames.has(nc.name)) {
    updatedData.push({
      id: `econ-new-${Math.random().toString(36).substr(2, 5)}`,
      name: nc.name,
      term: nc.term,
      credits: nc.credits,
      required: nc.required,
      category: nc.category,
      subCategory: "",
      schedule: "-",
      room: "-",
      instructor: "-",
      marks: ""
    });
  }
});

fs.writeFileSync(econDataPath, JSON.stringify(updatedData, null, 2));
console.log(`Successfully updated ${updatedData.length} courses with latest credits and required flags.`);
