/**
 * ============================================================
 *  VOC / E-Nose — Mock API (ไม่ต้องใช้ backend จริง)
 *  intercept fetch() แล้วคืนข้อมูลจำลองที่เคลื่อนไหวได้จริง
 * ============================================================
 */

// 🟡 Flag บอกให้ Layout แสดง Mock Mode banner
window.__VOC_MOCK_MODE = true;

// ─── State จำลอง ────────────────────────────────────────────
const state = {
  devices: [
    { box_id: 'BOX-001', status: 'ONLINE',  firmware: 'v2.3.1', model_ver: 'rf-v1.2', last_seen: new Date() },
    { box_id: 'BOX-002', status: 'ONLINE',  firmware: 'v2.3.1', model_ver: 'rf-v1.2', last_seen: new Date() },
    { box_id: 'BOX-003', status: 'OFFLINE', firmware: 'v2.1.0', model_ver: 'rf-v1.0', last_seen: new Date(Date.now() - 3_600_000) },
  ],

  sensor: {
    temp: 28.5, rh: 62, pm25: 12, tvoc: 120, eco2: 580,
    mq2: 240, mq3: 210, mq135: 340, mq8: 95, mics_co: 180, no2: 45, nh3: 60,
  },

  history: [],

  alerts: [
    { id: 1, time: '14:32:10', level: 'Warning',  message: 'TVOC สูงเกินปกติ: 218 (เกณฑ์ 200)',       status: 'Active',   created_at: new Date(Date.now() -  20 * 60000) },
    { id: 2, time: '13:15:44', level: 'Critical', message: 'TVOC สูงเกินวิกฤต: 415 (เกณฑ์ 400)',      status: 'Resolved', created_at: new Date(Date.now() - 110 * 60000) },
    { id: 3, time: '13:10:02', level: 'High',     message: 'AI ตรวจพบสาร THINNER (confidence 89%)',   status: 'Resolved', created_at: new Date(Date.now() - 115 * 60000) },
    { id: 4, time: '11:55:30', level: 'Warning',  message: 'PM2.5 สูงเกินปกติ: 38 (เกณฑ์ 35)',       status: 'Active',   created_at: new Date(Date.now() - 240 * 60000) },
    { id: 5, time: '10:20:18', level: 'Warning',  message: 'eCO2 สูงเกินปกติ: 1050 (เกณฑ์ 1000)',    status: 'Active',   created_at: new Date(Date.now() - 350 * 60000) },
  ],
  nextAlertId: 6,

  sessions: [
    { id: 1, box_id: 'BOX-001', label: 'AMBIENT', note: 'อากาศปกติ',      started_at: new Date(Date.now() - 7200_000), ended_at: new Date(Date.now() - 6900_000), reading_count: 180 },
    { id: 2, box_id: 'BOX-001', label: 'THINNER', note: 'ทินเนอร์ขวด 1', started_at: new Date(Date.now() - 5400_000), ended_at: new Date(Date.now() - 5100_000), reading_count: 215 },
    { id: 3, box_id: 'BOX-001', label: 'ALCOHOL', note: 'แอลกอฮอล์ 70%', started_at: new Date(Date.now() - 3600_000), ended_at: new Date(Date.now() - 3300_000), reading_count: 193 },
    { id: 4, box_id: 'BOX-002', label: 'ACETONE', note: 'อะซีโตนทดสอบ',  started_at: new Date(Date.now() - 1800_000), ended_at: new Date(Date.now() - 1500_000), reading_count: 201 },
    { id: 5, box_id: 'BOX-002', label: 'BENZENE', note: null,             started_at: new Date(Date.now() -  900_000), ended_at: new Date(Date.now() -  600_000), reading_count: 167 },
  ],
  nextSessionId: 6,
  activeSession: null,

  ai: { prediction: 'AMBIENT', confidence: 94.2, is_dangerous: false },
  ai_model_loaded: true,
  scenarioTick: 0,
};

// ─── init history ─────────────────────────────────────────────
function initHistory() {
  const now = Date.now();
  for (let i = 59; i >= 0; i--) {
    const t = new Date(now - i * 60_000);
    state.history.push({
      time: t.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }),
      tvoc: Math.round(80 + Math.random() * 80),
      pm25: +(8 + Math.random() * 10).toFixed(1),
    });
  }
}
initHistory();

// ─── Helpers ──────────────────────────────────────────────────
function rand(base, delta) { return +(base + (Math.random() - 0.5) * 2 * delta).toFixed(1); }
function randInt(base, delta) { return Math.round(base + (Math.random() - 0.5) * 2 * delta); }

// เก็บเวลาล่าสุดที่ยิง alert แต่ละประเภทเพื่อทำ Cooldown ใน Mock Mode
const lastMockAlertTime = {};

