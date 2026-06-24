# duck-Hunt

Gesture-controlled retro arcade game built with React, TypeScript, Vite, Tailwind CSS, HTML5 Canvas, and MediaPipe Hand Landmarker.

## Features

- **Webcam hand tracking** — index finger controls the crosshair
- **Pinch to shoot** — thumb + index finger pinch fires with 250ms cooldown
- **Multiple duck types** — Normal, Fast, Zigzag, Golden, Ghost, and Boss
- **Boss battles** every 5 levels with health bar and projectile eggs
- **Combo system** — consecutive hits multiply your score
- **Particle effects** — feathers, smoke, and explosion sparks
- **Procedural audio** — Web Audio API sound effects and background music
- **Local leaderboard** — top 10 scores saved in LocalStorage
- **Settings** — sensitivity, sound, music, and difficulty

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in a modern browser (Chrome recommended). Allow webcam access when prompted.

## How to Play

1. Click **START GAME** on the home screen
2. On the calibration screen, show your hand to the webcam
3. Move your index finger to aim; pinch thumb and index to shoot
4. Hit ducks before they fly off screen — you start with 5 lives
5. Build combos by hitting ducks consecutively
6. Defeat the Boss Duck every 5 levels

## Controls

| Action | Gesture |
|--------|---------|
| Aim | Point index finger |
| Shoot | Pinch thumb + index finger |
| Quit | Click QUIT button |

## Project Structure

```
src/
├── components/       # React UI screens
├── game/             # Canvas game engine, ducks, particles
├── handtracking/     # MediaPipe hand tracker + gesture detector
├── audio/            # Web Audio API sound manager
├── storage/          # LocalStorage leaderboard
├── hooks/            # React hooks
├── types/            # TypeScript types
└── assets/           # Sprites, sounds (placeholders)
```

## Deployment

### Netlify / Vercel / GitHub Pages

```bash
npm run build
```

The `dist/` folder is ready to deploy. A `netlify.toml` is included for Netlify with SPA redirects.

For GitHub Pages, `base: './'` is already set in `vite.config.ts`.

## Browser Requirements

- Webcam access
- WebGL (for MediaPipe GPU delegate; falls back automatically)
- Modern browser with Web Audio API support

## Customization

- **Sounds**: Add `.wav` files to `src/assets/sounds/` and wire them in `AudioManager.ts`
- **Sprites**: Replace procedural duck drawing in `Duck.ts` with sprite sheets
- **Difficulty**: Adjust values in `src/game/Levels.ts` and `src/types/game.ts`

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- HTML5 Canvas + requestAnimationFrame
- @mediapipe/tasks-vision (Hand Landmarker)
- LocalStorage
