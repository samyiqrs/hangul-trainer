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
