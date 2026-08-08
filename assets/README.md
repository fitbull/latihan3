# Final asset handoff

The build now uses the supplied factory background and bin artwork, transparent panel and pointer assets, and the final ElevenLabs-generated music and feedback sounds.

Runtime images live under Vite's `public/assets/images/` directory:

- `public/assets/images/factory-background.png` — supplied factory background
- `public/assets/images/bin-plural.png`, `bin-dual.png`, `bin-singular.png` — transparent supplied bins
- `public/assets/images/cover-panel.png` — transparent cover panel with the original pointer removed
- `public/assets/images/game-pointer.png` — isolated transparent custom pointer

Runtime audio lives under `public/assets/audio/`:

- `music-background.mp3` — seamless instrumental background loop
- `sfx-click.mp3` — button/start feedback
- `sfx-correct.mp3` — correct-answer feedback
- `sfx-wrong.mp3` — gentle wrong-answer feedback
- `sfx-complete.mp3` — completion celebration

Future ball assets can be added as:

- `public/assets/images/ball-*.webp` — transparent square ball variants, ideally 256 × 256
