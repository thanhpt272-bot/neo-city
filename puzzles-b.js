/* ===== NEO-CITY · Puzzles B: phishing, boss (robot: puzzles-robot.js) ===== */
(function () {
  'use strict';

  window.PUZZLES = window.PUZZLES || {};

  /* small DOM helper: el('div', 'pb-a pb-b', '<b>html</b>') */
  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* restart a CSS animation class on an element */
  function pulse(node, cls, ms) {
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
    if (ms) setTimeout(() => node.classList.remove(cls), ms);
  }

  /* =========================================================
     2. PHISHING – Hộp Thư Lớp Học (3 tin nhắn, nhiều bẫy tinh vi)
     ========================================================= */
  PUZZLES.phishing = (ctx, L) => {
    const msgs = MAIL;
    const N = msgs.length;
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
    const sleep = ms => new Promise(r => later(r, ms));
    ctx.onCleanup(() => { timers.forEach(clearTimeout); timers.clear(); });

    let mi = 0, segs = [], found = 0, total = 0, busy = false, over = false;

    const hint = el('div', 'hint pb-ph-hint');
    const tabs = el('div', 'pb-itabs');
    tabs.innerHTML = msgs.map((m, i) =>
      '<span class="pb-itab" data-i="' + i + '"><b>' + (i + 1) + '</b>' + (m.kind === 'chat' ? '💬' : '📧') + '</span>').join('');
    const view = el('div', 'pb-ph-view');
    const listBox = el('div', 'pb-flags glass');
    listBox.innerHTML = '<div class="pb-flags-head">🚩 Dấu hiệu đã phát hiện <b class="pb-fcount">0/0</b></div><ol class="pb-flist"></ol>';
    ctx.stage.append(tabs, hint, view, listBox);
    const fcount = $('.pb-fcount', listBox);
    const flist = $('.pb-flist', listBox);

    /* ---- render one segment (tappable) ---- */
    function seg(parent, s, tag, cls, html) {
      const n = el(tag || 'span', 'pb-seg' + (s.link ? ' pb-link' : '') + (s.cls ? ' pb-' + s.cls : '') + (cls ? ' ' + cls : ''),
        html != null ? html : esc(s.t));
      n.setAttribute('role', 'button');
      n.tabIndex = 0;
      const o = { node: n, s, done: false, lp: false };
      segs.push(o);
      n.addEventListener('click', e => { e.preventDefault(); if (o.lp) { o.lp = false; return; } tap(o); });
      n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(o); } });
      parent.appendChild(n);
      if (s.link && s.href) addReveal(parent, n, o, s.href);
      return n;
    }

    /* "xem link thật": button + long-press on the link */
    function addReveal(parent, linkNode, o, href) {
      const btn = el('button', 'pb-reveal', '👁 Xem link thật');
      btn.type = 'button';
      const tip = el('div', 'pb-realurl', '🔗 Link thật: <b>' + esc(href) + '</b>');
      const show = () => { if (!tip.classList.contains('on')) { tip.classList.add('on'); btn.classList.add('on'); ctx.sfx.tap(); } };
      btn.addEventListener('click', e => { e.stopPropagation(); show(); });
      let lpT = 0;
      linkNode.addEventListener('pointerdown', () => { clearTimeout(lpT); lpT = later(() => { o.lp = true; show(); }, 480); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => linkNode.addEventListener(ev, () => clearTimeout(lpT)));
      linkNode.addEventListener('contextmenu', e => e.preventDefault());
      parent.append(btn, tip);
    }

    function qrSvg() {
      let r = '';
      const fixed = (x, y) => (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7);
      for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) {
        if (fixed(x, y)) continue;
        if (Math.random() < .48) r += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
      }
      const eye = (x, y) => '<rect x="' + x + '" y="' + y + '" width="3" height="3" fill="none" stroke="#111" stroke-width=".6"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="1" height="1"/>';
      return '<svg viewBox="-.5 -.5 12 12" aria-hidden="true"><g fill="#111">' + r + eye(0, 0) + eye(8, 0) + eye(0, 8) + '</g></svg>';
    }

    function renderEmail(m, phone) {
      phone.insertAdjacentHTML('beforeend',
        '<div class="pb-ph-app"><span class="pb-ph-back">‹ Hộp thư</span><span class="pb-ph-title">' + esc(m.app) + '</span><span class="pb-ph-act">⋯</span></div>');
      const head = el('div', 'pb-mail-head');
      const body = el('div', 'pb-mail-body');
      phone.append(head, body);
      m.rows.forEach(r => {
        if (r.k === 'meta') {
          const row = el('div', 'pb-mail-row', '<span class="pb-mail-lbl">' + esc(r.lbl) + '</span>');
          const val = el('span', 'pb-mail-val');
          r.s.forEach(s => seg(val, s));
          row.appendChild(val);
          head.appendChild(row);
        } else if (r.k === 'att') {
          const s = r.s[0];
          const box = el('div', 'pb-att-row');
          seg(box, s, 'div', 'pb-att', '<span class="pb-att-ic">📄</span><span class="pb-att-txt"><b>' + esc(s.t) + '</b><small>' + esc(s.sub || '') + '</small></span><span class="pb-att-dl">⬇</span>');
          body.appendChild(box);
        } else if (r.k === 'qr') {
          const s = r.s[0];
          const box = el('div', 'pb-qr-row');
          seg(box, s, 'div', 'pb-qr', qrSvg() + '<span>' + esc(s.t) + '</span>');
          body.appendChild(box);
        } else {
          const p = el('p', 'pb-mail-p');
          r.s.forEach(s => seg(p, s));
          body.appendChild(p);
        }
      });
    }

    function renderChat(m, phone) {
      phone.classList.add('pb-chat');
      const head = el('div', 'pb-chat-head',
        '<span class="pb-ph-back">‹</span><span class="pb-chat-av">' + esc(m.avatar || '👤') + '</span>');
      const who = el('div', 'pb-chat-who', '<b>' + esc(m.name) + '</b>');
      const sub = el('div', 'pb-chat-sub');
      seg(sub, m.sub);
      who.appendChild(sub);
      head.appendChild(who);
      head.insertAdjacentHTML('beforeend', '<span class="pb-chat-ic">📞 ⋯</span>');
      const body = el('div', 'pb-chat-body');
      m.rows.forEach(r => {
        if (r.k === 'time') {
          const row = el('div', 'pb-chat-time');
          seg(row, r.s[0]);
          body.appendChild(row);
        } else {
          const b = el('div', 'pb-bub');
          r.s.forEach(s => seg(b, s));
          body.appendChild(b);
        }
      });
      phone.append(head, body, el('div', 'pb-chat-input', '<span>Nhắn tin…</span><span>😊 🎤</span>'));
    }

    function showMsg(i) {
      const m = msgs[i];
      segs = [];
      found = 0;
      busy = false;
      view.innerHTML = '';
      const phone = el('div', 'pb-phone pb-slidein');
      phone.innerHTML = '<div class="pb-ph-bar"><span>' + (m.kind === 'chat' ? '19:06' : '9:41') + '</span><span>📶 🔋</span></div>';
      if (m.kind === 'chat') renderChat(m, phone); else renderEmail(m, phone);
      view.appendChild(phone);
      total = segs.filter(o => o.s.f).length;
      hint.innerHTML = '<b>Tin ' + (i + 1) + '/' + N + ' · ' + esc(m.label) + '</b><br>Chạm vào chi tiết đáng ngờ. Có <b class="pb-hl">' + total + ' dấu hiệu</b>. ' +
        '⚠ Chạm sai bất kỳ chỗ nào cũng <b>mất 1 mạng</b> – đọc kỹ rồi mới chạm! Giữ đường link hoặc bấm 👁 để xem link thật.';
      flist.innerHTML = '';
      fcount.textContent = '0/' + total;
      $$('.pb-itab', tabs).forEach((t, k) => { t.classList.toggle('on', k === i); });
      ctx.setProg(i / N);
    }

    async function tap(o) {
      if (over || busy || !ctx.alive || o.done) return;
      const s = o.s;
      if (s.f) {
        o.done = true;
        found++;
        ctx.sfx.ok();
        o.node.classList.add('pb-flagged');
        o.node.insertBefore(el('span', 'pb-badge', String(found)), o.node.firstChild);
        flist.appendChild(el('li', 'pb-fitem', '<span class="pb-fnum">' + found + '</span><span>' + esc(s.f) + '</span>'));
        fcount.textContent = found + '/' + total;
        ctx.setProg((mi + found / total) / N);
        if (found >= total) await cleared();
      } else if (s.d) {
        o.done = true;
        pulse(o.node, 'pb-wrong', 700);
        o.node.classList.add('pb-safe');
        toast('🪤 Bẫy rồi! ' + esc(s.d), 'warn');
        if (!ctx.hit()) over = true;
      } else {
        // Chạm bừa cũng tính lỗi (mỗi chỗ chỉ bị tính 1 lần) – buộc học sinh đọc kỹ trước khi chạm
        o.done = true;
        pulse(o.node, 'pb-wrong', 700);
        o.node.classList.add('pb-missed');
        toast('❌ Sai rồi! Chỗ này không phải dấu hiệu lừa đảo.', 'warn');
        if (!ctx.hit()) over = true;
      }
    }

    async function cleared() {
      busy = true;
      const phone = $('.pb-phone', view);
      await sleep(450);
      if (!ctx.alive) return;
      phone.appendChild(el('div', 'pb-stamp pb-stamp-ok', '✔ ĐÃ BÁO CÁO<br>LỪA ĐẢO'));
      beep(880, .08, 'square', .05); beep(1320, .12, 'square', .05, .09);
      ctx.buzz && ctx.buzz([40, 40, 80]);
      $$('.pb-itab', tabs)[mi].classList.add('done');
      await sleep(1250);
      if (!ctx.alive) return;
      mi++;
      if (mi >= N) { over = true; ctx.win(); return; }
      phone.classList.remove('pb-slidein');
      phone.classList.add('pb-slideout');
      await sleep(320);
      if (!ctx.alive) return;
      showMsg(mi);
      ctx.stage.closest('.screen') && ctx.stage.closest('.screen').scrollTo({ top: 0, behavior: 'smooth' });
    }

    showMsg(0);
  };

  /* =========================================================
     3. BOSS – Lõi AI GLITCH (2 phase, nhiều kiểu đòn đánh / đỡ đòn)
     ========================================================= */
  PUZZLES.boss = (ctx, L) => {
    const HARD = (typeof BOSS_Q_HARD !== 'undefined' && BOSS_Q_HARD.length >= 6) ? BOSS_Q_HARD : BOSS_Q;
    const PH = [
      { hp: 5, time: 8000, tag: 'PHASE 1', name: 'GLITCH', color: '#00f0ff', skillP: .4, pool: BOSS_Q,
        virus: { n: 5, ms: 5500 }, charge: { green: .2, period: 1500 }, rain: { n: 7, gap: 600, fall: 2600 },
        beam: { n: 1, win: 1600 }, lock: 5500 },
      { hp: 5, time: 5000, tag: 'PHASE 2', name: 'GLITCH.EXE – Cuồng nộ', color: '#ff2b6a', skillP: .65, pool: HARD,
        virus: { n: 6, ms: 4500 }, charge: { green: .14, period: 1050 }, rain: { n: 9, gap: 450, fall: 2000 },
        beam: { n: 2, win: 1150 }, lock: 4500 }
    ];
    const SKILLS = {
      rain: { ic: '🌧️', name: 'Mưa mã độc', desc: 'Chạm phá mã độc trước khi rơi xuống đáy. ĐỪNG chạm 📘!' },
      beam: { ic: '⚡', name: 'Tia lừa đảo', desc: 'Giơ khiên đúng phía tia lừa đảo bắn tới!' },
      lock: { ic: '🔒', name: 'Khóa màn hình', desc: 'Mở khóa thật nhanh trước khi bị chiếm quyền!' },
      noise: { ic: '📡', name: 'Nhiễu tín hiệu', desc: 'Câu hỏi tiếp theo bị nhiễu chữ trong giây đầu!' }
    };
    const TAUNT = 'Ha ha ha! Ngươi nghĩ thế là xong sao? Giờ ta mới thật sự nổi giận!';
    const BITLINE = 'Cố lên! Mình đang vá lỗi phía trong!';

    /* ---------- timers / loops: all cleaned up ---------- */
    const timers = new Set();
    const rafs = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (ctx.alive) fn(); }, ms); timers.add(id); return id; };
    const sleep = ms => new Promise(r => later(r, ms));
    function loop(fn) { // fn(now) → false to stop
      const o = { id: 0 };
      const step = now => { rafs.delete(o.id); if (!ctx.alive) return; if (fn(now) === false) return; o.id = requestAnimationFrame(step); rafs.add(o.id); };
      o.id = requestAnimationFrame(step); rafs.add(o.id);
      return () => { cancelAnimationFrame(o.id); rafs.delete(o.id); };
    }
    const fx = el('div', 'pb-fx');
    (document.querySelector('.phone') || document.body).appendChild(fx);
    ctx.onCleanup(() => { timers.forEach(clearTimeout); timers.clear(); rafs.forEach(cancelAnimationFrame); rafs.clear(); fx.remove(); });

    /* ---------- question decks (no repeat until exhausted) ---------- */
    const decks = PH.map(p => ({ src: p.pool, q: shuffle(p.pool) }));
    function draw(ph, pred, avoid) {
      const d = decks[ph];
      const ok = q => (!pred || pred(q)) && !(avoid && avoid.includes(q));
      let i = d.q.findIndex(ok);
      if (i < 0) { d.q = d.q.concat(shuffle(d.src)); i = d.q.findIndex(ok); }
      return d.q.splice(i, 1)[0];
    }

    /* ---------- DOM ---------- */
    const spikes = Array.from({ length: 12 }, (_, i) => {
      const a = i / 12 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      return '<line x1="' + (c * 33).toFixed(1) + '" y1="' + (s * 33).toFixed(1) + '" x2="' + (c * 48).toFixed(1) + '" y2="' + (s * 48).toFixed(1) + '"/>' +
        '<circle cx="' + (c * 51).toFixed(1) + '" cy="' + (s * 51).toFixed(1) + '" r="4.5"/>';
    }).join('');
    const bossSvg =
      '<svg class="pb-bsvg" viewBox="-62 -62 124 124" aria-hidden="true">' +
      '<g class="pb-b-spikes">' + spikes + '</g>' +
      '<path class="pb-b-horns" d="M-24-22L-36-50L-10-30ZM24-22L36-50L10-30Z"/>' +
      '<circle class="pb-b-body" r="34"/>' +
      '<g class="pb-b-eyes"><ellipse cx="-12" cy="-4" rx="8" ry="9"/><ellipse cx="12" cy="-4" rx="8" ry="9"/></g>' +
      '<g class="pb-b-pupils"><circle cx="-11" cy="-2" r="4"/><circle cx="11" cy="-2" r="4"/></g>' +
      '<path class="pb-b-brow" d="M-23-17L-5-9M23-17L5-9"/>' +
      '<path class="pb-b-mouth" d="M-16 14L-10 21L-4 14L2 21L8 14L14 21"/>' +
      '</svg>';
    const segHtml = n => Array.from({ length: n }, () => '<i class="pb-hp-seg"></i>').join('');

    const arena = el('div', 'pb-arena');
    arena.dataset.phase = '0';
    arena.innerHTML =
      '<div class="pb-hp"><div class="pb-hp-top"><span class="pb-hp-lbl">GLITCH</span><span class="pb-hp-ph">PHASE 1/2</span></div>' +
      '<div class="pb-hp-bar"><div class="pb-hp-g" data-g="0">' + segHtml(PH[0].hp) + '</div><div class="pb-hp-g" data-g="1">' + segHtml(PH[1].hp) + '</div></div></div>' +
      '<div class="pb-aura"></div>' +
      '<div class="pb-boss-wrap"><div class="pb-boss">' + bossSvg + '</div></div>' +
      '<div class="pb-beam-warn pb-left">⚠</div><div class="pb-beam-warn pb-right">⚠</div>' +
      '<div class="pb-skill"></div>' +
      '<div class="pb-ban"></div>';
    ctx.stage.appendChild(arena);
    const bossWrap = $('.pb-boss-wrap', arena);
    const bossEl = $('.pb-boss', arena);
    const hpLbl = $('.pb-hp-lbl', arena);
    const hpPh = $('.pb-hp-ph', arena);
    const groups = $$('.pb-hp-g', arena).map(g => $$('.pb-hp-seg', g));
    const skillEl = $('.pb-skill', arena);
    const banEl = $('.pb-ban', arena);

    const timeBar = el('div', 'pb-time', '<i></i>');
    const timeFill = $('i', timeBar);
    const panel = el('div', 'pb-panel');
    ctx.stage.append(timeBar, panel);

    let phase = 0;
    let hp = PH[0].hp;
    let stopTimerFn = null;

    /* ---------- helpers ---------- */
    function startTimer(ms, onEnd) {
      stopTimer();
      const t0 = performance.now();
      timeBar.classList.remove('pb-low');
      stopTimerFn = loop(now => {
        const left = Math.max(0, 1 - (now - t0) / ms);
        timeFill.style.transform = 'scaleX(' + left + ')';
        timeBar.classList.toggle('pb-low', left < .3);
        if (left <= 0) { stopTimerFn = null; onEnd(); return false; }
      });
    }
    function stopTimer() { if (stopTimerFn) { stopTimerFn(); stopTimerFn = null; } }
    function resetTimerBar(full) { stopTimer(); timeBar.classList.remove('pb-low'); timeFill.style.transform = 'scaleX(' + (full ? 1 : 0) + ')'; }

    function renderHp() {
      groups.forEach((g, gi) => g.forEach((s, i) => {
        const alive = gi > phase || (gi === phase && i < hp);
        s.classList.toggle('pb-lost', !alive);
      }));
      ctx.setProg(phase === 0 ? (PH[0].hp - hp) / 10 : (PH[0].hp + PH[1].hp - hp) / 10);
    }
    function shatter(seg) {
      for (let i = 0; i < 4; i++) {
        const f = el('b', 'pb-frag');
        f.style.setProperty('--x', rand(-26, 26) + 'px');
        f.style.setProperty('--y', rand(-30, 14) + 'px');
        f.style.setProperty('--r', rand(-200, 200) + 'deg');
        seg.appendChild(f);
        later(() => f.remove(), 650);
      }
    }
    function floatText(txt, cls, y) {
      const n = el('div', 'pb-float ' + (cls || ''), txt);
      if (y != null) n.style.top = y + '%';
      arena.appendChild(n);
      later(() => n.remove(), 1100);
    }
    function fb(html, ok) {
      const n = el('div', 'pb-fb explain ' + (ok ? 'ok' : 'no'), html);
      panel.appendChild(n);
    }
    function panelHead(icon, title, sub) {
      return '<div class="pb-ph-head"><span class="pb-rtag">' + icon + ' ' + title + '</span>' + (sub ? '<span class="pb-rsub">' + sub + '</span>' : '') + '</div>';
    }

    /* ---------- effects ---------- */
    async function playerAttack(dmg, crit, label) {
      const shot = el('div', 'pb-shot' + (crit ? ' pb-crit' : ''));
      arena.appendChild(shot);
      beep(crit ? 1200 : 900, .12, 'sawtooth', .05); beep(crit ? 1800 : 1400, .1, 'square', .04, .05);
      await sleep(240);
      if (!ctx.alive) return;
      shot.remove();
      const imp = el('div', 'pb-impact' + (crit ? ' pb-crit' : ''));
      bossWrap.appendChild(imp);
      later(() => imp.remove(), 500);
      pulse(bossEl, 'pb-hit', 520);
      pulse(arena, crit ? 'pb-shake-big' : 'pb-shake', 420);
      beep(140, .18, 'square', .07);
      floatText(label || (crit ? 'CHÍ MẠNG! -' + dmg : '-' + dmg), crit ? 'pb-critx' : '');
      const before = hp;
      hp = Math.max(0, hp - dmg);
      for (let i = hp; i < before; i++) { const s = groups[phase][i]; if (s) shatter(s); }
      renderHp();
      ctx.buzz && ctx.buzz(crit ? [30, 30, 60] : 30);
    }

    async function bossAttack() {
      bossEl.classList.remove('pb-hit');
      pulse(bossEl, 'pb-atk', 650);
      beep(90, .35, 'sawtooth', .08); beep(60, .4, 'sawtooth', .07, .1);
      await sleep(260);
      if (!ctx.alive) return false;
      const w = el('div', 'pb-wave');
      bossWrap.appendChild(w);
      later(() => w.remove(), 700);
      pulse(arena, 'pb-shake-big', 450);
      const crack = el('div', 'pb-crack',
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M52 40 L30 8 M52 40 L78 4 M52 40 L96 34 M52 40 L88 78 M52 40 L58 98 M52 40 L18 86 M52 40 L2 46 M40 22 L28 30 M70 22 L84 18 M74 58 L92 56 M46 70 L30 74"/></svg>');
      const vig = el('div', 'pb-vig');
      fx.append(vig, crack);
      later(() => { crack.remove(); vig.remove(); }, 900);
      return ctx.hit();
    }

    async function blockFx(counter) {
      const sh = el('div', 'pb-shield', '<span>ĐỠ ĐÒN!</span>');
      arena.appendChild(sh);
      later(() => sh.remove(), 900);
      beep(660, .08, 'triangle', .08); beep(990, .14, 'triangle', .08, .07);
      await sleep(500);
      if (!ctx.alive) return;
      if (counter) await playerAttack(1, false, 'PHẢN ĐÒN! -1');
    }

    async function skillBanner(k) {
      const s = SKILLS[k];
      banEl.innerHTML = '<div class="pb-ban-in"><span class="pb-ban-ic">' + s.ic + '</span><div><small>GLITCH dùng kỹ năng</small><b>' + esc(s.name) + '</b><em>' + esc(s.desc) + '</em></div></div>';
      banEl.classList.remove('on'); void banEl.offsetWidth; banEl.classList.add('on');
      pulse(bossEl, 'pb-cast', 900);
      beep(300, .1, 'square', .05); beep(450, .1, 'square', .05, .1); beep(300, .2, 'square', .05, .2);
      skillEl.innerHTML = s.ic + ' ' + esc(s.name);
      skillEl.classList.add('on');
      await sleep(phase ? 1300 : 1600);
      banEl.classList.remove('on');
    }
    function clearSkill() { skillEl.classList.remove('on'); }

    function scramble(node, text, ms) {
      const G = '#%$@&*!?<>/\\|01▓▒░';
      const t0 = performance.now();
      let last = 0;
      node.classList.add('pb-noisy');
      loop(now => {
        const k = (now - t0) / ms;
        if (!node.isConnected) return false;
        if (k >= 1) { node.textContent = text; node.classList.remove('pb-noisy'); return false; }
        if (now - last < 70) return;
        last = now;
        const p = .75 * (1 - k) + .1;
        node.textContent = text.split('').map(c => c !== ' ' && Math.random() < p ? G[Math.random() * G.length | 0] : c).join('');
      });
    }

    /* ---------- ATTACK ROUNDS ---------- */
    // each resolves { ok:boolean, dmg:number, crit:boolean }

    function roundTF(noise) {
      const p = PH[phase];
      const q = draw(phase);
      panel.innerHTML = panelHead('⚔️', 'ĐÚNG HAY SAI?', phase ? 'Câu khó · 5 giây' : 'Trả lời nhanh < 2s = CHÍ MẠNG') +
        '<div class="pb-qcard glass"><div class="pb-qtext"></div></div>' +
        '<div class="pb-tf"><button class="btn green pb-tf-btn" data-v="1">✔ ĐÚNG</button><button class="btn red pb-tf-btn" data-v="0">✖ SAI</button></div>';
      const qt = $('.pb-qtext', panel);
      qt.textContent = q.t;
      if (noise) scramble(qt, q.t, 1500);
      pulse($('.pb-qcard', panel), 'pb-in');
      return new Promise(res => {
        let done = false;
        const t0 = performance.now();
        const finish = v => {
          if (done) return; done = true;
          stopTimer();
          $$('button', panel).forEach(b => { b.disabled = true; if ((b.dataset.v === '1') === q.a) b.classList.add('pb-right'); });
          const ok = v === q.a;
          const crit = ok && performance.now() - t0 < 2000;
          fb((ok ? '⚡ ' : v === null ? '⏰ Hết giờ! ' : '💢 ') + esc(q.e), ok);
          res({ ok, dmg: crit ? 2 : 1, crit, wait: 1500 });
        };
        $$('button', panel).forEach(b => b.addEventListener('click', () => { ctx.sfx.tap(); finish(b.dataset.v === '1'); }));
        startTimer(p.time, () => finish(null));
      });
    }

    function roundMC(noise) {
      const p = PH[phase];
      const wantTrue = Math.random() < .55;
      const target = draw(phase, q => q.a === wantTrue);
      const o1 = draw(phase, q => q.a !== wantTrue, [target]);
      const o2 = draw(phase, q => q.a !== wantTrue, [target, o1]);
      const opts = shuffle([target, o1, o2]);
      panel.innerHTML = panelHead('🎯', 'CHỌN ĐÁP ÁN', 'Câu nào <b class="' + (wantTrue ? 'pb-g' : 'pb-r') + '">' + (wantTrue ? 'ĐÚNG' : 'SAI') + '</b>?') +
        '<div class="pb-mc">' + opts.map((q, i) => '<button class="pb-mc-btn" data-i="' + i + '"><b>' + 'ABC'[i] + '</b><span></span></button>').join('') + '</div>';
      const btns = $$('.pb-mc-btn', panel);
      btns.forEach((b, i) => {
        const sp = $('span', b);
        sp.textContent = opts[i].t;
        if (noise) scramble(sp, opts[i].t, 1500);
      });
      pulse($('.pb-mc', panel), 'pb-in');
      return new Promise(res => {
        let done = false;
        const t0 = performance.now();
        const finish = idx => {
          if (done) return; done = true;
          stopTimer();
          btns.forEach((b, i) => { b.disabled = true; if (opts[i] === target) b.classList.add('pb-right'); else if (i === idx) b.classList.add('pb-wrongb'); });
          const ok = idx != null && opts[idx] === target;
          const crit = ok && performance.now() - t0 < 3000;
          fb((ok ? '⚡ ' : idx == null ? '⏰ Hết giờ! ' : '💢 ') + esc(target.e), ok);
          res({ ok, dmg: crit ? 2 : 1, crit, wait: 1700 });
        };
        btns.forEach((b, i) => b.addEventListener('click', () => { ctx.sfx.tap(); finish(i); }));
        startTimer(p.time + 3000, () => finish(null));
      });
    }

    function roundVirus() {
      const cfg = PH[phase].virus;
      panel.innerHTML = panelHead('🦠', 'BẮN VIRUS', 'Chạm hết ' + cfg.n + ' virus để nạp laser!') +
        '<div class="pb-field pb-vfield"><div class="pb-vcount">⚡ 0/' + cfg.n + '</div></div>';
      const field = $('.pb-field', panel);
      const cnt = $('.pb-vcount', panel);
      const W = field.clientWidth || 340, H = field.clientHeight || 220, S = 52;
      const bugs = [];
      for (let i = 0; i < cfg.n; i++) {
        const b = el('button', 'pb-bug', '🦠');
        b.type = 'button';
        const sp = (phase ? 95 : 70) + Math.random() * 40;
        const a = Math.random() * Math.PI * 2;
        const o = { b, x: rand(0, W - S), y: rand(28, H - S), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dead: false };
        b.style.transform = 'translate(' + o.x + 'px,' + o.y + 'px)';
        field.appendChild(b);
        bugs.push(o);
      }
      return new Promise(res => {
        let done = false, hits = 0, last = performance.now();
        const t0 = last;
        const stop = loop(now => {
          const dt = Math.min(.05, (now - last) / 1000); last = now;
          bugs.forEach(o => {
            if (o.dead) return;
            o.x += o.vx * dt; o.y += o.vy * dt;
            if (o.x < 0) { o.x = 0; o.vx *= -1; } else if (o.x > W - S) { o.x = W - S; o.vx *= -1; }
            if (o.y < 26) { o.y = 26; o.vy *= -1; } else if (o.y > H - S) { o.y = H - S; o.vy *= -1; }
            o.b.style.transform = 'translate(' + o.x + 'px,' + o.y + 'px)';
          });
          if (done) return false;
        });
        const finish = ok => {
          if (done) return; done = true;
          stop(); stopTimer();
          const crit = ok && performance.now() - t0 < cfg.ms * .45;
          if (!ok) bugs.forEach(o => { if (!o.dead) o.b.classList.add('pb-bug-win'); });
          fb(ok ? (crit ? '⚡ Siêu tốc! Laser nạp đầy 200%!' : '⚡ Nạp đủ năng lượng! Bắn!') : '⏰ Virus thoát được! GLITCH phản đòn!', ok);
          res({ ok, dmg: crit ? 2 : 1, crit, wait: 900 });
        };
        bugs.forEach(o => o.b.addEventListener('pointerdown', e => {
          e.preventDefault();
          if (done || o.dead) return;
          o.dead = true; hits++;
          o.b.classList.add('pb-pop');
          o.b.disabled = true;
          beep(700 + hits * 90, .06, 'square', .05);
          cnt.textContent = '⚡ ' + hits + '/' + cfg.n;
          later(() => o.b.remove(), 300);
          if (hits >= cfg.n) finish(true);
        }));
        startTimer(cfg.ms, () => finish(false));
      });
    }

    function roundCharge() {
      const cfg = PH[phase].charge;
      const g = cfg.green, y = .1;
      const gs = .2 + Math.random() * (.6 - g);
      panel.innerHTML = panelHead('🔋', 'NẠP NĂNG LƯỢNG', 'Bấm khi kim nằm trong vùng XANH = CHÍ MẠNG') +
        '<div class="pb-charge"><div class="pb-cbar">' +
        '<i class="pb-cz pb-cy" style="left:' + ((gs - y) * 100) + '%;width:' + (y * 100) + '%"></i>' +
        '<i class="pb-cz pb-cg" style="left:' + (gs * 100) + '%;width:' + (g * 100) + '%"></i>' +
        '<i class="pb-cz pb-cy" style="left:' + ((gs + g) * 100) + '%;width:' + (y * 100) + '%"></i>' +
        '<b class="pb-needle"></b></div>' +
        '<button class="btn big pb-fire-btn" type="button">⚡ BẮN!</button></div>';
      const needle = $('.pb-needle', panel);
      const btn = $('.pb-fire-btn', panel);
      return new Promise(res => {
        let done = false, pos = 0;
        const t0 = performance.now();
        const stop = loop(now => {
          const k = ((now - t0) / cfg.period) % 2;
          pos = k < 1 ? k : 2 - k;
          needle.style.left = (pos * 100) + '%';
          if (done) return false;
        });
        const finish = tapped => {
          if (done) return; done = true;
          stop(); stopTimer(); btn.disabled = true;
          let r = { ok: false, dmg: 0, crit: false, wait: 1000 };
          if (tapped) {
            if (pos >= gs && pos <= gs + g) r = { ok: true, dmg: 2, crit: true, wait: 900 };
            else if (pos >= gs - y && pos <= gs + g + y) r = { ok: true, dmg: 1, crit: false, wait: 900 };
          }
          needle.classList.add(r.crit ? 'pb-ng' : r.ok ? 'pb-ny' : 'pb-nr');
          fb(r.crit ? '🎯 HOÀN HẢO! Năng lượng tối đa!' : r.ok ? '⚡ Gần chuẩn! Vẫn bắn trúng.' : tapped ? '💥 Lệch nhịp! Quá tải năng lượng!' : '⏰ Chậm quá! GLITCH phản đòn!', r.ok);
          res(r);
        };
        btn.addEventListener('pointerdown', e => { e.preventDefault(); ctx.sfx.tap(); finish(true); });
        btn.addEventListener('click', () => finish(true));
        startTimer(5000, () => finish(false));
      });
    }

    /* ---------- DEFENSE ROUNDS ---------- */
    // each resolves true (blocked) / false (hit)

    function defRain() {
      const cfg = PH[phase].rain;
      panel.innerHTML = panelHead('🌧️', 'MƯA MÃ ĐỘC', 'Phá 🦠 · ĐỪNG chạm 📘') + '<div class="pb-field pb-rfield"><div class="pb-floor"></div></div>';
      const field = $('.pb-field', panel);
      const W = field.clientWidth || 340, H = field.clientHeight || 220, S = 50;
      const BAD = ['🦠', '🐛', '💣', '👾'];
      const kinds = shuffle(Array.from({ length: cfg.n }, (_, i) => i < 2 ? 'safe' : 'bad'));
      if (kinds[0] === 'safe') kinds.push(kinds.shift()); // first one is always malware
      const items = [];
      resetTimerBar(true);
      return new Promise(res => {
        let done = false, spawned = 0, last = performance.now();
        const total = (cfg.n - 1) * cfg.gap + cfg.fall;
        const t0 = last;
        const finish = ok => {
          if (done) return; done = true;
          stop();
          items.forEach(o => { o.b.disabled = true; });
          fb(ok ? '🛡️ Chặn sạch mã độc!' : '💥 Mã độc xuyên thủng tường lửa!', ok);
          res(ok);
        };
        const spawn = () => {
          if (done) return;
          const k = kinds[spawned++];
          const b = el('button', 'pb-drop' + (k === 'safe' ? ' pb-safe-ic' : ''), k === 'safe' ? '📘' : BAD[rand(0, 3)]);
          b.type = 'button';
          const o = { b, k, x: rand(4, W - S - 4), y: -S, t: performance.now(), gone: false };
          b.style.transform = 'translate(' + o.x + 'px,' + o.y + 'px)';
          b.addEventListener('pointerdown', e => {
            e.preventDefault();
            if (done || o.gone) return;
            o.gone = true;
            if (o.k === 'safe') { b.classList.add('pb-bad-tap'); toast('📘 Đó là sách học, không phải mã độc!', 'warn'); finish(false); return; }
            b.classList.add('pb-pop'); b.disabled = true;
            beep(800, .05, 'square', .05);
            later(() => b.remove(), 300);
          });
          field.appendChild(b);
          items.push(o);
          if (spawned < cfg.n) later(spawn, cfg.gap);
        };
        spawn();
        const stop = loop(now => {
          last = now;
          timeFill.style.transform = 'scaleX(' + Math.max(0, 1 - (now - t0) / total) + ')';
          for (const o of items) {
            if (o.gone) continue;
            const k = (now - o.t) / cfg.fall;
            o.y = -S + k * (H + S - 6);
            o.b.style.transform = 'translate(' + o.x + 'px,' + o.y + 'px)';
            if (k >= 1) {
              o.gone = true;
              if (o.k === 'bad') { o.b.classList.add('pb-leak'); finish(false); return false; }
              o.b.remove();
            }
          }
          if (spawned >= cfg.n && items.every(o => o.gone)) { finish(true); return false; }
          if (done) return false;
        });
      });
    }

    async function defBeam() {
      const cfg = PH[phase].beam;
      panel.innerHTML = panelHead('⚡', 'TIA LỪA ĐẢO', 'Nhìn dấu ⚠ – giơ khiên ĐÚNG PHÍA!') +
        '<div class="pb-beam-btns"><button class="btn pb-sh-btn" data-s="L" type="button">🛡️<br>TRÁI</button><button class="btn pb-sh-btn" data-s="R" type="button">🛡️<br>PHẢI</button></div>' +
        '<div class="pb-beam-cnt"></div>';
      const btns = $$('.pb-sh-btn', panel);
      const cnt = $('.pb-beam-cnt', panel);
      for (let i = 0; i < cfg.n; i++) {
        cnt.textContent = cfg.n > 1 ? 'Tia ' + (i + 1) + '/' + cfg.n : '';
        btns.forEach(b => { b.disabled = true; b.classList.remove('pb-right', 'pb-wrongb'); });
        await sleep(i ? 350 : 450);
        if (!ctx.alive) return false;
        const side = Math.random() < .5 ? 'L' : 'R';
        const warn = $(side === 'L' ? '.pb-beam-warn.pb-left' : '.pb-beam-warn.pb-right', arena);
        warn.classList.add('on');
        beep(side === 'L' ? 500 : 700, .12, 'square', .05);
        btns.forEach(b => { b.disabled = false; });
        const pick = await new Promise(res => {
          let done = false;
          const fin = v => { if (done) return; done = true; stopTimer(); res(v); };
          btns.forEach(b => { b.onclick = () => fin(b.dataset.s); });
          startTimer(cfg.win, () => fin(null));
        });
        if (!ctx.alive) return false;
        warn.classList.remove('on');
        const beam = el('div', 'pb-beam pb-beam-' + side + (pick === side ? ' pb-blocked' : ''));
        arena.appendChild(beam);
        later(() => beam.remove(), 600);
        btns.forEach(b => { b.disabled = true; b.onclick = null; if (b.dataset.s === side) b.classList.add(pick === side ? 'pb-right' : 'pb-wrongb'); });
        if (pick !== side) { fb(pick ? '💥 Sai phía! Tia lừa đảo xuyên qua!' : '⏰ Chậm quá! Tia lừa đảo trúng em!', false); return false; }
        beep(1000, .08, 'triangle', .07);
      }
      fb('🛡️ Chặn hết tia lừa đảo!', true);
      return true;
    }

    function defLock() {
      const ms = PH[phase].lock;
      if (Math.random() < .5) {
        const real = 'thcs-neocity.edu.vn';
        const opts = shuffle([real, 'thcs-neoclty.edu.vn', 'thcs-neocity.edu.vn.xyz', 'thcs-neocity-edu.vn']);
        panel.innerHTML = panelHead('🔒', 'KHÓA MÀN HÌNH', 'Chọn trang đăng nhập THẬT của trường!') +
          '<div class="pb-lock-grid">' + opts.map(d => '<button class="pb-dom" type="button">🔐 <span>' + esc(d) + '</span></button>').join('') + '</div>';
        const btns = $$('.pb-dom', panel);
        return new Promise(res => {
          let done = false;
          const fin = i => {
            if (done) return; done = true; stopTimer();
            btns.forEach((b, k) => { b.disabled = true; if (opts[k] === real) b.classList.add('pb-right'); else if (k === i) b.classList.add('pb-wrongb'); });
            const ok = i != null && opts[i] === real;
            fb(ok ? '🔓 Mở khóa thành công! Đúng tên miền thật.' : '💥 Sai tên miền – trang giả đã chiếm quyền!', ok);
            res(ok);
          };
          btns.forEach((b, i) => b.addEventListener('click', () => { ctx.sfx.tap(); fin(i); }));
          startTimer(ms, () => fin(null));
        });
      }
      const code = Array.from({ length: 4 }, () => rand(0, 9)).join('');
      panel.innerHTML = panelHead('🔒', 'KHÓA MÀN HÌNH', 'Nhập mã mở khóa: <b class="pb-code">' + code.split('').join(' ') + '</b>') +
        '<div class="pb-pin"><div class="pb-pin-show">' + '<i></i>'.repeat(4) + '</div><div class="pb-keys">' +
        [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => k === '' ? '<span></span>' : '<button class="pb-key" type="button" data-k="' + k + '">' + k + '</button>').join('') +
        '</div></div>';
      const dots = $$('.pb-pin-show i', panel);
      const show = $('.pb-pin-show', panel);
      return new Promise(res => {
        let done = false, typed = '';
        const draw = () => dots.forEach((d, i) => { d.textContent = typed[i] || ''; d.classList.toggle('on', i < typed.length); });
        const fin = ok => {
          if (done) return; done = true; stopTimer();
          $$('.pb-key', panel).forEach(b => { b.disabled = true; });
          fb(ok ? '🔓 Mở khóa thành công!' : '⏰ Hết giờ! GLITCH chiếm màn hình!', ok);
          res(ok);
        };
        $$('.pb-key', panel).forEach(b => b.addEventListener('pointerdown', e => {
          e.preventDefault();
          if (done) return;
          const k = b.dataset.k;
          ctx.sfx.tap();
          if (k === '⌫') typed = typed.slice(0, -1);
          else if (typed.length < 4) typed += k;
          draw();
          if (typed.length === 4) {
            if (typed === code) fin(true);
            else { pulse(show, 'pb-shake', 400); later(() => { if (!done) { typed = ''; draw(); } }, 250); }
          }
        }));
        startTimer(ms + 1000, () => fin(false));
      });
    }

    /* ---------- phase transition ---------- */
    async function phaseCutscene() {
      resetTimerBar(false);
      clearSkill();
      panel.innerHTML =
        '<div class="pb-talk glass"><div class="pb-line pb-glitch-line"><b>👾 GLITCH:</b> ' + esc(TAUNT) + '</div>' +
        '<div class="pb-line pb-bit-line"><b>🤖 BIT:</b> ' + esc(BITLINE) + '</div></div>';
      arena.classList.add('pb-trans');
      fx.appendChild(el('div', 'pb-gl-scr'));
      beep(80, .6, 'sawtooth', .08); beep(160, .5, 'square', .05, .2); beep(55, .7, 'sawtooth', .08, .5);
      ctx.buzz && ctx.buzz([100, 50, 100, 50, 200]);
      await sleep(700);
      if (!ctx.alive) return;
      phase = 1;
      hp = PH[1].hp;
      arena.dataset.phase = '1';
      hpLbl.textContent = 'GLITCH.EXE';
      hpPh.textContent = 'PHASE 2/2 · CUỒNG NỘ';
      renderHp();
      groups[1].forEach((s, i) => { s.style.animationDelay = (i * 70) + 'ms'; pulse(s, 'pb-fill', 900); });
      banEl.innerHTML = '<div class="pb-phase-ban"><b>PHASE 2</b><span>' + esc(PH[1].name) + '</span></div>';
      banEl.classList.remove('on'); void banEl.offsetWidth; banEl.classList.add('on');
      await sleep(1100);
      if (!ctx.alive) return;
      $$('.pb-gl-scr', fx).forEach(n => n.remove());
      arena.classList.remove('pb-trans');
      await sleep(1100);
      if (!ctx.alive) return;
      banEl.classList.remove('on');
    }

    /* ---------- death ---------- */
    async function death() {
      resetTimerBar(false);
      clearSkill();
      panel.innerHTML = '<div class="pb-talk glass"><div class="pb-line pb-glitch-line"><b>👾 GLITCH:</b> Khô…ng… thể… nào… ##%&!</div></div>';
      arena.classList.add('pb-freeze');
      beep(1200, .08, 'square', .05);
      await sleep(350);
      if (!ctx.alive) return;
      arena.classList.remove('pb-freeze');
      arena.classList.add('pb-dying');
      for (let i = 0; i < 6; i++) beep(rand(80, 900), .08, 'sawtooth', .05, i * .08);
      ctx.buzz && ctx.buzz([60, 30, 60, 30, 60, 30, 200]);
      await sleep(650);
      if (!ctx.alive) return;
      // pixel disintegration on a canvas
      const ar = arena.getBoundingClientRect(), br = bossEl.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cv = el('canvas', 'pb-dust');
      cv.width = ar.width * dpr; cv.height = ar.height * dpr;
      arena.appendChild(cv);
      const c2 = cv.getContext('2d');
      c2.scale(dpr, dpr);
      const cx = br.left - ar.left + br.width / 2, cy = br.top - ar.top + br.height / 2, R = br.width * .42;
      const cols = [PH[1].color, '#ffffff', '#ff2bd6', '#00f0ff', '#2a0b45'];
      const parts = [];
      for (let i = 0; i < 260; i++) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * R;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        parts.push({ x, y, vx: (x - cx) * (1.5 + Math.random() * 2.5) + rand(-40, 40), vy: (y - cy) * 1.5 - 60 - Math.random() * 120,
          s: 3 + Math.random() * 4, c: cols[i % cols.length], d: Math.random() * 250 });
      }
      bossWrap.style.visibility = 'hidden';
      beep(60, .9, 'sawtooth', .08); beep(1500, .5, 'triangle', .04, .2);
      const t0 = performance.now();
      let lt = t0;
      loop(now => {
        const dt = (now - lt) / 1000; lt = now;
        const T = now - t0;
        c2.clearRect(0, 0, ar.width, ar.height);
        let any = false;
        for (const p of parts) {
          if (T < p.d) { c2.globalAlpha = 1; c2.fillStyle = p.c; c2.fillRect(p.x, p.y, p.s, p.s); any = true; continue; }
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 40 * dt;
          const al = 1 - (T - p.d) / 900;
          if (al <= 0) continue;
          any = true;
          c2.globalAlpha = al; c2.fillStyle = p.c; c2.fillRect(p.x, p.y, p.s, p.s);
        }
        return any;
      });
      await sleep(900);
      if (!ctx.alive) return;
      fx.appendChild(el('div', 'pb-white'));
      await sleep(250);
      if (!ctx.alive) return;
      const bit = typeof bitSvg === 'function' ? bitSvg(64, 'pb-bit') : '🤖';
      const fin = el('div', 'pb-final',
        '<div class="pb-final-t">LÕI GLITCH<br>ĐÃ BỊ XÓA</div>' + bit +
        '<div class="pb-final-s">BIT đang khởi động lại… <b>0%</b></div><div class="pb-boot"><i></i></div>');
      fx.appendChild(fin);
      [523, 659, 784, 1046].forEach((f, i) => beep(f, .16, 'triangle', .07, .2 + i * .1));
      const pct = $('b', fin), bar = $('.pb-boot i', fin);
      const b0 = performance.now();
      loop(now => {
        const k = Math.min(1, (now - b0) / 1100);
        pct.textContent = Math.round(k * 100) + '%';
        bar.style.transform = 'scaleX(' + k + ')';
        if (k >= 1) { $('.pb-final-s', fin).innerHTML = '✅ BIT đã khởi động lại <b>100%</b>'; return false; }
      });
      await sleep(1700);
    }

    /* ---------- main fight loop ---------- */
    let bag = [];
    function nextType() {
      if (!bag.length) bag = shuffle(['tf', 'tf', 'mc', 'virus', 'charge']);
      return bag.shift();
    }
    let lastSkill = '';
    function pickSkill() {
      const opts = ['rain', 'beam', 'lock', 'noise'].filter(s => s !== lastSkill);
      lastSkill = opts[Math.random() * opts.length | 0];
      return lastSkill;
    }

    // returns 'end' when the fight is over (dead player or dead boss)
    async function afterDamage() {
      if (hp > 0) return '';
      if (phase === 0) {
        await sleep(500);
        if (!ctx.alive) return 'end';
        await phaseCutscene();
        return ctx.alive ? 'phase' : 'end';
      }
      await sleep(400);
      if (!ctx.alive) return 'end';
      await death();
      if (ctx.alive) ctx.win();
      return 'end';
    }

    async function fight() {
      panel.innerHTML = '<div class="pb-talk glass"><div class="pb-line pb-glitch-line"><b>👾 GLITCH:</b> Ngươi dám vào Phòng Máy Chủ? BIT là của ta!</div>' +
        '<div class="pb-line pb-bit-line"><b>🤖 BIT:</b> Giúp mình với! Trả lời đúng và đỡ đòn để tấn công GLITCH!</div></div>';
      resetTimerBar(true);
      await sleep(2000);
      let round = 0;
      while (ctx.alive) {
        round++;
        let noise = false;
        if (round > 1 && Math.random() < PH[phase].skillP) {
          const sk = pickSkill();
          resetTimerBar(true);
          panel.innerHTML = '<div class="pb-wait">⚠ GLITCH đang tung chiêu…</div>';
          await skillBanner(sk);
          if (!ctx.alive) return;
          if (sk === 'noise') noise = true;
          else {
            const ok = sk === 'rain' ? await defRain() : sk === 'beam' ? await defBeam() : await defLock();
            if (!ctx.alive) return;
            clearSkill();
            if (ok) {
              await blockFx(true);
              if (!ctx.alive) return;
              const r = await afterDamage();
              if (r === 'end') return;
              if (r === 'phase') continue;
            } else if (!(await bossAttack())) return;
            await sleep(1100);
            if (!ctx.alive) return;
          }
        }
        let type = nextType();
        if (noise && (type === 'virus' || type === 'charge')) type = Math.random() < .5 ? 'tf' : 'mc';
        const res = type === 'tf' ? await roundTF(noise) : type === 'mc' ? await roundMC(noise)
          : type === 'virus' ? await roundVirus() : await roundCharge();
        if (!ctx.alive) return;
        clearSkill();
        if (res.ok) {
          ctx.sfx.ok();
          await playerAttack(res.dmg, res.crit);
          if (!ctx.alive) return;
          const r = await afterDamage();
          if (r === 'end') return;
          if (r === 'phase') continue;
        } else if (!(await bossAttack())) return;
        await sleep(res.wait || 1300);
      }
    }

    renderHp();
    resetTimerBar(true);
    fight();
  };
})();
