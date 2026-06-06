# 한글 · 韓文拼音練習 (Hangul Trainer)

手機優先的韓文拼音發音練習 PWA。看到韓文字母 → 點一下聽 ko-KR 發音 → 練熟反射。
純前端、無後端、無帳號，進度存在瀏覽器 `localStorage`。

## 功能

- **字母卡**：基本母音 10 / 基本子音 14 / 雙子音·緊音 5 / 複合母音 11，點卡片發音，可慢速。
- **組合字練習**：초성 + 중성 即時組出音節（例 ㄱ+ㅏ=가），點擊發音，可隨機出題。
- **隨機測驗**：看字選音 / 聽音選字，即時對錯回饋 + 計分。
- **進度追蹤**：已學字母、最佳分數、連續打卡、今日練習分鐘數。
- **跟讀（加分）**：支援 Web Speech Recognition 的裝置可跟讀比對。
- **PWA**：可「加到主畫面」變全螢幕 App、可離線開啟。

## 使用

線上版直接用瀏覽器開（建議手機 Chrome / Safari），可加到主畫面當 App 用。

本地預覽：

```bash
python3 -m http.server 8080
# 瀏覽器開 http://localhost:8080
```

> ko-KR 發音需要裝置本身有韓語語音（iOS/Android 通常內建）。

## 技術備註

- 發音：`speechSynthesis`，`lang="ko-KR"`，正常 rate 0.9 / 慢速 0.5。
- 音節：Unicode 正規組字 `0xAC00 + (초성*21 + 중성)*28`。
- 進度：localStorage key `hangul_progress_v1`。
