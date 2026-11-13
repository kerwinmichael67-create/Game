# Apex Circuit

A 3D arcade racing game that runs in a single HTML page: three procedurally built circuits, four
cars to buy and tune, a drift system with turbo tiers and scoring, AI opponents that race and slide,
and real-time online multiplayer when published as a Claude artifact.

## Modes

- **Race the AI** – single race, three difficulty levels, 3 to 7 opponents.
- **Championship** – three rounds on all circuits against the same rivals, points per round, a purse for the title.
- **Drift Attack** – two solo laps scored on slides, with bronze, silver and gold targets per circuit.
- **Time Trial** – solo laps against the ghost of your best lap.
- **Online** – lobby, room codes, host-synced starts, bots filling the grid.

## Driving

`W/S` or `↑/↓` throttle and brake, `A/D` or `←/→` steer, tap `Space` while steering to drift,
`Shift` nitro, `R` reset, `C` camera, `Esc` pause, `M` music. Touch controls appear on phones;
gamepads work too.

Tyres hold a fixed amount of lateral grip, so full steering at speed never spins the car. Tapping
drift kicks the tail out: steering deeper into the slide tightens the line, easing off lets it run
wide, and straightening up after a long clean slide fires a turbo (blue, orange, purple). Boost
pads, slipstream and a well-timed launch add more speed.

## Where it runs

- **Claude artifact** – uses the artifact runtime's `room` capability for multiplayer and `db`/`user`
  for per-player progress and the shared leaderboard (`records/<user id>`, each player writes only
  their own row).
- **Standalone** – open `index.html` in any browser. Everything works except online play and the
  shared leaderboard, which need the artifact runtime.

## Layout

```
src/head.html    design tokens + styles
src/body.html    screens, HUD, touch controls
src/js/          engine modules, concatenated in filename order
build.mjs        builds dist/artifact.html (fragment for the artifact) and index.html (standalone)
```

Rebuild after editing anything in `src/`:

```bash
node build.mjs
```

## Tests

A headless regression suite drives the real page in Chromium (Playwright), with Three.js served from a
local copy and the artifact runtime replaced by `tests/mockroom.js`:

```bash
node tests/run.mjs
```

```bash
node tests/run.mjs physics net
```

`node tests/shots.mjs` writes a gallery of screenshots to `tests/out/` for visual review.

Three.js r128 is loaded from cdnjs and its post-processing passes (bloom) from jsDelivr; there are no
other dependencies and no build tooling to install. Conventions used throughout the code: y is up,
`forward = (sin yaw, 0, cos yaw)`, `right = forward × up`, and positive steering or lateral offset
means right.
