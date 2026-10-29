/* ===== NEO-CITY · Puzzles A: quiz, password, swipe, binary =====
   Đăng ký vào window.PUZZLES. Phụ thuộc globals của game.js lúc gọi:
   $, $$, esc, shuffle, rand, wait, toast, S; dữ liệu QUIZ, NEWS từ data.js.
   Mọi class riêng đều có tiền tố "pa-". */
(() => {
  'use strict';

  const P = (window.PUZZLES = window.PUZZLES || {});
  const LETTERS = 'ABCD';

  /** Tạo 1 phần tử từ chuỗi HTML. */
  const el = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  const buzz = (ctx, p) => { if (ctx.buzz) ctx.buzz(p); };

  /* ------------------------------------------------------------------
     1. QUIZ – Cổng Trường Thông Minh
  ------------------------------------------------------------------ */
  P.quiz = (ctx) => {
    const N = 5;
    const qs = shuffle(QUIZ).slice(0, N);
    let idx = 0;
    let good = 0;
    let done = false;

    ctx.stage.innerHTML = `
      <div class="glass pa-gate">
        <div class="pa-gate-title">CỔNG TRƯỜNG · <span class="pa-gate-count">0/${N}</span> KHÓA MỞ</div>
        <div class="pa-gate-locks">${'<span class="pa-lock"><i></i></span>'.repeat(N)}</div>
      </div>
      <div class="pa-quiz-slot"></div>`;

    const gate = $('.pa-gate', ctx.stage);
    const locks = $$('.pa-lock', ctx.stage);
    const count = $('.pa-gate-count', ctx.stage);
    const slot = $('.pa-quiz-slot', ctx.stage);
    ctx.setProg(0);

    const show = () => {
      const q = qs[idx];
      const opts = shuffle(q.o.map((t, k) => ({ t, ok: k === 0 })));
      slot.innerHTML = `
        <div class="glass pa-qcard">
          <div class="pa-qhead"><span>TRUY VẤN ${idx + 1}/${N}</span><span class="pa-blink">▮</span></div>
          <div class="pa-qtext">${esc(q.q)}</div>
          <div class="pa-opts">
            ${opts.map((o, k) => `
              <button type="button" class="pa-opt" style="--d:${k * 70}ms" data-k="${k}">
                <b>${LETTERS[k]}</b><span>${esc(o.t)}</span>
              </button>`).join('')}
          </div>
          <div class="pa-feed"></div>
        </div>`;
      const btns = $$('.pa-opt', slot);
      btns.forEach((b) => b.addEventListener('click', () => answer(q, opts, btns, +b.dataset.k)));
    };

    const answer = (q, opts, btns, k) => {
      if (btns[0].disabled) return;
      btns.forEach((b, j) => {
        b.disabled = true;
        b.classList.add(opts[j].ok ? 'pa-ok' : j === k ? 'pa-bad' : 'pa-dim');
      });

      const right = opts[k].ok;
      let alive = true;
      if (right) {
        ctx.sfx.ok();
        locks[good].classList.add('pa-on');
        good++;
        count.textContent = `${good}/${N}`;
      } else {
        alive = ctx.hit();
      }
      idx++;
      ctx.setProg(idx / N);

      const feed = $('.pa-feed', slot);
      feed.innerHTML = `<div class="explain ${right ? 'ok' : 'no'} pa-pop">
        <b>${right ? '✔ Chính xác!' : '✖ Chưa đúng!'}</b> ${esc(q.e)}</div>`;
      if (!alive) return;

      const next = el('<button type="button" class="btn big pa-pop">Tiếp tục ›</button>');
      next.addEventListener('click', () => {
        ctx.sfx.tap();
        next.disabled = true;
        if (idx < N) show();
        else openGate();
      });
      feed.appendChild(next);
      next.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };

    const openGate = async () => {
      if (done) return;
      done = true;
      locks.forEach((l) => l.classList.add('pa-on'));
      gate.classList.add('pa-open');
      count.textContent = `${N}/${N}`;
      buzz(ctx, [30, 40, 60]);
      await wait(900);
      if (ctx.alive) ctx.win();
    };

    show();
  };

  /* ------------------------------------------------------------------
     2. PASSWORD – Pháo Đài Mật Khẩu
  ------------------------------------------------------------------ */
  const stripVN = (s) => String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');

  const WEAK = ['123', '234', '345', '456', '567', '678', '789', '890', '987', '876', '765',
    '654', '543', '432', '321', 'abc', 'qwerty', 'asdf', 'password', 'matkhau', 'admin', 'iloveyou'];
  const SPECIAL_RE = /[!-/:-@[-`{-~]/;

  P.password = (ctx) => {
    const playerName = typeof S !== 'undefined' && S ? S.name : '';
    const nameWords = stripVN(playerName).toLowerCase()
      .split(/[^a-z0-9]+/).filter((w) => w.length >= 3);

    /** Trả về chuỗi dễ đoán tìm thấy, hoặc '' nếu không có. */
    const weakPart = (pw) => {
      const low = stripVN(pw).toLowerCase();
      const rep = low.match(/(.)\1\1/);
      if (rep) return rep[0];
      return WEAK.find((w) => low.includes(w)) || nameWords.find((w) => low.includes(w)) || '';
    };

    const RULES = [
      { t: 'Ít nhất 10 ký tự', f: (p) => p.length >= 10 },
      { t: 'Có chữ IN HOA (A–Z)', f: (p) => /[A-Z]/.test(p) },
      { t: 'Có chữ thường (a–z)', f: (p) => /[a-z]/.test(p) },
      { t: 'Có chữ số (0–9)', f: (p) => /[0-9]/.test(p) },
      { t: 'Có ký tự đặc biệt (! @ # $ % …)', f: (p) => SPECIAL_RE.test(p) },
      { t: 'Không chứa chuỗi dễ đoán (123, abc, qwerty, tên em…)', f: (p) => p.length > 0 && !weakPart(p) }
    ];

    const crackTime = (pw) => {
      if (!pw) return '—';
      if (weakPart(pw)) return 'tức thì';
      let cs = 0;
      if (/[a-z]/.test(pw)) cs += 26;
      if (/[A-Z]/.test(pw)) cs += 26;
      if (/[0-9]/.test(pw)) cs += 10;
      if (SPECIAL_RE.test(pw)) cs += 33;
      if (/[^\x20-\x7e]/.test(pw)) cs += 50;
      if (/ /.test(pw)) cs += 1;
      const entropy = pw.length * Math.log2(Math.max(cs, 2));
      const sec = Math.pow(2, entropy) / 1e10 / 2; // trung bình đoán trúng sau nửa không gian
      const yr = sec / 31536000;
      if (sec < 1) return 'tức thì';
      if (sec < 60) return `${Math.round(sec)} giây`;
      if (sec < 3600) return `${Math.round(sec / 60)} phút`;
      if (sec < 86400) return `${Math.round(sec / 3600)} giờ`;
      if (yr < 1) return `${Math.round(sec / 86400)} ngày`;
      if (yr < 1e6) return `${Math.round(yr).toLocaleString('vi-VN')} năm`;
      if (yr < 1e9) return 'hàng triệu năm';
      return 'hàng tỷ năm';
    };

    const STRENGTH = ['Rất yếu', 'Rất yếu', 'Yếu', 'Yếu', 'Trung bình', 'Khá mạnh', 'Rất mạnh'];
    const shieldPath = 'M50 4 L92 19 V56 C92 84 73 104 50 116 C27 104 8 84 8 56 V19 Z';
    const uid = 'pa' + Math.random().toString(36).slice(2, 8);

    ctx.stage.innerHTML = `
      <div class="pa-warn">⚠ Đây là trò chơi – đừng nhập mật khẩu thật của em!</div>
      <div class="glass pa-fort">
        <div class="pa-shield-wrap">
          <svg class="pa-shield" viewBox="0 0 100 120" aria-hidden="true">
            <defs>
              <clipPath id="${uid}c"><path d="${shieldPath}"/></clipPath>
              <linearGradient id="${uid}g" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stop-color="#ff2bd6"/><stop offset=".55" stop-color="#8b5cf6"/><stop offset="1" stop-color="#00f0ff"/>
              </linearGradient>
            </defs>
            <path class="pa-sh-bg" d="${shieldPath}"/>
            <g clip-path="url(#${uid}c)">
              <rect class="pa-sh-fill" x="0" y="0" width="100" height="120" fill="url(#${uid}g)"/>
              ${[1, 2, 3, 4, 5].map((i) => `<line class="pa-sh-line" x1="0" x2="100" y1="${4 + i * 18.67}" y2="${4 + i * 18.67}"/>`).join('')}
            </g>
            <path class="pa-sh-edge" d="${shieldPath}"/>
          </svg>
          <div class="pa-sh-icon">🔓</div>
        </div>
        <div class="pa-fort-info">
          <div class="pa-fort-label">LÁ CHẮN TÀI KHOẢN</div>
          <div class="pa-fort-pct">0%</div>
          <div class="hint pa-fort-state">Chưa được bảo vệ</div>
        </div>
      </div>
      <div class="glass pa-pw-box">
        <label class="pa-label" for="${uid}i">NHẬP MẬT KHẨU MỚI</label>
        <input id="${uid}i" class="pa-input" type="text" autocomplete="off" autocapitalize="off"
          autocorrect="off" spellcheck="false" maxlength="40" placeholder="Gõ mật khẩu tại đây…">
        <div class="pa-meter"><i></i></div>
        <div class="pa-meter-row"><span class="pa-str">—</span><span class="pa-len">0 ký tự</span></div>
        <div class="pa-crack">🤖 Hacker AI cần: <b>—</b></div>
      </div>
      <ul class="glass pa-rules">
        ${RULES.map((r) => `<li class="pa-rule"><span class="pa-led"></span><span class="pa-rule-t">${esc(r.t)}</span></li>`).join('')}
      </ul>
      <div class="hint pa-tip">💡 Mẹo: dùng cụm từ dễ nhớ, VD: <b>MeoDen@An3Ca!</b></div>
      <button type="button" class="btn big green pa-lockbtn" disabled>🔒 KHÓA TÀI KHOẢN</button>`;

    const st = ctx.stage;
    const input = $('.pa-input', st);
    const fort = $('.pa-fort', st);
    const shield = $('.pa-shield', st);
    const icon = $('.pa-sh-icon', st);
    const pct = $('.pa-fort-pct', st);
    const fstate = $('.pa-fort-state', st);
    const meter = $('.pa-meter i', st);
    const strEl = $('.pa-str', st);
    const lenEl = $('.pa-len', st);
    const crackEl = $('.pa-crack b', st);
    const rows = $$('.pa-rule', st);
    const btn = $('.pa-lockbtn', st);
    let allOk = false;
    let locked = false;

    const update = () => {
      const pw = input.value;
      const res = RULES.map((r) => r.f(pw));
      const passed = res.filter(Boolean).length;
      const weak = pw ? weakPart(pw) : '';

      rows.forEach((row, i) => {
        const was = row.classList.contains('pa-pass');
        row.classList.toggle('pa-pass', res[i]);
        row.classList.toggle('pa-fail', !res[i] && pw.length > 0);
        if (res[i] && !was) row.classList.add('pa-flash');
      });
      const weakRow = $('.pa-rule-t', rows[5]);
      weakRow.innerHTML = esc(RULES[5].t) + (weak ? ` <em class="pa-found">phát hiện: “${esc(weak)}”</em>` : '');

      const p = passed / RULES.length;
      shield.style.setProperty('--p', p);
      pct.textContent = Math.round(p * 100) + '%';
      fstate.textContent = passed === 6 ? 'Sẵn sàng khóa!' : passed >= 4 ? 'Đang gia cố…' : passed ? 'Lá chắn yếu' : 'Chưa được bảo vệ';
      fort.classList.toggle('pa-ready', passed === 6);

      meter.style.width = (pw ? Math.max(p, 0.06) : 0) * 100 + '%';
      meter.style.setProperty('--h', Math.round(p * 130));
      strEl.textContent = pw ? STRENGTH[passed] : '—';
      strEl.style.color = pw ? `hsl(${Math.round(p * 130)} 100% 62%)` : '';
      lenEl.textContent = `${pw.length} ký tự`;
      const ct = crackTime(pw);
      crackEl.textContent = ct;
      crackEl.className = ct === 'tức thì' ? 'pa-bad-t' : /triệu|tỷ|năm/.test(ct) ? 'pa-good-t' : '';

      allOk = passed === 6;
      btn.disabled = !allOk || locked;
      ctx.setProg(p);
    };

    rows.forEach((row) => row.addEventListener('animationend', () => row.classList.remove('pa-flash')));
    input.addEventListener('input', update);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') lock(); });

    const lock = async () => {
      if (!allOk || locked) return;
      locked = true;
      input.disabled = true;
      btn.disabled = true;
      btn.textContent = '🔒 ĐANG KHÓA…';
      fort.classList.add('pa-sealed');
      icon.textContent = '🔒';
      fstate.textContent = 'Tài khoản đã được bảo vệ!';
      ctx.sfx.ok();
      buzz(ctx, [40, 40, 90]);
      await wait(1200);
      if (ctx.alive) ctx.win();
    };
    btn.addEventListener('click', lock);

    update();
    ctx.setProg(0);
  };

  /* ------------------------------------------------------------------
     3. SWIPE – Chợ Tin Giả
  ------------------------------------------------------------------ */
  P.swipe = (ctx) => {
    const N = 6;
    const TH = 90; // ngưỡng vuốt (px)
    const deck = shuffle(NEWS).slice(0, N);
    let idx = 0;
    let busy = false;
    let won = false;

    ctx.stage.innerHTML = `
      <div class="pa-sw-top">
        <span class="pa-sw-count">THẺ 1/${N}</span>
        <span class="hint">Vuốt ⬅ TIN GIẢ · TIN THẬT ➡</span>
      </div>
      <div class="pa-deck"></div>
      <div class="pa-sw-btns">
        <button type="button" class="btn red pa-sw-fake">✖ GIẢ</button>
        <button type="button" class="btn green pa-sw-real">✔ THẬT</button>
      </div>
      <div class="pa-sw-feed"></div>`;

    const deckEl = $('.pa-deck', ctx.stage);
    const countEl = $('.pa-sw-count', ctx.stage);
    const feed = $('.pa-sw-feed', ctx.stage);
    const bFake = $('.pa-sw-fake', ctx.stage);
    const bReal = $('.pa-sw-real', ctx.stage);
    ctx.setProg(0);

    const cardHTML = (c, cls) => `
      <div class="pa-card ${cls}">
        <div class="pa-card-src">${esc(c.src)}</div>
        <div class="pa-card-text">${esc(c.t)}</div>
        <div class="pa-card-foot">#BẢNG-TIN-TRƯỜNG · kiểm chứng trước khi chia sẻ</div>
        <div class="pa-stamp pa-stamp-real">THẬT</div>
        <div class="pa-stamp pa-stamp-fake">GIẢ</div>
      </div>`;

    const setBtns = (on) => { bFake.disabled = bReal.disabled = !on; };

    const mount = () => {
      deckEl.innerHTML = '';
      if (deck[idx + 1]) deckEl.appendChild(el(cardHTML(deck[idx + 1], 'pa-under')));
      if (deck[idx]) {
        const top = el(cardHTML(deck[idx], 'pa-top pa-enter'));
        deckEl.appendChild(top);
        top.addEventListener('animationend', () => top.classList.remove('pa-enter'), { once: true });
        bindDrag(top);
      }
      countEl.textContent = `THẺ ${Math.min(idx + 1, N)}/${N}`;
    };

    const paint = (card, dx) => {
      card.style.transform = `translateX(${dx}px) rotate(${dx / 14}deg)`;
      const o = Math.min(Math.abs(dx) / TH, 1);
      $('.pa-stamp-real', card).style.opacity = dx > 0 ? o : 0;
      $('.pa-stamp-fake', card).style.opacity = dx < 0 ? o : 0;
    };

    const bindDrag = (card) => {
      let sx = 0, dx = 0, pid = null;
      card.addEventListener('pointerdown', (e) => {
        if (busy || pid !== null) return;
        pid = e.pointerId;
        sx = e.clientX;
        dx = 0;
        card.setPointerCapture(pid);
        card.classList.remove('pa-enter');
        card.classList.add('pa-drag');
      });
      card.addEventListener('pointermove', (e) => {
        if (e.pointerId !== pid) return;
        dx = e.clientX - sx;
        paint(card, dx);
      });
      const end = (e, cancel) => {
        if (e.pointerId !== pid) return;
        pid = null;
        card.classList.remove('pa-drag');
        if (!cancel && Math.abs(dx) > TH && !busy) decide(dx > 0);
        else paint(card, 0);
      };
      card.addEventListener('pointerup', (e) => end(e, false));
      card.addEventListener('pointercancel', (e) => end(e, true));
    };

    const decide = (guessReal) => {
      if (busy || idx >= N) return;
      busy = true;
      setBtns(false);
      ctx.sfx.tap();

      const c = deck[idx];
      const card = $('.pa-top', deckEl);
      if (card) {
        const dir = guessReal ? 1 : -1;
        card.classList.remove('pa-drag', 'pa-enter');
        $(guessReal ? '.pa-stamp-real' : '.pa-stamp-fake', card).style.opacity = 1;
        card.classList.add('pa-fly');
        card.style.transform = `translateX(${dir * (deckEl.offsetWidth + 160)}px) rotate(${dir * 28}deg)`;
        setTimeout(() => card.remove(), 480);
      }

      const right = guessReal === c.real;
      idx++;
      ctx.setProg(idx / N);
      let alive = true;
      if (right) ctx.sfx.ok();
      else alive = ctx.hit();

      feed.innerHTML = `<div class="explain ${right ? 'ok' : 'no'} pa-pop">
        <b>${right ? '✔ Chính xác!' : '✖ Nhầm rồi!'}</b> Đây là <b>TIN ${c.real ? 'THẬT' : 'GIẢ'}</b>. ${esc(c.e)}</div>`;
      if (!alive) return;

      const next = el('<button type="button" class="btn big pa-pop">Tiếp ›</button>');
      next.addEventListener('click', () => {
        next.disabled = true;
        ctx.sfx.tap();
        if (idx >= N) {
          if (!won) { won = true; ctx.win(); }
          return;
        }
        feed.innerHTML = '';
        busy = false;
        mount();
        setBtns(true);
      });
      feed.appendChild(next);
      next.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };

    bFake.addEventListener('click', () => decide(false));
    bReal.addEventListener('click', () => decide(true));
    mount();
  };

  /* ------------------------------------------------------------------
     4. BINARY – Lõi Nhị Phân
  ------------------------------------------------------------------ */
  P.binary = (ctx) => {
    const ROUNDS = [
      { bits: 5, min: 5, max: 15 },
      { bits: 5, min: 17, max: 31 },
      { bits: 6, min: 33, max: 63 }
    ];
    let r = 0;
    let bits = [];
    let target = 0;
    let locked = false;

    ctx.stage.innerHTML = `
      <div class="glass pa-bin-panel">
        <div class="pa-bin-head">
          <span class="pa-bin-layer">LỚP KHÓA 1/3</span>
          <span class="pa-bin-dots">${'<i></i>'.repeat(ROUNDS.length)}</span>
        </div>
        <div class="pa-bin-label">SỐ MỤC TIÊU</div>
        <div class="pa-bin-target">0</div>
        <div class="pa-bin-stats">
          <div><span>Tổng hiện tại</span><b class="pa-bin-sum">0</b></div>
          <div><span>Mã nhị phân</span><b class="pa-bin-str">00000</b></div>
        </div>
        <div class="pa-bin-status">&nbsp;</div>
        <div class="pa-bin-flash">🔓 MỞ KHÓA!</div>
      </div>
      <div class="pa-bits"></div>
      <div class="hint pa-tip">💡 Mỗi bit có giá trị gấp đôi bit bên phải. Máy tính lưu mọi thứ – chữ, ảnh, nhạc – bằng 0 và 1!</div>`;

    const st = ctx.stage;
    const panel = $('.pa-bin-panel', st);
    const layerEl = $('.pa-bin-layer', st);
    const dots = $$('.pa-bin-dots i', st);
    const targetEl = $('.pa-bin-target', st);
    const sumEl = $('.pa-bin-sum', st);
    const strEl = $('.pa-bin-str', st);
    const statusEl = $('.pa-bin-status', st);
    const bitsEl = $('.pa-bits', st);
    ctx.setProg(0);

    const valueOf = (i) => 1 << (bits.length - 1 - i);
    const sum = () => bits.reduce((s, b, i) => s + b * valueOf(i), 0);

    const startRound = () => {
      const cfg = ROUNDS[r];
      bits = new Array(cfg.bits).fill(0);
      target = rand(cfg.min, cfg.max);
      locked = false;
      layerEl.textContent = `LỚP KHÓA ${r + 1}/${ROUNDS.length}`;
      targetEl.textContent = target;
      targetEl.classList.remove('pa-pulse');
      void targetEl.offsetWidth;
      targetEl.classList.add('pa-pulse');
      bitsEl.style.setProperty('--n', cfg.bits);
      bitsEl.innerHTML = bits.map((_, i) => `
        <button type="button" class="pa-bit" style="--d:${i * 50}ms" data-i="${i}" aria-pressed="false">
          <span class="pa-bit-val">${valueOf(i)}</span>
          <span class="pa-bit-d">0</span>
        </button>`).join('');
      $$('.pa-bit', bitsEl).forEach((b) => b.addEventListener('click', () => toggle(+b.dataset.i)));
      refresh();
    };

    const refresh = () => {
      const s = sum();
      sumEl.textContent = s;
      strEl.textContent = bits.join('');
      $$('.pa-bit', bitsEl).forEach((b, i) => {
        b.classList.toggle('pa-on', bits[i] === 1);
        b.setAttribute('aria-pressed', bits[i] === 1);
        $('.pa-bit-d', b).textContent = bits[i];
      });
      const over = s > target;
      sumEl.classList.toggle('pa-over', over);
      statusEl.innerHTML = over ? '⚠ Tổng đang vượt quá mục tiêu – thử tắt bớt bit lớn.' : '&nbsp;';
      statusEl.classList.toggle('pa-warn-t', over);
      return s;
    };

    const toggle = async (i) => {
      if (locked) return;
      bits[i] ^= 1;
      ctx.sfx.tap();
      if (refresh() !== target) return;

      locked = true;
      $$('.pa-bit', bitsEl).forEach((b) => (b.disabled = true));
      panel.classList.add('pa-unlocked');
      dots[r].classList.add('pa-on');
      ctx.sfx.ok();
      buzz(ctx, [30, 30, 60]);
      r++;
      ctx.setProg(r / ROUNDS.length);
      await wait(900);
      if (!ctx.alive) return;
      panel.classList.remove('pa-unlocked');
      if (r >= ROUNDS.length) ctx.win();
      else startRound();
    };

    startRound();
  };
})();
