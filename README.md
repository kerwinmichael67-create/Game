# Last Stand — 3D Tower Defense

A browser tower-defense game in the spirit of Roblox's *Tower Defense Simulator*: a
walkable 3D lobby with kiosks, a tower shop, a five-slot loadout, blocky characters,
wave-based battles with bosses, hidden and flying enemies, upgrade paths, abilities
and unit-spawning towers.

It is an original game inspired by that genre — every tower, enemy, map and ability
here has its own name, art and stat line. Nothing is copied from another game.

**No build step, no dependencies to install, no network needed.** Open `index.html`
and play.

```
git clone <this repo>
cd Game
# either double-click index.html, or serve it:
npx http-server -p 8080 -c-1 .
```

Any modern desktop browser with WebGL works (Chrome, Edge, Firefox, Safari). It also
runs on a phone or tablet — an on-screen joystick appears in the lobby.

### One-file version

`laststand.html` is the whole game — stylesheet, three.js and every script — inlined
into a single 907 KB file with no external references of any kind. Email it, drop it
on a USB stick, or open it straight off the desktop; it works with the network
switched off.

It is generated, not hand-written. Edit the sources and regenerate:

```
node build-single.js              # -> laststand.html
node build-single.js out.html     # -> somewhere else
```

---

## What's in it

### The lobby
A 3D plaza you walk around in third person with a blocky character. WASD to move,
`Space` to jump, `Shift` to sprint, drag to orbit the camera, mouse wheel to zoom.
Walk up to a kiosk and press `E`, or use the buttons down the left side.

Four kiosks: **Shop**, **Loadout**, **Codex**, **Options**, plus a **Play** portal.
NPCs wander the plaza, and your character's hat changes as you level up.

### 51 towers
Every tower has five levels (placement plus four upgrades), each with its own name,
description and stat line. Towers are grouped by role:

| Role | Towers |
| --- | --- |
| **Starter** | Recruit, Rifleman, Splatter |
| **DPS** | Militia, Bowman, Scattergun, Marksman, Chaingunner, Longshot, Sentry, Headsman, Particle Lance, Soul Harvester |
| **Explosive** | Bomber, Rocketman, Howitzer, Pyrotechnician |
| **Elemental** | Flamecaster, Chiller, Glacier Blaster, Venom Gunner, Zapper, Elementalist |
| **Melee** | Reaper, Slammer, Pugilist, Champion |
| **Support** | Captain, Boombox, Field Medic, Marshal, Harlequin, Spook Punk |
| **Economy** | Homestead, Gunslinger, Syndicate Boss |
| **Spawner** | Barracks, Merc Camp, Mech Bay, Yule Camp, Mechanic, Bonecaller, Hivemind |
| **Air** | Sky Ace, Gunship |
| **Trap** | Snare Setter |
| **Golden** | Gilded Recruit, Scattergun, Marksman, Bomber and Chaingunner (bought with gems) |

They don't all just shoot. The set covers projectiles, hitscan pellets, lobbed
artillery with a minimum range, flame cones, chain lightning, charging beams that ramp
up the longer they fire, area freezes, poison and bleed, melee cleaves, ground slams,
auras that buff nearby towers, passive income, base healing, path traps, aircraft that
circle or hover over the map, sentries that get bolted together on site, soldiers that
march up the path and physically block enemies, drones that chase targets through the
air, and a Bonecaller that raises dead enemies to fight for you.

Three towers carry an activated ability on a cooldown: the Captain's **Rally**, the
Sky Ace's **Airstrike** and the Field Medic's **Emergency Triage**.

### 33 enemies
Grunts, Runners, Sprinters, Lumberers, Hardhats, Oozes that split when killed,
Detonators that explode and jam your towers, Menders that heal the pack, Jammers that
shut towers down, armoured Shieldbearers, fire-immune Cinders and Magma Hulks,
freeze-immune Frostlings, Revenants that come back once, and more.

Two properties change how you build:

* **Hidden** enemies (Phantom, Wraith, Revenant, Rift Hound, and several bosses) can
  only be targeted by towers with detection — or by anything inside a Marshal's aura.
* **Flying** enemies (Drone, Sky Skiff, Wraith, Rift Reaver) can't be hit by
  artillery, melee or traps. Most ranged towers learn to track them at level 2.

Ten bosses anchor the late waves, ending with the **Forsaken King** and the
**Umbral Titan**. Bosses summon reinforcements, jam towers, heal, resist stuns and
carry their own health bars.

