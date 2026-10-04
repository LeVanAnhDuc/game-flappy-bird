# 🐦 Duck Flap — the whole game drawn in code, playable on a phone or a desktop

[![Deploy](https://github.com/LeVanAnhDuc/web-game-duck-flap/actions/workflows/deploy.yml/badge.svg)](https://github.com/LeVanAnhDuc/web-game-duck-flap/actions/workflows/deploy.yml)
[![Release](https://img.shields.io/github/v/release/LeVanAnhDuc/web-game-duck-flap?sort=semver)](https://github.com/LeVanAnhDuc/web-game-duck-flap/releases)

A Flappy Bird clone built with Next.js and Canvas 2D. Every sprite, every sound
effect is generated at runtime — the project ships no image or audio file at all.
No server and no game accounts: your records stay on your own device.

**Play**: https://levananhduc.github.io/web-game-duck-flap/

![Duck Flap gameplay](docs/assets/screenshot.png)

## Features

- **The game itself**

  - Tap, click or press Space to flap; slip through the gap between pipes and stay off the ground
  - Hitting the ceiling only stops you, it does not kill you — the same forgiveness the original had
  - The hitbox is smaller than the bird you see, so a near miss reads as "just made it" instead of "cheated"
  - The start screen beats out the flap rhythm, so first-timers learn that a tap is a beat and not a one-off command
  - A run that ends on zero says why the duck fell, instead of leaving you to blame the device

- **Three difficulties, three separate record tables**

  - Easy / Normal / Hard change gravity, scroll speed, gap height and the spacing between pipes
  - Each difficulty keeps its own best score — a run on Easy can never bury a record set on Hard
  - The chosen difficulty is remembered between visits

- **Plays the same everywhere**

  - The world is a fixed 288 × 512 logical box scaled to fit the screen, so the difficulty and the scores are identical on every device
  - Physics runs on a fixed 1/120s step: a 60Hz laptop and a 144Hz monitor behave exactly alike
  - Portrait phones fill the frame; wide screens show the play area as a lit column against a dark page

- **Built for touch as much as for a keyboard**

  - Flap with `Space`, `↑`, `W`, a mouse click or a tap
  - `Space` starts a run straight from the menu, and Play holds focus from the first frame, so a keyboard never has to hunt for the button
  - Double-tap zoom, pull-to-refresh and text selection are all suppressed over the play area, so fast tapping stays fast tapping
  - Overlays never swallow a tap — only their buttons take pointer events

- **Pause, and never lose a run by accident**

  - `P` or `Esc` freezes the run and says so on screen
  - Switching browser tabs pauses the game by itself, so you do not come back to a dead bird — including the sliver of a frame between your first flap and the run proper

- **Sound without a single audio file**

  - Flap, score, hit and die are synthesised with WebAudio oscillators
  - Mute from the header or from settings; the choice is remembered
  - A browser that blocks or lacks WebAudio simply plays nothing — the game never breaks over sound

- **Graphics generated at runtime**

  - Sky gradient, clouds and hills scroll on four parallax layers
  - The bird's wing beat is derived from its vertical speed: fast strokes climbing, an outstretched glide falling
  - Every colour lives in one palette file, so re-skinning the game touches nothing else

- **No game accounts, no server**
  - Records and settings live in localStorage on your own device
  - Optional sign-in with Ducker ID (behind a feature flag, off in the deployed build): identity only, nothing is synced
  - Blocked storage (private windows) or corrupted data degrades to defaults instead of crashing

## Optional Ducker ID sign-in (local only)

Copy `.env.example` to `.env` and fill in `NEXT_PUBLIC_DUCKER_CLIENT_ID`. The button
only renders when `NEXT_PUBLIC_FEATURE_DUCKER_SIGN_IN=true` and all four
`NEXT_PUBLIC_DUCKER_*` values are set; the deploy workflow passes none of them.
`NEXT_PUBLIC_BASE_PATH` replaces the old `GITHUB_PAGES` switch.

## Controls

| Action | Key / gesture                 |
| ------ | ----------------------------- |
| Flap   | `Space`, `↑`, `W`, click, tap |
| Pause  | `P` or `Esc`                  |

## Commands

**Requires**: Node.js 18+

```bash
# Install dependencies
pnpm install

# Start the development server (http://localhost:3000; use --port if Ducker ID holds 3000)
pnpm dev

# Run the unit tests (Vitest)
pnpm test

# Run the browser tests (Playwright)
pnpm test:e2e

# Build a static site (output: out/)
pnpm build
```

## How it is put together

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript (strict mode)
- **Rendering**: Canvas 2D, drawn procedurally — no sprite sheet, no asset files
- **Styling**: Tailwind CSS v3, lucide-react icons
- **Audio**: WebAudio API (oscillator + gain envelope)
- **Testing**: Vitest + Playwright (Desktop Chrome and Pixel 7)
- **Build & Deploy**: static export, deployed to GitHub Pages by GitHub Actions

## Project structure

The rule that shapes everything: **`src/game/` never imports React.** It is a
standalone TypeScript library that runs under Node, which is why every rule of
the game can be checked without a browser.

```
src/
├── game/
│   ├── core/       # Pure functions: physics, pipe spawning, collision, scoring, world step
│   │   ├── world.ts        # stepWorld(state, dt, input) -> state
│   │   ├── physics.ts      # Gravity, flap, rotation from velocity
│   │   ├── collision.ts    # AABB overlap, bird/pipe/ground hitboxes
│   │   ├── pipes.ts        # Spawn, move, recycle
│   │   ├── scoring.ts      # One point per pipe, never twice
│   │   ├── rng.ts          # Seeded mulberry32, kept inside the state
│   │   └── constants.ts    # World size and the per-difficulty tuning table
│   ├── engine/     # The impure half: requestAnimationFrame loop, keyboard/pointer input
│   ├── render/     # Canvas 2D: viewport scaling, layers, palette
│   ├── score/      # ScoreRepository interface + localStorage implementation
│   ├── settings/   # Settings persistence
│   ├── storage/    # localStorage wrapper safe under SSR and private mode
│   └── audio/      # WebAudio sound effects
├── hooks/
│   └── useGameEngine.ts    # The single bridge between the engine and React
└── views/Home/             # Header, canvas, HUD and the overlays

docs/
└── superpowers/specs/2026-09-03-flappy-bird-design.md  # Full design spec
```

## How a frame works

The loop accumulates real time and spends it in fixed 1/120s slices, capped at
five slices per frame so a tab left in the background cannot trigger a death
spiral on its return:

```
frame(now):
  accumulator += now - previous
  steps = 0
  while accumulator >= 1/120 and steps < 5:
    state = stepWorld(state, 1/120, { flap: queue.shift() })
    accumulator -= 1/120
    steps += 1
  render(ctx, state, viewport)
  emit({ phase, score, difficulty })   # only when one of the three changed
```

That last line is the reason the game holds 60fps: React re-renders when the
score changes, not sixty times a second.

## Releases and versioning

Pushing to `main` runs two workflows:

- `.github/workflows/deploy.yml` — runs the unit tests, then the browser tests,
  builds a static export with the GitHub Pages base path, and publishes it
- `.github/workflows/release.yml` — reads the Conventional Commit prefixes since
  the last tag, bumps the version accordingly, and cuts a GitHub release with
  generated notes

Release notes are automated, the README is not. A user-facing `feat:` commit
should update the `## Features` section in the same branch.

---

**Created**: 2026-09-03

## Documentation

The full design spec — the rules, the tuning table and the reasoning behind both —
is in [`docs/superpowers/specs/2026-09-03-flappy-bird-design.md`](docs/superpowers/specs/2026-09-03-flappy-bird-design.md).
