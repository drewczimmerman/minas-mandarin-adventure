# Mina’s Mandarin Island

A cozy island game for a young child learning Mandarin: hear a word, tap the matching character, earn coins, dress up a character and decorate a home. Plain HTML/CSS/JS, no build step, no accounts. Progress is saved in the browser (`localStorage`).

## Play locally
```
python3 -m http.server 8000   # then open http://localhost:8000
```

## Publish on GitHub Pages
1. Push this folder to a new GitHub repo (branch `main`).
2. Repo **Settings → Pages → Source: GitHub Actions**. The included workflow deploys on every push.
3. Open the Pages URL on an iPhone/iPad in Safari → Share → **Add to Home Screen**.

## Add content
Everything is data in `js/data.js`: words in `W` (`character|pinyin|emoji|theme|english`), villagers in `TH`, shop items in `ITEMS`. The island layout, villagers and unlock thresholds (`NEED`) are in `js/world.js`.

## Notes
- Audio uses the device’s built-in Mandarin text-to-speech, so quality and tones vary by device. Recorded audio files would be more reliable for tones.
- If you change files, bump `V` in `sw.js` so installed copies refresh.

## Retro edition
Pixel-art UI based on `assets/mmi-logo.png`; overworld has scrolling camera and code-drawn pixel sprites (`js/world.js`). Music: `audio/theme-song.mp3` (title) `audio/quest-song.mp3` (word-matching screens) and `audio/game-music.mp3` (everywhere else); tracks crossfade; 🎵 mutes. Dialogue lines live in `DLG` in `js/data.js` (`English|中文|pinyin`). The second room costs 60 coins.
