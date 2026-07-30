# Final asset handoff

The build now uses the supplied factory background and bin artwork, plus transparent panel and pointer assets prepared from the supplied screenshot. Web Audio tones remain as placeholders.

Runtime images live under Vite's `public/assets/images/` directory:

- `public/assets/images/factory-background.png` — supplied factory background
- `public/assets/images/bin-plural.png`, `bin-dual.png`, `bin-singular.png` — transparent supplied bins
- `public/assets/images/cover-panel.png` — transparent cover panel with the original pointer removed
- `public/assets/images/game-pointer.png` — isolated transparent custom pointer

Future ball and audio assets can be added as:

- `public/assets/images/ball-*.webp` — transparent square ball variants, ideally 256 × 256
- `public/assets/audio/music.mp3` — seamless upbeat/playroom loop
- `public/assets/audio/start.mp3`, `correct.mp3`, `wrong.mp3`, `success.mp3`
