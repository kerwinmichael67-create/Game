# Blox Tycoon

An online multiplayer 3D tycoon game in the style of classic Roblox tycoons, playable in any modern browser.

Claim a plot, buy droppers that spawn cash cubes onto a conveyor, run them through upgraders, collect the cash, build walls, a roof, neon lights and a giant sign with your name on it, then **rebirth** for a permanent income boost. Up to 8 players share a server; everyone sees everyone else walking around, building and climbing the leaderboard in real time.

## Features

- **3D world** rendered with Three.js: a street of eight tycoon plots around a spawn hub with live in-world leaderboards.
- **Real multiplayer** over WebSockets with an authoritative Node.js server. Rooms ("servers") hold up to 8 players and are created automatically; share the 4-letter server code (or the URL) to play with friends.
- **Classic tycoon loop**: 15 purchasable items (6 droppers, 3 upgraders, walls, roof, neon lights, sign, turbo droppers, auto collector) plus a rebirth pad.
- **Blocky avatars** with name tags, walking and jumping animation, and per-player colors.
- **Chat**, toasts, a HUD with income per second, and a leaderboard sorted by rebirths and cash.
- **Reconnect-safe**: if your connection drops, your tycoon is held for 2 minutes and you resume right where you were.
- **Touch controls** (virtual joystick + jump button) for phones and tablets.
- Zero build step. Plain ES modules; Three.js is vendored.

## Run it locally

Requires Node.js 18 or newer.

```bash
npm install
npm start
```

Open <http://localhost:3000>. Open it in a second tab (or another device on your network using your machine's IP) to see multiplayer in action.

`npm run dev` restarts the server on file changes. `npm test` runs the server-side game-logic tests.

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | WASD / arrow keys | Left joystick |
| Jump | Space | JUMP button |
| Look | Drag mouse on the game | Drag on the right side |
| Zoom | Mouse wheel | — |
| Chat | Enter | Tap the chat box |
| Teleport to my tycoon | T or the ⌂ button | ⌂ button |
| Help | H or the ? button | ? button |

## How to play

1. Walk to any empty plot and stand on the gold **CLAIM TYCOON** pad.
2. Step on the **FREE Dropper** pad. Cubes start dropping onto your conveyor and ride into the Collector.
3. Stand on the blue **COLLECT** pad to move the collector's cash into your wallet.
4. Green pads are items you can afford; red pads show how much more you need. Each purchase unlocks the next pads.
5. Upgraders multiply every cube that passes through them. Turbo Droppers make all droppers fire faster. Auto Collector sends cash straight to your wallet.
6. Buy everything and the **REBIRTH** pad appears. Rebirthing resets your tycoon but gives +50% income permanently (stacks).

## Playing online with friends

The game is a single Node.js process that serves both the website and the WebSocket game server, so hosting it anywhere that runs Node makes it playable over the internet.

**Quick options**

- **Render / Railway / Fly.io / Heroku-style hosts**: create a new web service from this repository. Build command `npm install`, start command `npm start`. The server reads the `PORT` environment variable. WebSockets are supported by all of these out of the box.
- **Docker**:

  ```bash
  docker build -t blox-tycoon .
  docker run -p 3000:3000 blox-tycoon
  ```

- **Any VPS**: `npm install && PORT=80 npm start` (or put it behind nginx/Caddy with WebSocket proxying enabled and TLS; the client automatically uses `wss://` on HTTPS pages).
- **Same Wi-Fi only**: run `npm start` and have friends open `http://<your-local-ip>:3000`.

Once it is running, send friends the link with your server code, e.g. `https://your-host.example/?room=AB12`. Players who join without a code are placed in the fullest server that still has room.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP + WebSocket port |
| `DEV_CHEATS` | unset | Set to `1` to allow the browser console command `__bt.cheat(100000)` (for testing the build tree) |

Game balance lives in `shared/items.js` (prices, dropper values, upgrader multipliers, pad positions) and `shared/config.js` (player speed, conveyor speed, room size, rebirth bonus). Both files are shared by the server and the client so the two never disagree.

## Project layout

```
server/index.js   HTTP static server, WebSocket handling, room matchmaking, game loop
server/room.js    Authoritative game state: players, plots, droppers, purchases, rebirth
shared/           Config and the item tree, imported by both server and client
public/           The browser client (Three.js scene, avatar, controls, HUD, networking)
test/             node:test suite for the server game logic
```

### Networking model

- Clients send their own position at 15 Hz and the server relays everyone's positions, cash and plot state in compact snapshots at 15 Hz.
- Everything that matters is decided on the server: claiming plots, purchases (ownership, prerequisites, price, distance to the pad), income simulation, collection and rebirth. The client only animates what the server reports.
- Cube drops are sent as events so every player sees the same cubes travelling down each conveyor.

## License

MIT
