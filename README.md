# Latihan Interaktif Bab 3

Phaser 3 implementation of the storyboard mini-game for **المُفْرَدُ وَالمُثَنَّى وَالجَمْعُ**.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Drag each moving ball into the correct bin before the 45-second timer reaches zero.

## Gameplay implemented

- Cover, activity, correct/incorrect feedback, and results screens
- All 20 storyboard words and their specified categories
- Moving conveyor, drag-and-drop bins, 45-second countdown, and score out of 20
- ElevenLabs-generated background music and click/correct/wrong/completion sounds
- Star scale and Arabic feedback following the storyboard ranges (with one star as the zero-score fallback)
- Replay and return-to-main-menu actions
- Responsive 16:9 canvas with mouse and touch input
- Dedicated portrait-phone layout that fills the available screen without rotation
- Safe-area support for notches/home indicators and fullscreen entry on supported mobile browsers

See `assets/README.md` for the final art and audio handoff.
