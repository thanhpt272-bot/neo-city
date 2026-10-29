/* ===== NEO-CITY · Bảng xếp hạng =====
   Nơi lưu điểm được chọn tự động theo config.js:
   - 'firebase': Firestore, cập nhật tức thì (cần firebase.apiKey)
   - 'sheets'  : Google Sheets qua Apps Script (cần sheets.scriptUrl), cập nhật mỗi vài giây
   - 'server'  : máy tính giáo viên chạy `node server.js`, lưu file xep-hang.csv / .json
   - 'local'   : chạy thử trên 1 máy (localStorage) khi chưa cấu hình gì
   Gọi `await LB.init()` trước khi đọc LB.mode.
   Bản ghi người chơi: { room, pid, name, cls, avatar, score, done, finished, finishedAt, updatedAt } */
const LB = (() => {
  const C = window.NEO_CONFIG || {};
  const fb = C.firebase || {}, sh = C.sheets || {};
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const api = {
    mode: fb.apiKey ? 'firebase' : sh.scriptUrl ? 'sheets' : 'local',
    sheetUrl: sh.sheetUrl || '',
    init, submit, subscribe, byClass, GUEST: 'KHÁCH'
  };
  let db = null, ready = null;

  const loadScript = src => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = () => rej(new Error('Không tải được ' + src));
    document.head.appendChild(s);
  });
  const timeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

  function init() {
    if (ready) return ready;
    ready = (async () => {
      if (api.mode === 'firebase') {
        await loadScript(SDK + 'firebase-app-compat.js');
        await loadScript(SDK + 'firebase-firestore-compat.js');
        if (!firebase.apps.length) firebase.initializeApp(fb);
        db = firebase.firestore();
      } else if (api.mode === 'local' && /^https?:$/.test(location.protocol)) {
        // Trang đang được phục vụ bởi server.js của giáo viên?
        try {
          const r = await timeout(fetch('api/ping', { cache: 'no-store' }), 1500);
          if (r.ok && (await r.json()).neo) api.mode = 'server';
        } catch (e) {}
      }
    })().catch(e => { ready = null; throw e; });
    return ready;
  }

  const localKey = room => 'neocity_lb_' + room;
  const readLocal = room => { try { return JSON.parse(localStorage.getItem(localKey(room)) || '{}'); } catch (e) { return {}; } };

  const sort = list => list.sort((a, b) =>
    (b.score || 0) - (a.score || 0) ||
    (a.finishedAt || 9e15) - (b.finishedAt || 9e15) ||
    (a.updatedAt || 0) - (b.updatedAt || 0));

  async function submit(p) {
    await init();
    const doc = Object.assign({}, p, { updatedAt: Date.now() });
    switch (api.mode) {
      case 'firebase':
        return db.collection('players').doc(p.room + '_' + p.pid).set(doc);
      case 'sheets':
        // text/plain + no-cors: tránh preflight CORS của Apps Script
        return fetch(sh.scriptUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(doc) });
      case 'server': {
        const r = await fetch('api/lb', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(doc) });
        if (!r.ok) throw new Error('Máy chủ trả lỗi ' + r.status);
        return;
      }
      default: {
        const all = readLocal(p.room); all[p.pid] = doc;
        try { localStorage.setItem(localKey(p.room), JSON.stringify(all)); } catch (e) {}
      }
    }
  }

  async function fetchList(room) {
    const url = api.mode === 'sheets'
      ? `${sh.scriptUrl}?room=${encodeURIComponent(room)}&t=${Date.now()}`
      : `api/lb?room=${encodeURIComponent(room)}`;
    const r = await fetch(url, { cache: 'no-store' });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'Lỗi tải bảng xếp hạng');
    return j.list || [];
  }

  /* cb(list) với list đã sắp xếp điểm giảm dần; cb(null, err) khi lỗi. Trả về hàm hủy theo dõi. */
  function subscribe(room, cb, everyMs) {
    let stop = () => {}, cancelled = false;
    init().then(() => {
      if (cancelled) return;
      if (api.mode === 'firebase') {
        stop = db.collection('players').where('room', '==', room).limit(500)
          .onSnapshot(s => cb(sort(s.docs.map(d => d.data()))), err => cb(null, err));
      } else if (api.mode === 'local') {
        const emit = () => cb(sort(Object.values(readLocal(room))));
        const onStore = e => { if (e.key === localKey(room)) emit(); };
        emit(); addEventListener('storage', onStore);
        const iv = setInterval(emit, 2500);
        stop = () => { removeEventListener('storage', onStore); clearInterval(iv); };
      } else {
        const tick = () => fetchList(room).then(l => !cancelled && cb(sort(l))).catch(err => !cancelled && cb(null, err));
        tick();
        const iv = setInterval(tick, everyMs || (api.mode === 'sheets' ? 5000 : 3000));
        stop = () => clearInterval(iv);
      }
    }).catch(err => cb(null, err));
    return () => { cancelled = true; stop(); };
  }

  /* Xếp hạng theo lớp: điểm trung bình, kèm số người chơi và số người phá đảo.
     Người không nhập lớp (phụ huynh, khách) gộp vào nhóm GUEST; dùng c.label để hiển thị. */
  function byClass(list) {
    const m = {};
    list.forEach(p => {
      const k = (p.cls || '').toUpperCase() || api.GUEST;
      const c = m[k] = m[k] || { cls: k, label: k === api.GUEST ? 'Phụ huynh / Khách' : 'Lớp ' + k, total: 0, count: 0, finished: 0 };
      c.total += p.score || 0; c.count++; if (p.finished) c.finished++;
    });
    return Object.values(m).map(c => Object.assign(c, { avg: Math.round(c.total / c.count) }))
      .sort((a, b) => b.avg - a.avg || b.count - a.count);
  }

  return api;
})();