function maybeAddAlert(category, level, message) {
  const now = Date.now();
  // เช็คว่ามี Active alert ของ category นี้อยู่แล้วหรือไม่
  const existing = state.alerts.find(a => a.status === 'Active' && a.category === category);
  if (existing) {
    // ถ้ามีอยู่แล้ว และระดับใหม่รุนแรงขึ้น (Warning -> Critical) ให้อัปเดตรายการเดิม ไม่แทรกซ้ำ
    if (existing.level !== 'Critical' && level === 'Critical') {
      existing.level = 'Critical';
      existing.message = message;
    }
    return;
  }

  // Cooldown อย่างน้อย 60 วินาทีต่อประเภท ป้องกันยิงถี่รัว
  if (now - (lastMockAlertTime[category] || 0) < 60000) {
    return;
  }

  const nowDate = new Date();
  state.alerts.unshift({
    id: state.nextAlertId++,
    category,
    time: nowDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    level, message, status: 'Active', created_at: nowDate,
  });
  lastMockAlertTime[category] = now;
  if (state.alerts.length > 50) state.alerts.pop();
}

function autoResolveMockAlert(category) {
  state.alerts.forEach(a => {
    if (a.status === 'Active' && a.category === category) {
      a.status = 'Resolved';
    }
  });
}

function fmtLastSeen(d) {
  const diff = Date.now() - d.getTime();
  if (diff < 5 * 60_000) return 'Just now';
  return d.toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

// ─── Live sensor tick (every 3 s) ─────────────────────────────
function tickSensor() {
  state.scenarioTick++;
  const dangerous = state.scenarioTick % 20 >= 15;

  if (dangerous) {
    state.sensor.tvoc    = rand(350, 60);
    state.sensor.eco2    = rand(1100, 150);
    state.sensor.pm25    = rand(42, 8);
    state.sensor.temp    = rand(30, 1);
    state.sensor.rh      = rand(58, 3);
    state.sensor.mq3     = randInt(620, 80);
    state.sensor.mq135   = randInt(580, 60);
    state.sensor.mq8     = randInt(210, 40);
    state.sensor.mics_co = randInt(320, 50);
    state.sensor.no2     = randInt(90, 20);
    state.sensor.nh3     = randInt(140, 30);
    state.ai = { prediction: 'THINNER', confidence: +(85 + Math.random() * 12).toFixed(1), is_dangerous: true };

    if (state.sensor.tvoc >= 400) {
      maybeAddAlert('TVOC', 'Critical', `TVOC สูงเกินวิกฤต: ${Math.round(state.sensor.tvoc)} (เกณฑ์ 400)`);
    } else if (state.sensor.tvoc >= 200) {
      maybeAddAlert('TVOC', 'Warning', `TVOC สูงเกินปกติ: ${Math.round(state.sensor.tvoc)} (เกณฑ์ 200)`);
    }

    maybeAddAlert('AI', 'High', `AI ตรวจพบสาร ${state.ai.prediction} (confidence ${state.ai.confidence}%)`);
  } else {
    state.sensor.tvoc    = rand(110, 40);
    state.sensor.eco2    = rand(560, 80);
    state.sensor.pm25    = rand(11, 5);
    state.sensor.temp    = rand(28, 0.8);
    state.sensor.rh      = rand(62, 3);
    state.sensor.mq3     = randInt(195, 30);
    state.sensor.mq135   = randInt(320, 40);
    state.sensor.mq8     = randInt(88, 15);
    state.sensor.mics_co = randInt(170, 25);
    state.sensor.no2     = randInt(42, 10);
    state.sensor.nh3     = randInt(55, 15);
    state.ai = { prediction: 'AMBIENT', confidence: +(90 + Math.random() * 8).toFixed(1), is_dangerous: false };

    // Auto-resolve เมื่อค่ากลับมาเป็นปกติ
    if (state.sensor.tvoc < 180) autoResolveMockAlert('TVOC');
    if (!state.ai.is_dangerous) autoResolveMockAlert('AI');
  }

  const now = new Date();
  state.history.push({
    time: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }),
    tvoc: Math.round(state.sensor.tvoc),
    pm25: +state.sensor.pm25,
  });
  if (state.history.length > 240) state.history.shift();

  state.devices[0].last_seen = now;
  state.devices[1].last_seen = now;
}

setInterval(tickSensor, 3000);