### 7 maps × 5 difficulties
Crossroads, Harbor Point, Pine Hollow, Sunken Temple (two converging paths),
Frostbite Pass, Molten Core and Rift Nexus (two separate paths feeding one core).
Each has its own palette, scenery and hazards; water and lava block building.

Difficulty sets the wave count, enemy health, starting cash, base HP and payout:

| | Waves | Enemy HP | Start | Base HP | Reward |
| --- | --- | --- | --- | --- | --- |
| Rookie | 20 | ×0.65 | $1,500 | 180 | ×0.7 |
| Standard | 30 | ×1.0 | $1,200 | 140 | ×1.0 |
| Molten | 35 | ×1.9 | $1,000 | 115 | ×1.7 |
| Forsaken | 40 | ×3.4 | $900 | 95 | ×2.6 |
| Nightmare | 45 | ×6.5 | $800 | 75 | ×4.2 |

Every mode ends on a boss wave, and the harder modes mix extra enemy types into the
ordinary waves.

### Your character in battle
The same blocky character you walk around the lobby with is on the battlefield too,
and you can walk it around while the towers fight. It is purely your avatar — enemies
ignore it, it blocks nothing, and it never touches the simulation. Walking makes the
camera follow you; the arrow keys, a middle-drag or `C` hand the camera back.

### Servers and online co-op
**You do not arrange anything.** The game joins a server as it starts — Server 1
unless you moved — and everyone on that server is standing in the same plaza,
walking around with their name and colour over their head. Open the page on two
machines and you are together; nothing to type, no code to swap.

The banner across the top of the plaza names your server and its headcount; click
it, or the SERVERS button, to move. There are eight public servers, and a private
room behind a four-letter code for when you want just your friends — same thing,
under a name only they know. Your choice is remembered for next time.

A plaza has **no host**. Pressing *Choose map & deploy* claims the host seat for
the length of that match and takes everybody on the server in with you; when the
match ends the seat is given up again. Up to six players.

Each player has **their own wallet** and **their own towers** — you spend your own
money, and only you can upgrade, sell or trigger the ability on a tower you built.
The base HP is shared, because the base is. Kills pay whoever owns the tower that
got them; the wave bonus pays everyone, and everyone is paid coins and XP when the
match ends. Anyone can start the next wave early; pause and game speed belong to the
host, since they move the world everybody is looking at.

If the host leaves mid-match the match ends for everyone — nobody inherits a
half-finished world. A player who arrives after a match has started watches rather
than plays; they join the next one.

