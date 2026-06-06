// 韓文字母權威清單 — 完全依照 SPEC §7，勿增刪、勿改拼音。
// ch = 字母本體（顯示用）；rom = 羅馬拼音對照；
// say = 發音示範音節（TTS 用）。單一 jamo 丟給 speechSynthesis 會被唸成「字母名稱」
//       (例 ㄴ→니은，兩個音)，故改唸合法音節示範「音值」：
//       母音配無聲初聲 ㅇ（ㅏ→아）；子音配中性母音 ㅡ 凸顯音值（ㄴ→느）；
//       ㅇ 特例唸「응」示範其收尾 ng 音。勿改這些 say 值（韓文事實）。

const LETTER_GROUPS = [
  {
    id: "vowel",
    title: "基本母音",
    subtitle: "Basic Vowels",
    count: 10,
    letters: [
      { ch: "ㅏ", rom: "a", say: "아" },
      { ch: "ㅑ", rom: "ya", say: "야" },
      { ch: "ㅓ", rom: "eo", say: "어" },
      { ch: "ㅕ", rom: "yeo", say: "여" },
      { ch: "ㅗ", rom: "o", say: "오" },
      { ch: "ㅛ", rom: "yo", say: "요" },
      { ch: "ㅜ", rom: "u", say: "우" },
      { ch: "ㅠ", rom: "yu", say: "유" },
      { ch: "ㅡ", rom: "eu", say: "으" },
      { ch: "ㅣ", rom: "i", say: "이" },
    ],
  },
  {
    id: "consonant",
    title: "基本子音",
    subtitle: "Basic Consonants",
    count: 14,
    letters: [
      { ch: "ㄱ", rom: "g/k", say: "그" },
      { ch: "ㄴ", rom: "n", say: "느" },
      { ch: "ㄷ", rom: "d/t", say: "드" },
      { ch: "ㄹ", rom: "r/l", say: "르" },
      { ch: "ㅁ", rom: "m", say: "므" },
      { ch: "ㅂ", rom: "b/p", say: "브" },
      { ch: "ㅅ", rom: "s", say: "스" },
      { ch: "ㅇ", rom: "(無聲/收尾 ng)", say: "응" },
      { ch: "ㅈ", rom: "j", say: "즈" },
      { ch: "ㅊ", rom: "ch", say: "츠" },
      { ch: "ㅋ", rom: "k", say: "크" },
      { ch: "ㅌ", rom: "t", say: "트" },
      { ch: "ㅍ", rom: "p", say: "프" },
      { ch: "ㅎ", rom: "h", say: "흐" },
    ],
  },
  {
    id: "double",
    title: "雙子音 / 緊音",
    subtitle: "Double / Tense",
    count: 5,
    letters: [
      { ch: "ㄲ", rom: "kk", say: "끄" },
      { ch: "ㄸ", rom: "tt", say: "뜨" },
      { ch: "ㅃ", rom: "pp", say: "쁘" },
      { ch: "ㅆ", rom: "ss", say: "쓰" },
      { ch: "ㅉ", rom: "jj", say: "쯔" },
    ],
  },
  {
    id: "compound",
    title: "複合母音",
    subtitle: "Compound Vowels",
    count: 11,
    letters: [
      { ch: "ㅐ", rom: "ae", say: "애" },
      { ch: "ㅒ", rom: "yae", say: "얘" },
      { ch: "ㅔ", rom: "e", say: "에" },
      { ch: "ㅖ", rom: "ye", say: "예" },
      { ch: "ㅘ", rom: "wa", say: "와" },
      { ch: "ㅙ", rom: "wae", say: "왜" },
      { ch: "ㅚ", rom: "oe", say: "외" },
      { ch: "ㅝ", rom: "wo", say: "워" },
      { ch: "ㅞ", rom: "we", say: "웨" },
      { ch: "ㅟ", rom: "wi", say: "위" },
      { ch: "ㅢ", rom: "ui", say: "의" },
    ],
  },
];

// ── 音節組合用：Unicode 正規組字 (초성 + 중성 [+ 종성]) ──
// 초성(initial) 19 個，順序固定（Unicode 規範）
const CHOSEONG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ",
  "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];