// ─── Route handlers ───────────────────────────────────────────
const routes = [
  {
    method: 'GET', pattern: /\/api\/dashboard\/latest/,
    handler(url) {
      const boxId = new URL(url).searchParams.get('box_id') ?? 'BOX-001';
      const dev = state.devices.find(d => d.box_id === boxId) ?? state.devices[0];
      return {
        box_id: dev.box_id, status: dev.status, firmware: dev.firmware, model_version: dev.model_ver,
        ai_model_loaded: state.ai_model_loaded,
        environment: { temp: state.sensor.temp, rh: state.sensor.rh, pm25: state.sensor.pm25, tvoc: state.sensor.tvoc, eco2: state.sensor.eco2 },
        sensors: { mq2: state.sensor.mq2, mq3: state.sensor.mq3, mq135: state.sensor.mq135, mq8: state.sensor.mq8, mics_co: state.sensor.mics_co, no2: state.sensor.no2, nh3: state.sensor.nh3 },
        ai_detection: { prediction: state.ai.prediction, confidence: state.ai.confidence },
      };
    },
  },

  {
    method: 'GET', pattern: /\/api\/dashboard\/history/,
    handler(url) {
      const range = new URL(url).searchParams.get('range') ?? '1h';
      const pts = { '15m': 15, '1h': 60, '24h': 240 }[range] ?? 60;
      return state.history.slice(-pts);
    },
  },

  {
    method: 'GET', pattern: /\/api\/alerts\/summary$/,
    handler() {
      const active = state.alerts.filter(a => a.status === 'Active');
      const counts = {};
      active.forEach(a => { counts[a.level] = (counts[a.level] ?? 0) + 1; });
      return counts;
    },
  },

  {
    method: 'GET', pattern: /\/api\/alerts(\?|$)/,
    handler(url) {
      const limit = parseInt(new URL(url).searchParams.get('limit') ?? '20');
      return state.alerts.slice(0, limit);
    },
  },

  {
    method: 'PATCH', pattern: /\/api\/alerts\/\d+\/resolve/,
    handler(url) {
      const match = url.match(/\/api\/alerts\/(\d+)\/resolve/);
      const id = parseInt(match[1]);
      const alert = state.alerts.find(a => a.id === id);
      if (!alert) return { __status: 404, detail: 'Alert not found' };
      alert.status = 'Resolved';
      return { status: 'ok', alert_id: id };
    },
  },

  {
    method: 'GET', pattern: /\/api\/devices/,
    handler() {
      return state.devices.map(d => ({
        id: d.box_id, status: d.status, firmware: d.firmware, model: d.model_ver,
        last_seen: fmtLastSeen(new Date(d.last_seen)),
      }));
    },
  },

  {
    method: 'POST', pattern: /\/api\/ingest/,
    handler() {
      return { status: 'ok', reading_id: Math.floor(Math.random() * 10000), ai: state.ai };
    },
  },

  {
    method: 'GET', pattern: /\/api\/training\/sessions(\?|$)/,
    handler() {
      return state.sessions.map(s => ({
        id: s.id, box_id: s.box_id, label: s.label, note: s.note,
        started_at: s.started_at.toISOString(),
        ended_at: s.ended_at ? s.ended_at.toISOString() : null,
        reading_count: s.reading_count,
      }));
    },
  },

  {
    method: 'POST', pattern: /\/api\/training\/sessions(\?|$)/,
    handler(_url, body) {
      const now = new Date();
      const session = {
        id: state.nextSessionId++,
        box_id: body?.box_id ?? 'BOX-001',
        label: (body?.label ?? 'AMBIENT').toUpperCase(),
        note: body?.note ?? null,
        started_at: now, ended_at: null, reading_count: 0,
      };
      state.sessions.unshift(session);
      state.activeSession = session;
      const iv = setInterval(() => {
        if (state.activeSession?.id === session.id) session.reading_count++;
        else clearInterval(iv);
      }, 2000);
      return { session_id: session.id, label: session.label, started_at: session.started_at.toISOString() };
    },
  },

  {
    method: 'PATCH', pattern: /\/api\/training\/sessions\/\d+\/end/,
    handler(url) {
      const match = url.match(/\/api\/training\/sessions\/(\d+)\/end/);
      const id = parseInt(match[1]);
      const session = state.sessions.find(s => s.id === id);
      if (!session) return { __status: 404, detail: 'Session not found' };
      session.ended_at = new Date();
      if (state.activeSession?.id === id) state.activeSession = null;
      return {
        session_id: session.id, label: session.label,
        started_at: session.started_at.toISOString(),
        ended_at: session.ended_at.toISOString(),
        total_readings: session.reading_count,
      };
    },
  },

  {
    method: 'GET', pattern: /\/api\/export\/csv/,
    handler(url) {
      const sessionId = new URL(url).searchParams.get('session_id');
      const sessions = sessionId
        ? state.sessions.filter(s => s.id === parseInt(sessionId))
        : state.sessions.filter(s => s.ended_at);
      if (sessions.length === 0) return { __status: 404, detail: 'No labeled data found' };

      const rows = [['recorded_at','box_id','label','temp','rh','pm25','tvoc','eco2','mq2','mq3','mq135','mq8','mics_co','no2','nh3']];
      sessions.forEach(s => {
        for (let i = 0; i < Math.min(s.reading_count, 10); i++) {
          rows.push([
            new Date(s.started_at.getTime() + i * 3000).toISOString(),
            s.box_id, s.label,
            rand(28, 2), rand(60, 5), rand(12, 5), rand(120, 50), rand(600, 100),
            randInt(240, 50), randInt(200, 50), randInt(330, 60), randInt(90, 20), randInt(180, 40), randInt(45, 15), randInt(60, 20),
          ]);
        }
      });

      const csv = rows.map(r => r.join(',')).join('\n');
      return { __csv: csv, __filename: 'voc_training_data.csv' };
    },
  },

  // ── Edit device ────────────────────────────────────────────
  {
    method: 'PATCH', pattern: /\/api\/devices\/[^/]+$/,
    handler(url, body) {
      const boxId = url.split('/api/devices/')[1].split('?')[0];
      const dev = state.devices.find(d => d.box_id === boxId);
      if (!dev) return { __status: 404, detail: 'Device not found' };
      if (body?.firmware  !== undefined) dev.firmware  = body.firmware;
      if (body?.model_ver !== undefined) dev.model_ver = body.model_ver;
      if (body?.status    !== undefined) dev.status    = body.status;
      return { id: dev.box_id, status: dev.status, firmware: dev.firmware, model: dev.model_ver };
    },
  },

  // ── Delete device ──────────────────────────────────────────
  {
    method: 'DELETE', pattern: /\/api\/devices\/[^/]+$/,
    handler(url) {
      const boxId = url.split('/api/devices/')[1].split('?')[0];
      const idx = state.devices.findIndex(d => d.box_id === boxId);
      if (idx === -1) return { __status: 404, detail: 'Device not found' };
      state.devices.splice(idx, 1);
      return { detail: 'deleted' };
    },
  },

  // ── Edit session (label / note) ────────────────────────────
  {
    method: 'PATCH', pattern: /\/api\/training\/sessions\/\d+$/,
    handler(url, body) {
      const id = parseInt(url.match(/\/api\/training\/sessions\/(\d+)$/)[1]);
      const s = state.sessions.find(s => s.id === id);
      if (!s) return { __status: 404, detail: 'Session not found' };
      if (body?.label !== undefined) s.label = body.label.toUpperCase();
      if (body?.note  !== undefined) s.note  = body.note;
      return { id: s.id, label: s.label, note: s.note };
    },
  },

  // ── Delete session ─────────────────────────────────────────
  {
    method: 'DELETE', pattern: /\/api\/training\/sessions\/\d+$/,
    handler(url) {
      const id = parseInt(url.match(/\/api\/training\/sessions\/(\d+)$/)[1]);
      const idx = state.sessions.findIndex(s => s.id === id);
      if (idx === -1) return { __status: 404, detail: 'Session not found' };
      state.sessions.splice(idx, 1);
      if (state.activeSession?.id === id) state.activeSession = null;
      return { detail: 'deleted' };
    },
  },
];

