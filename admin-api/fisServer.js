import { createMcpExpressApp } from '@modelcontextprotocol/express';
import fs from 'node:fs';
import courses from '../src/data/courses_info.json' with { type: 'json' };
import { getCoursesForEntryYear, INFO_PROGRAMS, SUPPORTED_ENTRY_YEARS } from '../shared/curriculum.js';
import { proxyDccJwks, verifyDccAccessToken } from './dccAuth.js';
import { deleteCourseProfile, getCourseProfile, saveCourseProfile } from './profileStore.js';
import { handleMcpRequest } from './mcp.js';

const app = createMcpExpressApp({ host: '0.0.0.0' });
const PORT = Number(process.env.PORT) || 3000;
const ACCESS_LOG_PATH = '/var/log/nginx/access.log';
const HISTORY_LOG_PATH = '/stats/update_history.log';
const configuredHosts = new Set((process.env.FIS_ALLOWED_HOSTS || '').split(',').map(value => value.trim()).filter(Boolean));

function isTrustedPublicHostname(hostname) {
  return ['localhost', '127.0.0.1', '::1'].includes(hostname)
    || hostname.endsWith('.shu-dcc.net')
    || configuredHosts.has(hostname);
}

function protectPublicEndpoint(req, res, next) {
  const host = req.hostname;
  if (!host || !isTrustedPublicHostname(host)) return res.status(403).json({ error: 'invalid_host' });
  const origin = req.get('origin');
  if (origin) {
    try {
      if (!isTrustedPublicHostname(new URL(origin).hostname)) return res.status(403).json({ error: 'invalid_origin' });
    } catch {
      return res.status(403).json({ error: 'invalid_origin' });
    }
  }
  next();
}

app.get('/api/health', (_req, res) => res.json({ ok: true, mcp: '/mcp' }));
app.get('/api/auth/dcc/jwks', proxyDccJwks);

function validateProfile(body) {
  const entryYear = Number(body?.entryYear);
  const program = String(body?.program || '').toUpperCase();
  const courseIds = Array.isArray(body?.courseIds) ? [...new Set(body.courseIds)] : null;
  if (!SUPPORTED_ENTRY_YEARS.includes(entryYear)) return { error: 'unsupported_entry_year' };
  if (!INFO_PROGRAMS.includes(program)) return { error: 'invalid_program' };
  if (!courseIds || courseIds.length > 300 || courseIds.some(id => typeof id !== 'string')) return { error: 'invalid_course_ids' };
  const availableIds = new Set(getCoursesForEntryYear(courses, entryYear).map(course => course.id));
  if (courseIds.some(id => !availableIds.has(id))) return { error: 'course_not_available_for_entry_year' };
  return { profile: { facultyId: 'info', entryYear, program, courseIds } };
}

app.get('/api/me/course-profile', verifyDccAccessToken, async (req, res, next) => {
  try {
    const stored = await getCourseProfile(req.dccIdentity.sub);
    if (!stored) return res.status(404).json({ error: 'profile_not_found' });
    res.set('Cache-Control', 'no-store');
    res.json(stored);
  } catch (error) {
    next(error);
  }
});

app.put('/api/me/course-profile', verifyDccAccessToken, async (req, res, next) => {
  try {
    const validation = validateProfile(req.body);
    if (validation.error) return res.status(400).json({ error: validation.error });
    const stored = await saveCourseProfile(req.dccIdentity.sub, validation.profile);
    res.set('Cache-Control', 'no-store');
    res.json(stored);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/me/course-profile', verifyDccAccessToken, async (req, res, next) => {
  try {
    await deleteCourseProfile(req.dccIdentity.sub);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post(['/mcp', '/mcp/'], protectPublicEndpoint, async (req, res, next) => {
  try {
    await handleMcpRequest(req, res);
  } catch (error) {
    next(error);
  }
});

const isAsset = url => url.match(/\.(js|css|png|jpg|svg|json|ico|webp|map)$/i)
  || url.includes('/@vite/')
  || url.includes('/node_modules/');

function parseNginxLog(line) {
  const match = line.match(/^(\S+) \S+ \S+ \[(.*?)\] "(.*?)" (\d+) (\d+) "(.*?)" "(.*?)"/);
  if (!match) return null;
  const requestLine = match[3];
  const requestPath = requestLine.split(' ')[1] || '';
  if (isAsset(requestPath)) return null;
  return { ip: match[1], timestamp: match[2], request: requestLine, path: requestPath, status: Number(match[4]) };
}

app.get('/api/admin/stats', (_req, res) => {
  try {
    if (!fs.existsSync(ACCESS_LOG_PATH)) return res.json({ totalHits: 0, uniqueIps: 0, dailyHits: [], topIps: [] });
    const rawLogs = fs.readFileSync(ACCESS_LOG_PATH, 'utf8').split('\n').filter(Boolean).map(parseNginxLog).filter(Boolean);
    const seenHits = new Set();
    const logs = rawLogs.filter(log => {
      const key = `${log.ip}:${log.path}:${log.timestamp.substring(0, 17)}`;
      if (seenHits.has(key)) return false;
      seenHits.add(key);
      return true;
    });
    const ipStats = {};
    const hourlyStats = {};
    logs.forEach(log => {
      ipStats[log.ip] = (ipStats[log.ip] || 0) + 1;
      const hour = `${log.timestamp.substring(12, 14)}時`;
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    });
    const topIps = Object.entries(ipStats).map(([ip, count]) => ({ ip, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    const dailyHits = Object.entries(hourlyStats).map(([time, hits]) => ({ time, hits }));
    res.json({ totalHits: logs.length, uniqueIps: Object.keys(ipStats).length, dailyHits, topIps });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'failed_to_parse_logs' });
  }
});

app.get('/api/admin/history', (_req, res) => {
  try {
    if (!fs.existsSync(HISTORY_LOG_PATH) || fs.statSync(HISTORY_LOG_PATH).size === 0) return res.json({ history: [] });
    const history = fs.readFileSync(HISTORY_LOG_PATH, 'utf8').split('\n').filter(Boolean).reverse();
    res.json({ history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'failed_to_read_history' });
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (!res.headersSent) res.status(500).json({ error: 'internal_server_error' });
});

app.listen(PORT, '0.0.0.0', () => console.log(`FIS API and MCP server listening on ${PORT}`));