// 중성(medial) 21 個，順序固定（Unicode 規範）
const JUNGSEONG = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ",
  "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ",
];

// 組合練習可選的子音（基本 14 + 雙子音 5）與母音（基本 10 + 複合 11）
const COMBO_CONSONANTS = ["ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ","ㄲ","ㄸ","ㅃ","ㅆ","ㅉ"];
const COMBO_VOWELS = ["ㅏ","ㅑ","ㅓ","ㅕ","ㅗ","ㅛ","ㅜ","ㅠ","ㅡ","ㅣ","ㅐ","ㅒ","ㅔ","ㅖ","ㅘ","ㅙ","ㅚ","ㅝ","ㅞ","ㅟ","ㅢ"];

// 把初聲 + 中聲組成一個音節 (無終聲)。回傳 null 表示無法組合。
function composeSyllable(initial, medial) {
  const ci = CHOSEONG.indexOf(initial);
  const vi = JUNGSEONG.indexOf(medial);
  if (ci < 0 || vi < 0) return null;
  const code = 0xac00 + (ci * 21 + vi) * 28; // 終聲 index = 0
  return String.fromCharCode(code);
}

// 所有字母攤平（給測驗用），帶上所屬組別
const ALL_LETTERS = LETTER_GROUPS.flatMap((g) =>
  g.letters.map((l) => ({ ...l, group: g.id }))
);

// ════════════════════════════════════════════════════════════
//  階段式學習框架（資料驅動）— 新增階段＝改這份資料，不動引擎
//  unlockBy: 解鎖條件（前一階段測驗最佳百分比 ≥ minPct）；null = 永遠開放
//  locked: 內容尚未建置（顯示「即將推出」）
//  tabs: 進入該階段時底部導覽的中段按鈕（首頁/進度固定）
// ════════════════════════════════════════════════════════════
const UNLOCK_PCT = 90; // 解鎖門檻（測驗達此百分比解鎖下一階）

const STAGES = [
  {
    id: 1, title: "發音地基", subtitle: "Hangul · 字母拼音", badge: "가",
    desc: "母音・子音・複合母音，共 40 字母", unlockBy: null,
    tabs: [
      { view: "letters", icon: "가", label: "字母" },
      { view: "combo", icon: "➕", label: "組合" },
      { view: "quiz", icon: "✏️", label: "測驗" },
    ],
  },
  {
    id: 2, title: "生存單字 & 數字", subtitle: "Survival Words & Numbers", badge: "단어",
    desc: "問候・家庭・食物・地點・時間 + 兩套數字", unlockBy: { stage: 1, minPct: UNLOCK_PCT },
    tabs: [
      { view: "vocab", icon: "📖", label: "單字" },
      { view: "numbers", icon: "🔢", label: "數字" },
      { view: "quiz", icon: "✏️", label: "測驗" },
    ],
  },
  { id: 3, title: "句子骨架（文法）", subtitle: "Sentence Grammar", badge: "문법",
    desc: "助詞・基本語尾・造簡單句", unlockBy: { stage: 2, minPct: UNLOCK_PCT }, locked: true },
  { id: 4, title: "日常會話", subtitle: "Daily Conversation", badge: "회화",
    desc: "情境對話・聽力・角色扮演", unlockBy: { stage: 3, minPct: UNLOCK_PCT }, locked: true },
  { id: 5, title: "進階・敬語 / TOPIK", subtitle: "Advanced (選配)", badge: "고급",
    desc: "敬語體系・長文閱讀・TOPIK 備考", unlockBy: { stage: 4, minPct: UNLOCK_PCT }, locked: true },
];