// ─── Fetch interceptor ────────────────────────────────────────
const _origFetch = window.fetch.bind(window);

window.fetch = async function mockFetch(input, init = {}) {
  const url = typeof input === 'string' ? input : input.url;
  const method = (init?.method ?? 'GET').toUpperCase();

  if (!url.includes('localhost:8000')) {
    return _origFetch(input, init);
  }

  // POST routes must come before GET pattern for same path
  const route = routes.find(r => {
    if (r.method !== method) return false;
    return r.pattern.test(url);
  });

  if (!route) {
    console.warn('[MockAPI] No handler for', method, url);
    return new Response(JSON.stringify({ detail: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  let body = null;
  if (init?.body) {
    try { body = JSON.parse(init.body); } catch { body = init.body; }
  }

  // Simulate network latency
  await new Promise(r => setTimeout(r, 60 + Math.random() * 120));

  const result = route.handler(url, body);

  // CSV response
  if (result?.__csv !== undefined) {
    const blob = new Blob([result.__csv], { type: 'text/csv' });
    return new Response(blob, {
      status: 200,
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename=${result.__filename}` },
    });
  }

  // Determine status and clean result
  let status = 200;
  let cleanResult = result;

  if (result !== null && !Array.isArray(result) && typeof result === 'object') {
    if (result.__status !== undefined) {
      status = result.__status;
      cleanResult = Object.fromEntries(Object.entries(result).filter(([k]) => k !== '__status'));
    }
  }

  return new Response(JSON.stringify(cleanResult), { status, headers: { 'Content-Type': 'application/json' } });
};

console.log('%c[VOC Mock API] ✅ Active — ข้อมูลอัปเดตทุก 3 วินาที (สลับ AMBIENT/THINNER อัตโนมัติ)', 'color:#2563eb;font-weight:bold;font-size:13px');
