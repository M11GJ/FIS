import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const ACCESS_LOG_PATH = '/var/log/nginx/access.log';
const HISTORY_LOG_PATH = '/stats/update_history.log';

// アセットファイル（JS, CSS, 画像など）を統計から除外する判定
const isAsset = (url) => {
    return url.match(/\.(js|css|png|jpg|svg|json|ico|webp|map)$/i) || 
           url.includes('/@vite/') || 
           url.includes('/node_modules/');
};

// Nginxログのパース関数
function parseNginxLog(line) {
    // 形式: 192.168.11.2 - - [16/Apr/2026:06:27:18 +0000] "GET /shu-binran/ HTTP/1.1" 200 ...
    const regex = /^(\S+) \S+ \S+ \[(.*?)\] "(.*?)" (\d+) (\d+) "(.*?)" "(.*?)"/;
    const match = line.match(regex);
    if (!match) return null;

    const requestLine = match[3];
    const path = requestLine.split(' ')[1] || '';

    // アセットへのアクセスは無視
    if (isAsset(path)) return null;

    return {
        ip: match[1],
        timestamp: match[2],
        request: requestLine,
        path: path,
        status: parseInt(match[4])
    };
}

// 統計データの取得 API
app.get('/api/admin/stats', (req, res) => {
    try {
        if (!fs.existsSync(ACCESS_LOG_PATH)) {
            return res.json({ totalHits: 0, uniqueIps: 0, dailyHits: [], topIps: [] });
        }

        const lines = fs.readFileSync(ACCESS_LOG_PATH, 'utf8').split('\n').filter(l => l.trim());
        const rawLogs = lines.map(parseNginxLog).filter(l => l);

        // 重複排除ロジック (IP + パス + 分単位 が同じなら1回とみなす)
        const deduplicatedLogs = [];
        const seenHits = new Set();

        rawLogs.forEach(log => {
            const minute = log.timestamp.substring(0, 17); // Group by "16/Apr/2026:15:30"
            const key = `${log.ip}:${log.path}:${minute}`;
            
            if (!seenHits.has(key)) {
                deduplicatedLogs.push(log);
                seenHits.add(key);
            }
        });

        const ipStats = {};
        const hourlyStats = {};
        
        deduplicatedLogs.forEach(log => {
            // IP統計
            ipStats[log.ip] = (ipStats[log.ip] || 0) + 1;
            
            // 時間別統計 (グラフ用)
            const hour = log.timestamp.substring(12, 14) + '時'; // "15時"
            hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
        });

        const sortedIps = Object.entries(ipStats)
            .map(([ip, count]) => ({ ip, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // 直近24時間の枠を作成
        const dailyHits = Object.entries(hourlyStats)
            .map(([time, hits]) => ({ time, hits }));

        res.json({
            totalHits: deduplicatedLogs.length,
            uniqueIps: Object.keys(ipStats).length,
            dailyHits,
            topIps: sortedIps
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to parse logs' });
    }
});

// 更新履歴の取得 API
app.get('/api/admin/history', (req, res) => {
    try {
        if (!fs.existsSync(HISTORY_LOG_PATH)) {
            return res.json({ history: [] });
        }

        const stats = fs.statSync(HISTORY_LOG_PATH);
        if (stats.size === 0) return res.json({ history: [] });

        const history = fs.readFileSync(HISTORY_LOG_PATH, 'utf8')
            .split('\n')
            .filter(l => l.trim())
            .reverse();

        res.json({ history: history });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read history' });
    }
});

app.listen(PORT, () => {
    console.log(`Admin API server running on port ${PORT}`);
});