// ── Stage 2 內容（韓文事實型資料，已校對；勿腦補增刪、勿改拼音）──
// rom = 修正羅馬字參考；zh = 中文意思；say = TTS 唸的內容（整詞，自然發音）。
const STAGE2 = {
  // 數字：韓語有兩套系統。漢字數（닐/이/삼…）用於日期、金額、電話、分鐘；
  //       純韓數（하나/둘/셋…）用於數量、年齡、點鐘。
  numbers: {
    sino: [
      { ko: "영 / 공", rom: "yeong / gong", val: "0", say: "영" },
      { ko: "일", rom: "il", val: "1", say: "일" },
      { ko: "이", rom: "i", val: "2", say: "이" },
      { ko: "삼", rom: "sam", val: "3", say: "삼" },
      { ko: "사", rom: "sa", val: "4", say: "사" },
      { ko: "오", rom: "o", val: "5", say: "오" },
      { ko: "육", rom: "yuk", val: "6", say: "육" },
      { ko: "칠", rom: "chil", val: "7", say: "칠" },
      { ko: "팔", rom: "pal", val: "8", say: "팔" },
      { ko: "구", rom: "gu", val: "9", say: "구" },
      { ko: "십", rom: "sip", val: "10", say: "십" },
      { ko: "백", rom: "baek", val: "100", say: "백" },
      { ko: "천", rom: "cheon", val: "1,000", say: "천" },
      { ko: "만", rom: "man", val: "10,000", say: "만" },
    ],
    native: [
      { ko: "하나", rom: "hana", val: "1", say: "하나" },
      { ko: "둘", rom: "dul", val: "2", say: "둘" },
      { ko: "셋", rom: "set", val: "3", say: "셋" },
      { ko: "넷", rom: "net", val: "4", say: "넷" },
      { ko: "다섯", rom: "daseot", val: "5", say: "다섯" },
      { ko: "여섯", rom: "yeoseot", val: "6", say: "여섯" },
      { ko: "일곱", rom: "ilgop", val: "7", say: "일곱" },
      { ko: "여덟", rom: "yeodeol", val: "8", say: "여덟" },
      { ko: "아홉", rom: "ahop", val: "9", say: "아홉" },
      { ko: "열", rom: "yeol", val: "10", say: "열" },
      { ko: "스물", rom: "seumul", val: "20", say: "스물" },
      { ko: "서른", rom: "seoreun", val: "30", say: "서른" },
    ],
  },
  vocab: [
    {
      id: "greet", title: "問候 & 客套", emoji: "👋",
      words: [
        { ko: "안녕하세요", rom: "annyeonghaseyo", zh: "你好（敬語）", say: "안녕하세요" },
        { ko: "안녕", rom: "annyeong", zh: "嗨／再見（半語）", say: "안녕" },
        { ko: "감사합니다", rom: "gamsahamnida", zh: "謝謝（正式）", say: "감사합니다" },
        { ko: "고마워요", rom: "gomawoyo", zh: "謝謝", say: "고마워요" },
        { ko: "죄송합니다", rom: "joesonghamnida", zh: "對不起（正式）", say: "죄송합니다" },
        { ko: "미안해요", rom: "mianhaeyo", zh: "對不起", say: "미안해요" },
        { ko: "네", rom: "ne", zh: "是／對", say: "네" },
        { ko: "아니요", rom: "aniyo", zh: "不是", say: "아니요" },
        { ko: "안녕히 가세요", rom: "annyeonghi gaseyo", zh: "再見（對離開的人）", say: "안녕히 가세요" },
        { ko: "안녕히 계세요", rom: "annyeonghi gyeseyo", zh: "再見（對留下的人）", say: "안녕히 계세요" },
      ],
    },
    {
      id: "family", title: "家庭 & 稱呼", emoji: "👪",
      words: [
        { ko: "가족", rom: "gajok", zh: "家人", say: "가족" },
        { ko: "엄마", rom: "eomma", zh: "媽媽", say: "엄마" },
        { ko: "아빠", rom: "appa", zh: "爸爸", say: "아빠" },
        { ko: "어머니", rom: "eomeoni", zh: "母親", say: "어머니" },
        { ko: "아버지", rom: "abeoji", zh: "父親", say: "아버지" },
        { ko: "오빠", rom: "oppa", zh: "哥哥（女生稱）", say: "오빠" },
        { ko: "형", rom: "hyeong", zh: "哥哥（男生稱）", say: "형" },
        { ko: "언니", rom: "eonni", zh: "姊姊（女生稱）", say: "언니" },
        { ko: "누나", rom: "nuna", zh: "姊姊（男生稱）", say: "누나" },
        { ko: "동생", rom: "dongsaeng", zh: "弟弟／妹妹", say: "동생" },
      ],
    },
    {
      id: "food", title: "食物 & 飲料", emoji: "🍚",
      words: [
        { ko: "밥", rom: "bap", zh: "飯", say: "밥" },
        { ko: "물", rom: "mul", zh: "水", say: "물" },
        { ko: "김치", rom: "gimchi", zh: "泡菜", say: "김치" },
        { ko: "불고기", rom: "bulgogi", zh: "韓式烤肉", say: "불고기" },
        { ko: "비빔밥", rom: "bibimbap", zh: "拌飯", say: "비빔밥" },
        { ko: "커피", rom: "keopi", zh: "咖啡", say: "커피" },
        { ko: "차", rom: "cha", zh: "茶", say: "차" },
        { ko: "맥주", rom: "maekju", zh: "啤酒", say: "맥주" },
        { ko: "음식", rom: "eumsik", zh: "食物", say: "음식" },
        { ko: "맛있어요", rom: "masisseoyo", zh: "好吃", say: "맛있어요" },
      ],
    },
    {
      id: "place", title: "地點 & 方向", emoji: "📍",
      words: [
        { ko: "집", rom: "jip", zh: "家", say: "집" },
        { ko: "학교", rom: "hakgyo", zh: "學校", say: "학교" },
        { ko: "회사", rom: "hoesa", zh: "公司", say: "회사" },
        { ko: "화장실", rom: "hwajangsil", zh: "廁所", say: "화장실" },
        { ko: "식당", rom: "sikdang", zh: "餐廳", say: "식당" },
        { ko: "카페", rom: "kape", zh: "咖啡廳", say: "카페" },
        { ko: "병원", rom: "byeongwon", zh: "醫院", say: "병원" },
        { ko: "역", rom: "yeok", zh: "車站", say: "역" },
        { ko: "공항", rom: "gonghang", zh: "機場", say: "공항" },
        { ko: "여기", rom: "yeogi", zh: "這裡", say: "여기" },
      ],
    },
    {
      id: "time", title: "時間", emoji: "🕐",
      words: [
        { ko: "오늘", rom: "oneul", zh: "今天", say: "오늘" },
        { ko: "내일", rom: "naeil", zh: "明天", say: "내일" },
        { ko: "어제", rom: "eoje", zh: "昨天", say: "어제" },
        { ko: "지금", rom: "jigeum", zh: "現在", say: "지금" },
        { ko: "아침", rom: "achim", zh: "早上", say: "아침" },
        { ko: "점심", rom: "jeomsim", zh: "中午／午餐", say: "점심" },
        { ko: "저녁", rom: "jeonyeok", zh: "晚上／晚餐", say: "저녁" },
        { ko: "시간", rom: "sigan", zh: "時間", say: "시간" },
        { ko: "요일", rom: "yoil", zh: "星期", say: "요일" },
        { ko: "주말", rom: "jumal", zh: "週末", say: "주말" },
      ],
    },
  ],
};

