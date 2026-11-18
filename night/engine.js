/* 天亮之前：第二、三關共用的遊戲引擎
   橫向捲動的剖面場景：走路、上下樓、躲、搜、手機按鈕、背景圖與照亮圖的合成、人物動作圖、卡片、聲音。
   每一關只要給：場景資料（樓梯、躲藏點、可搜的東西）、圖檔、以及這一關自己的邏輯（hooks）。 */
'use strict';
const ENG = (function () {
  const cv = document.getElementById('cv'), g = cv.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const HF = 3.25, CLIMB = 1.5;
  let C = null; // 這一關的設定
  let W = 0, H = 0, DPR = 1;
  const L = { top: 66, bot: 132, u: 30, vh: 0, vhm: 0, vwm: 0, vt: 0, fh: 0 };
  const CAM = { left: null, top: null };
  const IMG = {};
  const S = { phase: 'title', t: 0, night: 240, dawn: 240, p: null, bag: [], cap: 4, spot: 0, spotBy: '', boxes: [], home: false, caught: false, say: null };
  const IN = { l: false, r: false };
  const FX = [];

  // ---------- 畫面大小與座標 ----------
  function resize() {
    DPR = Math.min(3, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; g.setTransform(DPR, 0, 0, DPR, 0, 0);
    const ah = H - L.top - L.bot; const s = Math.min(W / C.visW, 60); // 手機直式：畫面寬度看 visW 公尺，左右跟著人捲動
    L.u = s; L.vwm = Math.min(W / s, C.view.x1 - C.view.x0); L.ix = (W - L.vwm * s) / 2; L.vh = Math.min(ah, (C.view.y1 - C.view.y0) * s); L.vt = L.top + (ah - L.vh) / 2; L.vhm = L.vh / s; L.fh = HF * s;
  }
  const X = (x) => L.ix + (x - CAM.left) * L.u, WY = (y) => L.vt + (CAM.top - y) * L.u, BASE = (f) => WY(f * HF), FY = (f) => BASE(f) - L.fh;
  function camUpdate(snap) {
    const p = S.p; const fy = p.climb > 0 ? climbY(p) / HF : p.f; const v = C.view;
    const wantL = clamp(p.x - L.vwm / 2, v.x0, v.x1 - L.vwm), wantT = clamp((C.camY ? C.camY(fy) : fy * HF + HF * 0.55) + L.vhm / 2, v.y0 + L.vhm, v.y1);
    if (CAM.left === null || snap) { CAM.left = wantL; CAM.top = wantT; } else { CAM.left = lerp(CAM.left, wantL, 0.12); CAM.top = lerp(CAM.top, wantT, 0.12); }
  }
  function bgPart(img, x0, y0, x1, y1, ctx = g) { const b = C.bgv, k = b.pxm; ctx.drawImage(img, (x0 - b.x0) * k, (b.y1 - y1) * k, (x1 - x0) * k, (y1 - y0) * k, X(x0), WY(y1), (x1 - x0) * L.u, (y1 - y0) * L.u); }
  const viewRect = () => [CAM.left, CAM.top - L.vhm, CAM.left + L.vwm, CAM.top];

  // ---------- 聲音（輕柔：腳步、翻找、心跳、風；沒有爆炸聲） ----------
  const AU = { ctx: null, noise: null };
  function audioInit() {
    if (AU.ctx) { AU.ctx.resume(); return; }
    try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return; }
    const c = AU.ctx; const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; AU.noise = buf;
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380; const gn = c.createGain(); gn.gain.value = 0.05; src.connect(f).connect(gn).connect(c.destination); src.start();
  }
  function tick(freq, len, vol, type = 'bandpass') { const c = AU.ctx; if (!c) return; const s = c.createBufferSource(); s.buffer = AU.noise; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = 1.2; const gn = c.createGain(); const t = c.currentTime; gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + len); s.connect(f).connect(gn).connect(c.destination); s.start(t, Math.random()); s.stop(t + len + 0.05); }
  function thump(vol) { const c = AU.ctx; if (!c) return; const o = c.createOscillator(); o.frequency.value = 52; const gn = c.createGain(); const t = c.currentTime; gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); o.connect(gn).connect(c.destination); o.start(t); o.stop(t + 0.3); }

  // ---------- 卡片與提示 ----------
  let cardKeys = null;
  function card(html, keys, low) { const el = $('card'); el.innerHTML = `<div class="sheet">${html}</div>`; el.hidden = false; el.classList.toggle('low', !!low); cardKeys = keys;
    el.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); if (b.disabled) return; audioInit(); const f = keys[b.dataset.k]; if (f) f(); })); }
  function hideCard() { $('card').hidden = true; $('card').innerHTML = ''; cardKeys = null; }
  function toast(t, ms = 1600) { const el = $('toast'); el.textContent = t; el.style.opacity = 1; clearTimeout(el._t); el._t = setTimeout(() => (el.style.opacity = 0), ms); }
  function say(text, x, f, dur = 2) { S.say = { text, x, f, t: dur }; }

  // ---------- 樓梯、躲、搜 ----------
  const near = (f, x, r) => S.p.f === f && Math.abs(S.p.x - x) < r;
  const climbK = (p) => 1 - p.climb / CLIMB;
  function climbY(p) { const k = climbK(p); const t = k < 0.15 ? 0 : (k - 0.15) / 0.85; return lerp(p.climbFrom, p.climbTo, t) * HF; }
  const upZone = (s) => s.dir < 0 ? [s.x - 0.05, s.xb + 0.3] : [s.xb - 0.3, s.x + 0.05], downZone = (s) => s.dir < 0 ? [s.xt - 0.4, s.xt + 0.5] : [s.xt - 0.5, s.xt + 0.4];
  function addLoot(it) { if (S.bag.length >= S.cap) { toast(`背包滿了（${S.cap} 格），${it}帶不走`); return false; } S.bag.push(it); return true; }
  function context() {
    const p = S.p; if (S.phase !== 'night' || p.climb > 0) return null;
    if (p.search) return { k: 'stop', t: '停手', s: '進度會留著' };
    if (p.hide) return { k: 'unhide', t: '出來' };
    const pre = C.hooks.context && C.hooks.context(p); if (pre) return pre;
    if (C.exit && near(C.exit.f, C.exit.x, 0.5)) return { k: 'home', t: '回家', s: S.bag.length ? `帶著 ${S.bag.length} 樣東西` : '空手' };
    for (const s of C.stairs) { const u = upZone(s), d = downZone(s); if (p.f === s.f && p.x >= u[0] && p.x <= u[1]) return { k: 'up', t: '上樓', st: s }; if (p.f === s.f + 1 && p.x >= d[0] && p.x <= d[1]) return { k: 'down', t: '下樓', st: s }; }
    for (const b of S.boxes) if (!b.done && near(b.f, b.x, 0.45)) { const lock = C.hooks.boxLock && C.hooks.boxLock(b); if (lock) return { k: 'none', t: lock.t, s: lock.s, off: true }; return { k: 'search', t: '搜', s: b.n, b }; }
    for (const h of C.hides) if (near(h.f, h.x, 0.42)) return { k: 'hide', t: '躲', s: h.n, h };
    const post = C.hooks.context2 && C.hooks.context2(p); if (post) return post;
    return null;
  }
  function act() {
    audioInit(); if (S.phase !== 'night') return; const c = context(); if (!c || c.off) return; const p = S.p;
    if (C.hooks.act && C.hooks.act(c)) return;
    if (c.k === 'home') { S.home = true; end('home'); }
    else if (c.k === 'up' || c.k === 'down') { const st = c.st, up = c.k === 'up'; p.climb = CLIMB; p.climbFrom = p.f; p.climbTo = up ? st.f + 1 : st.f; p.cx0 = p.x; p.cx1 = up ? st.xt : st.xb; p.cxa = up ? st.xb : st.xt; p.face = Math.sign(p.cx1 - p.cxa); p.vx = 0; tick(500, 0.12, 0.25); }
    else if (c.k === 'search') p.search = { b: c.b, t: c.b.prog || 0, need: c.b.need || 2.4 };
    else if (c.k === 'stop') { p.search.b.prog = p.search.t; p.search = null; }
    else if (c.k === 'hide') { p.hide = c.h; p.hx = p.x; p.vx = 0; tick(700, 0.1, 0.12); toast(`你躲在${c.h.n}，屏住呼吸`); }
    else if (c.k === 'unhide') { p.x = p.hx; p.hide = false; }
  }
  function end(why) { if (S.phase === 'end') return; S.phase = 'end'; $('ctl').hidden = true; IN.l = IN.r = false; C.hooks.end(why); }

  // ---------- 更新 ----------
  function update(dt) {
    if (C.hooks.pre && C.hooks.pre(dt)) return;
    if (S.phase !== 'night') return;
    S.t += dt; S.dt = dt; S.dawn = Math.max(0, S.night - S.t);
    if (S.dawn <= 0) { end('dawn'); return; }
    const p = S.p;
    const want = !p.hide && p.climb <= 0 && !p.search && !p.lock ? (IN.r ? 1 : 0) - (IN.l ? 1 : 0) : 0;
    p.vx = lerp(p.vx, want * (C.speed || 1.7), Math.min(1, dt * 10)); if (want) p.face = want;
    const fr = C.floors[p.f]; p.x = clamp(p.x + p.vx * dt, fr[0], fr[1]);
    if (Math.abs(p.vx) > 0.3) { p.walk += dt * 9; if (Math.sin(p.walk) * Math.sin(p.walk - dt * 9) < 0) tick(900 + Math.random() * 300, 0.06, 0.12); }
    if (p.climb > 0) { p.climb -= dt; p.walk += dt * 7; const k = climbK(p); p.x = k < 0.15 ? lerp(p.cx0, p.cxa, k / 0.15) : lerp(p.cxa, p.cx1, (k - 0.15) / 0.85); if (k > 0.55 && p.f !== p.climbTo) p.f = p.climbTo; if (Math.sin(p.walk) * Math.sin(p.walk - dt * 7) < 0) tick(600 + Math.random() * 200, 0.07, 0.1); if (p.climb <= 0) p.climb = 0; }
    if (p.hide) p.x = lerp(p.x, p.hide.x + (p.hide.dx || 0), Math.min(1, dt * 8));
    if (p.search) { p.search.t += dt; if (Math.random() < dt * 6) tick(2200 + Math.random() * 1500, 0.08, 0.1, 'highpass'); if (C.hooks.searching) C.hooks.searching(p.search, dt);
      if (p.search && p.search.t >= p.search.need) { const b = p.search.b; b.done = true; p.search = null; if (C.hooks.found && C.hooks.found(b)) {} else if (!b.loot.length) toast(`${b.n}：空的`); else { const got = []; for (const it of b.loot) if (addLoot(it)) got.push(it); if (got.length) toast(`找到：${got.join('、')}`); } } }
    for (let i = FX.length - 1; i >= 0; i--) { FX[i].t += dt; if (FX[i].t > (FX[i].life || 0.9)) FX.splice(i, 1); }
    if (S.say) { S.say.t -= dt; if (S.say.t <= 0) S.say = null; }
    if (C.hooks.update) C.hooks.update(dt);
    if (S.phase !== 'night') return;
    const seen = C.hooks.seen ? C.hooks.seen(dt) : null;
    if (seen && seen.v > 0) { S.spot += seen.v * dt; S.spotBy = seen.by; } else S.spot = Math.max(0, S.spot - dt * 0.7);
    if (S.spot > 0.25) { AU.hbT = (AU.hbT || 0) - dt; if (AU.hbT <= 0) { thump(0.25 + S.spot * 0.3); AU.hbT = 0.75 - S.spot * 0.35; } }
    if (S.spot >= 1) { if (C.hooks.spotted && C.hooks.spotted()) S.spot = 0; else { S.caught = true; end('caught'); } }
  }

  // ---------- 人物動作圖：先畫到小畫布、依亮暗壓暗，再貼上 ----------
  const SC = document.createElement('canvas'), SCG = SC.getContext('2d');
  function sprite(sheet, info, name, frame, x, base, dir, dark = 0, tint) {
    const A = info.anims[name]; if (!A || !sheet.complete || !sheet.naturalWidth) return null; const i = Math.floor(frame) % A.n; const k = L.u / info.pxm; const w = info.cw * k, h = info.ch * k;
    const pw = Math.ceil(w * DPR), ph = Math.ceil(h * DPR); if (SC.width < pw || SC.height < ph) { SC.width = Math.max(SC.width, pw); SC.height = Math.max(SC.height, ph); }
    SCG.globalCompositeOperation = 'source-over'; SCG.clearRect(0, 0, SC.width, SC.height); SCG.drawImage(sheet, i * info.cw, A.row * info.ch, info.cw, info.ch, 0, 0, pw, ph);
    if (dark > 0 || tint) { SCG.globalCompositeOperation = 'source-atop'; SCG.fillStyle = tint || `rgba(6,9,18,${dark})`; SCG.fillRect(0, 0, pw, ph); }
    g.save(); g.translate(x, base + info.foot * L.u); g.scale(dir, 1); g.drawImage(SC, 0, 0, pw, ph, -info.ox * L.u, -h, w, h); g.restore();
    const ln = A.lens && A.lens[i]; return ln ? [x + dir * (ln[0] * k - info.ox * L.u), base + info.foot * L.u - h + ln[1] * k] : null;
  }
  function player() { const p = S.p; let y = BASE(p.f), x = X(p.x), nm = 'p_idle', fr = 0;
    if (p.climb > 0) { y = WY(climbY(p)); nm = climbK(p) < 0.15 ? 'p_walk' : 'p_climb'; fr = p.walk * 1.1; }
    else if (p.anim) { nm = p.anim; fr = p.walk; } else if (p.hide || p.search) nm = 'p_crouch'; else if (Math.abs(p.vx) > 0.3) { nm = 'p_walk'; fr = p.walk * 1.1; }
    if (C.theme.glow && !p.hide) { g.save(); g.shadowColor = C.theme.glow; g.shadowBlur = 7; }
    sprite(IMG.spr, C.spr, nm, fr, x, y, p.face, p.hide ? 0.55 : C.theme.pdark || 0, C.theme.ptint); if (C.theme.glow && !p.hide) g.restore(); }

  // ---------- 光：照到的地方換成「照亮版」 ----------
  const LC = document.createElement('canvas'), LCG = LC.getContext('2d');
  function lit(img, maskFn, clip) {
    if (LC.width !== cv.width || LC.height !== cv.height) { LC.width = cv.width; LC.height = cv.height; }
    LCG.setTransform(DPR, 0, 0, DPR, 0, 0); LCG.globalCompositeOperation = 'source-over'; LCG.clearRect(0, 0, W, H); const out = maskFn(LCG);
    LCG.globalCompositeOperation = 'source-in'; bgPart(img, ...(clip || viewRect()), LCG); g.drawImage(LC, 0, 0, W, H); return out;
  }
  function glowMask(m, x, y, r, a) { const gr = m.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); m.fillStyle = gr; m.fillRect(x - r, y - r, r * 2, r * 2); }
  function playerGlow(m, a = 0.45) { const p = S.p; glowMask(m, X(p.x), (p.climb > 0 ? WY(climbY(p)) : BASE(p.f)) - L.fh * 0.32, L.u * 1.3, p.hide ? 0.12 : a); }

  // ---------- 畫面 ----------
  function marker(x, y, t) { const r = 12; g.fillStyle = C.theme.mk || '#e8e1d0'; g.strokeStyle = C.theme.ink; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); g.fillStyle = C.theme.ink; g.font = '900 16px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x, y + 1); g.textBaseline = 'alphabetic'; }
  function label(x, y, t) { g.font = '900 14px ' + C.theme.font; g.textAlign = 'center'; const w = g.measureText(t).width + 12; g.fillStyle = C.theme.mk || '#e8e1d0'; g.fillRect(x - w / 2, y - 15, w, 21); g.strokeStyle = C.theme.ink; g.lineWidth = 2; g.strokeRect(x - w / 2, y - 15, w, 21); g.fillStyle = C.theme.ink; g.fillText(t, x, y + 1); }
  function labels() {
    const LB = [], p = S.p;
    for (const b of S.boxes) if (p.f === b.f && Math.abs(p.x - b.x) < 2.2 && !b.hidden) { g.globalAlpha = b.done ? 0.45 : 1; marker(X(b.x), BASE(b.f) - L.fh * 0.78, b.done ? '✕' : '?'); g.globalAlpha = 1;
      if (!b.done && b.prog > 0 && !(p.search && p.search.b === b)) { const x0 = X(b.x) - 16, y0 = BASE(b.f) - L.fh * 0.78 + 16; g.fillStyle = 'rgba(22,24,27,0.85)'; g.fillRect(x0, y0, 32, 6); g.fillStyle = '#e8e1d0'; g.fillRect(x0, y0, 32 * Math.min(1, b.prog / (b.need || 2.4)), 6); g.strokeStyle = '#e8e1d0'; g.lineWidth = 1.5; g.strokeRect(x0, y0, 32, 6); } }
    if (!p.hide) for (const h of C.hides) if (near(h.f, h.x, 1.4)) LB.push([X(h.x), BASE(h.f) - L.fh * 0.78, '可以躲']);
    if (p.climb <= 0 && !p.hide) for (const st of C.stairs) { const u = upZone(st), d = downZone(st); if (near(st.f, st.xb, 2.4)) LB.push([X((u[0] + u[1]) / 2), BASE(st.f) - L.fh * 0.78, '▲ 上樓']); if (near(st.f + 1, st.xt, 2.4)) LB.push([X((d[0] + d[1]) / 2), BASE(st.f + 1) - L.fh * 0.78, '▼ 下樓']); }
    if (C.exit && near(C.exit.f, C.exit.x, 2.4)) LB.push([X(C.exit.x), BASE(C.exit.f) - L.fh * 0.78, '回家']);
    if (C.hooks.labels) C.hooks.labels(LB);
    LB.sort((a, b) => a[0] - b[0]); for (let i = 1; i < LB.length; i++) if (Math.abs(LB[i][0] - LB[i - 1][0]) < 64 && Math.abs(LB[i][1] - LB[i - 1][1]) < 24) LB[i][1] = LB[i - 1][1] - 25;
    for (const [x, y, t] of LB) label(x, y, t);
  }
  function fxText() { for (const fx of FX) { const life = fx.life || 0.9, k = fx.t / life; g.save(); g.globalAlpha = (1 - k * k) * (fx.a || 1); g.translate(X(fx.x), WY(fx.y + k * 0.35)); g.rotate(fx.rot || -0.08); g.font = `900 ${Math.round(L.u * (fx.size || 0.38))}px ` + C.theme.font; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 4; g.strokeStyle = C.theme.fxStroke || '#16181b'; g.strokeText(fx.text, 0, 0); g.fillStyle = C.theme.fxFill || '#e8e1d0'; g.fillText(fx.text, 0, 0); g.restore(); } }
  function bubble() { if (!S.say) return; const sx = X(S.say.x), sy = BASE(S.say.f) - L.u * 2.0; g.font = `900 ${Math.round(Math.max(15, L.u * 0.44))}px ` + C.theme.font; const tw = g.measureText(S.say.text).width, bw = tw + 26, bh = Math.max(34, L.u * 0.95); const bx = clamp(sx - bw * 0.4, 8, W - bw - 8), by = sy - bh;
    g.fillStyle = C.theme.bubble || '#f4f0e6'; g.strokeStyle = C.theme.ink; g.lineWidth = 3; g.beginPath(); g.ellipse(bx + bw / 2, by + bh / 2, bw / 2, bh / 2, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(sx - 6, by + bh - 4); g.lineTo(sx + 2, sy + L.u * 0.25); g.lineTo(sx + 10, by + bh - 6); g.closePath(); g.fill(); g.beginPath(); g.moveTo(sx - 6, by + bh - 2); g.lineTo(sx + 2, sy + L.u * 0.25); g.lineTo(sx + 10, by + bh - 4); g.stroke();
    g.fillStyle = C.theme.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(S.say.text, bx + bw / 2, by + bh / 2 + 1); g.textBaseline = 'alphabetic'; }
  function hud() {
    const y = 12, th = C.theme;
    if (th.vignette) { const vg = g.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.32, W / 2, H * 0.45, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${th.vignette})`); g.fillStyle = vg; g.fillRect(0, 0, W, H); }
    g.fillStyle = th.hudBg; g.fillRect(10, y, W - 20, 50); g.strokeStyle = th.ink; g.lineWidth = 3; g.strokeRect(10, y, W - 20, 50);
    g.fillStyle = th.ink; g.textAlign = 'left'; g.font = '900 20px ' + th.font; g.textBaseline = 'middle';
    const s = Math.ceil(S.dawn); g.fillText(S.phase === 'night' || S.phase === 'end' || S.phase === 'dlg' ? `天亮前 ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : C.dayLabel, 22, y + 25);
    g.textAlign = 'right'; g.font = '900 17px ' + th.font; g.fillText(`${S.bag.length ? S.bag.join(' ') : '背包空的'}（${S.bag.length}/${S.cap}）`, W - 22, y + 25);
    if (S.spot > 0.02) { g.fillStyle = '#b5402f'; g.fillRect(10, y + 50, (W - 20) * Math.min(1, S.spot), 8); g.font = '900 15px ' + th.font; g.textAlign = 'left'; g.fillStyle = th.warnInk || th.hudBg; g.fillText(C.spotText ? C.spotText(S.spotBy) : '快被發現了', 14, y + 74); }
    const p = S.p; if (p && p.search) { const k = p.search.t / p.search.need; const x0 = X(p.x) - 28, y0 = BASE(p.f) - L.fh * 0.86; g.fillStyle = th.hudBg; g.fillRect(x0, y0, 56, 10); g.fillStyle = th.ink; g.fillRect(x0, y0, 56 * k, 10); g.strokeStyle = th.ink; g.lineWidth = 2; g.strokeRect(x0, y0, 56, 10); }
    g.textBaseline = 'alphabetic';
  }
  function draw() {
    g.fillStyle = C.theme.bg0 || '#0a0d14'; g.fillRect(0, 0, W, H);
    if (S.phase === 'title' || S.phase === 'day') { if (IMG.bg.complete && IMG.bg.naturalWidth) { const iw = IMG.bg.width, ih = IMG.bg.height, k = Math.max(W / iw, H / ih) * 1.0; const fx = C.titleFocus || 0.5; g.drawImage(IMG.bg, (W - iw * k) * fx, (H - ih * k) / 2, iw * k, ih * k); } g.fillStyle = 'rgba(8,10,16,0.35)'; g.fillRect(0, 0, W, H); hud(); return; }
    camUpdate(); if (!IMG.bg.complete || !IMG.bgl.complete) { hud(); return; }
    bgPart(IMG.bg, ...viewRect());
    if (C.hooks.drawBack) C.hooks.drawBack();
    const sh = lit(IMG.bgl, (m) => { playerGlow(m, C.theme.glowA || 0.45); return C.hooks.lightMask ? C.hooks.lightMask(m) : null; });
    if (C.hooks.drawNPC) C.hooks.drawNPC();
    player(); const p = S.p;
    if (p.hide && IMG.fg.complete && C.hideBox[p.hide.k]) { const b = C.hideBox[p.hide.k], y0 = p.hide.f * HF; const box = [p.hide.x + b[0], y0 - 0.05, p.hide.x + b[1], y0 + b[2]]; bgPart(IMG.fg, ...box); if (IMG.fgl.complete) lit(IMG.fgl, (m) => { playerGlow(m); if (C.hooks.lightMask) C.hooks.lightMask(m); }, box); g.save(); g.globalAlpha = 0.22; player(); g.restore(); }
    if (C.hooks.drawFront) C.hooks.drawFront(sh);
    fxText(); bubble();
    if (S.phase === 'night' && !C.clean) labels();
    if (p.hide) { const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H); }
    if (C.hooks.overlay) C.hooks.overlay();
    hud();
  }

  // ---------- 手機按鈕 ----------
  function bindHold(id, k) { const el = $(id); const on = (e) => { e.preventDefault(); audioInit(); IN[k] = true; el.classList.add('on'); }; const off = (e) => { e.preventDefault(); IN[k] = false; el.classList.remove('on'); }; el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off); }
  function renderAct() { const c = S.phase === 'night' ? context() : null; const b = $('bAct'); const html = c ? `${c.t}${c.s ? `<small>${c.s}</small>` : ''}` : '　'; if (b._h !== html) { b._h = html; b.innerHTML = html; } b.classList.toggle('off', !c || !!c.off); }

  function start(cfg) {
    C = cfg; S.night = S.dawn = cfg.night || 240;
    for (const [k, f] of Object.entries(cfg.imgs)) { IMG[k] = new Image(); IMG[k].src = f; }
    S.p = { f: cfg.start.f, x: cfg.start.x, vx: 0, face: 1, hide: false, climb: 0, climbTo: 0, search: null, walk: 0 };
    S.boxes = cfg.boxes.map((b) => ({ ...b, done: false }));
    resize(); addEventListener('resize', resize);
    bindHold('bL', 'l'); bindHold('bR', 'r');
    $('bAct').addEventListener('pointerdown', (e) => { e.preventDefault(); act(); });
    addEventListener('keydown', (e) => { if (e.repeat) return; if (e.code === 'ArrowLeft' || e.code === 'KeyA') IN.l = true; if (e.code === 'ArrowRight' || e.code === 'KeyD') IN.r = true; if (['Space', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS', 'Enter'].includes(e.code)) { e.preventDefault(); act(); } });
    addEventListener('keyup', (e) => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') IN.l = false; if (e.code === 'ArrowRight' || e.code === 'KeyD') IN.r = false; });
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    let last = performance.now();
    function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); draw(); renderAct(); requestAnimationFrame(loop); }
    requestAnimationFrame(loop);
  }
  function startNight() { hideCard(); S.phase = 'night'; S.t = 0; $('ctl').hidden = false; camUpdate(true); }

  return { S, IN, FX, L, CAM, IMG, HF, X, WY, BASE, FY, g, clamp, lerp, near, climbY, climbK, addLoot, context, act, end, start, startNight, card, hideCard, toast, say, tick, thump, audioInit, sprite, glowMask, bgPart, viewRect, lit, get W() { return W; }, get H() { return H; }, get DPR() { return DPR; }, update, draw };
})();
