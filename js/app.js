/* ── 韓文學習 PWA · 主邏輯（階段式解鎖框架） ── */
(function () {
  "use strict";

  // ───────── 進度 (localStorage, v2 per-stage) ─────────
  const STORE_KEY = "hangul_progress_v2";
  const STORE_KEY_V1 = "hangul_progress_v1";

  function today() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function blankState() {
    return {
      v: 2,
      currentStage: 1,
      stages: {}, // { [id]: { learned: [], bestPct: 0 } }
      streak: 0, lastActiveDate: null, secondsToday: 0, secondsDate: null,
    };
  }

  function loadState() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) {}
    if (s && s.v === 2) return Object.assign(blankState(), s);

    // 從 v1 遷移（保留學過字母 + 打卡 + 今日時數；舊的 raw 分數無法轉百分比，bestPct 從 0 起算）
    const base = blankState();
    try {
      const old = JSON.parse(localStorage.getItem(STORE_KEY_V1));
      if (old) {
        base.stages["1"] = { learned: Array.isArray(old.learned) ? old.learned : [], bestPct: 0 };
        base.streak = old.streak || 0;
        base.lastActiveDate = old.lastActiveDate || null;
        base.secondsToday = old.secondsToday || 0;
        base.secondsDate = old.secondsDate || null;
      }
    } catch (e) {}
    return base;
  }
  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  let state = loadState();

  function stageState(id) {
    const k = String(id);
    if (!state.stages[k]) state.stages[k] = { learned: [], bestPct: 0 };
    return state.stages[k];
  }

  // 進入 app：登記今天活躍、處理 streak + 今日秒數重置
  function markActiveToday() {
    const t = today();
    if (state.secondsDate !== t) { state.secondsDate = t; state.secondsToday = 0; }
    if (state.lastActiveDate !== t) {
      if (state.lastActiveDate === yesterdayStr()) state.streak += 1;
      else state.streak = 1;
      state.lastActiveDate = t;
    }
    saveState();
  }

  function markLearned(stageId, key) {
    const ss = stageState(stageId);
    if (!ss.learned.includes(key)) {
      ss.learned.push(key);
      saveState();
      renderHome();
      renderProgress();
    }
  }

  // ───────── 解鎖判斷 ─────────
  function stageDef(id) { return STAGES.find((s) => s.id === id); }
  function isUnlocked(id) {
    const def = stageDef(id);
    if (!def || !def.unlockBy) return true; // Stage 1 永遠開放
    const prev = stageState(def.unlockBy.stage);
    return prev.bestPct >= def.unlockBy.minPct;
  }
  function hasContent(id) {
    const def = stageDef(id);
    return def && !def.locked;
  }
  function stageItemKeys(id) { return STAGE_ITEM_KEYS[id] || []; }
  function stageLearnedCount(id) {
    const keys = stageItemKeys(id);
    if (!keys.length) return 0;
    const set = new Set(stageState(id).learned);
    return keys.filter((k) => set.has(k)).length;
  }

  // 計時：頁面可見時每秒累加，每 10 秒寫入一次
  let tickBuf = 0;
  setInterval(() => {
    if (document.visibilityState !== "visible") return;
    if (state.secondsDate !== today()) { state.secondsDate = today(); state.secondsToday = 0; }
    state.secondsToday += 1;
    tickBuf += 1;
    if (tickBuf >= 10) { tickBuf = 0; saveState(); renderHome(); renderProgress(); }
  }, 1000);
  window.addEventListener("beforeunload", saveState);

  // ───────── TTS (speechSynthesis ko-KR) ─────────
  const synth = window.speechSynthesis;
  let koVoice = null;
  function pickVoice() {
    if (!synth) return;
    const voices = synth.getVoices();
    koVoice =
      voices.find((v) => v.lang && v.lang.toLowerCase() === "ko-kr") ||
      voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("ko")) ||
      null;
    document.getElementById("voiceWarn").classList.toggle("show", !koVoice && voices.length > 0);
  }
  if (synth) {
    pickVoice();
    if (typeof synth.onvoiceschanged !== "undefined") synth.onvoiceschanged = pickVoice;
    setTimeout(pickVoice, 400);
  } else {
    document.getElementById("voiceWarn").classList.add("show");
  }

  function speak(text, slow) {
    if (!synth) return;
    try { synth.cancel(); } catch (e) {}
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    if (koVoice) u.voice = koVoice;
    u.rate = slow ? 0.5 : 0.9;
    u.pitch = 1;
    synth.speak(u);
  }

  // ───────── 導覽（底部 tabbar 依當前階段動態產生） ─────────
  const tabbar = document.getElementById("tabbar");
  const FIXED_HOME = { view: "home", icon: "🏠", label: "首頁" };
  const FIXED_PROGRESS = { view: "progress", icon: "📊", label: "進度" };
  let currentView = "home";

  function renderTabbar() {
    const def = stageDef(state.currentStage) || STAGES[0];
    const tabs = [FIXED_HOME, ...(def.tabs || []), FIXED_PROGRESS];
    tabbar.innerHTML = "";
    tabs.forEach((t) => {
      const b = document.createElement("button");
      b.dataset.view = t.view;
      b.className = t.view === currentView ? "active" : "";
      b.innerHTML = `<span class="ic">${t.icon}</span>${t.label}`;
      b.addEventListener("click", () => showView(t.view));
      tabbar.appendChild(b);
    });
  }

  function showView(name) {
    currentView = name;
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    const el = document.getElementById("view-" + name);
    if (el) el.classList.add("active");
    tabbar.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (name === "quiz") startRound(); // 進測驗 = 開新一輪
  }

  // 進入某階段：切換 currentStage、重建 tabbar、跳到該階段第一個子頁
  function enterStage(id) {
    if (!isUnlocked(id)) { flashLockedToast(id); return; }
    if (!hasContent(id)) { flashComingSoon(id); return; }
    state.currentStage = id;
    saveState();
    const def = stageDef(id);
    renderStageContent(id);
    renderTabbar();
    showView(def.tabs[0].view);
  }

  function renderStageContent(id) {
    if (id === 1) { renderTabs(); renderLetterGrid(); }
    else if (id === 2) { renderVocab(); renderNumbers(); }
    else if (id === 3) { renderGrammar(); }
  }

  // ───────── 首頁：總覽 hero + 關卡地圖 ─────────
  const stageMap = document.getElementById("stageMap");

  function totalItems() {
    return STAGES.filter((s) => hasContent(s.id)).reduce((n, s) => n + stageItemKeys(s.id).length, 0);
  }
  function totalLearned() {
    return STAGES.filter((s) => hasContent(s.id)).reduce((n, s) => n + stageLearnedCount(s.id), 0);
  }
  function bestPctAll() {
    return Math.max(0, ...STAGES.map((s) => stageState(s.id).bestPct));
  }

  function renderHome() {
    document.getElementById("homeMinutes").textContent = Math.floor(state.secondsToday / 60);
    document.getElementById("homeStreak").textContent = state.streak;
    const tot = totalItems(), learned = totalLearned();
    document.getElementById("homeProgress").style.width = (tot ? Math.round((learned / tot) * 100) : 0) + "%";
    document.getElementById("homeLearned").textContent = `已學 ${learned} / ${tot} 項`;
    document.getElementById("homeBest").textContent = `最佳測驗 ${bestPctAll()}%`;

    stageMap.innerHTML = "";
    STAGES.forEach((s) => {
      const unlocked = isUnlocked(s.id);
      const content = hasContent(s.id);
      const keys = stageItemKeys(s.id);
      const learnedN = stageLearnedCount(s.id);
      const pct = keys.length ? Math.round((learnedN / keys.length) * 100) : 0;
      const ss = stageState(s.id);

      const card = document.createElement("button");
      card.className = "stage-card s" + s.id + (unlocked ? "" : " locked") + (!content ? " soon" : "");

      let status;
      if (!unlocked) {
        const by = s.unlockBy;
        status = `<span class="st-lock">🔒 ${stageDef(by.stage).title}測驗達 ${by.minPct}% 解鎖</span>`;
      } else if (!content) {
        status = `<span class="st-soon">內容建置中・即將推出</span>`;
      } else {
        status = `<span class="st-meta">已學 ${learnedN}/${keys.length}・最佳測驗 ${ss.bestPct}%</span>`;
      }

      card.innerHTML =
        `<div class="sc-badge">${unlocked ? (content ? s.badge : "🛠") : "🔒"}</div>` +
        `<div class="sc-body">` +
        `<div class="sc-top"><span class="sc-stage">STAGE ${s.id}</span>` +
        (unlocked && content && ss.bestPct >= UNLOCK_PCT ? `<span class="sc-pass">✓ 達標</span>` : ``) + `</div>` +
        `<div class="sc-title">${s.title}</div>` +
        `<div class="sc-desc">${s.desc}</div>` +
        (unlocked && content ? `<div class="sc-bar"><i style="width:${pct}%"></i></div>` : ``) +
        `<div class="sc-status">${status}</div>` +
        `</div>`;
      card.addEventListener("click", () => enterStage(s.id));
      stageMap.appendChild(card);
    });
  }

  let toastTimer = null;
  function showToast(msg) {
    let t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }
  function flashLockedToast(id) {
    const by = stageDef(id).unlockBy;
    showToast(`🔒 先把 ${stageDef(by.stage).title} 測驗練到 ${by.minPct}% 才解鎖喔`);
  }
  function flashComingSoon() { showToast("🛠 這一關內容正在建置，敬請期待！"); }

  // ───────── Stage 1：字母學習 ─────────
  const letterTabs = document.getElementById("letterTabs");
  const letterGrid = document.getElementById("letterGrid");
  let currentGroup = LETTER_GROUPS[0].id;

  function renderTabs() {
    letterTabs.innerHTML = "";
    LETTER_GROUPS.forEach((g) => {
      const c = document.createElement("button");
      c.className = "chip" + (g.id === currentGroup ? " active" : "");
      c.textContent = `${g.title} ${g.count}`;
      c.addEventListener("click", () => selectGroup(g.id));
      letterTabs.appendChild(c);
    });
  }
  function selectGroup(id) { currentGroup = id; renderTabs(); renderLetterGrid(); }
  function renderLetterGrid() {
    const g = LETTER_GROUPS.find((x) => x.id === currentGroup);
    letterGrid.innerHTML = "";
    g.letters.forEach((l) => {
      const card = document.createElement("button");
      card.className = "letter-card" + (stageState(1).learned.includes(l.ch) ? " learned" : "");
      card.innerHTML = `<span class="lc-ch">${l.ch}</span><span class="lc-rom">${l.rom}</span>`;
      card.addEventListener("click", () => {
        card.classList.add("speaking");
        setTimeout(() => card.classList.remove("speaking"), 400);
        speak(l.say, false);
        markLearned(1, l.ch);
        openSheet({ ch: l.ch, rom: l.rom, say: l.say });
      });
      letterGrid.appendChild(card);
    });
  }

  // 詳情彈窗（字母 / 單字共用）
  const sheet = document.getElementById("sheet");
  let sheetItem = null;
  function openSheet(item) {
    sheetItem = item;
    document.getElementById("sheetCh").textContent = item.ch;
    document.getElementById("sheetRom").textContent = item.rom;
    const zhEl = document.getElementById("sheetZh");
    if (item.zh) { zhEl.textContent = item.zh; zhEl.style.display = "block"; }
    else { zhEl.style.display = "none"; }
    sheet.classList.add("show");
  }
  function closeSheet() { sheet.classList.remove("show"); }
  sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });
  document.getElementById("sheetSpeak").addEventListener("click", () => sheetItem && speak(sheetItem.say, false));
  document.getElementById("sheetSlow").addEventListener("click", () => sheetItem && speak(sheetItem.say, true));

  // ───────── Stage 1：組合練習 ─────────
  const comboConsEl = document.getElementById("comboCons");
  const comboVowEl = document.getElementById("comboVow");
  const comboSyl = document.getElementById("comboSyl");
  const comboFormula = document.getElementById("comboFormula");
  const comboSpeak = document.getElementById("comboSpeak");
  const comboSlow = document.getElementById("comboSlow");
  let selCons = null, selVow = null, comboResult = null;

  function buildJamoRow(el, list, type) {
    el.innerHTML = "";
    list.forEach((j) => {
      const b = document.createElement("button");
      b.className = "jamo";
      b.textContent = j;
      b.addEventListener("click", () => {
        if (type === "cons") selCons = j; else selVow = j;
        [...comboConsEl.children].forEach((c) => c.classList.toggle("sel", c.textContent === selCons));
        [...comboVowEl.children].forEach((c) => c.classList.toggle("sel", c.textContent === selVow));
        updateCombo();
      });
      el.appendChild(b);
    });
  }
  function updateCombo() {
    if (selCons && selVow) {
      comboResult = composeSyllable(selCons, selVow);
      if (comboResult) {
        comboSyl.textContent = comboResult;
        comboSyl.classList.remove("empty");
        comboFormula.textContent = `${selCons} + ${selVow} = ${comboResult}`;
        comboSpeak.disabled = false; comboSlow.disabled = false;
        speak(comboResult, false);
        return;
      }
    }
    comboSyl.textContent = selCons || selVow ? (selCons || "") + (selVow || "") : "？";
    comboSyl.classList.add("empty");
    comboFormula.textContent = selCons || selVow ? "再選一個" : "選子音 + 母音";
    comboSpeak.disabled = true; comboSlow.disabled = true;
  }
  comboSpeak.addEventListener("click", () => comboResult && speak(comboResult, false));
  comboSlow.addEventListener("click", () => comboResult && speak(comboResult, true));
  document.getElementById("comboRandom").addEventListener("click", () => {
    selCons = COMBO_CONSONANTS[Math.floor(Math.random() * COMBO_CONSONANTS.length)];
    selVow = COMBO_VOWELS[Math.floor(Math.random() * COMBO_VOWELS.length)];
    [...comboConsEl.children].forEach((c) => c.classList.toggle("sel", c.textContent === selCons));
    [...comboVowEl.children].forEach((c) => c.classList.toggle("sel", c.textContent === selVow));
    updateCombo();
  });

  // ───────── Stage 2：單字 ─────────
  const vocabThemes = document.getElementById("vocabThemes");
  function renderVocab() {
    vocabThemes.innerHTML = "";
    const learned = new Set(stageState(2).learned);
    STAGE2.vocab.forEach((t) => {
      const sec = document.createElement("div");
      sec.className = "vocab-theme";
      sec.innerHTML = `<h4 class="theme-title">${t.emoji} ${t.title}</h4>`;
      const grid = document.createElement("div");
      grid.className = "word-grid";
      t.words.forEach((w) => {
        const card = document.createElement("button");
        card.className = "word-card" + (learned.has(w.ko) ? " learned" : "");
        card.innerHTML = `<span class="wc-ko">${w.ko}</span><span class="wc-zh">${w.zh}</span><span class="wc-rom">${w.rom}</span>`;
        card.addEventListener("click", () => {
          card.classList.add("speaking");
          setTimeout(() => card.classList.remove("speaking"), 400);
          speak(w.say, false);
          markLearned(2, w.ko);
          card.classList.add("learned");
          openSheet({ ch: w.ko, rom: w.rom, zh: w.zh, say: w.say });
        });
        grid.appendChild(card);
      });
      sec.appendChild(grid);
      vocabThemes.appendChild(sec);
    });
  }

  // ───────── Stage 2：數字 ─────────
  function renderNumberGrid(el, list) {
    const learned = new Set(stageState(2).learned);
    el.innerHTML = "";
    list.forEach((n) => {
      const key = "num:" + n.sys + ":" + n.val;
      const card = document.createElement("button");
      card.className = "num-card" + (learned.has(key) ? " learned" : "");
      card.innerHTML = `<span class="nc-val">${n.val}</span><span class="nc-ko">${n.ko}</span><span class="nc-rom">${n.rom}</span>`;
      card.addEventListener("click", () => {
        card.classList.add("speaking");
        setTimeout(() => card.classList.remove("speaking"), 400);
        speak(n.say, false);
        markLearned(2, key);
        card.classList.add("learned");
        openSheet({ ch: n.ko, rom: n.rom, zh: n.val, say: n.say });
      });
      el.appendChild(card);
    });
  }
  function renderNumbers() {
    renderNumberGrid(document.getElementById("numSino"), STAGE2.numbers.sino.map((n) => ({ ...n, sys: "sino" })));
    renderNumberGrid(document.getElementById("numNative"), STAGE2.numbers.native.map((n) => ({ ...n, sys: "native" })));
  }

  // ───────── Stage 3：文法 ─────────
  const grammarList = document.getElementById("grammarList");
  function renderGrammar() {
    const learned = new Set(stageState(3).learned);
    grammarList.innerHTML = "";
    STAGE3.grammar.forEach((g) => {
      const card = document.createElement("div");
      card.className = "gram-card" + (learned.has(g.id) ? " learned" : "");
      const exHtml = g.ex.map((e, i) =>
        `<button class="gram-ex" data-i="${i}">` +
        `<span class="ge-ko">${e.ko}</span>` +
        `<span class="ge-zh">${e.zh}</span>` +
        `<span class="ge-rom">${e.rom}</span>` +
        `<span class="ge-play">🔊</span></button>`
      ).join("");
      card.innerHTML =
        `<div class="gram-title">${g.title}</div>` +
        `<div class="gram-point">${g.point}</div>` +
        `<div class="gram-ex-list">${exHtml}</div>`;
      card.querySelectorAll(".gram-ex").forEach((b) => {
        b.addEventListener("click", () => {
          const e = g.ex[Number(b.dataset.i)];
          b.classList.add("speaking");
          setTimeout(() => b.classList.remove("speaking"), 400);
          speak(e.say, false);
          markLearned(3, g.id);
          card.classList.add("learned");
        });
      });
      grammarList.appendChild(card);
    });
  }

  // ───────── 測驗（依當前階段，每輪 10 題，達標解鎖下一階） ─────────
  const ROUND_LEN = 10;
  let quizMode = "see"; // see = 看字選意/音, hear = 聽音選字
  let round = { stage: 1, n: 0, score: 0, item: null, answered: false, finished: false };

  const elQNum = document.getElementById("qNum");
  const elQLen = document.getElementById("qLen");
  const elQScore = document.getElementById("qScore");
  const elQPrompt = document.getElementById("qPrompt");
  const elQSub = document.getElementById("qSub");
  const elQOptions = document.getElementById("qOptions");
  const elQFeedback = document.getElementById("qFeedback");
  const elQStageLabel = document.getElementById("qStageLabel");
  const quizPlay = document.getElementById("quizPlay");
  const quizResult = document.getElementById("quizResult");

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function disp(it, mode) { return mode === "hear" ? it.ch : it.ans; }
  function pickDistractors(pool, answer, mode) {
    const seen = new Set([disp(answer, mode)]);
    const out = [];
    for (const it of shuffle(pool)) {
      const d = disp(it, mode);
      if (seen.has(d)) continue;
      seen.add(d); out.push(it);
      if (out.length === 3) break;
    }
    return out;
  }

  function buildQueue(stage) {
    const def = stageDef(stage);
    const pool = def.quizType === "choice" ? (QUIZ_CHOICE[stage] || []) : (QUIZ_ITEMS[stage] || []);
    return shuffle(pool).slice(0, Math.min(ROUND_LEN, pool.length));
  }

  function startRound() {
    const stage = state.currentStage;
    const def = stageDef(stage);
    const isChoice = def.quizType === "choice";
    round = { stage, type: def.quizType, queue: buildQueue(stage), n: 0, score: 0, item: null, answered: false, finished: false, len: 0 };
    round.len = round.queue.length;
    elQStageLabel.textContent = `STAGE ${def.id} · ${def.title}`;
    document.getElementById("modeSee").textContent = stage === 1 ? "看字選音" : "看字選意";
    document.querySelector(".mode-toggle").style.display = isChoice ? "none" : "flex";
    if (isChoice) quizMode = "see";
    quizResult.classList.remove("show");
    quizPlay.style.display = "";
    elQLen.textContent = round.len;
    newQuestion();
  }

  function newQuestion() {
    if (round.n >= round.len) return endRound();
    round.answered = false;
    document.getElementById("qNext").disabled = true;
    elQFeedback.textContent = "";
    elQFeedback.className = "quiz-feedback";
    const item = round.queue[round.n];
    round.item = item;
    elQOptions.innerHTML = "";
    if (round.type === "choice") renderChoiceQuestion(item);
    else renderMatchQuestion(item);
    elQNum.textContent = round.n + 1;
    elQScore.textContent = round.score;
  }

  function renderMatchQuestion(answer) {
    const items = QUIZ_ITEMS[round.stage];
    const distractors = pickDistractors(items.filter((l) => l.key !== answer.key), answer, quizMode);
    const options = shuffle([answer, ...distractors]);
    if (quizMode === "see") {
      elQPrompt.textContent = answer.ch;
      elQPrompt.style.fontSize = round.stage === 1 ? "84px" : "clamp(34px, 11vw, 52px)";
      elQSub.textContent = round.stage === 1 ? "選出正確的羅馬拼音" : "選出正確的中文意思";
      speak(answer.say, false);
      options.forEach((o) => {
        const b = document.createElement("button");
        b.className = "opt"; b.textContent = o.ans;
        if (round.stage === 1) b.style.fontSize = "18px";
        b.addEventListener("click", () => answerMatch(b, o, answer));
        elQOptions.appendChild(b);
      });
    } else {
      elQPrompt.textContent = "🔊";
      elQPrompt.style.fontSize = "60px";
      elQSub.textContent = round.stage === 1 ? "聽發音，選出正確的字母" : "聽發音，選出正確的韓文";
      speak(answer.say, false);
      options.forEach((o) => {
        const b = document.createElement("button");
        b.className = "opt"; b.textContent = o.ch; b.style.fontFamily = "var(--font-kr)";
        b.addEventListener("click", () => answerMatch(b, o, answer));
        elQOptions.appendChild(b);
      });
    }
  }

  function renderChoiceQuestion(item) {
    elQPrompt.textContent = item.prompt;
    elQPrompt.style.fontSize = "clamp(22px, 6.5vw, 30px)";
    elQSub.textContent = item.hint;
    shuffle(item.options).forEach((opt) => {
      const b = document.createElement("button");
      b.className = "opt"; b.textContent = opt; b.style.fontFamily = "var(--font-kr)"; b.style.fontSize = "20px";
      b.addEventListener("click", () => answerChoice(b, opt, item));
      elQOptions.appendChild(b);
    });
  }

  function answerMatch(btn, chosen, answer) {
    if (round.answered) return;
    round.answered = true;
    round.n += 1;
    const correct = chosen.key === answer.key;
    if (correct) {
      btn.classList.add("correct");
      round.score += 1;
      elQFeedback.textContent = "答對了！ 🎉"; elQFeedback.className = "quiz-feedback ok";
    } else {
      btn.classList.add("wrong");
      elQFeedback.textContent = `答案是 ${answer.ch}（${answer.ans}）`; elQFeedback.className = "quiz-feedback no";
      [...elQOptions.children].forEach((c) => { if (c.textContent === disp(answer, quizMode)) c.classList.add("correct"); });
    }
    [...elQOptions.children].forEach((c) => (c.disabled = true));
    elQScore.textContent = round.score;
    document.getElementById("qNext").disabled = false;
    markLearned(round.stage, answer.key);
  }

  function answerChoice(btn, opt, item) {
    if (round.answered) return;
    round.answered = true;
    round.n += 1;
    const correct = opt === item.answer;
    if (correct) {
      btn.classList.add("correct");
      round.score += 1;
      elQFeedback.textContent = `答對了！ 🎉 ${item.explain}`; elQFeedback.className = "quiz-feedback ok";
    } else {
      btn.classList.add("wrong");
      elQFeedback.textContent = `正解：${item.answer}　${item.explain}`; elQFeedback.className = "quiz-feedback no";
      [...elQOptions.children].forEach((c) => { if (c.textContent === item.answer) c.classList.add("correct"); });
    }
    [...elQOptions.children].forEach((c) => (c.disabled = true));
    elQScore.textContent = round.score;
    document.getElementById("qNext").disabled = false;
    speak(item.say, false);
    markLearned(round.stage, item.key);
  }

  function endRound() {
    round.finished = true;
    const pct = round.len ? Math.round((round.score / round.len) * 100) : 0;
    const ss = stageState(round.stage);
    const prevBest = ss.bestPct;
    if (pct > ss.bestPct) { ss.bestPct = pct; saveState(); }
    renderHome(); renderProgress();

    // 是否（首次）解鎖下一階段
    const next = stageDef(round.stage + 1);
    let unlockMsg = "";
    if (next && next.unlockBy && next.unlockBy.stage === round.stage) {
      const justUnlocked = prevBest < next.unlockBy.minPct && ss.bestPct >= next.unlockBy.minPct;
      if (justUnlocked && hasContent(next.id)) unlockMsg = `🎉 達標！已解鎖 STAGE ${next.id}「${next.title}」`;
      else if (justUnlocked && !hasContent(next.id)) unlockMsg = `🎉 達標！STAGE ${next.id} 內容建置中，敬請期待`;
    }

    const pass = pct >= UNLOCK_PCT;
    quizPlay.style.display = "none";
    quizResult.classList.add("show");
    quizResult.innerHTML =
      `<div class="qr-emoji">${pass ? "🏆" : pct >= 60 ? "👍" : "💪"}</div>` +
      `<div class="qr-pct">${pct}<span>%</span></div>` +
      `<div class="qr-sub">答對 ${round.score} / ${ROUND_LEN} 題</div>` +
      (pass ? `<div class="qr-pass">達 ${UNLOCK_PCT}% 解鎖標準！</div>`
            : `<div class="qr-fail">再練一下，達 ${UNLOCK_PCT}% 就能解鎖下一關</div>`) +
      (unlockMsg ? `<div class="qr-unlock">${unlockMsg}</div>` : ``) +
      `<div class="sheet-actions" style="margin-top:16px">` +
      `<button class="btn btn-primary" id="qrAgain">再來一輪</button>` +
      `<button class="btn btn-soft" id="qrHome">回關卡地圖</button></div>`;
    document.getElementById("qrAgain").addEventListener("click", startRound);
    document.getElementById("qrHome").addEventListener("click", () => showView("home"));
  }

  document.getElementById("qNext").addEventListener("click", newQuestion);
  document.getElementById("qReplay").addEventListener("click", () => round.item && speak(round.item.say, false));
  document.querySelectorAll(".mode-toggle .chip").forEach((c) => {
    c.addEventListener("click", () => {
      quizMode = c.dataset.mode;
      document.querySelectorAll(".mode-toggle .chip").forEach((x) => x.classList.toggle("active", x === c));
      startRound();
    });
  });

  // ───────── 進度頁（總覽 + 各階段） ─────────
  function renderProgress() {
    document.getElementById("stLearned").textContent = totalLearned();
    document.getElementById("stBest").textContent = bestPctAll() + "%";
    document.getElementById("stStreak").textContent = state.streak;
    document.getElementById("stMinutes").textContent = Math.floor(state.secondsToday / 60);

    const gp = document.getElementById("groupProgress");
    gp.innerHTML = "";
    STAGES.forEach((s) => {
      const content = hasContent(s.id);
      const unlocked = isUnlocked(s.id);
      const keys = stageItemKeys(s.id);
      const learnedN = stageLearnedCount(s.id);
      const pct = keys.length ? Math.round((learnedN / keys.length) * 100) : 0;
      const ss = stageState(s.id);
      const row = document.createElement("div");
      row.className = "gp-row" + (unlocked ? "" : " dim");
      const right = !unlocked ? "🔒 未解鎖"
        : !content ? "建置中"
        : `${learnedN} / ${keys.length}・測驗 ${ss.bestPct}%`;
      row.innerHTML =
        `<div class="gp-top"><span>STAGE ${s.id} · ${s.title}</span><span>${right}</span></div>` +
        (unlocked && content ? `<div class="gp-bar"><i style="width:${pct}%"></i></div>` : ``);
      gp.appendChild(row);
    });
  }
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("確定要清除所有進度嗎？")) {
      state = blankState();
      saveState(); markActiveToday();
      renderStageContent(state.currentStage);
      renderHome(); renderProgress(); renderTabbar();
      showView("home");
    }
  });

  // ───────── 跟讀 (Web Speech Recognition · 加分，graceful degrade) ─────────
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const shRes = document.getElementById("shRes");
  let shTarget = null;
  function pickShadowTarget() {
    const c = COMBO_CONSONANTS[Math.floor(Math.random() * COMBO_CONSONANTS.length)];
    const v = COMBO_VOWELS[Math.floor(Math.random() * COMBO_VOWELS.length)];
    shTarget = composeSyllable(c, v) || "가";
  }
  if (!SR) {
    document.getElementById("shadowBox").style.display = "none";
  } else {
    document.getElementById("shPlay").addEventListener("click", () => {
      pickShadowTarget();
      shRes.textContent = "請唸：" + shTarget;
      shRes.style.color = "var(--ink-soft)";
      speak(shTarget, false);
    });
    document.getElementById("shRec").addEventListener("click", () => {
      if (!shTarget) pickShadowTarget();
      const rec = new SR();
      rec.lang = "ko-KR"; rec.interimResults = false; rec.maxAlternatives = 3;
      shRes.textContent = "🎤 聽你唸…"; shRes.style.color = "var(--ink-soft)";
      rec.onresult = (ev) => {
        const heard = ev.results[0][0].transcript.replace(/\s/g, "");
        const ok = heard.includes(shTarget) || shTarget.includes(heard[0] || "_");
        shRes.textContent = ok ? `👍 很接近！我聽到「${heard}」` : `再試一次～我聽到「${heard}」(目標 ${shTarget})`;
        shRes.style.color = ok ? "var(--good)" : "var(--bad)";
      };
      rec.onerror = () => { shRes.textContent = "沒聽清楚，再試一次"; shRes.style.color = "var(--ink-soft)"; };
      try { rec.start(); } catch (e) { shRes.textContent = "麥克風無法啟動"; }
    });
  }

  // ───────── 初始化 ─────────
  markActiveToday();
  if (!isUnlocked(state.currentStage) || !hasContent(state.currentStage)) state.currentStage = 1;
  renderStageContent(state.currentStage);
  buildJamoRow(comboConsEl, COMBO_CONSONANTS, "cons");
  buildJamoRow(comboVowEl, COMBO_VOWELS, "vow");
  updateCombo();
  renderHome();
  renderProgress();
  renderTabbar();
  showView("home");
})();
