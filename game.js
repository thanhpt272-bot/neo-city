'use strict';
/* ===== NEO-CITY · Lõi trò chơi =====
   Các ải được đăng ký trong window.PUZZLES (puzzles-a.js, puzzles-b.js). */

/* ---------- Tiện ích ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const wait = ms => new Promise(r => setTimeout(r, ms));
const app = $('#app'), phone = $('.phone');
window.PUZZLES = window.PUZZLES || {};

/* ---------- Trạng thái (lưu trên máy) ---------- */
const SKEY = 'neocity_v1';
const S = Object.assign(
  { name: '', cls: '', avatar: AVATARS[0], mode: 'free', room: 'DEMO', pid: '', done: {}, unlocked: {}, wishes: [], scores: {},
    sound: true, assembled: false, finishedAt: null },
  (() => { try { return JSON.parse(localStorage.getItem(SKEY) || '{}'); } catch (e) { return {}; } })()
);
if (!S.pid) S.pid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const save = () => { try { localStorage.setItem(SKEY, JSON.stringify(S)); } catch (e) {} };
const MAIN = LEVELS.filter(l => !l.boss);
const BOSS = LEVELS.find(l => l.boss);
const pieceCount = () => MAIN.filter(l => S.done[l.id]).length;
const totalScore = () => Object.values(S.scores).reduce((a, b) => a + b, 0);
const resetProgress = () => Object.assign(S, { done: {}, unlocked: {}, wishes: [], scores: {}, assembled: false, finishedAt: null });

/* ---------- Điểm & bảng xếp hạng ---------- */
function levelScore(L, hearts, sec) {
  const base = L.boss ? 200 : 100, heart = 30 * hearts, speed = Math.max(0, 60 - Math.floor(sec / (L.boss ? 3 : 4)));
  return { base, heart, speed, total: base + heart + speed };
}
let syncWarned = false;
function syncScore() {
  if (!S.name) return;
  LB.submit({
    room: S.room, pid: S.pid, name: S.name.slice(0, 24), cls: (S.cls || '').slice(0, 10), avatar: S.avatar,
    score: totalScore(), done: LEVELS.filter(l => S.done[l.id]).length, finished: !!S.done[BOSS.id], finishedAt: S.finishedAt || null
  }).catch(() => { if (!syncWarned) { syncWarned = true; toast('⚠️ Chưa gửi được điểm lên bảng xếp hạng. Kiểm tra mạng nhé!', 'warn'); } });
}
const MODE_LABEL = {
  firebase: '🟢 Trực tiếp · Firebase', sheets: '🟢 Google Sheets · cập nhật mỗi 10 giây',
  server: '🟢 Máy chủ trong lớp', local: '🟡 Chạy thử trên 1 máy'
};

/* ---------- Linh vật BIT ---------- */
const bitSvg = (size = 90, cls = '') => `<svg class="bit ${cls}" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">
  <line x1="60" y1="22" x2="60" y2="8" stroke="#00f0ff" stroke-width="3"/><circle class="bit-led" cx="60" cy="7" r="5.5" fill="#ff2bd6"/>
  <rect x="10" y="44" width="9" height="20" rx="4.5" fill="#ff2bd6"/><rect x="101" y="44" width="9" height="20" rx="4.5" fill="#ff2bd6"/>
  <rect x="18" y="20" width="84" height="68" rx="28" fill="#1d1250" stroke="#00f0ff" stroke-width="3"/>
  <rect x="24" y="25" width="40" height="10" rx="5" fill="rgba(255,255,255,.12)"/>
  <rect x="29" y="37" width="62" height="32" rx="16" fill="#05010f" stroke="rgba(0,240,255,.55)"/>
  <g class="bit-eyes"><ellipse cx="47" cy="52" rx="6.5" ry="7.5" fill="#00f0ff"/><ellipse cx="73" cy="52" rx="6.5" ry="7.5" fill="#00f0ff"/>
    <circle cx="49" cy="49" r="2" fill="#fff"/><circle cx="75" cy="49" r="2" fill="#fff"/></g>
  <path d="M52 62 q8 6 16 0" stroke="#39ff88" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <circle cx="35" cy="76" r="4" fill="rgba(255,43,214,.45)"/><circle cx="85" cy="76" r="4" fill="rgba(255,43,214,.45)"/>
  <rect x="40" y="90" width="40" height="22" rx="11" fill="#140a33" stroke="#8b5cf6" stroke-width="2"/><circle cx="60" cy="101" r="4.5" fill="#f9f871"/>
</svg>`;
const BIT_TIPS = [
  'Mật khẩu mạnh nên dài ít nhất 10 ký tự nhé!', 'Thấy tin "giật gân"? Kiểm tra nguồn trước khi chia sẻ!',
  'Không bao giờ đưa mã OTP cho bất kỳ ai.', 'Chơi càng nhanh, càng ít sai thì điểm càng cao!',
  'Mỗi ải cho 1 mảnh ghép – gom đủ 6 mảnh để cứu mình nhé!', 'AI là trợ lý, em mới là người quyết định.',
  'Gặp chuyện không ổn trên mạng? Hãy kể với thầy cô, bố mẹ.'
];

function status(L) {
  if (S.done[L.id]) return 'done';
  if (L.boss) { if (pieceCount() < MAIN.length) return 'locked'; }
  else if (S.mode === 'free' && L.id > 1 && !S.done[L.id - 1]) return 'locked';
  if (S.mode === 'station' && !S.unlocked[L.id]) return 'scan';
  return 'open';
}

/* ---------- Âm thanh & rung ---------- */
let actx;
function beep(f = 440, d = .08, type = 'square', vol = .05, when = 0) {
  if (!S.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + when;
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d + .02);
  } catch (e) {}
}
const sfx = {
  tap: () => beep(660, .05, 'square', .03),
  ok: () => { beep(523, .09, 'triangle', .09); beep(784, .14, 'triangle', .09, .08); },
  bad: () => { beep(190, .22, 'sawtooth', .07); beep(120, .25, 'sawtooth', .06, .08); },
  win: () => [523, 659, 784, 1046, 1318].forEach((f, i) => beep(f, .18, 'triangle', .09, i * .09))
};
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

