/* ===== NEO-CITY · Ải 4 "Phòng STEM" – Lập trình robot (bản 7x7) =====
   Ghi đè PUZZLES.robot cũ trong puzzles-b.js (file này được nạp SAU).
   Luật:
   - Mỗi lệnh đi 1 ô (chạm vào lệnh trong chương trình để đổi ×1/×2/×3).
   - ⏸ chờ: đứng yên 1 bước.
   - Cổng laser BẬT ở bước chẵn (0, 2, 4…), TẮT ở bước lẻ. Đứng trên ô laser lúc BẬT = hỏng.
   - 🚪 cửa khóa chỉ đi qua được khi đã nhặt 🔑.
   - Thắng: đã nhặt ⚡ pin và chạm 🏁 trạm sạc.
*/
(function () {
  'use strict';

  window.PUZZLES = window.PUZZLES || {};

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function pulse(node, cls, ms) {
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
    if (ms) setTimeout(() => node.classList.remove(cls), ms);
  }

  const FALLBACK = {
    map: ['S..K#..', '##.##.#', '...B...', '.###.#.', '...###Z', '##..D..', '...#.#G'],
    max: 20,
    hint: '3 lệnh đầu: ➡×2 ⬇×2 ➡ (nhặt ⚡). Đường laser ngắn hơn đường 🚪 nhưng phải canh giờ!'
  };

  const CMDS = {
    U: { dr: -1, dc: 0, ic: '⬆', rot: 0, name: 'Lên' },
    R: { dr: 0, dc: 1, ic: '➡', rot: 90, name: 'Phải' },
    D: { dr: 1, dc: 0, ic: '⬇', rot: 180, name: 'Xuống' },
    L: { dr: 0, dc: -1, ic: '⬅', rot: 270, name: 'Trái' },
    W: { dr: 0, dc: 0, ic: '⏸', name: 'Chờ' }
  };

  const laserOn = t => t % 2 === 0;

  PUZZLES.robot = (ctx, L) => {
    const LV = (typeof ROBOT_LEVEL !== 'undefined' && ROBOT_LEVEL) || FALLBACK;
    const map = LV.map.map(row => row.split(''));
    const N = map.length;
    const MAX = LV.max || 20;
    let start = { r: 0, c: 0 };
    map.forEach((row, r) => row.forEach((ch, c) => { if (ch === 'S') start = { r, c }; }));

    let prog = [];          // [{k:'R', n:1..3}]
    let running = false;
    let fast = false;
    let st = null;          // world state
    let rot = 90;           // robot facing (deg, cumulative)

    /* ---------- layout ---------- */
    const root = el('div', 'pr-root');
    root.style.setProperty('--n', N);

    const wrap = el('div', 'pr-board glass');
    const hud = el('div', 'pr-hud',
      '<span class="pr-step">BƯỚC <b>0</b></span>' +
      '<span class="pr-lz">LASER <b>BẬT</b></span>' +
      '<span class="pr-inv"><i class="pr-inv-b" title="Pin">⚡</i><i class="pr-inv-k" title="Chìa khóa">🔑</i></span>');
    const grid = el('div', 'pr-grid');
    const cells = [];
    map.forEach((row, r) => {
      cells[r] = [];
      row.forEach((ch, c) => {
        const cell = el('div', 'pr-cell');
        if ((r + c) % 2) cell.classList.add('pr-alt');
        switch (ch) {
          case '#': cell.classList.add('pr-wall'); break;
          case 'S': cell.classList.add('pr-start'); cell.innerHTML = '<span class="pr-ic pr-start-ic">S</span>'; break;
          case 'B': cell.classList.add('pr-bat'); cell.innerHTML = '<span class="pr-ic">⚡</span>'; break;
          case 'K': cell.classList.add('pr-key'); cell.innerHTML = '<span class="pr-ic">🔑</span>'; break;
          case 'D': cell.classList.add('pr-door'); cell.innerHTML = '<span class="pr-ic">🚪</span>'; break;
          case 'Z': cell.classList.add('pr-laser'); cell.innerHTML = '<span class="pr-beam"></span><span class="pr-beam pr-beam2"></span>'; break;
          case 'G': cell.classList.add('pr-goal'); cell.innerHTML = '<span class="pr-ic">🏁</span>'; break;
        }
        cells[r][c] = cell;
        grid.appendChild(cell);
      });
    });
    const bot = el('div', 'pr-bot', '<div class="pr-bot-in"><span class="pr-dir"></span><span class="pr-bot-face">🤖</span></div>');
    grid.appendChild(bot);
    const botIn = $('.pr-bot-in', bot);
    const dirEl = $('.pr-dir', bot);
    wrap.appendChild(hud);
    wrap.appendChild(grid);
    root.appendChild(wrap);

    root.appendChild(el('div', 'pr-legend',
      '<span><i class="pr-lg-wall"></i>Tường</span>' +
      '<span><i>⚡</i>Pin (phải nhặt)</span>' +
      '<span><i>🔑</i>Chìa khóa</span>' +
      '<span><i>🚪</i>Cửa khóa: cần 🔑</span>' +
      '<span><i class="pr-lg-laser"></i>Laser: BẬT bước chẵn, TẮT bước lẻ</span>' +
      '<span><i>🏁</i>Trạm sạc</span>'));

    const msg = el('div', 'pr-msg');
    root.appendChild(msg);

    const progPanel = el('div', 'pr-prog glass',
      '<div class="pr-prog-head"><span>📜 CHƯƠNG TRÌNH <small>· chạm lệnh để ×2/×3</small></span><span class="pr-count">0/' + MAX + '</span></div>' +
      '<div class="pr-chips"></div>');
    root.appendChild(progPanel);
    const chipsBox = $('.pr-chips', progPanel);
    const countEl = $('.pr-count', progPanel);

    const pad = el('div', 'pr-pad');
    pad.innerHTML = ['U', 'D', 'L', 'R'].map(k =>
      '<button class="btn pr-key" data-k="' + k + '" aria-label="' + CMDS[k].name + '">' + CMDS[k].ic + '</button>').join('') +
      '<button class="btn pr-key pr-wait" data-k="W" aria-label="Chờ 1 bước">⏸<small>chờ</small></button>' +
      '<button class="btn ghost pr-key" data-k="undo" aria-label="Xóa lệnh cuối">⌫</button>' +
      '<button class="btn ghost pr-key" data-k="clear" aria-label="Xóa hết">🗑</button>';
    root.appendChild(pad);

    const runRow = el('div', 'pr-runrow');
    const runBtn = el('button', 'btn big green pr-run', '▶ CHẠY');
    const spdBtn = el('button', 'btn ghost pr-spd', '⏩ x2');
    const hintBtn = el('button', 'btn ghost pr-hintbtn', '💡 Gợi ý');
    spdBtn.setAttribute('aria-pressed', 'false');
    runRow.append(runBtn, spdBtn, hintBtn);
    root.appendChild(runRow);

    root.appendChild(el('div', 'pr-tip',
      '💡 Thuật toán = dãy bước rõ ràng, đúng thứ tự. Lệnh ×2, ×3 chính là <b>vòng lặp</b>!'));

    ctx.stage.appendChild(root);

    /* ---------- helpers ---------- */
    const stepMs = () => (fast ? 170 : 340);

    function setMsg(html, type) {
      msg.className = 'pr-msg' + (type ? ' pr-msg-' + type : '');
      msg.innerHTML = '<span>' + html + '</span>';
      pulse(msg, 'pr-pop');
    }

    function placeBot(r, c, instant) {
      if (instant) bot.classList.add('pr-noanim');
      bot.style.transform = 'translate(' + (c * 100) + '%,' + (r * 100) + '%)';
      if (instant) { void bot.offsetWidth; bot.classList.remove('pr-noanim'); }
    }

    function face(k, instant) {
      const target = CMDS[k].rot;
      let d = ((target - rot) % 360 + 540) % 360 - 180;   // shortest turn
      rot += d;
      if (instant) dirEl.classList.add('pr-noanim');
      dirEl.style.transform = 'rotate(' + rot + 'deg)';
      if (instant) { void dirEl.offsetWidth; dirEl.classList.remove('pr-noanim'); }
    }

    function drawHud() {
      $('.pr-step b', hud).textContent = st.t;
      const on = laserOn(st.t);
      const lz = $('.pr-lz', hud);
      lz.classList.toggle('pr-off', !on);
      $('b', lz).textContent = on ? 'BẬT' : 'TẮT';
      grid.classList.toggle('pr-lz-off', !on);
      $('.pr-inv-b', hud).classList.toggle('pr-have', st.bat);
      $('.pr-inv-k', hud).classList.toggle('pr-have', st.key);
    }

    function totalSteps() { return prog.reduce((s, x) => s + x.n, 0); }

    function renderProg() {
      countEl.textContent = prog.length + '/' + MAX;
      countEl.classList.toggle('pr-full', prog.length >= MAX);
      if (!prog.length) {
        chipsBox.innerHTML = '<span class="pr-empty">Chưa có lệnh nào… bấm ⬆⬇⬅➡ bên dưới</span>';
      } else {
        chipsBox.innerHTML = prog.map((x, i) =>
          '<button class="pr-cmd' + (x.k === 'W' ? ' pr-cmd-w' : '') + '" data-i="' + i + '" aria-label="Lệnh ' + (i + 1) + ': ' +
          CMDS[x.k].name + ' ×' + x.n + '"><i>' + (i + 1) + '</i>' + CMDS[x.k].ic +
          '<b class="pr-mul' + (x.n > 1 ? ' pr-mul-on' : '') + '">×' + x.n + '</b></button>').join('');
      }
      if (!running) ctx.setProg(Math.min(prog.length / 7, 1) * 0.3);
    }

    function centerChip(chip) {
      const left = chip.offsetLeft - (chipsBox.clientWidth - chip.offsetWidth) / 2;
      chipsBox.scrollTo({ left: Math.max(0, left), behavior: fast ? 'auto' : 'smooth' });
    }

    function lock(on) {
      running = on;
      $$('button', pad).forEach(b => { b.disabled = on; });
      runBtn.disabled = on;
      hintBtn.disabled = on;
      root.classList.toggle('pr-running', on);
    }

    function resetWorld() {
      st = { r: start.r, c: start.c, t: 0, bat: false, key: false };
      bot.classList.remove('pr-crash', 'pr-win', 'pr-charged', 'pr-haskey');
      wrap.classList.remove('pr-solved', 'pr-flash');
      $$('.pr-got', grid).forEach(n => n.classList.remove('pr-got'));
      $$('.pr-open', grid).forEach(n => n.classList.remove('pr-open'));
      $$('.pr-trail', grid).forEach(n => n.classList.remove('pr-trail'));
      $$('.pr-spark', grid).forEach(n => n.remove());
      $$('.pr-cmd', chipsBox).forEach(c => { c.classList.remove('pr-cur', 'pr-done', 'pr-bad'); c.removeAttribute('data-sub'); });
      placeBot(st.r, st.c, true);
      face('R', true);
      drawHud();
    }

    function spark(r, c) {
      const s = el('div', 'pr-spark', '<span>💥</span>');
      s.style.transform = 'translate(' + (c * 100) + '%,' + (r * 100) + '%)';
      grid.appendChild(s);
      setTimeout(() => s.remove(), 900);
    }

    /* ---------- controls ---------- */
    pad.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || running) return;
      const k = b.dataset.k;
      ctx.sfx.tap();
      if (k === 'undo') prog.pop();
      else if (k === 'clear') prog = [];
      else if (prog.length >= MAX) { toast('Tối đa ' + MAX + ' lệnh thôi! Thử dùng ×2/×3 cho gọn.', 'warn'); return; }
      else prog.push({ k, n: 1 });
      renderProg();
      const last = chipsBox.lastElementChild;
      if (last && k in CMDS) { pulse(last, 'pr-pop'); chipsBox.scrollLeft = chipsBox.scrollWidth; }
    });

    chipsBox.addEventListener('click', e => {
      const b = e.target.closest('.pr-cmd');
      if (!b || running) return;
      const x = prog[+b.dataset.i];
      if (!x) return;
      x.n = x.n % 3 + 1;
      ctx.sfx.tap();
      const m = $('.pr-mul', b);
      m.textContent = '×' + x.n;
      m.classList.toggle('pr-mul-on', x.n > 1);
      b.setAttribute('aria-label', 'Lệnh ' + (+b.dataset.i + 1) + ': ' + CMDS[x.k].name + ' ×' + x.n);
      pulse(b, 'pr-pop');
    });

    spdBtn.addEventListener('click', () => {
      fast = !fast;
      ctx.sfx.tap();
      spdBtn.classList.toggle('pr-spd-on', fast);
      spdBtn.setAttribute('aria-pressed', String(fast));
      root.style.setProperty('--pr-spd', stepMs() + 'ms');
    });

    hintBtn.addEventListener('click', () => {
      if (running) return;
      ctx.sfx.tap();
      setMsg('💡 ' + esc(LV.hint), 'hint');
    });

    runBtn.addEventListener('click', run);

    /* ---------- engine: 1 bước ---------- */
    // trả về null nếu ổn, hoặc { why, bump } nếu hỏng
    function stepOnce(k) {
      const d = CMDS[k];
      if (k !== 'W') {
        const nr = st.r + d.dr, nc = st.c + d.dc;
        const out = nr < 0 || nc < 0 || nr >= N || nc >= N;
        const ch = out ? '#' : map[nr][nc];
        if (ch === '#') return { why: out ? 'đâm vào rìa bản đồ' : 'đâm tường', bump: true, r: nr, c: nc };
        if (ch === 'D' && !st.key) return { why: 'cửa khóa mà chưa có 🔑 chìa', bump: true, r: nr, c: nc };
        st.r = nr; st.c = nc;
      }
      st.t++;
      if (map[st.r][st.c] === 'Z' && laserOn(st.t)) return { why: 'dính tia laser (bước ' + st.t + ' laser đang BẬT)' };
      return null;
    }

    function arrive() {
      const ch = map[st.r][st.c];
      const cell = cells[st.r][st.c];
      cell.classList.add('pr-trail');
      if (ch === 'B' && !st.bat) {
        st.bat = true; cell.classList.add('pr-got'); bot.classList.add('pr-charged');
        ctx.sfx.ok(); setMsg('⚡ Đã nhặt pin! Giờ về 🏁 trạm sạc.', 'ok');
      } else if (ch === 'K' && !st.key) {
        st.key = true; cell.classList.add('pr-got'); bot.classList.add('pr-haskey');
        ctx.sfx.ok(); setMsg('🔑 Đã có chìa khóa – cửa 🚪 sẽ mở!', 'ok');
      } else if (ch === 'D') {
        if (!cell.classList.contains('pr-open')) { cell.classList.add('pr-open'); beep(660, .1, 'triangle', .05); }
      } else if (ch === 'G' && !st.bat) {
        setMsg('🔋 Tới trạm sạc nhưng chưa có ⚡ pin!', 'warn');
      }
      return ch === 'G' && st.bat;
    }

    async function crash(fail, chip, idx) {
      chip.classList.add('pr-bad');
      if (fail.bump) {
        const d = { r: fail.r - st.r, c: fail.c - st.c };
        bot.style.transform = 'translate(' + ((st.c + d.c * 0.32) * 100) + '%,' + ((st.r + d.r * 0.32) * 100) + '%)';
        await wait(150);
        if (!ctx.alive) return false;
        placeBot(st.r, st.c);
      }
      spark(fail.bump ? (st.r + fail.r) / 2 : st.r, fail.bump ? (st.c + fail.c) / 2 : st.c);
      bot.classList.add('pr-crash');
      pulse(wrap, 'pr-flash', 600);
      setMsg('💥 Lệnh #' + (idx + 1) + ': robot ' + fail.why + '!', 'bad');
      if (!ctx.hit()) return false;
      await wait(900);
      if (!ctx.alive) return false;
      resetWorld();
      setMsg('Sửa lại chương trình rồi chạy lại nhé! (chương trình vẫn được giữ)', '');
      lock(false);
      return true;
    }

    async function run() {
      if (running) return;
      if (!prog.length) { toast('Hãy thêm lệnh cho robot trước nhé!', 'warn'); return; }
      ctx.sfx.tap();
      lock(true);
      resetWorld();
      root.style.setProperty('--pr-spd', stepMs() + 'ms');
      setMsg('⚙️ Đang chạy chương trình…');
      await wait(250);
      if (!ctx.alive) return;

      const chips = $$('.pr-cmd', chipsBox);
      const total = totalSteps();
      let done = 0;
      for (let i = 0; i < prog.length; i++) {
        const x = prog[i];
        const chip = chips[i];
        chips.forEach(c => c.classList.remove('pr-cur'));
        chip.classList.add('pr-cur');
        centerChip(chip);
        if (x.k !== 'W') face(x.k);

        for (let j = 0; j < x.n; j++) {
          if (x.n > 1) chip.setAttribute('data-sub', (j + 1) + '/' + x.n);
          const fail = stepOnce(x.k);
          if (fail && fail.bump) { await crash(fail, chip, i); return; }
          placeBot(st.r, st.c);
          if (x.k === 'W') pulse(botIn, 'pr-waitpulse', 320);
          else beep(330 + done * 12, .04, 'square', .025);
          drawHud();
          done++;
          ctx.setProg(0.3 + 0.6 * done / total);
          await wait(stepMs());
          if (!ctx.alive) return;
          if (fail) { await crash(fail, chip, i); return; }
          if (arrive()) {
            chip.classList.remove('pr-cur'); chip.classList.add('pr-done');
            bot.classList.add('pr-win');
            wrap.classList.add('pr-solved');
            setMsg('✅ Robot đã có pin và về trạm sạc! Thuật toán chuẩn!', 'ok');
            ctx.setProg(1);
            await wait(900);
            if (!ctx.alive) return;
            ctx.win();
            return;
          }
        }
        chip.removeAttribute('data-sub');
        chip.classList.remove('pr-cur');
        chip.classList.add('pr-done');
      }

      if (map[st.r][st.c] === 'G') setMsg('🔋 Robot tới trạm nhưng chưa nhặt ⚡ pin!', 'warn');
      else if (!st.bat) setMsg('🤔 Hết lệnh rồi! Robot chưa nhặt ⚡ pin và chưa tới 🏁.', 'warn');
      else setMsg('🤔 Hết lệnh rồi mà robot chưa tới 🏁 trạm sạc.', 'warn');
      await wait(1300);
      if (!ctx.alive) return;
      resetWorld();
      lock(false);
    }

    root.style.setProperty('--pr-spd', stepMs() + 'ms');
    resetWorld();
    renderProg();
    setMsg('Nhặt ⚡ pin rồi về 🏁 trạm sạc. Có 2 đường: lấy 🔑 mở 🚪 hoặc canh giờ qua laser.');
  };
})();
