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

// Nginxログのパース関数
function parseNginxLog(line) {
    // 形式: 192.168.11.2 - - [16/Apr/2026:06:27:18 +0000] "GET /shu-binran/ HTTP/1.1" 200 ...
    const regex = /^(\S+) \S+ \S+ \[(.*?)\] "(.*?)" (\d+) (\d+) "(.*?)" "(.*?)"/;
    const match = line.match(regex);
    if (!match) return null;

    return {
        ip: match[1],
        timestamp: match[2],
        request: match[3],
        status: parseInt(match[4]),
        bytes: parseInt(match[5]),
        referer: match[6],
        userAgent: match[7]
    };
}

// 統計データの取得 API
app.get('/api/admin/stats', (req, res) => {
    try {
        if (!fs.existsSync(ACCESS_LOG_PATH)) {
            return res.json({ totalHits: 0, uniqueIps: 0, dailyHits: [], topIps: [] });
        }

        const lines = fs.readFileSync(ACCESS_LOG_PATH, 'utf8').split('\n').filter(l => l.trim());
        const parsedLogs = lines.map(parseNginxLog).filter(l => l);

        const ipStats = {};
        const hourlyStats = {};
        
        parsedLogs.forEach(log => {
            // IP統計
            ipStats[log.ip] = (ipStats[log.ip] || 0) + 1;
            
            // 時間別統計 (簡易版: 16/Apr/2026:06 形式)
            const hour = log.timestamp.substring(0, 14); 
            hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
        });

        const sortedIps = Object.entries(ipStats)
            .map(([ip, count]) => ({ ip, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const dailyHits = Object.entries(hourlyStats)
            .map(([time, hits]) => ({ time, hits }))
            .slice(-24); // 直近24履歴

        res.json({
            totalHits: parsedLogs.length,
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

        const lines = fs.readFileSync(HISTORY_LOG_PATH, 'utf8')
            .split('\n')
            .filter(l => l.trim())
            .reverse(); // 新しい順

        res.json({ history: lines });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read history' });
    }
});

app.listen(PORT, () => {
    console.log(`Admin API server running on port ${PORT}`);
});