/* ---------- Điều hướng màn hình ---------- */
let cleanups = [];
const onCleanup = f => cleanups.push(f);
function go(html, { cls = '', nav = null, after = null } = {}) {
  cleanups.forEach(f => { try { f(); } catch (e) {} });
  cleanups = [];
  $$('.modal', phone).forEach(m => m.remove());
  app.innerHTML = `<div class="screen ${cls} ${nav ? 'has-nav' : ''}">${html}</div>${nav ? navBar(nav) : ''}`;
  const scr = app.firstElementChild;
  if (nav) bindNav();
  after && after(scr);
  return scr;
}
const navBar = a => `<nav class="nav glass">${[['map', '🗺️', 'Bản đồ'], ['pieces', '🧩', 'Mảnh ghép'], ['rank', '🏆', 'Xếp hạng'], ['wishes', '💌', 'Lời chúc'],
  ...(S.mode === 'station' ? [['scan', '📷', 'Quét QR']] : [])]
  .map(([k, i, t]) => `<button class="${a === k ? 'on' : ''}" data-nav="${k}"><span>${i}</span>${t}</button>`).join('')}</nav>`;
function bindNav() {
  $$('[data-nav]', app).forEach(b => b.onclick = () => {
    sfx.tap();
    ({ map: renderMap, pieces: renderPieces, rank: renderRank, wishes: renderWishes, scan: () => renderScan() })[b.dataset.nav]();
  });
}
const backBar = (label, id = 'bk') => `<div class="topbar"><button class="icon-btn" id="${id}">‹</button><span>${label}</span><span></span></div>`;

function toast(msg, type = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + type; t.innerHTML = msg; phone.appendChild(t);
  setTimeout(() => t.classList.add('out'), 2400); setTimeout(() => t.remove(), 2900);
}
function modal(html) {
  const m = document.createElement('div');
  m.className = 'modal'; m.innerHTML = `<div class="modal-box glass">${html}</div>`; phone.appendChild(m);
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) m.remove(); });
  return m;
}
async function typeText(el, text, speed = 24) {
  if (!el) return;
  let skip = false; el.onclick = () => skip = true; el.textContent = '';
  for (const ch of text) {
    if (!el.isConnected) return;
    if (skip) { el.textContent = text; return; }
    el.textContent += ch;
    if (ch !== ' ' && Math.random() < .25) beep(1400, .012, 'square', .012);
    await wait(speed);
  }
}

/* ---------- Hiệu ứng nền ---------- */
function startRain() {
  const cv = $('#rain'), g = cv.getContext('2d'), fs = 14;
  let w, h, drops;
  const rs = () => { w = cv.width = phone.clientWidth; h = cv.height = phone.clientHeight; drops = Array(Math.ceil(w / fs)).fill(0).map(() => Math.random() * -60); };
  rs(); addEventListener('resize', rs);
  setInterval(() => {
    g.fillStyle = 'rgba(6,2,15,.2)'; g.fillRect(0, 0, w, h); g.font = fs + 'px monospace';
    drops.forEach((y, i) => {
      g.fillStyle = i % 3 ? '#00f0ff' : '#ff2bd6';
      g.fillText(Math.random() < .5 ? '0' : '1', i * fs, y * fs);
      drops[i] = y * fs > h && Math.random() > .975 ? 0 : y + 1;
    });
  }, 75);
}
function confetti(n = 140) {
  const cv = document.createElement('canvas'); cv.className = 'confetti'; phone.appendChild(cv);
  const w = cv.width = phone.clientWidth, h = cv.height = phone.clientHeight, g = cv.getContext('2d');
  const cols = ['#00f0ff', '#ff2bd6', '#f9f871', '#39ff88', '#8b5cf6'];
  const ps = [...Array(n)].map(() => ({ x: w / 2, y: h * .38, vx: (Math.random() - .5) * 13, vy: -Math.random() * 13 - 4,
    s: Math.random() * 7 + 3, c: cols[Math.random() * 5 | 0], r: Math.random() * 6, vr: (Math.random() - .5) * .3 }));
  let t = 0;
  (function f() {
    g.clearRect(0, 0, w, h);
    ps.forEach(p => {
      p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore();
    });
    if (++t < 170) requestAnimationFrame(f); else cv.remove();
  })();
}

