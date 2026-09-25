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

### Progression
Matches pay out coins and XP. Coins unlock towers in the shop; some towers also need
a player level, and the Gilded ones cost gems (earned by clearing Forsaken and
Nightmare). Everything is saved to `localStorage`, with an in-memory fallback if the
browser blocks it. Options → *Reset save data* wipes it.

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
| `Space` | start the next wave early for a cash bonus |
| `P` | pause · the HUD button cycles 1× / 2× / 3× speed |
| Right-drag | rotate camera · wheel zoom · arrows or middle-drag to pan |
| `Esc` | cancel placement / deselect |

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
js/lobby.js         the plaza, the player controller, kiosks
js/battle.js        the match: placement, towers, enemies, units, waves
js/ui.js            menus, shop, loadout, codex, battle HUD
js/main.js          renderer, game loop, scene switching
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

## Licence

The game code is yours to do as you like with. `vendor/three.min.js` is three.js,
© three.js authors, MIT — see `vendor/three.LICENSE`.
