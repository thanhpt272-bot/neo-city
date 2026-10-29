/* ===== NEO-CITY · Puzzles B: robot, phishing, boss ===== */
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
     1. ROBOT – Xưởng Robot (tư duy thuật toán)
     ========================================================= */
  PUZZLES.robot = (ctx, L) => {
    const MAX = 18;
    const STEP_MS = 320;
    const DIRS = {
      U: { dr: -1, dc: 0, ic: '⬆' },
      D: { dr: 1, dc: 0, ic: '⬇' },
      L: { dr: 0, dc: -1, ic: '⬅' },
      R: { dr: 0, dc: 1, ic: '➡' }
    };

    const map = ROBOT_MAP.map(row => row.split(''));
    const N = map.length;
    let start = { r: 0, c: 0 }, chipPos = null;
    map.forEach((row, r) => row.forEach((ch, c) => {
      if (ch === 'S') start = { r, c };
      if (ch === 'C') chipPos = { r, c };
    }));

    let prog = [];
    let running = false;
    let hasChip = false;
    let pos = { ...start };

    /* ---- layout ---- */
    ctx.stage.appendChild(el('div', 'hint',
      'Lập trình robot: nhặt ⚡ pin rồi tới 🏁 trạm sạc. Tránh tường! (tối đa 18 lệnh)'));

    const boardWrap = el('div', 'pb-board-wrap glass');
    const board = el('div', 'pb-board');
    board.style.setProperty('--n', N);
    let chipCell = null;
    map.forEach((row, r) => row.forEach((ch, c) => {
      const cell = el('div', 'pb-cell');
      if (ch === '#') cell.classList.add('pb-wall');
      if (ch === 'S') { cell.classList.add('pb-start'); cell.innerHTML = '<span class="pb-cell-ic pb-start-ic">S</span>'; }
      if (ch === 'C') { cell.classList.add('pb-chipcell'); cell.innerHTML = '<span class="pb-cell-ic pb-chip">⚡</span>'; chipCell = cell; }
      if (ch === 'G') { cell.classList.add('pb-goal'); cell.innerHTML = '<span class="pb-cell-ic">🏁</span>'; }
      board.appendChild(cell);
    }));
    const robot = el('div', 'pb-robot', '<span class="pb-robot-body">🤖</span>');
    robot.style.width = robot.style.height = (100 / N) + '%';
    board.appendChild(robot);
    boardWrap.appendChild(board);
    ctx.stage.appendChild(boardWrap);

    const msg = el('div', 'pb-msg', 'Bấm các mũi tên để thêm lệnh, rồi chạy chương trình.');
    ctx.stage.appendChild(msg);

    const progPanel = el('div', 'pb-prog glass');
    progPanel.innerHTML =
      '<div class="pb-prog-head"><span>📜 CHƯƠNG TRÌNH</span><span class="pb-count">0/' + MAX + '</span></div>' +
      '<div class="pb-chips"></div>';
    ctx.stage.appendChild(progPanel);
    const chipsBox = $('.pb-chips', progPanel);
    const countEl = $('.pb-count', progPanel);

    const pad = el('div', 'pb-pad');
    pad.innerHTML =
      '<button class="btn pb-key" data-k="U" aria-label="Lên">⬆</button>' +
      '<button class="btn pb-key" data-k="D" aria-label="Xuống">⬇</button>' +
      '<button class="btn pb-key" data-k="L" aria-label="Trái">⬅</button>' +
      '<button class="btn pb-key" data-k="R" aria-label="Phải">➡</button>' +
      '<button class="btn ghost pb-key" data-k="undo" aria-label="Xóa lệnh cuối">⌫</button>' +
      '<button class="btn ghost pb-key" data-k="clear" aria-label="Xóa hết">🗑</button>';
    ctx.stage.appendChild(pad);

    const runBtn = el('button', 'btn big green pb-run', '▶ CHẠY CHƯƠNG TRÌNH');
    ctx.stage.appendChild(runBtn);

    ctx.stage.appendChild(el('div', 'pb-tip',
      '💡 Thuật toán = dãy các bước rõ ràng, đúng thứ tự để giải quyết vấn đề.'));

    /* ---- rendering helpers ---- */
    function placeRobot(p, instant) {
      if (instant) robot.classList.add('pb-noanim');
      robot.style.transform = 'translate(' + (p.c * 100) + '%,' + (p.r * 100) + '%)';
      if (instant) { void robot.offsetWidth; robot.classList.remove('pb-noanim'); }
    }

    function renderProg() {
      countEl.textContent = prog.length + '/' + MAX;
      countEl.classList.toggle('pb-full', prog.length >= MAX);
      if (!prog.length) {
        chipsBox.innerHTML = '<span class="pb-empty">Chưa có lệnh nào…</span>';
      } else {
        chipsBox.innerHTML = prog.map((k, i) =>
          '<span class="pb-cmd" data-i="' + i + '"><i>' + (i + 1) + '</i>' + DIRS[k].ic + '</span>').join('');
      }
      if (!running) ctx.setProg(Math.min(prog.length / 16, 1) * 0.9);
    }

    function setMsg(html, type) {
      msg.className = 'pb-msg' + (type ? ' pb-msg-' + type : '');
      msg.innerHTML = html;
      pulse(msg, 'pb-pop');
    }

    function lock(on) {
      running = on;
      $$('button', pad).forEach(b => { b.disabled = on; });
      runBtn.disabled = on;
      boardWrap.classList.toggle('pb-running', on);
    }

    function resetWorld() {
      pos = { ...start };
      hasChip = false;
      robot.classList.remove('pb-crash', 'pb-win', 'pb-charged');
      if (chipCell) chipCell.classList.remove('pb-got');
      $$('.pb-cmd', chipsBox).forEach(c => c.classList.remove('pb-cur', 'pb-done', 'pb-bad'));
      placeRobot(pos, true);
    }

    /* ---- controls ---- */
    pad.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || running) return;
      const k = b.dataset.k;
      ctx.sfx.tap();
      if (k === 'undo') prog.pop();
      else if (k === 'clear') prog = [];
      else if (prog.length >= MAX) { toast('Tối đa ' + MAX + ' lệnh thôi!', 'warn'); return; }
      else prog.push(k);
      renderProg();
      const last = chipsBox.lastElementChild;
      if (last && k in DIRS) { pulse(last, 'pb-pop'); chipsBox.scrollLeft = chipsBox.scrollWidth; }
    });

    runBtn.addEventListener('click', run);

    async function run() {
      if (running) return;
      if (!prog.length) { toast('Hãy thêm lệnh cho robot trước nhé!', 'warn'); return; }
      ctx.sfx.tap();
      lock(true);
      resetWorld();
      setMsg('⚙️ Đang chạy chương trình…');
      await wait(300);
      if (!ctx.alive) return;

      const chips = $$('.pb-cmd', chipsBox);
      for (let i = 0; i < prog.length; i++) {
        chips.forEach(c => c.classList.remove('pb-cur'));
        const chip = chips[i];
        chip.classList.add('pb-cur');
        chip.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });

        const d = DIRS[prog[i]];
        const nr = pos.r + d.dr, nc = pos.c + d.dc;
        const blocked = nr < 0 || nc < 0 || nr >= N || nc >= N || map[nr][nc] === '#';

        if (blocked) {
          chip.classList.add('pb-bad');
          // nudge toward the obstacle, then crash
          robot.style.transform = 'translate(' + ((pos.c + d.dc * 0.3) * 100) + '%,' + ((pos.r + d.dr * 0.3) * 100) + '%)';
          await wait(160);
          if (!ctx.alive) return;
          placeRobot(pos);
          robot.classList.add('pb-crash');
          pulse(boardWrap, 'pb-flash', 600);
          setMsg('💥 Robot đâm tường ở lệnh #' + (i + 1), 'bad');
          if (!ctx.hit()) return;
          await wait(900);
          if (!ctx.alive) return;
          resetWorld();
          setMsg('Sửa lại chương trình rồi chạy lại nhé!');
          lock(false);
          return;
        }

        pos = { r: nr, c: nc };
        placeRobot(pos);
        await wait(STEP_MS);
        if (!ctx.alive) return;
        chip.classList.remove('pb-cur');
        chip.classList.add('pb-done');

        if (!hasChip && chipPos && pos.r === chipPos.r && pos.c === chipPos.c) {
          hasChip = true;
          chipCell.classList.add('pb-got');
          robot.classList.add('pb-charged');
          ctx.sfx.ok();
          setMsg('⚡ Đã nạp pin!', 'ok');
        }
      }

      const onGoal = map[pos.r][pos.c] === 'G';
      if (onGoal && hasChip) {
        robot.classList.add('pb-win');
        boardWrap.classList.add('pb-solved');
        setMsg('✅ Robot đã nạp pin và về trạm sạc!', 'ok');
        ctx.setProg(1);
        await wait(700);
        if (!ctx.alive) return;
        ctx.win();
        return;
      }

      if (onGoal) setMsg('🔋 Robot tới trạm nhưng chưa nạp pin!', 'warn');
      else setMsg('🤔 Robot chưa tới trạm sạc. Sửa lại chương trình nhé!', 'warn');
      await wait(1200);
      if (!ctx.alive) return;
      resetWorld();
      lock(false);
    }

    resetWorld();
    renderProg();
  };

  /* =========================================================
     2. PHISHING – Bẫy Phishing
     ========================================================= */
  PUZZLES.phishing = (ctx, L) => {
    const segs = [];   // { node, f }
    let found = 0;
    let done = false;

    ctx.stage.appendChild(el('div', 'hint',
      'Email này có 5 dấu hiệu lừa đảo. Chạm vào từng chỗ đáng ngờ!'));

    const phone = el('div', 'pb-phone');
    phone.innerHTML =
      '<div class="pb-ph-bar"><span>9:41</span><span>📶 🔋</span></div>' +
      '<div class="pb-ph-app"><span class="pb-ph-back">‹ Hộp thư</span><span class="pb-ph-title">📧 Thư đến</span><span class="pb-ph-act">⋯</span></div>';
    const head = el('div', 'pb-mail-head');
    const body = el('div', 'pb-mail-body');
    phone.appendChild(head);
    phone.appendChild(body);
    ctx.stage.appendChild(phone);

    function addSeg(parent, tag, cls, html, item) {
      const n = el(tag, 'pb-seg ' + (cls || ''), html);
      n.setAttribute('role', 'button');
      n.tabIndex = 0;
      const s = { node: n, f: item.f || null, found: false };
      segs.push(s);
      n.addEventListener('click', () => tap(s));
      n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(s); } });
      parent.appendChild(n);
      return n;
    }

    // header: from + subject
    const fromRow = el('div', 'pb-mail-row');
    fromRow.innerHTML = '<span class="pb-mail-lbl">Từ:</span>';
    addSeg(fromRow, 'span', 'pb-from', MAIL.from.t, MAIL.from); // already escaped
    head.appendChild(fromRow);
    head.appendChild(el('div', 'pb-mail-row pb-mail-to', '<span class="pb-mail-lbl">Đến:</span><span>em@hocsinh.edu.vn</span>'));
    const subjRow = el('div', 'pb-mail-row');
    subjRow.innerHTML = '<span class="pb-mail-lbl">Tiêu đề:</span>';
    addSeg(subjRow, 'span', 'pb-subj', esc(MAIL.subj.t), MAIL.subj);
    head.appendChild(subjRow);

    // body paragraphs
    MAIL.body.forEach(item => {
      const p = el('p', 'pb-mail-p');
      addSeg(p, 'span', item.link ? 'pb-link' : '', esc(item.t), item);
      body.appendChild(p);
    });

    const total = segs.filter(s => s.f).length;

    const listBox = el('div', 'pb-flags glass');
    listBox.innerHTML = '<div class="pb-flags-head">🚩 Dấu hiệu đã phát hiện <b class="pb-fcount">0/' + total + '</b></div><ol class="pb-flist"></ol>';
    ctx.stage.appendChild(listBox);
    const fcount = $('.pb-fcount', listBox);
    const flist = $('.pb-flist', listBox);

    async function tap(s) {
      if (done || !ctx.alive || s.found) return;
      if (s.f) {
        s.found = true;
        found++;
        ctx.sfx.ok();
        s.node.classList.add('pb-flagged');
        s.node.appendChild(el('span', 'pb-badge', String(found)));
        const li = el('li', 'pb-fitem', '<span class="pb-fnum">' + found + '</span><span>' + esc(s.f) + '</span>');
        flist.appendChild(li);
        fcount.textContent = found + '/' + total;
        ctx.setProg(found / total);
        if (found >= total) {
          done = true;
          await wait(500);
          if (!ctx.alive) return;
          const stamp = el('div', 'pb-stamp', 'PHÁT HIỆN<br>TOÀN BỘ!');
          phone.appendChild(stamp);
          ctx.buzz && ctx.buzz([40, 40, 80]);
          await wait(1300);
          if (!ctx.alive) return;
          ctx.win();
        }
      } else {
        pulse(s.node, 'pb-wrong', 700);
        toast('Chỗ này bình thường mà!', 'warn');
        if (!ctx.hit()) done = true;
      }
    }
  };

  /* =========================================================
     3. BOSS – Lõi AI GLITCH
     ========================================================= */
  PUZZLES.boss = (ctx, L) => {
    const MAX_HP = 6;
    const TIME = 8000;
    const pool = shuffle(BOSS_Q);
    let hp = MAX_HP;
    let qi = 0;
    let round = 0;
    let answered = true;
    let timer = null;
    let tStart = 0;

    ctx.onCleanup(() => clearInterval(timer));

    const arena = el('div', 'pb-arena');
    arena.innerHTML =
      '<div class="pb-hp"><span class="pb-hp-lbl">GLITCH</span><div class="pb-hp-bar">' +
      Array.from({ length: MAX_HP }, () => '<i class="pb-hp-seg"></i>').join('') +
      '</div></div>' +
      '<div class="pb-boss-wrap"><div class="pb-boss" data-e="👾">👾</div></div>' +
      '<div class="pb-laser"></div>' +
      '<div class="pb-red"></div>';
    ctx.stage.appendChild(arena);
    const bossEl = $('.pb-boss', arena);
    const laser = $('.pb-laser', arena);
    const redEl = $('.pb-red', arena);
    const hpSegs = $$('.pb-hp-seg', arena);

    const timeBar = el('div', 'pb-time', '<i></i>');
    ctx.stage.appendChild(timeBar);
    const timeFill = $('i', timeBar);

    const card = el('div', 'pb-qcard glass');
    ctx.stage.appendChild(card);

    const btns = el('div', 'pb-tf');
    btns.innerHTML =
      '<button class="btn green pb-tf-btn" data-v="1">✔ ĐÚNG</button>' +
      '<button class="btn red pb-tf-btn" data-v="0">✖ SAI</button>';
    ctx.stage.appendChild(btns);

    const fb = el('div', 'pb-fb');
    ctx.stage.appendChild(fb);

    btns.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || answered) return;
      answer(b.dataset.v === '1');
    });

    function setButtons(on) {
      $$('button', btns).forEach(b => { b.disabled = !on; });
    }

    function renderHp() {
      hpSegs.forEach((s, i) => s.classList.toggle('pb-lost', i >= hp));
    }

    function nextRound() {
      if (!ctx.alive) return;
      const q = pool[qi % pool.length];
      qi++;
      round++;
      fb.innerHTML = '';
      card.innerHTML = '<div class="pb-qnum">ĐÒN TẤN CÔNG #' + round + '</div><div class="pb-qtext">' + esc(q.t) + '</div>';
      pulse(card, 'pb-in');
      card._q = q;
      answered = false;
      setButtons(true);
      tStart = Date.now();
      timeFill.style.width = '100%';
      timeBar.classList.remove('pb-low');
      clearInterval(timer);
      timer = setInterval(tick, 50);
    }

    function tick() {
      if (!ctx.alive) { clearInterval(timer); return; }
      const left = Math.max(0, TIME - (Date.now() - tStart));
      timeFill.style.width = (left / TIME * 100) + '%';
      timeBar.classList.toggle('pb-low', left < 3000);
      if (left <= 0) answer(null);
    }

    async function answer(v) {
      if (answered) return;
      answered = true;
      clearInterval(timer);
      setButtons(false);
      const q = card._q;
      const correct = v === q.a;

      if (correct) {
        ctx.sfx.ok();
        pulse(laser, 'pb-fire', 600);
        await wait(250);
        if (!ctx.alive) return;
        pulse(bossEl, 'pb-hit', 600);
        hp--;
        renderHp();
        ctx.setProg((MAX_HP - hp) / MAX_HP);
        fb.innerHTML = '<div class="explain ok">⚡ Trúng đòn! ' + esc(q.e) + '</div>';
      } else {
        pulse(bossEl, 'pb-attack', 700);
        pulse(redEl, 'pb-pulse', 700);
        fb.innerHTML = '<div class="explain no">' + (v === null ? '⏰ Hết giờ! ' : '💢 GLITCH phản đòn! ') + esc(q.e) + '</div>';
        if (!ctx.hit()) return;
      }

      if (hp <= 0) {
        await wait(700);
        if (!ctx.alive) return;
        await explode();
        if (!ctx.alive) return;
        ctx.win();
        return;
      }

      await wait(1600);
      nextRound();
    }

    async function explode() {
      card.innerHTML = '<div class="pb-qnum">LÕI GLITCH ĐANG SỤP ĐỔ…</div><div class="pb-qtext">BIT đang được khôi phục! 🎉</div>';
      timeFill.style.width = '0%';
      bossEl.classList.add('pb-die');
      const wrap = $('.pb-boss-wrap', arena);
      for (let i = 0; i < 14; i++) {
        const p = el('span', 'pb-shard');
        const ang = (i / 14) * Math.PI * 2;
        const dist = rand(60, 120);
        p.style.setProperty('--x', Math.cos(ang) * dist + 'px');
        p.style.setProperty('--y', Math.sin(ang) * dist + 'px');
        p.style.background = ['#00f0ff', '#ff2bd6', '#f9f871', '#39ff88'][i % 4];
        wrap.appendChild(p);
      }
      ctx.buzz && ctx.buzz([60, 40, 60, 40, 120]);
      await wait(1200);
    }

    renderHp();
    setButtons(false);
    card.innerHTML = '<div class="pb-qnum">CHUẨN BỊ…</div><div class="pb-qtext">GLITCH xuất hiện! Trả lời ĐÚNG/SAI để tấn công.</div>';
    const t0 = setTimeout(nextRound, 1000);
    ctx.onCleanup(() => clearTimeout(t0));
  };
})();