/* ---------- Ảnh Huy hiệu & 6 mảnh ghép (vẽ bằng canvas) ---------- */
let FULL = '', PIECES = [];
function buildArt() {
  const W = 600, H = 400, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  let seed = 2026; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const HZ = 215;
  let gr = g.createLinearGradient(0, 0, 0, HZ);
  gr.addColorStop(0, '#12052e'); gr.addColorStop(1, '#6a1272');
  g.fillStyle = gr; g.fillRect(0, 0, W, HZ);
  g.fillStyle = '#07021a'; g.fillRect(0, HZ, W, H - HZ);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * .8})`; g.fillRect(rnd() * W, rnd() * HZ * .8, 1.6, 1.6); }
  // mặt trời neon
  const cx = 300, R = 120;
  g.save(); g.beginPath(); g.arc(cx, HZ, R, Math.PI, 0); g.closePath(); g.clip();
  const sg = g.createLinearGradient(0, HZ - R, 0, HZ); sg.addColorStop(0, '#f9f871'); sg.addColorStop(1, '#ff2bd6');
  g.fillStyle = sg; g.fillRect(cx - R, HZ - R, 2 * R, R);
  g.fillStyle = '#5a1068';
  for (let k = 0; k < 7; k++) g.fillRect(cx - R, HZ - 8 - k * 15, 2 * R, 2 + k * .9);
  g.restore();
  // tòa nhà
  for (let x = -10; x < W; x += 26 + rnd() * 18) {
    const bw = 22 + rnd() * 26, bh = 40 + rnd() * (Math.abs(x - cx) < 140 ? 70 : 130);
    g.fillStyle = '#0c0428'; g.fillRect(x, HZ - bh, bw, bh);
    g.strokeStyle = rnd() < .5 ? 'rgba(0,240,255,.55)' : 'rgba(255,43,214,.55)'; g.lineWidth = 1; g.strokeRect(x + .5, HZ - bh + .5, bw - 1, bh);
    for (let wy = HZ - bh + 6; wy < HZ - 6; wy += 9) for (let wx = x + 4; wx < x + bw - 4; wx += 7)
      if (rnd() < .45) { g.fillStyle = rnd() < .5 ? '#00f0ff' : '#f9f871'; g.globalAlpha = .7; g.fillRect(wx, wy, 3, 4); g.globalAlpha = 1; }
  }
  // lưới sàn phối cảnh
  g.strokeStyle = 'rgba(255,43,214,.75)'; g.lineWidth = 1.5; g.shadowColor = '#ff2bd6'; g.shadowBlur = 6;
  for (let i = 1; i < 14; i++) { const y = HZ + Math.pow(i / 13, 2) * (H - HZ); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  for (let i = -14; i <= 14; i++) { g.beginPath(); g.moveTo(cx + i * 10, HZ); g.lineTo(cx + i * 80, H); g.stroke(); }
  g.shadowBlur = 0;
  // chữ huy hiệu
  g.textAlign = 'center';
  g.fillStyle = 'rgba(6,2,15,.65)'; g.fillRect(40, 268, 520, 98);
  g.strokeStyle = '#00f0ff'; g.lineWidth = 2; g.strokeRect(40, 268, 520, 98);
  g.font = '700 54px "Chakra Petch", sans-serif'; g.fillStyle = '#fff'; g.shadowColor = '#00f0ff'; g.shadowBlur = 18;
  g.fillText('CÔNG DÂN SỐ', 300, 326);
  g.font = '700 20px "Chakra Petch", sans-serif'; g.fillStyle = '#f9f871'; g.shadowColor = '#f9f871'; g.shadowBlur = 10;
  g.fillText('TRƯỜNG HỌC SỐ NEO-CITY', 300, 354);
  g.shadowBlur = 0;
  g.strokeStyle = '#f9f871'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
  FULL = c.toDataURL('image/png');
  PIECES = [];
  for (let i = 0; i < 6; i++) {
    const p = document.createElement('canvas'); p.width = p.height = 200;
    p.getContext('2d').drawImage(c, (i % 3) * 200, (i / 3 | 0) * 200, 200, 200, 0, 0, 200, 200);
    PIECES.push(p.toDataURL('image/png'));
  }
}

/* ---------- Khởi động & tạo nhân vật ---------- */
function renderBoot() {
  go(`<div class="boot">
    <div class="logo"><div class="logo-ring"></div><div class="glitch" data-text="NEO-CITY">NEO-CITY</div><div class="logo-sub">GIẢI CỨU TRƯỜNG HỌC SỐ</div></div>
    <pre class="term" id="term"></pre>
    <div class="form glass hidden" id="form">
      <div class="form-row">
        <div><label for="nm">TÊN CỦA EM</label>
        <input class="input" id="nm" maxlength="20" placeholder="VD: Minh Anh" autocomplete="off" value="${esc(S.name)}"></div>
        <div class="cls-col"><label for="cl">LỚP</label>
        <input class="input" id="cl" maxlength="6" placeholder="8A" title="Không bắt buộc – phụ huynh có thể để trống" autocomplete="off" autocapitalize="characters" value="${esc(S.cls)}"></div>
      </div>
      <label>CHỌN AVATAR</label>
      <div class="avatars">${AVATARS.map(a => `<button class="av ${a === S.avatar ? 'sel' : ''}" data-a="${a}">${a}</button>`).join('')}</div>
      <p class="tiny">Lớp không bắt buộc – phụ huynh, khách mời có thể để trống.</p>
      <button class="btn big" id="go">⚡ KÍCH HOẠT</button>
    </div></div>`, {
    after: async () => {
      const term = $('#term');
      for (const line of ['> Kết nối máy chủ Trường THCS Neo-City... OK', '> CẢNH BÁO: phát hiện virus AI "GLITCH" ⚠', '> Đang triệu tập Đội Công dân số...', '> Sẵn sàng.']) {
        for (const ch of line) { if (!term.isConnected) return; term.textContent += ch; await wait(14); }
        term.textContent += '\n'; beep(880, .04, 'square', .03); await wait(160);
      }
      $('#form').classList.remove('hidden');
      $$('.av').forEach(b => b.onclick = () => { sfx.tap(); $$('.av').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); S.avatar = b.dataset.a; });
      $('#go').onclick = () => {
        const n = $('#nm').value.trim().replace(/\s+/g, ' ');
        const c = $('#cl').value.trim().toUpperCase().replace(/\s+/g, '');
        if (n.length < 2) { toast('Nhập tên của em (ít nhất 2 ký tự) nhé!', 'warn'); $('#nm').focus(); return; }
        if (isBadName(n) || isBadName(c)) {
          sfx.bad(); buzz([60, 40, 60]);
          const f = isBadName(n) ? $('#nm') : $('#cl'); f.classList.add('shake', 'bad'); setTimeout(() => f.classList.remove('shake'), 500);
          toast('🚫 Tên có từ ngữ không phù hợp.<br>Công dân số văn minh chọn tên đẹp nhé! 😊', 'warn'); f.focus(); return;
        }
        const fresh = !Object.keys(S.done).length;
        S.name = n; S.cls = c; save(); sfx.win(); syncScore();
        fresh ? renderStory() : renderMap();
      };
    }
  });
}
function renderStory() {
  const pages = [
    { ico: '🏫', c: 'var(--cyan)', title: 'TRƯỜNG HỌC SỐ NEO-CITY',
      text: 'Trường THCS Neo-City vừa trở thành "Trường học số": điểm danh bằng khuôn mặt, sổ liên lạc điện tử, thư viện số, lớp học thông minh và cả một trợ lý AI tên BIT luôn giúp thầy cô và học sinh.\n\nChỉ còn một tuần nữa là đến Ngày hội Chuyển đổi số của trường!' },
    { ico: '👾', c: 'var(--red)', title: 'VIRUS GLITCH TẤN CÔNG!',
      text: 'Đêm qua, virus AI tên GLITCH đột nhập hệ thống. Nó khóa cổng trường, tung tin giả lên bảng tin, gửi email lừa đảo vào hộp thư lớp, khóa thư viện số… và khống chế BIT trong Phòng Máy Chủ.\n\nNếu không ai ngăn lại, Ngày hội sẽ bị hủy!' },
    { ico: bitSvg(120), c: 'var(--green)', title: 'BIT GỬI TÍN HIỆU CẦU CỨU',
      text: `"${S.name} ơi… mình là BIT đây. Mình còn chút năng lượng để gửi tin này. Thầy cô đã chọn em vào ĐỘI CÔNG DÂN SỐ của trường.\n\nHãy đi qua 6 khu vực, dùng kiến thức số để đánh bại bẫy của GLITCH, thu thập 6 mảnh Huy hiệu rồi tới Phòng Máy Chủ cứu mình nhé!"` }
  ];
  let i = 0;
  const show = () => {
    const p = pages[i];
    go(`<div class="story">
      <div class="villain" style="filter:drop-shadow(0 0 20px ${p.c})">${p.ico}</div>
      <h2 class="neon-title" style="--c:${p.c}">${p.title}</h2>
      <div class="glass"><p id="st" style="white-space:pre-line"></p></div>
      <div class="hint center">${pages.map((_, k) => k === i ? '◆' : '◇').join(' ')}</div>
      <button class="btn big" id="go">${i < pages.length - 1 ? 'TIẾP TỤC ›' : '🗺️ VÀO BẢN ĐỒ TRƯỜNG'}</button></div>`, {
      after: () => {
        typeText($('#st'), p.text, 18);
        $('#go').onclick = () => { sfx.tap(); if (++i < pages.length) show(); else renderMap(); };
      }
    });
  };
  show();
}

/* ---------- Bản đồ ---------- */
function renderMap() {
  const XS = [50, 26, 72, 30, 70, 32, 50], GAP = 150, TOP = 90;
  const H = TOP + GAP * (LEVELS.length - 1) + 150;
  const pts = LEVELS.map((L, i) => ({ x: XS[i % XS.length], y: TOP + i * GAP }));
  const seg = (a, b) => `M${a.x} ${a.y} C${a.x} ${(a.y + b.y) / 2},${b.x} ${(a.y + b.y) / 2},${b.x} ${b.y} `;
  let full = '', lit = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const d = seg(pts[i], pts[i + 1]); full += d;
    if (S.done[LEVELS[i].id] && status(LEVELS[i + 1]) !== 'locked') lit += d;
  }
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const blds = [...Array(16)].map(() => `<div class="bldg" style="left:${rnd() < .5 ? rnd() * 12 : 86 + rnd() * 10}%;top:${rnd() * (H - 160)}px;height:${60 + rnd() * 100}px"></div>`).join('');

  go(`
    <header class="hud glass">
      <div class="hud-av">${S.avatar}</div>
      <div class="hud-info"><b>${esc(S.name)} <em>${esc(S.cls)}</em></b><small>${S.mode === 'station' ? '📷 Trạm QR' : '🗺️ Tự do'} · Phiên ${esc(S.room)}</small></div>
      <div class="hud-stats"><span class="hud-chip">⭐ ${totalScore()}</span><span class="hud-chip pc">🧩 ${pieceCount()}/6</span></div>
      <button class="icon-btn" id="set" aria-label="Cài đặt">⚙️</button>
    </header>
    <div class="map-wrap" id="mw"><div class="map" style="height:${H}px">
      <div class="city-bg"></div>${blds}
      <svg class="map-path" viewBox="0 0 100 ${H}" preserveAspectRatio="none"><path class="p-dim" d="${full}"/><path class="p-lit" d="${lit}"/></svg>
      ${LEVELS.map((L, i) => {
        const st = status(L), side = pts[i].x > 50 ? 'left' : 'right';
        return `<button class="node ${st} ${L.boss ? 'boss' : ''}" data-id="${L.id}" style="left:${pts[i].x}%;top:${pts[i].y}px;--c:${L.color}">
          <span class="node-core"><i>${st === 'locked' ? '🔒' : L.icon}</i></span>
          ${st === 'done' ? '<span class="node-badge ok">✓</span>' : st === 'scan' ? '<span class="node-badge">📷</span>' : ''}
          <span class="node-label ${L.boss ? 'right' : side}" ${L.boss ? 'style="left:auto;right:auto;top:auto;bottom:-46px;transform:none;width:200px;margin-left:-52px;text-align:center"' : ''}><small>${L.boss ? 'TRÙM CUỐI' : 'ẢI ' + L.id}</small>${L.name}</span>
        </button>`;
      }).join('')}
      <div class="map-end" style="top:${H - 30}px">◢ NGÀY HỘI CHUYỂN ĐỔI SỐ ◣</div>
      ${(() => { const c = LEVELS.findIndex(l => ['open', 'scan'].includes(status(l))); return c < 0 ? '' :
        `<div class="me-pin" style="left:${pts[c].x}%;top:${pts[c].y - (LEVELS[c].boss ? 118 : 106)}px"><span>${S.avatar}</span><i>EM Ở ĐÂY</i></div>`; })()}
    </div></div>
    <button class="bit-helper" id="bith" aria-label="Lời khuyên của BIT">${bitSvg(62)}<span class="bit-bubble" id="bitb">Chạm vào ải đang sáng để bắt đầu nhé!</span></button>`, {
    cls: 'flush', nav: 'map',
    after: scr => {
      $('#set').onclick = openSettings;
      let tip = 0;
      $('#bith').onclick = () => { sfx.tap(); const b = $('#bitb'); b.textContent = BIT_TIPS[tip++ % BIT_TIPS.length]; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); };
      setTimeout(() => { const b = $('#bitb'); if (b) b.classList.add('show'); }, 600);
      $$('.node', scr).forEach(b => b.onclick = () => {
        const L = LEVELS.find(l => l.id === +b.dataset.id), st = status(L);
        sfx.tap();
        if (st === 'locked') {
          b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 500);
          toast(L.boss ? '🔒 Hoàn thành đủ 6 khu vực để vào Phòng Máy Chủ!' : '🔒 Hãy hoàn thành ải trước để mở khóa!', 'warn');
        } else if (st === 'scan') renderScan(L.id);
        else renderBrief(L);
      });
      const cur = LEVELS.findIndex(l => ['open', 'scan'].includes(status(l)));
      const mw = $('#mw');
      if (cur > 0) mw.scrollTop = Math.max(0, pts[cur].y - mw.clientHeight / 2);
    }
  });
}

function openSettings() {
  sfx.tap();
  const m = modal(`<h3>⚙️ Cài đặt</h3>
    <div class="row"><span>Âm thanh</span><button class="tg ${S.sound ? 'on' : ''}" id="snd" aria-label="Âm thanh"></button></div>
    <div class="row"><span>Chế độ chơi</span><div class="seg2"><button data-m="free" class="${S.mode === 'free' ? 'on' : ''}">Tự do</button><button data-m="station" class="${S.mode === 'station' ? 'on' : ''}">Trạm QR</button></div></div>
    <p class="tiny">Trạm QR: phải quét mã dán tại từng trạm mới mở được ải (đi theo thứ tự bất kỳ). Tự do: chơi lần lượt từng ải.</p>
    <div class="row"><span>Đổi tên / avatar</span><button class="btn ghost" id="prof">✏️ Sửa</button></div>
    <button class="btn ghost" id="rst">↺ Chơi lại từ đầu</button>
    <button class="btn" data-close>Đóng</button>`);
  $('#snd', m).onclick = e => { S.sound = !S.sound; save(); e.currentTarget.classList.toggle('on', S.sound); sfx.tap(); };
  $$('[data-m]', m).forEach(b => b.onclick = () => { S.mode = b.dataset.m; save(); renderMap(); toast(S.mode === 'station' ? '📷 Đã chuyển sang chế độ Trạm QR' : '🗺️ Đã chuyển sang chế độ Tự do'); });
  $('#prof', m).onclick = () => renderBoot();
  $('#rst', m).onclick = () => {
    if (!confirm('Xóa toàn bộ tiến trình và chơi lại từ đầu?')) return;
    resetProgress(); S.pid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8); save(); syncScore(); renderMap();
  };
}

/* ---------- Giới thiệu ải ---------- */
function renderBrief(L) {
  go(`${backBar(L.boss ? 'TRÙM CUỐI' : 'ẢI ' + L.id + '/6')}
    <div class="brief">
      <div class="holo" style="--c:${L.color}"><div class="holo-ring"></div><div class="holo-ring r2"></div><span>${L.icon}</span></div>
      <h2 class="neon-title" style="--c:${L.color}">${L.name}</h2>
      <p class="area">${L.area}</p>
      <div class="glass brief-box bit-say">${bitSvg(54, 'bit-mini')}<div><b>BIT</b><p id="story"></p></div></div>
      <div class="glass mission"><b>🎯 NHIỆM VỤ</b><p>${L.mission}</p></div>
      <div class="glass mission"><b>🎁 PHẦN THƯỞNG</b><p>${S.done[L.id] ? 'Đã nhận – chơi lại để luyện tập nhé!' : L.boss ? 'Mở khóa màn ghép Huy hiệu + Chứng nhận Công dân số' : `Mảnh ghép #${L.id} + 1 Lời chúc bí mật`}</p></div>
      <button class="btn big" id="st">⚡ BẮT ĐẦU XÂM NHẬP</button>
    </div>`, {
    after: () => {
      typeText($('#story'), L.story, 18);
      $('#bk').onclick = () => { sfx.tap(); renderMap(); };
      $('#st').onclick = () => { sfx.tap(); playLevel(L); };
    }
  });
}

/* ---------- Chơi ải ---------- */
function playLevel(L) {
  const scr = go(`
    <div class="lv-top" style="--c:${L.color}">
      <button class="icon-btn" id="bk">‹</button>
      <div class="lv-title"><small>${L.boss ? 'TRÙM CUỐI' : 'ẢI ' + L.id}</small><b>${L.icon} ${L.name}</b></div>
      <div class="hearts" id="hearts"></div>
    </div>
    <div class="lv-bar"><i id="lvbar"></i></div>
    <div class="stage" id="stage"></div>`);
  const max = L.hearts || 3;
  const ctx = {
    stage: $('#stage'), hearts: max, max, alive: true, ended: false, sfx, buzz, t0: Date.now(),
    onCleanup,
    setProg(p) { const b = $('#lvbar'); if (b) b.style.width = Math.max(0, Math.min(1, p)) * 100 + '%'; },
    hit() {
      if (!ctx.alive || ctx.ended) return false;
      ctx.hearts = Math.max(0, ctx.hearts - 1);
      sfx.bad(); buzz([80, 40, 80]);
      drawHearts(true);
      scr.classList.remove('shake'); void scr.offsetWidth; scr.classList.add('shake');
      const f = document.createElement('div'); f.className = 'hurt-flash'; phone.appendChild(f); setTimeout(() => f.remove(), 650);
      if (ctx.hearts <= 0) { ctx.ended = true; setTimeout(() => ctx.alive && failLevel(L), 900); return false; }
      return true;
    },
    win() { if (!ctx.alive || ctx.ended) return; ctx.ended = true; ctx.setProg(1); setTimeout(() => ctx.alive && winLevel(L, levelScore(L, ctx.hearts, (Date.now() - ctx.t0) / 1000)), 350); }
  };
  onCleanup(() => { ctx.alive = false; });
  function drawHearts(pop) {
    $('#hearts').innerHTML = [...Array(max)].map((_, i) =>
      `<i class="${i >= ctx.hearts ? 'lost' : ''} ${pop && i === ctx.hearts ? 'pop' : ''}">${i < ctx.hearts ? '💙' : '🖤'}</i>`).join('');
  }
  drawHearts();
  $('#bk').onclick = () => { if (confirm('Thoát ải? Tiến trình ải này sẽ mất.')) renderMap(); };
  const fn = PUZZLES[L.type];
  if (!fn) { ctx.stage.innerHTML = `<p class="hint center">Ải "${L.type}" chưa được cài đặt.</p>`; return; }
  try { fn(ctx, L); } catch (e) { console.error(e); ctx.stage.innerHTML = '<p class="hint center">Có lỗi khi tải ải. Hãy thử lại.</p>'; }
}

function pickWish() {
  const left = WISHES.filter(w => !S.wishes.includes(w));
  return (left.length ? left : WISHES)[Math.random() * (left.length || WISHES.length) | 0];
}

function winLevel(L, sc) {
  const first = !S.done[L.id];
  const best = sc.total > (S.scores[L.id] || 0);
  let wish = null;
  if (first) {
    S.done[L.id] = true;
    wish = pickWish(); S.wishes.push(wish);
    if (L.boss) S.finishedAt = Date.now();
  }
  if (best) S.scores[L.id] = sc.total;
  save(); syncScore();
  sfx.win(); buzz([60, 40, 160]);
  go(`<div class="reward">
    <div class="glitch" data-text="HOÀN THÀNH!">HOÀN THÀNH!</div>
    <p class="area">${L.boss ? 'BIT đã được giải cứu! Ngày hội Chuyển đổi số của trường diễn ra thành công!' : `Ải ${L.id} · ${L.name}`}</p>
    ${L.boss ? '<div class="trophy">🏆</div>' : `
      <div class="flip ${first ? '' : 'flipped'}" id="flip"><div class="flip-in"><div class="face front">?</div><div class="face back"><img src="${PIECES[L.id - 1]}" alt="Mảnh ghép ${L.id}"></div></div></div>
      <p class="pc-label">🧩 Mảnh ghép #${L.id} ${first ? 'đã được thu thập!' : '(đã có trong kho)'} · ${pieceCount()}/6</p>`}
    <div class="glass score-box">
      <div class="score-big"><span id="sc">0</span><small>ĐIỂM${best && !first ? ' · KỶ LỤC MỚI!' : ''}</small></div>
      <div class="score-rows"><span>Hoàn thành <b>+${sc.base}</b></span><span>💙 Mạng còn lại <b>+${sc.heart}</b></span><span>⚡ Tốc độ <b>+${sc.speed}</b></span></div>
    </div>
    <div class="glass lesson">${bitSvg(46, 'bit-mini')}<div><b>📘 BÀI HỌC SỐ · BIT nhắn em</b><p>${L.lesson}</p></div></div>
    ${wish ? '<div class="wish glass"><b>💌 LỜI CHÚC BÍ MẬT</b><p id="wish"></p></div>' : ''}
    <div class="btns">
      ${L.boss ? '<button class="btn big" id="asm">🧩 GHÉP HUY HIỆU</button>' : ''}
      ${!L.boss && pieceCount() === 6 && !S.done[BOSS.id] ? '<button class="btn big red" id="boss">👾 ĐỐI ĐẦU TRÙM CUỐI</button>' : ''}
      <div class="btn-row"><button class="btn ghost" id="rk">🏆 Xếp hạng</button><button class="btn ${L.boss ? 'ghost' : ''}" id="mp">🗺️ Về bản đồ</button></div>
    </div></div>`, {
    after: () => {
      confetti();
      countUp($('#sc'), sc.total, 1100);
      const flip = $('#flip'), wEl = $('#wish');
      if (first && flip) setTimeout(() => { if (flip.isConnected) { flip.classList.add('flipped'); beep(1046, .2, 'triangle', .08); } }, 800);
      if (wEl) setTimeout(() => typeText(wEl, wish, 26), 1500);
      $('#mp').onclick = () => { sfx.tap(); renderMap(); };
      $('#rk').onclick = () => { sfx.tap(); renderRank(); };
      const a = $('#asm'); if (a) a.onclick = () => { sfx.tap(); S.assembled ? renderCert() : renderAssemble(); };
      const b = $('#boss'); if (b) b.onclick = () => { sfx.tap(); const B = LEVELS.find(l => l.boss); status(B) === 'scan' ? renderScan(B.id) : renderBrief(B); };
    }
  });
}

function failLevel(L) {
  go(`<div class="reward fail">
    <div class="fail-ico">👾</div>
    <div class="glitch" data-text="MẤT KẾT NỐI!">MẤT KẾT NỐI!</div>
    <p>GLITCH đã chặn em ở <b>${L.name}</b>. Đừng nản – BIT tin em sẽ làm được!</p>
    <div class="btns"><button class="btn big" id="re">↻ THỬ LẠI</button><button class="btn ghost" id="mp">🗺️ Về bản đồ</button></div>
  </div>`, { after: () => { $('#re').onclick = () => playLevel(L); $('#mp').onclick = renderMap; } });
}

/* ---------- Kho mảnh ghép ---------- */
function renderPieces() {
  const pc = pieceCount(), boss = LEVELS.find(l => l.boss);
  go(`<div class="topbar"><span></span><span>KHO MẢNH GHÉP</span><span></span></div>
    <h2 class="neon-title" style="--c:var(--yellow)">HUY HIỆU CÔNG DÂN SỐ</h2>
    <p class="hint center">Mỗi ải hoàn thành = 1 mảnh ghép. Đủ 6 mảnh và cứu BIT ở Phòng Máy Chủ để ghép Huy hiệu, nhận Chứng nhận!</p>
    <div class="board">${MAIN.map((L, i) => S.done[L.id]
      ? `<div class="slot filled"><img src="${PIECES[i]}" alt=""></div>`
      : `<div class="slot q"><span>?</span><small>${L.icon} Ải ${L.id}</small></div>`).join('')}</div>
    <div class="pc-count">${pc}/6 mảnh</div>
    ${S.assembled ? '<button class="btn big" id="cert">🏆 XEM CHỨNG NHẬN</button>'
      : S.done[boss.id] ? '<button class="btn big" id="asm">🧩 GHÉP HUY HIỆU NGAY</button>'
      : pc === 6 ? '<button class="btn big red" id="bs">👾 Tới Phòng Máy Chủ cứu BIT</button>' : ''}`, {
    nav: 'pieces',
    after: () => {
      const c = $('#cert'); if (c) c.onclick = renderCert;
      const a = $('#asm'); if (a) a.onclick = renderAssemble;
      const b = $('#bs'); if (b) b.onclick = () => status(boss) === 'scan' ? renderScan(boss.id) : renderBrief(boss);
    }
  });
}

/* ---------- Bảng xếp hạng ---------- */
function countUp(el, to, ms = 900) {
  if (!el) return;
  const t0 = performance.now();
  (function f(t) {
    if (!el.isConnected) return;
    const k = Math.min(1, (t - t0) / ms);
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(f);
  })(t0);
}
function renderRank() {
  let list = null, tab = 'me', err = null;
  go(`<div class="topbar"><span></span><span>BẢNG XẾP HẠNG</span><span></span></div>
    <div class="rank-me glass" id="rme"></div>
    <div class="seg2 rank-tabs"><button data-t="me" class="on">👤 Cá nhân</button><button data-t="cls">🏫 Theo lớp</button></div>
    <div class="rlist" id="rlist"><div class="empty"><div class="spin">📡</div>Đang kết nối bảng xếp hạng…</div></div>
    <p class="tiny center" id="rmode"></p>`, {
    nav: 'rank',
    after: () => {
      const draw = () => {
        const box = $('#rlist'); if (!box) return;
        const me = list ? list.findIndex(p => p.pid === S.pid) : -1;
        $('#rme').innerHTML = `<div class="rm-av">${S.avatar}</div>
          <div class="rm-info"><b>${esc(S.name)}</b><small>${S.cls ? 'Lớp ' + esc(S.cls) : 'Phụ huynh / Khách'} · Phiên ${esc(S.room)}</small></div>
          <div class="rm-rank"><small>HẠNG</small><b>${me >= 0 ? '#' + (me + 1) : '—'}</b></div>
          <div class="rm-score"><small>ĐIỂM</small><b>${totalScore()}</b></div>`;
        if (err) { box.innerHTML = `<div class="empty"><div>📡</div>Không tải được bảng xếp hạng.<br><small>${esc(err.message || err)}</small></div>`; return; }
        if (!list) return;
        if (!list.length) { box.innerHTML = '<div class="empty"><div>🏁</div>Chưa có ai trên bảng.<br>Hoàn thành ải đầu tiên để ghi tên!</div>'; return; }
        if (tab === 'me') {
          box.innerHTML = list.slice(0, 50).map((p, i) => `
            <div class="rrow ${p.pid === S.pid ? 'me' : ''} ${i < 3 ? 'top' + (i + 1) : ''}" style="animation-delay:${Math.min(i, 12) * .04}s">
              <span class="rr-pos">${['🥇', '🥈', '🥉'][i] || i + 1}</span>
              <span class="rr-av">${esc(p.avatar || '🤖')}</span>
              <span class="rr-name"><b>${esc(p.name)}</b><small>${esc(p.cls || 'Khách')} · ${p.finished ? '✅ Phá đảo' : `${p.done || 0}/7 ải`}</small>
                <i class="rr-bar"><i style="width:${(p.done || 0) / 7 * 100}%"></i></i></span>
              <span class="rr-score">${p.score || 0}</span>
            </div>`).join('');
        } else {
          const cl = LB.byClass(list), top = Math.max(1, ...cl.map(c => c.avg));
          box.innerHTML = cl.map((c, i) => `
            <div class="crow ${c.cls === ((S.cls || '').toUpperCase() || LB.GUEST) ? 'me' : ''}" style="animation-delay:${i * .05}s">
              <span class="rr-pos">${['🥇', '🥈', '🥉'][i] || i + 1}</span>
              <span class="cr-main"><b>${esc(c.label)}</b><small>${c.count} học sinh · ${c.finished} phá đảo</small>
                <i class="rr-bar big"><i style="width:${c.avg / top * 100}%"></i></i></span>
              <span class="rr-score">${c.avg}<small>TB</small></span>
            </div>`).join('') + '<p class="tiny center">Xếp theo điểm trung bình của lớp.</p>';
        }
      };
      $$('[data-t]').forEach(b => b.onclick = () => { sfx.tap(); tab = b.dataset.t; $$('[data-t]').forEach(x => x.classList.toggle('on', x === b)); draw(); });
      draw();
      onCleanup(LB.subscribe(S.room, (l, e) => { err = l ? null : e; if (l) list = l; draw(); }, LB.mode === 'sheets' ? 10000 : undefined));
      LB.init().then(() => { const m = $('#rmode'); if (m) m.textContent = MODE_LABEL[LB.mode] || ''; }).catch(() => {});
    }
  });
}

/* ---------- Lời chúc ---------- */
function renderWishes() {
  go(`<div class="topbar"><span></span><span>HỘP THƯ LỜI CHÚC</span><span></span></div>
    <h2 class="neon-title" style="--c:var(--pink)">💌 ${S.wishes.length} LỜI CHÚC</h2>
    ${S.wishes.length ? `<div class="wlist">${S.wishes.map((w, i) => `<div class="witem glass" style="animation-delay:${i * .07}s"><i>${['💖', '🌟', '🚀', '🎉', '💎', '🌈', '🏆'][i % 7]}</i><p>${esc(w)}</p></div>`).join('')}</div>`
      : '<div class="empty"><div>📭</div>Chưa có lời chúc nào.<br>Hoàn thành ải để mở khóa lời chúc bí mật!</div>'}
    ${S.wishes.length && S.wishes.length < LEVELS.length ? `<p class="hint center">Còn ${LEVELS.length - S.wishes.length} lời chúc đang chờ em mở khóa…</p>` : ''}`, { nav: 'wishes' });
}

/* ---------- Quét QR trạm ---------- */
function parseKey(txt) {
  txt = String(txt || '').trim();
  try { const k = new URL(txt).searchParams.get('key'); if (k) txt = k; } catch (e) {}
  return txt.toUpperCase();
}
function applyKey(txt) {
  const L = LEVELS.find(l => l.key === parseKey(txt));
  if (!L) return null;
  S.unlocked[L.id] = true; save();
  return L;
}
function afterUnlock(L) {
  sfx.win(); buzz([50, 30, 50]);
  toast(`🔓 Đã mở khóa: <b>${L.name}</b>`, 'ok');
  const st = status(L);
  if (st === 'open' || st === 'done') renderBrief(L);
  else { renderMap(); setTimeout(() => toast(L.boss ? 'Cần hoàn thành 6 khu vực trước khi vào Phòng Máy Chủ!' : 'Hãy hoàn thành ải trước đó!', 'warn'), 600); }
}
let qrLibPromise;
function loadQrLib() {
  return qrLibPromise = qrLibPromise || new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
    s.onload = res; s.onerror = () => { qrLibPromise = null; rej(new Error('load')); };
    document.head.appendChild(s);
  });
}
function renderScan(forId) {
  const L = forId && LEVELS.find(l => l.id === forId);
  go(`<div class="topbar"><span></span><span>QUÉT MÃ TRẠM</span><span></span></div>
    <p class="hint center">${L ? `Tìm tới <b style="color:${L.color}">${L.boss ? 'Trạm cuối' : 'Trạm ' + L.id} – ${L.name}</b> và quét mã QR để mở khóa.` : 'Hướng camera vào mã QR dán tại trạm để mở khóa ải.'}</p>
    <div class="scanner"><div id="reader"></div>
      <div class="scan-frame"><i></i><i></i><i></i><i></i><div class="scan-laser"></div></div>
      <div class="scan-msg" id="smsg">Đang mở camera…</div></div>
    <div class="glass manual"><label for="kc">HOẶC NHẬP MÃ TRẠM</label>
      <div class="row"><input class="input" id="kc" placeholder="VD: NC-GATE-01" autocomplete="off" autocapitalize="characters"><button class="btn" id="kok">Mở</button></div></div>
    <p class="tiny center">Mẹo: có thể dùng app Camera của điện thoại quét mã trạm – trò chơi sẽ tự mở khóa.</p>`, {
    nav: 'scan',
    after: async () => {
      let alive = true, qr = null, done = false;
      onCleanup(() => { alive = false; if (qr) qr.stop().catch(() => {}); });
      const tryKey = txt => {
        if (done) return;
        const hit = applyKey(txt);
        if (!hit) { toast('⚠️ Mã này không thuộc Neo-City!', 'warn'); sfx.bad(); return; }
        done = true; afterUnlock(hit);
      };
      $('#kok').onclick = () => tryKey($('#kc').value);
      $('#kc').onkeydown = e => { if (e.key === 'Enter') tryKey($('#kc').value); };
      const msg = t => { const m = $('#smsg'); if (m) m.textContent = t; };
      if (!window.isSecureContext) { msg('Camera trong game cần trang HTTPS. Hãy dùng app Camera hoặc nhập mã bên dưới.'); return; }
      try {
        await loadQrLib();
        if (!alive) return;
        qr = new Html5Qrcode('reader', { verbose: false });
        let last = 0;
        await qr.start({ facingMode: 'environment' }, { fps: 10, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * .68); return { width: s, height: s }; } },
          txt => { if (Date.now() - last < 1500) return; last = Date.now(); tryKey(txt); }, () => {});
        if (!alive) { qr.stop().catch(() => {}); return; }
        msg('Giữ mã QR nằm trong khung');
      } catch (e) {
        qr = null;
        msg('Không mở được camera. Hãy cho phép quyền camera, dùng app Camera, hoặc nhập mã bên dưới.');
      }
    }
  });
}

/* ---------- Ghép huy hiệu ---------- */
function renderAssemble() {
  const order = shuffle([0, 1, 2, 3, 4, 5]);
  let sel = null, placed = 0;
  go(`${backBar('GHÉP HUY HIỆU')}
    <h2 class="neon-title" style="--c:var(--yellow)">GHÉP HUY HIỆU</h2>
    <p class="hint center">Chạm vào 1 mảnh bên dưới, rồi chạm vào ô đúng vị trí trên khung.</p>
    <div class="board" id="board">${order.map((_, i) => `<div class="slot" data-i="${i}"></div>`).join('')}</div>
    <div class="tray" id="tray">${order.map(i => `<button class="tp" data-i="${i}"><img src="${PIECES[i]}" alt=""></button>`).join('')}</div>`, {
    after: () => {
      $('#bk').onclick = renderPieces;
      $$('.tp').forEach(b => b.onclick = () => { sfx.tap(); $$('.tp').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = b; });
      $$('.slot').forEach(s => s.onclick = () => {
        if (s.classList.contains('filled')) return;
        if (!sel) { toast('Chọn 1 mảnh ghép trước nhé!'); return; }
        if (sel.dataset.i !== s.dataset.i) {
          sfx.bad(); buzz(60); s.classList.add('shake'); setTimeout(() => s.classList.remove('shake'), 450);
          toast('Chưa khớp – thử ô khác!', 'warn'); return;
        }
        sfx.ok(); s.classList.add('filled'); s.innerHTML = sel.innerHTML;
        sel.classList.remove('sel'); sel.classList.add('used'); sel = null;
        if (++placed === 6) {
          S.assembled = true; save();
          $('#board').classList.add('complete'); sfx.win(); confetti(200); buzz([80, 50, 200]);
          setTimeout(() => toast('🏆 HUY HIỆU CÔNG DÂN SỐ ĐÃ HOÀN THÀNH!', 'ok'), 300);
          setTimeout(renderCert, 2200);
        }
      });
    }
  });
}

/* ---------- Chứng nhận ---------- */
function wrapText(g, text, x, y, maxW, lh) {
  let line = '';
  for (const w of text.split(' ')) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); line = w; y += lh; } else line = t;
  }
  g.fillText(line, x, y);
  return y;
}
function drawCert(cv) {
  return new Promise(res => {
    const W = 1080, H = 1400; cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#120530'); bg.addColorStop(1, '#06020f');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(0,240,255,.08)'; g.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.shadowBlur = 20; g.shadowColor = '#00f0ff'; g.strokeStyle = '#00f0ff'; g.lineWidth = 6; g.strokeRect(30, 30, W - 60, H - 60);
    g.shadowColor = '#ff2bd6'; g.strokeStyle = '#ff2bd6'; g.lineWidth = 2; g.strokeRect(50, 50, W - 100, H - 100);
    g.textAlign = 'center'; g.fillStyle = '#fff';
    g.shadowColor = '#00f0ff'; g.shadowBlur = 24; g.font = '700 84px "Chakra Petch", sans-serif'; g.fillText('CHỨNG NHẬN', W / 2, 170);
    g.shadowColor = '#f9f871'; g.shadowBlur = 12; g.fillStyle = '#f9f871'; g.font = '700 38px "Chakra Petch", sans-serif';
    g.fillText('TRƯỜNG HỌC SỐ NEO-CITY', W / 2, 230);
    const img = new Image();
    img.onload = () => {
      g.shadowColor = '#f9f871'; g.shadowBlur = 30; g.drawImage(img, 165, 280, 750, 500); g.shadowBlur = 0;
      g.font = '88px serif'; g.fillText(S.avatar, W / 2, 900);
      g.fillStyle = '#8fa3c7'; g.font = '400 32px "Be Vietnam Pro", sans-serif'; g.fillText('Trao tặng thành viên Đội Công dân số', W / 2, 960);
      g.fillStyle = '#fff'; g.shadowColor = '#ff2bd6'; g.shadowBlur = 26; g.font = '800 76px "Be Vietnam Pro", sans-serif';
      g.fillText(S.name.toUpperCase(), W / 2, 1050, W - 160); g.shadowBlur = 0;
      g.fillStyle = '#e8f6ff'; g.font = '400 30px "Be Vietnam Pro", sans-serif';
      const y = wrapText(g, 'Đã vượt qua 6 thử thách, đánh bại virus GLITCH, giải cứu trợ lý AI BIT và bảo vệ Trường học số Neo-City.', W / 2, 1120, W - 200, 42);
      g.fillStyle = '#39ff88'; g.font = '600 24px "Be Vietnam Pro", sans-serif';
      wrapText(g, 'Hiểu biết số · Bảo mật mật khẩu · Nhận diện tin giả · Tư duy thuật toán · Hệ nhị phân · Chống lừa đảo', W / 2, y + 56, W - 200, 34);
      const d = new Date(S.finishedAt || Date.now());
      g.fillStyle = '#8fa3c7'; g.font = '400 24px "Be Vietnam Pro", sans-serif';
      g.fillText(`Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`, W / 2, H - 90);
      res();
    };
    img.src = FULL;
  });
}
function renderCert() {
  go(`${backBar('CHỨNG NHẬN')}
    <canvas id="cv" class="cert"></canvas>
    <a class="btn big" id="dl" download="chung-nhan-cong-dan-so.png">⬇️ TẢI CHỨNG NHẬN</a>
    <p class="tiny center">Trên iPhone: nhấn giữ vào ảnh để lưu.</p>
    <button class="btn ghost" id="ws">💌 Xem ${S.wishes.length} lời chúc</button>
    <button class="btn ghost" id="mp">🗺️ Về bản đồ</button>`, {
    after: async () => {
      $('#bk').onclick = renderMap; $('#mp').onclick = renderMap; $('#ws').onclick = renderWishes;
      const cv = $('#cv');
      await drawCert(cv);
      try { $('#dl').href = cv.toDataURL('image/png'); } catch (e) {}
    }
  });
}

/* ---------- Khởi chạy ---------- */
async function init() {
  startRain();
  try {
    await Promise.race([
      Promise.all(['700 54px "Chakra Petch"', '800 40px "Be Vietnam Pro"', '400 20px "Be Vietnam Pro"'].map(f => document.fonts.load(f, 'CÔNG DÂN SỐ'))),
      wait(2500)
    ]);
  } catch (e) {}
  buildArt();

  const p = new URLSearchParams(location.search);
  const mode = p.get('mode'), key = p.get('key');
  const room = (p.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
  if (mode === 'free' || mode === 'station') { S.mode = mode; save(); }
  let newRoom = false;
  if (room && room !== S.room) {
    // Phiên chơi mới (lớp/buổi khác): bắt đầu lại, giữ tên để sửa nhanh nếu dùng chung máy
    resetProgress(); S.room = room; save(); newRoom = !!S.name;
  }
  const L = key ? applyKey(key) : null;
  if (mode || key || room) history.replaceState(null, '', location.pathname);

  if (!S.name || newRoom) {
    if (newRoom) setTimeout(() => toast(`Đã vào phiên <b>${esc(room)}</b>. Kiểm tra lại tên và lớp nhé!`, 'ok'), 300);
    renderBoot();
    if (L) setTimeout(() => toast(`🔓 Đã mở khóa trạm: <b>${L.name}</b>`, 'ok'), 400);
  } else if (L) afterUnlock(L);
  else renderMap();
  if (key && !L) setTimeout(() => toast('⚠️ Mã trạm không hợp lệ', 'warn'), 500);
}
