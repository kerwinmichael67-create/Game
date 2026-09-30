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
  - Profile picture color: pick a swatch or use the color picker
  - Bio, favorite games and friends list
  - Sign out
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

Real-time games also have on-screen buttons for phones and tablets.

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
