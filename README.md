# Apex Circuit

A 3D arcade racing game that runs in a single HTML page: three procedurally built circuits,
AI opponents with three difficulty levels, a garage with credit-funded upgrades, time trial with
a ghost car, and real-time online multiplayer when published as a Claude artifact.

## Play

- **Claude artifact** – the published page uses the artifact runtime's `room` capability for
  multiplayer (lobby, room codes, host-synced starts) and `db`/`user` to keep each player's
  credits and upgrades with their account.
- **Standalone** – open `index.html` in any browser. Everything works except online play,
  which needs the artifact runtime.

Controls: `W/S` or `↑/↓` throttle and brake, `A/D` or `←/→` steer, `Shift` nitro, `Space`
handbrake, `C` camera, `Esc` pause. Touch controls appear automatically on phones; gamepads work too.

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

Three.js r128 is loaded from cdnjs and its post-processing passes (bloom) from jsDelivr; there are no other
dependencies and no build tooling to install. The Graphics toggle on the main menu switches between High
(bloom, soft shadows, full resolution) and Fast (for phones and integrated GPUs).