### Team chat
Chat is always there, because you are always on a server: it sits at the edge of
the plaza, moves aside for the build bar during a match, and docks inside the
servers panel while that is open. Collapse it and it keeps an unread count. `Y`
focuses the input, `Z` opens a strip of quick phrases ("Need cash", "Watch the
air", …).

Joins, leaves, waves and the result appear as system lines. Those are worked out
locally by every page from what it already knows, so they cost no network traffic
and nobody can forge one. Quick chat travels as an index into a fixed table rather
than as text, so what arrives is a number and the wording comes from the receiving
page. Both ends are rate limited — the room's send budget is shared with the
commands that actually run the match.

Co-op needs a transport, and the game picks one at startup:

* On the **published claude.ai page**, it uses that page's `room` capability, so
  anyone you have shared the page with can join your room from their own machine.
  They need at least *Contributor* access — the platform will not let a view-only
  visitor send anything, so they can watch but not build (the game says so if it
  happens).
* Anywhere else — a local file, GitHub Pages — it falls back to `BroadcastChannel`,
  which reaches **other tabs of the same browser only**. Useful for trying it out;
  not actually online.

The co-op panel tells you which of the two you are on before you host.

### Profiles and signing in
Settings → the card at the top. Two different things live there, and they are not
the same thing:

* **Profiles.** Several people sharing one browser can each have their own coins,
  unlocks and stats. Create one, switch between them, give one a passcode. The
  passcode stops a sibling opening your save by accident — it is **not security**:
  the save lives in this browser, the check runs in this browser, and anyone who
  opens the devtools walks straight past it. The panel says so.
* **Your Claude account.** On the published page the viewer is already signed in to
  claude.ai, and the game asks the platform who they are through the `user`
  capability. That identity is real, because the platform vouches for it rather than
  the page. The card shows it, and one click adopts that name as your display name
  for co-op.

Everything without a profile stays in the original "guest" save, so a player who had
progress before any of this keeps it.

### Progression
Matches pay out coins and XP. Coins unlock towers in the shop; some towers also need
a player level, and the Gilded ones cost gems (earned by clearing Forsaken and
Nightmare). Everything is saved to `localStorage`, with an in-memory fallback if the
browser blocks it. Options → *Reset save data* wipes the profile you are on.

---

## Controls

**Lobby** — `W A S D` move · `Space` jump · `Shift` sprint · `E` use kiosk ·
drag to look · wheel to zoom

**Battle**

| | |
| --- | --- |
| `1`–`5` | select tower to build |
| Click | place tower / select a built tower |
| `Shift` while placing | keep building the same tower |
| `Q` | upgrade selected · `X` sell (65% refund) |
| `T` | cycle targeting: First / Last / Strongest / Weakest / Closest |
| `F` | use the selected tower's ability |
| `W A S D` | walk your character · `Space` jump · `Shift` sprint |
| `C` | toggle whether the camera follows your character |
| `Enter` | start the next wave early for a cash bonus |
| `P` | pause · the HUD button cycles 1× / 2× / 3× speed |
| Right-drag | rotate camera · wheel zoom · arrows or middle-drag to pan |
| `Esc` | cancel placement / deselect |
| `Y` | chat (co-op only) |

---

## How it's put together

```
index.html          markup and the HUD
styles.css          all UI styling
vendor/three.min.js three.js r158 (MIT), vendored so the game works offline
js/util.js          maths, save data, synthesized WebAudio sound, toasts
js/models.js        every 3D model, built procedurally from primitives
js/data/towers.js   the 51 tower definitions
js/data/enemies.js  the 33 enemy definitions
js/data/maps.js     maps, themes, difficulties, path maths
js/data/waves.js    the 45-wave script and the scaling rules
js/account.js       profiles on this browser, and the real claude.ai identity
js/net.js           co-op transport: the artifact room, or BroadcastChannel
js/lobby.js         the plaza, the player controller, kiosks
js/battle.js        the match: placement, towers, enemies, units, waves
js/coop.js          co-op session: roster, snapshots, commands
js/chat.js          the team chat panel, quick chat and system lines
js/ui.js            menus, shop, loadout, codex, battle HUD
js/main.js          renderer, game loop, scene switching

build-single.js     bundles all of the above into laststand.html
laststand.html      generated single-file build — don't edit by hand
```

There are no art or audio assets. Every model is assembled from boxes, cylinders,
spheres and cones at runtime; sound effects and the lobby music are synthesized with
the Web Audio API; text that appears in the 3D world (kiosk signs, your nametag) is
drawn to a canvas and used as a texture.

A few implementation notes worth knowing if you plan to change things:

* The simulation runs in fixed sub-steps of at most 50 ms. The speed multiplier adds
  sub-steps rather than lengthening them, so a tower with a 0.07 s cooldown still
  fires at its full rate at 3× speed.
* Geometries that are shared out of a cache are tagged `__shared` and are never
  disposed by the effect pool; projectiles reuse one geometry per radius.
* Shop and codex thumbnails are rendered once by a single offscreen WebGL renderer
  and cached as data URLs, so hundreds of cards cost one context.
* Shadows, scenery density and damage numbers can be turned down in Options if a
  machine struggles.
* Co-op is host-authoritative. The host runs the ordinary simulation and publishes a
  packed snapshot of it; clients simulate nothing and send what their player did as a
  command, which the host re-checks against its own world before applying. Nothing
  arriving from the room is trusted.
* That snapshot travels in room *presence*, which is capped at 4 KiB, so the world is
  packed as fixed-width base36 records rather than JSON: 11 characters per enemy, 10
  per tower. An enemy is sent as a distance along its path, and the client places it
  with the same `pathPoint` the host used, so the two agree exactly; between snapshots
  the client advances each enemy at its own speed and eases onto the next one. Measured
  drift is under half a unit.
* When a wave is big enough to overflow the budget, the enemies nearest the base are
  packed first and the tail is dropped — at 545 enemies the payload settles around
  3.4 KiB and clients render the leading ~290.

## Licence

The game code is yours to do as you like with. `vendor/three.min.js` is three.js,
© three.js authors, MIT — see `vendor/three.LICENSE`.
