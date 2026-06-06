// 韓文字母權威清單 — 完全依照 SPEC §7，勿增刪、勿改拼音。
// 羅馬拼音僅供對照；發音以 ko-KR TTS 為準。

const LETTER_GROUPS = [
  {
    id: "vowel",
    title: "基本母音",
    subtitle: "Basic Vowels",
    count: 10,
    letters: [
      { ch: "ㅏ", rom: "a" },
      { ch: "ㅑ", rom: "ya" },
      { ch: "ㅓ", rom: "eo" },
      { ch: "ㅕ", rom: "yeo" },
      { ch: "ㅗ", rom: "o" },
      { ch: "ㅛ", rom: "yo" },
      { ch: "ㅜ", rom: "u" },
      { ch: "ㅠ", rom: "yu" },
      { ch: "ㅡ", rom: "eu" },
      { ch: "ㅣ", rom: "i" },
    ],
  },
  {
    id: "consonant",
    title: "基本子音",
    subtitle: "Basic Consonants",
    count: 14,
    letters: [
      { ch: "ㄱ", rom: "g/k" },
      { ch: "ㄴ", rom: "n" },
      { ch: "ㄷ", rom: "d/t" },
      { ch: "ㄹ", rom: "r/l" },
      { ch: "ㅁ", rom: "m" },
      { ch: "ㅂ", rom: "b/p" },
      { ch: "ㅅ", rom: "s" },
      { ch: "ㅇ", rom: "(無聲/收尾 ng)" },
      { ch: "ㅈ", rom: "j" },
      { ch: "ㅊ", rom: "ch" },
      { ch: "ㅋ", rom: "k" },
      { ch: "ㅌ", rom: "t" },
      { ch: "ㅍ", rom: "p" },
      { ch: "ㅎ", rom: "h" },
    ],
  },
  {
    id: "double",
    title: "雙子音 / 緊音",
    subtitle: "Double / Tense",
    count: 5,
    letters: [
      { ch: "ㄲ", rom: "kk" },
      { ch: "ㄸ", rom: "tt" },
      { ch: "ㅃ", rom: "pp" },
      { ch: "ㅆ", rom: "ss" },
      { ch: "ㅉ", rom: "jj" },
    ],
  },
  {
    id: "compound",
    title: "複合母音",
    subtitle: "Compound Vowels",
    count: 11,
    letters: [
      { ch: "ㅐ", rom: "ae" },
      { ch: "ㅒ", rom: "yae" },
      { ch: "ㅔ", rom: "e" },
      { ch: "ㅖ", rom: "ye" },
      { ch: "ㅘ", rom: "wa" },
      { ch: "ㅙ", rom: "wae" },
      { ch: "ㅚ", rom: "oe" },
      { ch: "ㅝ", rom: "wo" },
      { ch: "ㅞ", rom: "we" },
      { ch: "ㅟ", rom: "wi" },
      { ch: "ㅢ", rom: "ui" },
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
