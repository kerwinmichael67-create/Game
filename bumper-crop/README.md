# Bumper Crop Online

Bumper Crop with online multiplayer.

- **4 plots per server.** Up to four farmers share one yard. Plot 1 is top left, 2 is top right, 3 is bottom right and 4 is bottom left. Each plot has its own colour and a signboard with the owner's name.
- **Stalls around the yard.** Seeds, Gear, Market and Eggs are along the top. Upgrades, Harvest and Farmers (crew) are along the bottom. A path runs between the plots.
- **Server switching.** Click the server button at the top of the screen to see every server, who is on it, how many plots are free and what the weather is there, then press **Join**. Your coins, seeds, pets and plants go with you. If a server is full, the game puts you on the next one with room.
- **Chat.** Each server has its own chat. Press **Enter** or **T** to type, and **Enter** to send. Messages also show as speech bubbles over the player's head. On phones, open chat with the chat button on the right. The chat also posts when someone picks a rainbow crop, gets a rare pet or extends their plot.

Your farm is saved in your browser. If the game server can't be reached, the game still works offline and keeps trying to reconnect.

## Play from a link (no server needed)

The game is published on claude.ai at https://claude.ai/artifact/EbZ9Hs3pRP6S6FCa8mQTWu. There, it uses claude.ai's live room instead of this Node server: each server is a room, and players' names, plots, positions, a packed copy of their farm and their chat all travel as live "presence". Everyone who opens the link while signed in to claude.ai (and has been given access through the page's Share menu) plays together. In this mode, chat history isn't kept, so people who join later won't see earlier messages, and other players' crops show approximate sizes.

## Run it

You need Node.js 18 or newer.

```bash
npm install
npm start
```

Open http://localhost:3000. To try multiplayer on one computer, open it in a second browser or a private window (each browser has its own save and name).

## Put it online

Deploy the repo to any Node host that supports WebSockets (Render, Railway, Fly.io, a VPS and so on):

- Build command: `npm install`
- Start command: `npm start`
- The server listens on the `PORT` environment variable.

Optional settings:

- `SERVER_NAMES`: a comma-separated list of server names, for example `SERVER_NAMES="Meadow,Orchard,Barnyard"`.

If the page is hosted somewhere other than the game server, add `?server=wss://your-game-server.example.com/ws` to the page URL, or type the address under **Servers → Game server address**.

## How it fits together

- `server.js`: serves the page and runs the WebSocket at `/ws`. It keeps the list of servers, gives each player a plot, passes farm snapshots, positions and chat between players in the same server, and limits how fast each player can chat. `/api/servers` returns the list as JSON.
- `public/index.html`: the game. Each browser runs its own farm and sends a snapshot of it whenever it changes, so the other players can see your crops grow. Shop restocks use the server's clock, so everyone sees the same stock at the same time. Each server has its own weather.
