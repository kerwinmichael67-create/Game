# Game Chat

An online chat where you can talk to whoever is online, make your own chats, and challenge people to live multiplayer minigames.

## Features

- **Accounts**: sign up with a username and password. You stay signed in on that browser.
- **Global chat** for everyone, plus **New chat** for your own private or public group chats. You can add people to a chat or leave it.
- **Direct messages**: click anyone's name and press **Message**.
- **Presence**: see who's online. The "N Online" counter and "active" counts update live, and so does the typing indicator.
- **Settings** (laid out like the mockup):
  - Name, password and username
  - Status: Online, Offline (appear offline), or Idle / do not disturb. While you're on do not disturb, nobody can challenge you.
  - Background: White, Black, or any custom color
  - Profile picture: choose a photo (cropped to a square automatically), or pick a color swatch or use the color picker
  - Sound on/off for @mentions and direct messages
  - Bio, favorite games and friends list
  - Sign out
- **Reactions**: hover a message and press 😊 to react (👍 ❤️ 😂 😮 😢 🔥 🎉 👀). Click a reaction to add yours or take it back.
- **Polls**: press 📊 next to the message box, write a question and 2–6 options. Everyone can vote and change their vote, and the results update live.
- **@mentions**: type `@` to pick someone. Their name is highlighted, and they get a pop-up, a red **@** badge on the chat and a sound.
- **Delete** your own messages (🗑️). Everyone sees "This message was deleted".
- **Search** (🔍 or Ctrl+K) through recent messages, file names and polls in all your chats. Click a result to jump to it.
- **Emoji picker** (😊 next to the message box) and clickable links in messages.
- **Request a game**: pick a game and an online opponent. They get an Accept / Decline pop-up, and the game opens next to the chat. Results are posted to the chat, and everyone's win/loss record shows on their profile.

### Games (all online, player vs player)

| Game | How to win | Controls |
| --- | --- | --- |
| 🐍 Snake PvP | Longest snake after 90 seconds. If you die you respawn small. | Arrows / WASD / swipe |
| ♟️ Chess | Checkmate. Full rules: castling, en passant, promotion. | Click piece → click square |
| ⛀ Checkers | Leave your opponent with no moves. Captures are forced; you can multi-jump and get kinged. | Click piece → click square |
| 🧱 Tetris Battle | Last one standing. Clearing lines sends junk rows to your opponent. | ←→ ↑ ↓ Space, C = hold |
| 🥊 Street Fighter | Best of 3 rounds: punch, kick, block, jump, and a fireball. | A/D W S, J/K/L |
| 🏓 Pong | First to 7 | W/S or ↑/↓ |
| 🔴 Connect Four | Four in a row | Click a column |
| ❌ Tic-Tac-Toe | Three in a row | Click a square |
| ⚫ Reversi | Most discs when neither player can move. Trap discs to flip them. | Click a dotted square |
| 🔲 Dots & Boxes | Most boxes. Closing a box scores it and gives you another turn. | Click between two dots |
| 🫘 Mancala | Most seeds in your store. Land in your store to go again, or in an empty pit to capture. | Click one of your pits |
| ⭕ Five in a Row | Five stones in a line on a 15×15 board | Click a spot |
| 🏍️ Light Cycles | Best of 5 rounds: don't crash into a trail or the wall | Arrows / WASD / swipe |
| 🏒 Air Hockey | First to 7 goals | Mouse or finger, or WASD / arrows |
| 🏎️ Apex Rush 3D | First over the line. 3D racing on nine circuits, with nitro, drifting, jumps and pickups. | WASD or arrows, Shift nitro, Space pickup, C camera (keyboard only) |
| 🏰 Tower Defense | Survive the most waves, or be first to beat wave 25. Bosses on waves 5, 10 and 25. | Click to build, 1–5 pick a tower, U upgrade, T target, Space next wave |

Real-time games also have on-screen buttons for phones and tablets, except Apex Rush 3D, which needs a keyboard.

**Tower Defense**: each player defends their own map against the same 25 waves (boss waves 5, 10 and 25), and sees the other's towers and progress on a mini-map. Everyone starts with $350 and 100 lives, and has the same towers: Pistol $100 (no limit), Machine gun $250 (max 5), Sniper $200 (max 8, pierces armor), Flamethrower $150 (max 5, burns crowds) and Farm $75 (max 7, pays $25 after every wave, up to $250 fully upgraded), 20 towers in all. Every tower has 5 upgrades, each dearer than the last; you can sell a tower for 70% of what you put in. Waves start on their own after a short break (or press Space), and 1×/2×/3× speeds the game up. Whoever survives more waves wins (same wave: more kills); beating wave 25 wins outright. The bot plays its own map: easy usually falls around wave 14, medium around 21, and hard beats wave 25.

**Apex Rush 3D online**: the game (`public/apex.html`) opens full-window. Whoever sent the challenge picks the circuit, direction, weather, pickups and laps; each player picks their own car; both press **Ready** and the countdown starts. Each browser drives its own car and streams it to the other about 20 times a second; Jolt and Oil pickups reach the other car too. If one player finishes, the other has 30 seconds to cross the line before the race is called.