// 攤平：Stage 2 全部可學項目（learned 追蹤 + 測驗用），統一成 {key, ch, ans, say}
//   ch = 顯示的韓文；ans = 測驗答案（中文意思或數值）
const STAGE2_VOCAB_FLAT = STAGE2.vocab.flatMap((t) =>
  t.words.map((w) => ({ ...w, theme: t.id }))
);
const STAGE2_NUMBERS_FLAT = [
  ...STAGE2.numbers.sino.map((n) => ({ ...n, sys: "sino" })),
  ...STAGE2.numbers.native.map((n) => ({ ...n, sys: "native" })),
];

// 測驗題庫（依階段）：每題 {key, ch, ans, say}
const QUIZ_ITEMS = {
  1: ALL_LETTERS.map((l) => ({ key: l.ch, ch: l.ch, ans: l.rom, say: l.say })),
  2: [
    ...STAGE2_VOCAB_FLAT.map((w) => ({ key: w.ko, ch: w.ko, ans: w.zh, say: w.say })),
    ...STAGE2_NUMBERS_FLAT.map((n) => ({ key: "num:" + n.sys + ":" + n.val, ch: n.ko, ans: n.val, say: n.say })),
  ],
};

// 每階段「全部項目 key」清單（算進度用）
const STAGE_ITEM_KEYS = {
  1: ALL_LETTERS.map((l) => l.ch),
  2: QUIZ_ITEMS[2].map((q) => q.key),
};
