/* 天亮之前：三關共用的紀錄與因果規則（第一關、第二關、第三關與自動測試都讀這一個檔）
   規則全部寫在這裡，畫面上的每一句結果都從這裡算出來，確保前後一致。 */
(function (root) {
  const KEY = 'tianliang_story_v1';
  const blankItems = () => ({ 罐頭: 0, 繃帶: 0, 木柴: 0 });

  // ---------- 存讀：網址參數優先（跨裝置、測試用），其次瀏覽器暫存 ----------
  function encode(st) { return btoa(unescape(encodeURIComponent(JSON.stringify(st)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function decode(s) { try { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch (e) { return null; } }
  function load() {
    try { const q = new URLSearchParams(location.search).get('s'); if (q) { const st = decode(q); if (st) return st; } } catch (e) {}
    try { const t = localStorage.getItem(KEY); if (t) return JSON.parse(t); } catch (e) {}
    return null;
  }
  function save(st) { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} return st; }
  function link(path, st) { return path + '?s=' + encode(st); }

  // ---------- 第一關結束：把夜裡的結果整理成紀錄 ----------
  // S：第一關的遊戲狀態（bag、ate、home、caught、tookCouple）
  function fromLevel1(S) {
    const carried = !S.caught; // 被發現的話背包丟了
    const items = blankItems();
    if (carried) for (const it of S.bag) if (it in items) items[it]++;
    return {
      v: 1,
      L1: {
        med: carried && S.bag.includes('藥'), // 退燒藥有沒有帶回家給妹妹吃
        ateSelf: !!S.ate, // 第 37 天的罐頭是自己吃的
        late: !S.home && !S.caught, // 天亮了沒回家，躲到隔天晚上
        caught: !!S.caught,
        couple: S.tookCouple === true ? 'took' : S.tookCouple === false ? 'left' : 'none',
      },
      home: items, // 家裡的東西（第一關帶回來的）
    };
  }

  // ---------- 妹妹的體力 ----------
  function strength(st) {
    let s = 1;
    const a = st.L1, b = st.L2, c = st.L3;
    const why = ['起點 1'];
    if (a.med) { s += 1; why.push('吃到退燒藥 +1'); }
    if (!a.ateSelf) { s += 1; why.push('第 37 天的罐頭給了妹妹 +1'); }
    if (a.late) { s -= 1; why.push('第一關天亮才回家 −1'); }
    if (b) {
      if (b.cansHome >= 1) { s += 1; why.push('第二關回家時家裡還有罐頭 +1'); }
      if (b.late) { s -= 1; why.push('第二關天亮才回家 −1'); }
    }
    if (c && c.gaveLastCan) { s -= 1; why.push('第三關把最後一個罐頭給了別人 −1'); }
    return { value: Math.max(0, Math.min(4, s)), why };
  }

  // ---------- 第三關：誰來求救（照順序，第一個符合的就是） ----------
  function knocker(st) {
    if (st.L2 && st.L2.route === 'rob') return 'child';
    if (st.L1.couple === 'took') return 'oldwoman';
    return 'neighbor';
  }
  // 幫他要付出什麼；home：家裡現有的東西；abx：抗生素盒數
  const NEEDS = { child: { 抗生素: 1 }, oldwoman: { 罐頭: 1, 木柴: 1 }, neighbor: { 繃帶: 1, 抗生素: 1 } };
  function canHelp(who, st) {
    const need = NEEDS[who], have = { ...st.home, 抗生素: st.abx };
    const lack = Object.keys(need).filter((k) => (have[k] || 0) < need[k]);
    return { ok: lack.length === 0, lack };
  }
  // 幫了之後：扣掉東西，回傳新的紀錄
  function applyHelp(who, st) {
    const need = NEEDS[who], out = JSON.parse(JSON.stringify(st));
    for (const k in need) { if (k === '抗生素') out.abx -= need[k]; else out.home[k] -= need[k]; }
    out.L3 = { who, helped: true, gaveLastCan: (need['罐頭'] || 0) > 0 && out.home['罐頭'] === 0 };
    return out;
  }

  // ---------- 結局 ----------
  function ending(st) {
    const str = strength(st), abx = st.abx;
    const gaveMedAway = st.L3 && st.L3.helped && NEEDS[st.L3.who]['抗生素'] && abx === 0;
    if (abx >= 1 && str.value >= 1) return { alive: true, line: '妹妹吃了抗生素。第三天，她終於坐起來，喝了半碗熱水。', str };
    let reason;
    if (abx < 1 && gaveMedAway) reason = '那盒藥，我給了門外的人。';
    else if (abx < 1) reason = '肺炎沒有藥。';
    else reason = '藥來得太晚，她太虛弱了。';
    return { alive: false, line: `妹妹最後沒有撐過去。${reason}我已經盡力了……對不起。`, str };
  }

  // ---------- 戰後證詞：把三關的選擇寫成一段話 ----------
  function testimony(st) {
    const a = st.L1, b = st.L2, c = st.L3, out = [];
    out.push(a.ateSelf ? '第 37 天，最後一個罐頭，我自己吃了。' : '第 37 天，最後一個罐頭，我給了妹妹。');
    if (a.couple === 'took') out.push('那天夜裡，我拿走了對面四樓老先生的心臟藥。');
    else if (a.couple === 'left') out.push('那天夜裡，我把老先生的心臟藥放回了桌上。');
    if (b) {
      if (b.route === 'trade') out.push('第 38 天，我用家裡的東西，跟藥局地下室的女人換了一盒抗生素。');
      else if (b.route === 'steal') out.push('第 38 天，我趁藥局地下室的女人睡著，偷走了她備用的那盒藥。');
      else if (b.route === 'rob') out.push('第 38 天，我推開藥局地下室的女人，搶走了她的藥。她跌下了樓梯。');
      else if (b.route === 'fled') out.push('第 38 天，我想趁藥局地下室的女人睡著時偷她的藥，被她發現，空手逃走了。');
      else if (b.route === 'leave') out.push('第 38 天，我在藥局地下室什麼也沒拿，空手回家。');
      else out.push('第 38 天，我沒能走到藥局的地下室。');
      if (b.shot) out.push('回家的路上，狙擊手的子彈逼我丟下了背包。');
    }
    if (c) {
      const who = { child: '那個女人的孩子', oldwoman: '對面四樓的老太太', neighbor: '中彈的鄰居' }[c.who];
      if (c.who === 'neighbor') out.push(c.helped ? '第 39 天夜裡，中彈的鄰居倒在門外喊救命，我出去把他拖了進來，分了他一盒藥。' : '第 39 天夜裡，中彈的鄰居倒在門外喊救命，我沒有出去。');
      else out.push(c.helped ? `第 39 天夜裡，${who}來敲門，我開了門。` : `第 39 天夜裡，${who}來敲門，我沒有開門。`);
    }
    return out;
  }

  root.STORY = { KEY, blankItems, encode, decode, load, save, link, fromLevel1, strength, knocker, NEEDS, canHelp, applyHelp, ending, testimony };
  if (typeof module !== 'undefined') module.exports = root.STORY;
})(typeof window !== 'undefined' ? window : globalThis);