**Playing the bot**: in **Request a game**, pick **Play the bot** and choose Easy, Medium or Hard. It's always there, and it's picked automatically when nobody else is online. It plays all 16 games (Apex Rush and Tower Defense use their own built-in bots) and runs in your own browser, so it works on both the website and claude.ai. Bot games don't count toward your win/loss record and aren't posted in the chat. Run `node test/bots.js` to check the bots' strength and speed.

**Replying and editing**: point at a message (or tap it on a phone) and press ↩ to reply or ✏️ to edit one of your own. You can also press ↑ in an empty message box to edit your last message, and Esc cancels. A reply shows a quote of the message it answers; click the quote to jump to that message. Edited messages say **edited**; click that to see the original text, and click again to switch back. Every earlier version is kept.

**Calls (website version)**: open a direct message with someone who's online and press 📞 for a voice call or 🎥 for a video call. You can also use **Call** / **Video** on their profile card. They can answer with voice or video, or decline. During a call you can mute, turn your camera on or off (even partway through a voice call), make the call window bigger, or hang up. Audio and video go straight between the two browsers (WebRTC); the chat server only passes along ringing and connection details.
- The browser asks for camera and microphone permission the first time. Calls need an `https` address, which Render provides, or `localhost`.
- Most connections work with the free public STUN servers. Some strict school or office networks block direct connections; for those, add a TURN relay by setting the `ICE_SERVERS` environment variable, for example `[{"urls":"turn:turn.example.com:3478","username":"u","credential":"p"}]`.
- Calls aren't available on the claude.ai version: claude.ai pages can't use the camera or microphone, and they block WebRTC.

**Sharing files**: send photos, videos and files with the 📎 button, by dragging them onto the chat, or by pasting a screenshot. Photos show inline (click one to see it full size), videos play in the chat, and other files show as a card with a **Save** button.
- **Website (server):** any file type, up to 10 MB each, stored in `data/uploads`. Uploads are served sandboxed, so they can't run scripts, and anything that isn't a photo, video, audio file or PDF downloads instead of opening.
- **claude.ai:** photos (PNG, JPG, GIF, WebP, SVG), videos (MP4, WebM), PDFs and text files, up to 20 MB each.

## Get a public link (free, ~3 minutes)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/kerwinmichael67-create/Game)

1. Make sure this code is on the repo's `main` branch. Render reads `render.yaml` from there.
2. Click the button above and sign in to Render with GitHub. It's free.
3. Press **Deploy**. When it's done you'll get a link like `https://game-chat-xxxx.onrender.com`. Send it to your friends!

On the free plan, the site goes to sleep after about 15 minutes with nobody on it, and the first visit after that takes around 30 seconds to wake it up. Saved data (accounts and chat history) is reset whenever the site restarts or redeploys. To keep data, upgrade to a paid plan, add a persistent disk mounted at `/data`, and set the `DATA_DIR=/data` environment variable.

## Play on claude.ai (no server needed)

The same app also runs as a claude.ai artifact. There, chats and profiles are stored in the artifact's shared database, and live presence and game state travel over the artifact's live rooms. In each game, the challenger's browser runs the game for both players.

- Rebuild it with `node scripts/build-artifact.js`, which writes `dist/game-chat.html`.
- Everyone who uses it needs a claude.ai account. The owner invites each friend by email from the artifact's **Share** menu, as an **Editor**. That's the access level that lets people post, save their profile and play.
- The code lives in `artifact/backend.js`. It stands in for `server.js` and speaks the same message protocol, so the web client runs unchanged.

## Run it

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
cd chat
npm install
npm start
```

Then open http://localhost:3000. To try it alone, open a second browser (or a private window), make a second account, and chat or play against yourself.

**Playing with friends**
- **Same Wi-Fi**: find your computer's local IP address (for example `192.168.1.20`). Friends open `http://192.168.1.20:3000`.
- **Over the internet**: deploy the `chat` folder to any Node host that supports WebSockets, such as Render, Railway, Fly.io or a VPS. The start command is `npm start`, and the server uses the `PORT` environment variable if it's set.

Accounts, chats and messages are saved to `chat/data/db.json`. Set `DATA_DIR` to store them somewhere else.

## Tests

```bash
npm test
```

This checks the game rules, then runs two simulated players against a real server. They sign up, chat, create rooms, and play chess, tetris and snake.

## How it's built

- `server.js`: HTTP server plus WebSocket (`ws`). It handles accounts, rooms, presence, challenges and game sessions. Passwords are hashed with scrypt.
- `shared/rules.js`: chess, checkers, connect four and tic-tac-toe rules. The server uses them to validate every move, and the browser uses them to highlight legal moves.
- `realtime.js`: snake, pong and the fighting game run on the server (server-authoritative), so neither player can cheat. For Tetris, each player's board runs in their own browser and the server passes junk rows between them.
- `public/`: the web client (`index.html`, `style.css`, `app.js` for the chat, `games.js` for the game renderers).
