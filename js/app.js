/* ── 韓文學習 PWA · 主邏輯 ── */
(function () {
  "use strict";

  // ───────── 進度 (localStorage) ─────────
  const STORE_KEY = "hangul_progress_v1";
  const TOTAL_LETTERS = ALL_LETTERS.length; // 40

  function today() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function loadState() {
    let s;
    try { s = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { s = {}; }
    return Object.assign(
      { learned: [], bestScore: 0, streak: 0, lastActiveDate: null, secondsToday: 0, secondsDate: null },
      s
    );
  }
  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  let state = loadState();

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

  function markLearned(ch) {
    if (!state.learned.includes(ch)) {
      state.learned.push(ch);
      saveState();
      renderProgress();
      renderHome();
    }
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

  // ───────── 導覽 ─────────
  const tabbar = document.getElementById("tabbar");
  function showView(name) {
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    const el = document.getElementById("view-" + name);
    if (el) el.classList.add("active");
    tabbar.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  tabbar.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) showView(b.dataset.view);
  });

  // ───────── 首頁 ─────────
  const groupGrid = document.getElementById("groupGrid");
  function renderHome() {
    document.getElementById("homeMinutes").textContent = Math.floor(state.secondsToday / 60);
    document.getElementById("homeStreak").textContent = state.streak;
    const learnedCount = state.learned.length;
    document.getElementById("homeProgress").style.width = Math.round((learnedCount / TOTAL_LETTERS) * 100) + "%";
    document.getElementById("homeLearned").textContent = `已學 ${learnedCount} / ${TOTAL_LETTERS} 字母`;
    document.getElementById("homeBest").textContent = `最佳測驗 ${state.bestScore} 分`;

    groupGrid.innerHTML = "";
    LETTER_GROUPS.forEach((g) => {
      const done = g.letters.filter((l) => state.learned.includes(l.ch)).length;
      const pct = Math.round((done / g.letters.length) * 100);
      const btn = document.createElement("button");
      btn.className = "group-card g-" + g.id;
      btn.innerHTML =
        `<div><div class="gc-ch">${g.letters[0].ch}${g.letters[1] ? g.letters[1].ch : ""}</div>` +
        `<div class="gc-title">${g.title}</div>` +
        `<div class="gc-sub">${done}/${g.letters.length} · ${g.subtitle}</div></div>` +
        `<div class="gc-bar"><i style="width:${pct}%"></i></div>`;
      btn.addEventListener("click", () => { showView("letters"); selectGroup(g.id); });
      groupGrid.appendChild(btn);
    });
  }

  // ───────── 字母學習 ─────────
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
  function selectGroup(id) {
    currentGroup = id;
    renderTabs();
    renderLetterGrid();
  }
  function renderLetterGrid() {
    const g = LETTER_GROUPS.find((x) => x.id === currentGroup);
    letterGrid.innerHTML = "";
    g.letters.forEach((l) => {
      const card = document.createElement("button");
      card.className = "letter-card" + (state.learned.includes(l.ch) ? " learned" : "");
      card.innerHTML = `<span class="lc-ch">${l.ch}</span><span class="lc-rom">${l.rom}</span>`;
      card.addEventListener("click", () => {
        card.classList.add("speaking");
        setTimeout(() => card.classList.remove("speaking"), 400);
        speak(l.say, false);
        markLearned(l.ch);
        openSheet(l);
      });
      letterGrid.appendChild(card);
    });
  }

  // 字母詳情彈窗
  const sheet = document.getElementById("sheet");
  let sheetLetter = null;
  function openSheet(l) {
    sheetLetter = l;
    document.getElementById("sheetCh").textContent = l.ch;
    document.getElementById("sheetRom").textContent = l.rom;
    sheet.classList.add("show");
  }
  function closeSheet() { sheet.classList.remove("show"); }
  sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });
  document.getElementById("sheetSpeak").addEventListener("click", () => sheetLetter && speak(sheetLetter.say, false));
  document.getElementById("sheetSlow").addEventListener("click", () => sheetLetter && speak(sheetLetter.say, true));

  // ───────── 組合練習 ─────────
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

  // ───────── 測驗 ─────────
  let quizMode = "see"; // see = 看字選音, hear = 聽音選字
  let quizSession = { score: 0, total: 0, answered: false, correct: null };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function newQuestion() {
    quizSession.answered = false;
    document.getElementById("qNext").disabled = true;
    document.getElementById("qFeedback").textContent = "";
    document.getElementById("qFeedback").className = "quiz-feedback";

    const answer = ALL_LETTERS[Math.floor(Math.random() * ALL_LETTERS.length)];
    quizSession.correct = answer;
    // 干擾項：同一型態優先（區分 rom 唯一）
    const pool = ALL_LETTERS.filter((l) => l.ch !== answer.ch);
    const distractors = shuffle(pool).slice(0, 3);
    const options = shuffle([answer, ...distractors]);

    const qPrompt = document.getElementById("qPrompt");
    const qSub = document.getElementById("qSub");
    const qOptions = document.getElementById("qOptions");
    qOptions.innerHTML = "";

    if (quizMode === "see") {
      qPrompt.textContent = answer.ch;
      qPrompt.style.fontSize = "84px";
      qSub.textContent = "選出正確的羅馬拼音";
      speak(answer.say, false);
      options.forEach((o) => {
        const b = document.createElement("button");
        b.className = "opt"; b.textContent = o.rom;
        b.addEventListener("click", () => answerQuestion(b, o, answer, qOptions));
        qOptions.appendChild(b);
      });
    } else {
      qPrompt.textContent = "🔊";
      qPrompt.style.fontSize = "60px";
      qSub.textContent = "聽發音，選出正確的字母";
      speak(answer.say, false);
      options.forEach((o) => {
        const b = document.createElement("button");
        b.className = "opt"; b.textContent = o.ch; b.style.fontFamily = "var(--font-kr)";
        b.addEventListener("click", () => answerQuestion(b, o, answer, qOptions));
        qOptions.appendChild(b);
      });
    }
    document.getElementById("qNum").textContent = quizSession.total + 1;
  }
  function answerQuestion(btn, chosen, answer, container) {
    if (quizSession.answered) return;
    quizSession.answered = true;
    quizSession.total += 1;
    const fb = document.getElementById("qFeedback");
    const correct = chosen.ch === answer.ch;
    if (correct) {
      btn.classList.add("correct");
      quizSession.score += 1;
      fb.textContent = "答對了！ 🎉"; fb.className = "quiz-feedback ok";
    } else {
      btn.classList.add("wrong");
      fb.textContent = `答案是 ${answer.ch}（${answer.rom}）`; fb.className = "quiz-feedback no";
      [...container.children].forEach((c) => {
        if ((quizMode === "see" && c.textContent === answer.rom) || (quizMode === "hear" && c.textContent === answer.ch))
          c.classList.add("correct");
      });
    }
    [...container.children].forEach((c) => (c.disabled = true));
    document.getElementById("qScore").textContent = quizSession.score;
    document.getElementById("qTotal").textContent = quizSession.total;
    document.getElementById("qNext").disabled = false;
    markLearned(answer.ch);
    if (quizSession.score > state.bestScore) { state.bestScore = quizSession.score; saveState(); renderHome(); renderProgress(); }
  }
  document.getElementById("qNext").addEventListener("click", newQuestion);
  document.getElementById("qReplay").addEventListener("click", () => quizSession.correct && speak(quizSession.correct.say, false));
  document.querySelectorAll(".mode-toggle .chip").forEach((c) => {
    c.addEventListener("click", () => {
      quizMode = c.dataset.mode;
      document.querySelectorAll(".mode-toggle .chip").forEach((x) => x.classList.toggle("active", x === c));
      newQuestion();
    });
  });

  // ───────── 進度頁 ─────────
  function renderProgress() {
    document.getElementById("stLearned").textContent = state.learned.length;
    document.getElementById("stBest").textContent = state.bestScore;
    document.getElementById("stStreak").textContent = state.streak;
    document.getElementById("stMinutes").textContent = Math.floor(state.secondsToday / 60);
    const gp = document.getElementById("groupProgress");
    gp.innerHTML = "";
    LETTER_GROUPS.forEach((g) => {
      const done = g.letters.filter((l) => state.learned.includes(l.ch)).length;
      const pct = Math.round((done / g.letters.length) * 100);
      const row = document.createElement("div");
      row.className = "gp-row";
      row.innerHTML =
        `<div class="gp-top"><span>${g.title}</span><span>${done} / ${g.letters.length}</span></div>` +
        `<div class="gp-bar"><i style="width:${pct}%"></i></div>`;
      gp.appendChild(row);
    });
  }
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("確定要清除所有進度嗎？")) {
      state = { learned: [], bestScore: 0, streak: 0, lastActiveDate: null, secondsToday: 0, secondsDate: null };
      saveState(); markActiveToday();
      renderHome(); renderProgress(); renderLetterGrid();
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
    document.getElementById("shadowBox").style.display = "none"; // 不支援就隱藏，不報錯
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
  renderHome();
  renderTabs();
  renderLetterGrid();
  buildJamoRow(comboConsEl, COMBO_CONSONANTS, "cons");
  buildJamoRow(comboVowEl, COMBO_VOWELS, "vow");
  updateCombo();
  renderProgress();
  newQuestion();
})();
