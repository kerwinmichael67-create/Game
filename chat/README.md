# Game Chat

An online chat where you can talk to whoever is online, make your own chats, and challenge people to live multiplayer minigames.

## Features

- **Accounts**: sign up with a username and password. You stay signed in on that browser.
- **Global chat** for everyone, plus **New chat** for your own private or public group chats. You can add people to a chat or leave it.
- **Direct messages**: click anyone's name and press **Message**.
- **🤖 AI helper**: the first entry in your chats list is a private chat with Claude, an AI from Anthropic. Ask it anything: game tips and strategy, rules, homework, ideas, jokes, quizzes, help writing a message. Answers appear as they're written; ⏹ stops one part-way, **↻ Try again** asks for a different answer, 📋 copies one, and **🧹 New chat** starts over. Only you can see it, and the conversation is kept in your browser. Claude is told about Game Chat and its games and keeps things suitable for all ages. On the website the server needs an Anthropic API key (see [Turn on the AI helper](#turn-on-the-ai-helper)); on claude.ai it uses each person's own Claude plan, and claude.ai asks them once to allow it.
- **🧰 Tools** (button in the top bar; press it again to go back to the chat). Everything you make is kept in your browser:
  - **🌐 HTML previewer**: write HTML, CSS and JavaScript and see the page live as you type (or press ▶ Run / Ctrl+Enter). `console.log` and errors (with line numbers) show under the preview. Start from a template (starter page, bouncing ball, profile card, quiz), switch to a big preview, or download it as a `.html` file. The page runs walled off from the chat, so it can't see your chats or sign-in.
  - **🧮 Calculator**: type or tap. + − × ÷, powers, roots, %, n!, sin/cos/tan (degrees or radians), log, ln, π, e and Ans, with brackets and `2π`-style multiplication. History of your answers; click one to reuse it.
  - **⏱️ Stopwatch** with laps, and a **timer** (quick 30 s – 15 min buttons) that keeps going while you chat and rings when it's done.
  - **🔁 Unit converter**: length, weight, temperature, speed, time, volume, data and area, both ways.
  - **🎲 Random**: roll up to 6 dice (d4–d100), flip a coin, pick a number, or paste names to pick one, shuffle the order or make teams.
  - **📝 Notes**, **✅ To-do list**, **🎨 Colors** (picker, HEX/RGB/HSL to copy, shades, and whether white or black text is readable on it), **🔤 Text tools** (word count, UPPER/lower/Title case, sort, remove repeats, find & replace) and **🔢 Number bases** (decimal, binary, octal, hex, and text ↔ binary).
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
- **Formatting**: `**bold**`, `*italic*`, `~~strike~~`, `` `code` ``, code blocks with three backticks, `> quotes` and `||spoilers||` (click to reveal). The message box is multi-line: Enter sends, Shift+Enter starts a new line.
- **Commands** (type `/` for suggestions): `/me waves`, `/shrug`, `/tableflip`, `/unflip`, `/lenny`, `/roll 2d6`, `/flip`, `/remind 10m stretch` (only you see reminders) and `/help`.
- **Emoji shortcodes**: type `:fire:` (with suggestions after two letters). A message of just a few emoji shows them big.
- **@everyone and @here** ping everyone in the chat.
- **Mention sound**: when someone @mentions you (or edits a message to mention you), or sends you a direct message, while you're on another tab, in another app, in a game, or in another chat, a sound plays. Browsers only allow sound after you've clicked or typed on the page once, so the chat gets sound ready on your first click. Pick Ding, Chime, Bell, Pop, Blip or none, and the volume, in Settings. Mentions still ping in muted chats.
- **Message menu** (⋯ on a message): copy text, forward to another chat, pin to the chat, save for later. Double-click a message to 👍 it.
- **Chat menu** (⋯ in the top bar): pinned messages, saved messages, photos & videos in the chat, export the chat as a text file, favorite (keeps it at the top), mute, mark all chats read, and a list of commands and shortcuts.
- **Drafts** are kept per chat. A **Jump to latest** button shows how many new messages arrived while you were scrolled up, and a **New messages** line marks where you left off. **Alt+↑/↓** switches chats.
- **Custom status** under your name, **friend online alerts**, and **blocking** someone (from their profile) hides their messages, pings, typing and challenges. Blocking, muting, favorites, drafts, saved messages and sound settings are kept in your own browser.
- **🕹️ Games** (next to Request a game): party games with **servers** anyone can join. Make a server (name, how many players, how long to draw) or join one from the list; the host presses Start. For now there's **Draw Phone**, like Gartic Phone: everyone writes a prompt, then the papers go round: you draw the prompt you're handed, the next person describes your drawing, and so on until every paper has visited everyone. Then the host shows each album step by step (or all at once), and can start another game. Drawing has colors, 4 brush sizes, a paint bucket, an eraser, undo (Ctrl+Z) and clear. Each round has a timer; when it runs out, what you have is sent. The **▁ Chat** button takes you back to the chat while the game keeps going. On the website the server runs each game; on claude.ai the host's browser does (if the host leaves, the next player takes over), drawings are stored like shared photos, and a server everyone has left is tidied away after 10 minutes.
- **🎲 Classic games — tables** (in 🕹️ Games): every Request-a-game game except Apex Rush and Tower Defense (which have their own online modes) also has 6 **tables** to join. Pick a game, then **Join a random table** or a specific one. The next players in line play while everyone else at the table watches the match live; afterwards the winner stays on and everyone else goes to the back of the line. **Just watch** takes you out of the line, **Play** puts you back. **Snake, Light Cycles and Tetris Battle seat up to 4 players** at once (the match waits a few seconds longer for more people before it starts); every other game is 1 v 1. A pill at the bottom shows where you are in line. The first person at a table runs its matches in their browser (on both the website and claude.ai); if they leave, the match ends and the next person takes over the table.
- **⛏️ Blockcraft** (in 🕹️ Games): a Minecraft-style building game. Six worlds (servers), each generated from its own seed with hills, beaches, water, snowy peaks, forests and ores; **Join a random world** or pick one. Everyone in a world sees each other (with name tags) and every block anyone places or breaks, live, and can chat (T). Worlds are **saved**: whoever has been in a world longest saves it every few seconds (on the website the chat server keeps it in `data/game-saves/`, on claude.ai it's stored with the page), so builds are still there next time. Controls: WASD move, mouse look (click the game; Esc lets go), Space jump (double-tap or F to fly; Space/Shift up/down), left click break, right click place, 1–9 or the wheel pick a block, E opens all 27 blocks, middle click copies a block, Ctrl sprint, F3 coordinates. A 15-minute day/night cycle is the same for everyone.
  - **Creative or Survival**: pick a mode on the world list (or switch from the pause menu). **Creative** is as above: every block, flying, nothing can hurt you. **Survival** has health and hunger (eat by right-clicking food), fall damage, and mining that takes time: hold the left button, and stone, ores and bricks need a pickaxe (wood → stone → iron → diamond) to drop anything. Blocks you place come out of your inventory. **E** opens your inventory and **crafting** (planks, sticks, pickaxes, swords, bricks, TNT, wool dyes…) and **smelting** with coal (iron and gold ingots, glass, cooked meat). Your inventory, health, food and position are saved per world.
  - **Mobs**: pigs, cows and sheep wander the grass by day (porkchops, beef, wool, mutton). At night **zombies**, **skeletons** (they shoot) and **creepers** (they hiss, swell and blow a crater) come out and hunt players in Survival; zombies and skeletons burn in the sunlight. Hit a mob by clicking it (swords hit harder). The player who's been in the world longest runs the mobs and shares them through the live room, so everyone sees the same ones; if they leave, the next player takes over where they were.
- **🧱 Bloxverse** (in 🕹️ Games): a Roblox-style hub. Dress up your avatar, then pick an experience and press **▶** to join the busiest server with room, or pick a server from the list. Third-person controls: WASD move, Space jump, drag to turn the camera, wheel to zoom, **/** to chat (with speech bubbles), **R** to reset your character, **Esc** for the menu. Phones and tablets get a joystick and a jump button. Each server has a live leaderboard. The home screen features the newest experience at the top, with a Play button.
  - **🪙 Blox Coins and cosmetics** — every experience pays Blox Coins (plus +50 a day for showing up). Spend them in the shop on the avatar screen: 16 hats, 11 faces, back items (cape, angel or bat wings, sword, backpack, jetpack, guitar), auras (sparkles, fire, hearts, snow, lightning, rainbow), shirt patterns and pets that follow you around. Colours and the original hats and faces stay free. Your outfit, coins and purchases are saved, and everyone sees what you wear.
  - **⚔️ Command an Army** — 3 v 3 battles (6 players per server; empty seats are filled with bots, so alone you get 2 bot allies against 3 bots). Attackers capture Point A, then B (which breaches the fort's gate), then the Base; defenders hold them off until time runs out (8 minutes, +2 for every capture). You ride a horse (G to get off) at the head of an army: X Hold, C Follow, V Attack, B Rush, Z changes formation (block, wedge, line). Fight with your class: click to attack, F or right mouse to block, Q to roll, H to heal. Camps move with the front; standing in yours refills your army, and 1–4 switch to another of your units there. Kill streaks (Rampage, Unstoppable, Merciless…), a scoreboard (Tab) and MVPs on a podium in the courtyard afterwards. Between battles: 10 units from ★2 to ★5 (summon them on the banner with gems; duplicates level them up), 3 classes, 4 mounts, a skill tree, a 30-level battle pass (gems, coins, units, a mount and a hat), daily quests, codes (try BLOXVERSE) and ranked rating on servers 5 and 6. All saved. The menus are the coloured buttons down the left; **Units** opens full screen, with your army of 4 along the top, every unit's 3D portrait, rarity, level and stats, filters, and Equip / Unequip / Command, and **Summon** is a full-screen banner that reveals what you pulled. After a battle a full-screen Victory or Defeat screen shows your troops and heroes defeated, points captured and rewards.
  - **🌱 Grow a Garden** — six plots per server; you get the first free one. Buy seeds at the Seed Shop (its stock restocks every 5 minutes, the same for everyone), plant them in your soil, and they grow in real time, even while you're away: carrots and watermelons harvest once, strawberries, apples and the rarer ones keep fruiting. Press E next to a ripe plant to harvest, sell at the Sell Stand for Sheckles. Gear: watering can, sprinklers and a shovel; eggs hatch pets with bonuses (faster growth, better prices, more mutations, free seeds). Weather (rain, thunderstorm, frost, golden hour) brings mutations worth up to 100×. Gardens are saved, and everyone sees everyone else's.
  - **🗼 Tower Defense Simulator** — co-op for up to 4. Vote Easy, Normal or Hard and press Ready, then place towers (1–5, click the ground; Shift to place several) along the path: Scout, Sniper, Soldier, Demoman and Farm, plus Freezer, Commander, Minigunner and Ranger unlocked with Blox Coins. Click a tower to upgrade it (U), change its targeting or sell it for a third. Each player has their own cash from kills, wave bonuses and farms. Enemies include hidden ones (only some towers see them), armored ones, splitters, a mini-boss and a final boss.
  - **🔥 Tower of Hell** — a new tower every round, stacked from random sections (stairways, fading steps, skinny beams, trusses, kill floors, spinners, elevators, bounce pads…), sometimes with a twist: speed, low gravity, high jump, fog, invisible or extra-long. No checkpoints: touch red and it's back to the bottom. Reach the top before the 6-minute timer runs out.
  - **🏃 Mega Obby** — 30 stages: gaps, lava with stepping stones, spinning bars, vanishing blocks, moving platforms, conveyors, narrow beams, kill-brick slaloms and bounce pads. Checkpoints save your stage, so you continue where you left off; the leaderboard shows everyone's stage, and finishing posts your time.
  - **💰 Cube Factory Tycoon** — four factories per server. Step on a free one's claim pad; droppers make cubes that ride the conveyor into the collector for cash, and the green pads buy more droppers, upgraders (×2), a faster conveyor, walls, a second floor, a golden statue and finally a rocket. Your cash and everything you bought are saved and come back when you claim a factory next time.
  - **🏷️ Tag Arena** — rounds of 90 seconds once 2 or more players are on the server. One player is IT (a little faster, frozen for a moment after being tagged); touch someone to pass it on. Every second you're not IT scores a point.
  - **🌋 Floor is Lava** — every round builds a new tower of platforms in a glass pit and the lava rises faster and faster. Last one standing wins (alone, see how long you last); players who are out, or arrive mid-round, watch from the balcony.
  - Tag, Floor is Lava, Tower of Hell, Tower Defense Simulator and Command an Army are run by whoever has been on the server longest (their browser simulates the enemies, soldiers and bots and shares them through the live room); if they leave, the next player carries on from the last state everyone saw.
- **🧠 Trivia Rush** (party game, 2–12 players): pick a server (or a random one), the host presses Start, and everyone answers the same 10 questions (from 150, in 13 categories). 15 seconds each; a right answer scores 500 plus up to 500 for speed, plus 100 per right answer in a row. Scores after each question and a podium at the end.
- **🕵️ Odd One Out** (party game, 3–10 players): everyone gets the same secret word except one player, who gets a similar one, and nobody knows which they are. Take turns giving a short clue, then vote. Catch the odd one and everyone who voted for them scores 100; if they get away they score 300; a caught odd one can still steal 200 by guessing everyone else's word. Three rounds, a different odd one each time.
- **🎨 Sketch & Guess** (party game, 2–10 players): take turns drawing. The drawer picks one of three words and draws it (12 colours including white to erase, 3 brush sizes, undo, clear, and an ink meter); everyone else types guesses. Guessing faster scores more (the first right guess gets a bonus), the drawer scores for everyone who gets it, wrong guesses show in the guess list, near misses say "is close!", and letters are revealed as time runs out. Everyone draws once (twice with 3 or fewer players).
- **🙋 Majority Rules** (party game, 2–12 players): 8 questions with no right answer ("Best pizza topping?"). Pick what you think most people will pick: the most popular answer scores 100 (+50 if everyone agrees), and a tie at the top scores nothing. Every fourth round is a **minority round**, where the least-picked answer scores 150.
- All four party games use the same servers as the other 🕹️ Games: the host runs the game in their browser, and if they leave, the next player carries on from where it was.
- **More 🕹️ Games**, each opened full-screen inside the chat (▁ Chat to minimise, ✕ Close to quit), all online on both the website and claude.ai, and each opens straight into its online mode:
  - **Tower Defense: Last Stand** — joining drops you on a random server (🎲 picks another random one; the numbered buttons pick a specific one).
  - **Bumper Crop** — now opens on a home screen with **Play** and the settings (farmer name, sound, save codes, start over). Play shows the server list; **Join a random server** puts you on a random one with room, or pick one yourself. The 💾 button in the game brings the home screen back.
  - **Duel Yard** — starts looking for a random opponent as soon as it opens (Cancel to practice vs the bot instead).
  - **Space Shooter** — opens on the **👥 Co-op** server list: join a random server (or pick one); up to 4 pilots fly the host's missions together, sharing one hull and one fuel tank. Enemies aim at whichever ship is closest; power-ups go to whoever grabs them.
  - **Tank Arena** — turrets no longer spin by themselves: **aim with the mouse and click (or hold) to fire**. Extra keyboard players on the same computer get a turret that tracks the nearest tank. Opens in **ONLINE** mode, which lists servers (Join a random server, or pick one); the first player on a server is the host, picks the battlefield and deploys (alone, you get a bot). Knocked-out players pick their upgrade on their own screen.
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
| 🚢 Battleship | Sink all 5 enemy ships first. Arrange your fleet (or Shuffle), press Ready, then take turns firing. Each player only ever sees their own fleet. | Click a square on the enemy grid |

Real-time games also have on-screen buttons for phones and tablets, except Apex Rush 3D, which needs a keyboard.

**Tower Defense**: each player defends their own map against the same 25 waves (boss waves 5, 10 and 25), and sees the other's towers and progress on a mini-map. Everyone starts with $350 and 100 lives, and has the same towers: Pistol $100 (no limit), Machine gun $250 (max 5), Sniper $200 (max 8, pierces armor), Flamethrower $150 (max 5, burns crowds) and Farm $75 (max 7, pays $25 after every wave, up to $250 fully upgraded), 20 towers in all. Every tower has 5 upgrades, each dearer than the last; you can sell a tower for 70% of what you put in. Waves start on their own after a short break (or press Space), and 1×/2×/3× speeds the game up. Whoever survives more waves wins (same wave: more kills); beating wave 25 wins outright. Every tower level has its own name and picture. Tower icons are from [game-icons.net](https://game-icons.net) by Lorc, Delapouite and contributors, used under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). The bot plays its own map: easy usually falls around wave 14, medium around 21, and hard beats wave 25.

**Apex Rush 3D online**: the game (`public/apex.html`) opens full-window. Whoever sent the challenge picks the circuit, direction, weather, pickups and laps; each player picks their own car; both press **Ready** and the countdown starts. Each browser drives its own car and streams it to the other about 20 times a second; Jolt and Oil pickups reach the other car too. If one player finishes, the other has 30 seconds to cross the line before the race is called.

**⧉ Pop out**: the ⧉ button in the top bar puts the chat in a small window of its own, so you can keep chatting (and get challenged) while you use other tabs. It's the same chat, signed in as you, with a compact top bar; the tab you popped it out of shows a note and stays quiet (no double pings), and **Bring it back** closes the small window. On the website, Chrome and Edge give you a floating window that stays on top of your other tabs and apps; other browsers get a small separate window. On claude.ai (which won't open its own pages in a pop-up from an artifact) ⧉ opens a blank window and starts a copy of the chat in it on your claude.ai connection — keep the claude.ai tab open (in the background is fine); in Chrome and Edge that window first offers **📌 Float on top**, or you can chat right there. If pop-ups are blocked, ⧉ tells you how to allow them.

**Sound effects**: every game has them, made on the fly in your browser (no sound files): moves, captures and checks, drops and flips, line clears, bounces and goals, punches, shots and explosions, coins and purchases, jumps, footsteps and the classic "oof" in Bloxverse, ticking clocks and right/wrong stings in the party games, and a fanfare when you win. The **🔊** button on the game panel (and on the bar above each full-window game) mutes or unmutes all of them at once, and the choice is remembered; Bloxverse's pause menu has the same switch.

**Playing the bot**: in **Request a game**, pick **Play the bot** and choose Easy, Medium or Hard. It's always there, and it's picked automatically when nobody else is online. It plays all 17 games (Apex Rush and Tower Defense use their own built-in bots) and runs in your own browser, so it works on both the website and claude.ai. Bot games don't count toward your win/loss record and aren't posted in the chat. Run `node test/bots.js` to check the bots' strength and speed.

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
- The 🤖 AI helper asks Claude straight from the page (the artifact's `sample` capability), so no API key is needed. Each person's questions use their own Claude plan, and claude.ai asks them to allow it the first time. It also works in the ⧉ popped-out window, which asks through the claude.ai tab (keep that tab open).

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

### Turn on the AI helper

On the website, the 🤖 AI helper's questions go through your server to Claude, so the server needs an Anthropic API key:

1. Make a key at [platform.claude.com](https://platform.claude.com) (API keys). Questions are billed to that account.
2. Set it as the `ANTHROPIC_API_KEY` environment variable and restart the server, for example `ANTHROPIC_API_KEY=sk-ant-... npm start`. On Render, add it under your service's **Environment** tab.

Without a key everything else works, and the AI helper says it isn't switched on yet. The model is set by `AI_MODEL` in `server.js`. If Claude declines a question, Anthropic's server-side fallback retries it on the model Anthropic recommends for that case. To keep costs in check each person can ask up to 30 questions every 15 minutes, one at a time, and only the latest part of a long conversation is sent.

## Tests

```bash
npm test
```

This checks the game rules, then runs two simulated players against a real server. They sign up, chat, create rooms, and play chess, tetris and snake.

## How it's built

- `server.js`: HTTP server plus WebSocket (`ws`). It handles accounts, rooms, presence, challenges and game sessions. Passwords are hashed with scrypt.
- `shared/rules.js`: chess, checkers, connect four and tic-tac-toe rules. The server uses them to validate every move, and the browser uses them to highlight legal moves.
- `realtime.js`: snake, pong and the fighting game run on the server (server-authoritative), so neither player can cheat. For Tetris, each player's board runs in their own browser and the server passes junk rows between them.
- `public/`: the web client (`index.html`, `style.css`, `app.js` for the chat, `games.js` for the game renderers, `ai.js` for the 🤖 AI helper, `tools.js` for the 🧰 Tools).
- `shared/ai-guide.js`: what the AI helper is told about itself and Game Chat. The server's `POST /ai` sends it with each question to Claude (using `@anthropic-ai/sdk`) and streams the answer back.
