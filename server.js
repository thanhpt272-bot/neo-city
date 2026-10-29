/* ===== NEO-CITY · Máy chủ trong lớp (không cần cài thêm thư viện) =====
   Chạy:  node server.js        (cổng 8080)
          node server.js 3000   (đổi cổng)
   Điểm được lưu tại data/xep-hang.json và data/xep-hang.csv (mở bằng Excel). */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { isBadName } = require('./filter.js');

const PORT = +process.argv[2] || 8080;
const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const JSON_FILE = path.join(DATA, 'xep-hang.json');
const CSV_FILE = path.join(DATA, 'xep-hang.csv');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8'
};

fs.mkdirSync(DATA, { recursive: true });
let db = {};
try { db = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8')); } catch (e) {}

/* ---------- Lưu file ---------- */
const csvCell = v => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s;           // chặn công thức khi mở bằng Excel
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const fmt = ms => {
  if (!ms) return '';
  const d = new Date(ms), p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
function writeCsv() {
  const rows = [['Phiên', 'Hạng', 'Tên', 'Lớp', 'Avatar', 'Điểm', 'Số ải đã qua', 'Phá đảo', 'Thời gian phá đảo', 'Cập nhật lúc']];
  const rooms = {};
  Object.values(db).forEach(p => (rooms[p.room] = rooms[p.room] || []).push(p));
  Object.keys(rooms).sort().forEach(room => {
    sortList(rooms[room]).forEach((p, i) => rows.push([room, i + 1, p.name, p.cls, p.avatar, p.score, p.done,
      p.finished ? 'Có' : 'Không', fmt(p.finishedAt), fmt(p.updatedAt)]));
  });
  fs.writeFileSync(CSV_FILE, '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n'));
}
let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { fs.writeFileSync(JSON_FILE, JSON.stringify(db, null, 1)); } catch (e) { console.warn('⚠ Không ghi được xep-hang.json:', e.message); }
    try { writeCsv(); } catch (e) { console.warn('⚠ Không ghi được xep-hang.csv (file đang mở trong Excel?) – sẽ thử lại ở lần cập nhật sau.'); }
  }, 400);
}

/* ---------- Dữ liệu ---------- */
const sortList = l => l.sort((a, b) => b.score - a.score || (a.finishedAt || 9e15) - (b.finishedAt || 9e15) || a.updatedAt - b.updatedAt);
const str = (v, max) => typeof v === 'string' && v.length <= max ? v : null;
const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi ? v : null;
function clean(p) {
  const o = {
    room: str(p.room, 20), pid: str(p.pid, 40), name: str(p.name, 24), cls: str(p.cls || '', 10), avatar: str(p.avatar || '', 8),
    score: int(p.score, 0, 2000), done: int(p.done, 0, 7), finished: p.finished === true,
    finishedAt: p.finishedAt == null ? null : int(p.finishedAt, 0, 9e15), updatedAt: Date.now()
  };
  if (!o.room || !o.pid || !o.name || o.score === null || o.done === null) return null;
  if (isBadName(o.name) || isBadName(o.cls)) return null;
  return o;
}

/* ---------- HTTP ---------- */
const send = (res, code, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;

  if (p === '/api/ping') return send(res, 200, { neo: true });

  if (p === '/api/lb' && req.method === 'GET') {
    const room = url.searchParams.get('room') || '';
    return send(res, 200, { ok: true, list: sortList(Object.values(db).filter(x => x.room === room)) });
  }

  if (p === '/api/lb' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 4096) req.destroy(); });
    req.on('end', () => {
      let rec;
      try { rec = clean(JSON.parse(body)); } catch (e) {}
      if (!rec) return send(res, 400, { ok: false, error: 'Dữ liệu không hợp lệ' });
      const key = rec.room + '_' + rec.pid, old = db[key];
      if (old && old.score > rec.score) rec.score = old.score;   // điểm không bao giờ giảm
      db[key] = rec;
      scheduleSave();
      send(res, 200, { ok: true });
    });
    return;
  }

  // File tĩnh (chặn truy cập ngoài thư mục và thư mục data)
  let file = path.normalize(path.join(ROOT, decodeURIComponent(p === '/' ? '/index.html' : p)));
  if (!file.startsWith(ROOT) || (file + path.sep).startsWith(DATA + path.sep)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'Không tìm thấy', 'text/plain; charset=utf-8');
    send(res, 200, buf, MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
  });
}).listen(PORT, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log('\n  ███ NEO-CITY · Máy chủ trong lớp đang chạy ███\n');
  console.log('  Mở trang giáo viên trên máy chiếu bằng địa chỉ:');
  (ips.length ? ips : ['<IP-máy-tính>']).forEach(ip => console.log(`     http://${ip}:${PORT}/index.html`));
  console.log('\n  (Không dùng "localhost" – điện thoại học sinh sẽ không vào được.)');
  console.log(`  Bảng xếp hạng lưu tại: ${CSV_FILE}`);
  console.log('  Nhấn Ctrl + C để tắt máy chủ.\n');
});
