// The land must never cover the track. On every circuit, at both quality levels, the terrain has to stay
// below the road, the kerbs and the shoulders, and nothing may hide the tarmac when seen from above.
// Also guards the things that caused the original bug: the nearest-sample search and the depth precision
// of the bloom render target.
import { open, check, finish, installHelpers } from './harness.mjs';
const { page, close, errors } = await open();
await page.evaluate(installHelpers);

const ids = await page.evaluate(() => TRACKS.map((t) => t.id));
check('there are circuits to test', ids.length >= 3, ids.join(','));

for (const quality of ['high', 'low']) {
  for (const id of ids) {
    const r = await page.evaluate(
      ({ id, quality }) => {
        Game.world.setQuality(quality);
        T.start({ mode: 'trial', trackId: id, laps: 1 });
        const t = Game.track,
          w = Game.world,
          te = w.terrain,
          C = t.halfWidth + t.wallOffset,
          out = { quality: w.quality };

        /* 1. nearest(): must agree with a brute-force search everywhere, near the road and far from it */
        const R = rng(1234);
        let minX = 1e9,
          maxX = -1e9,
          minZ = 1e9,
          maxZ = -1e9;
        for (const p of t.center) {
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minZ = Math.min(minZ, p.z);
          maxZ = Math.max(maxZ, p.z);
        }
        const brute = (x, z) => {
          let bd = Infinity;
          for (const p of t.center) bd = Math.min(bd, (p.x - x) ** 2 + (p.z - z) ** 2);
          return Math.sqrt(bd);
        };
        let nearestBad = 0,
          nearestWorst = 0;
        const probe = (x, z) => {
          const i = t.nearest(x, z),
            d = Math.hypot(t.center[i].x - x, t.center[i].z - z),
            b = brute(x, z);
          if (d - b > 1e-6) {
            nearestBad++;
            nearestWorst = Math.max(nearestWorst, d - b);
          }
        };
        for (let k = 0; k < 4000; k++) probe(minX - 400 + R() * (maxX - minX + 800), minZ - 400 + R() * (maxZ - minZ + 800));
        for (let i = 0; i < t.n; i++)
          for (const lat of [-C, -C / 2, 0, C / 2, C]) probe(t.center[i].x + t.right[i].x * lat, t.center[i].z + t.right[i].z * lat);
        out.nearestBad = nearestBad;
        out.nearestWorst = nearestWorst;

        /* 2. the mesh: finite everywhere, within budget */
        const pos = te.mesh.geometry.attributes.position.array;
        let nonFinite = 0;
        for (let k = 0; k < pos.length; k++) if (!isFinite(pos[k])) nonFinite++;
        out.nonFinite = nonFinite;
        out.triangles = te.triangles;

        /* 3. clearance: the land against the road surface across the whole corridor, on and between samples */
        let worstGap = Infinity,
          worstAt = '',
          points = 0;
        for (let i = 0; i < t.n; i++) {
          const j = (i + 1) % t.n;
          for (const f of [0, 0.5]) {
            const cx = lerp(t.center[i].x, t.center[j].x, f),
              cz = lerp(t.center[i].z, t.center[j].z, f),
              rx = lerp(t.right[i].x, t.right[j].x, f),
              rz = lerp(t.right[i].z, t.right[j].z, f);
            for (let lat = -C - 0.3; lat <= C + 0.3; lat += 0.4) {
              const y = lerp(t.heightAt(i, lat), t.heightAt(j, lat), f),
                g = w.groundY(cx + rx * lat, cz + rz * lat),
                gap = y - g;
              points++;
              if (!(gap >= worstGap)) {
                worstGap = gap;
                worstAt = `sample ${i}+${f} lat ${lat.toFixed(1)}`;
              }
            }
          }
        }
        out.points = points;
        out.worstGap = worstGap;
        out.worstAt = worstAt;

        /* 4. seen from straight above, the first surface must be the road, a kerb or a shoulder: never the land.
              Uses the real meshes, so it also proves heightAt() and the rendered triangles agree. */
        const named = (n) => w.trackGroup.children.filter((o) => o.name === n);
        const surfaces = [...named('terrain'), ...named('road'), ...named('kerb'), ...named('shoulder')];
        out.surfaceCounts = ['terrain', 'road', 'kerb', 'shoulder'].map((n) => n + ':' + named(n).length).join(' ');
        w.trackGroup.updateMatrixWorld(true);
        const ray = new THREE.Raycaster(),
          down = new THREE.Vector3(0, -1, 0),
          from = new THREE.Vector3();
        let rays = 0,
          landFirst = 0,
          noHit = 0,
          meshMismatch = 0,
          firstBad = '';
        const lats = [-C + 0.2, -t.halfWidth - 1.6, -t.halfWidth - 0.5, -t.halfWidth + 0.3, -t.halfWidth / 2, 0, t.halfWidth / 2, t.halfWidth - 0.3, t.halfWidth + 0.5, t.halfWidth + 1.6, C - 0.2];
        for (let i = 0; i < t.n; i += 9) {
          for (const lat of lats) {
            const x = t.center[i].x + t.right[i].x * lat,
              z = t.center[i].z + t.right[i].z * lat;
            from.set(x, 60, z);
            ray.set(from, down);
            const hits = ray.intersectObjects(surfaces, false);
            rays++;
            if (!hits.length) {
              noHit++;
              continue;
            }
            if (hits[0].object.name === 'terrain') {
              landFirst++;
              if (!firstBad) firstBad = `sample ${i} lat ${lat.toFixed(1)}`;
            }
            const land = hits.find((h) => h.object.name === 'terrain');
            if (!land || Math.abs(land.point.y - w.groundY(x, z)) > 0.01) meshMismatch++;
          }
        }
        out.rays = rays;
        out.landFirst = landFirst;
        out.firstBad = firstBad;
        out.noHit = noHit;
        out.meshMismatch = meshMismatch;

        /* 5. no cracks where fine cells meet coarse ones: heights agree either side of every cell border */
        let cracks = 0;
        const e = 1e-3;
        for (let cz = 1; cz < te.nz; cz++)
          for (let cx = 1; cx < te.nx; cx++) {
            const x = te.x0 + cx * te.CS,
              z = te.z0 + cz * te.CS;
            for (let k = 0; k < 8; k++) {
              const s = ((k + 0.37) / 8) * te.CS;
              if (Math.abs(te.heightAt(x - e, z + s) - te.heightAt(x + e, z + s)) > 0.02) cracks++;
              if (Math.abs(te.heightAt(x + s, z - e) - te.heightAt(x + s, z + e)) > 0.02) cracks++;
            }
          }
        out.cracks = cracks;

        /* 6. scenery: every tree, rock, building and lamp stands outside the barriers with its whole bulk
              (rocks, buildings and pine canopies have a footprint), none is left at the origin, none is in the sea */
        const m4 = new THREE.Matrix4(),
          v = new THREE.Vector3(),
          q4 = new THREE.Quaternion(),
          sc = new THREE.Vector3();
        let props = 0,
          onTrack = 0,
          atOrigin = 0,
          inSea = 0,
          firstProp = '';
        w.trackGroup.traverse((o) => {
          if (!o.isInstancedMesh) return;
          for (let k = 0; k < o.count; k++) {
            o.getMatrixAt(k, m4);
            m4.decompose(v, q4, sc);
            props++;
            if (v.x === 0 && v.z === 0) atOrigin++;
            let reach = 0.4;
            if (o.name === 'rocks') reach = 1.4 * Math.max(sc.x, sc.z);
            else if (o.name === 'buildings') reach = Math.hypot(sc.x, sc.z) / 2;
            else if (o.name === 'canopy') reach = o.geometry.parameters.radius * sc.x;
            if (!t.clear(v.x, v.z, reach)) {
              onTrack++;
              if (!firstProp) firstProp = `${o.name || o.geometry.type} #${k}`;
            }
            if (v.x > te.waterStart && te.heightAt(v.x, v.z) < te.waterLevel + 0.3) inSea++;
          }
        });
        out.props = props;
        out.onTrack = onTrack;
        out.firstProp = firstProp;
        out.atOrigin = atOrigin;
        out.inSea = inSea;

        /* 7. the sea never laps over the circuit, and its inland edge is hidden under dry land */
        out.waterLevel = te.waterLevel;
        out.hasWater = named('water').length;
        let lowRoad = Infinity,
          lowShore = Infinity;
        if (out.hasWater) {
          for (let i = 0; i < t.n; i++)
            if (t.center[i].x + C + 5 > te.waterStart) lowRoad = Math.min(lowRoad, t.heightAt(i, -C), t.heightAt(i, C));
          for (let z = te.z0 + 1; z < te.z0 + te.nz * te.CS; z += 3) lowShore = Math.min(lowShore, te.heightAt(te.waterStart + 0.5, z));
        }
        out.lowRoad = lowRoad;
        out.lowShore = lowShore;

        /* 8. depth precision of whatever the scene is rendered into */
        const gl = w.renderer.getContext();
        out.composer = !!w.composer;
        if (w.composer) {
          Game.headless = false;
          Game.frame(1 / 60);
          Game.headless = true;
          w.renderer.setRenderTarget(w.composer.renderTarget1);
          out.depthBits = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE);
          w.renderer.setRenderTarget(null);
        } else out.depthBits = gl.getParameter(gl.DEPTH_BITS);
        out.near = w.camera.near;
        return out;
      },
      { id, quality }
    );
    const tag = `${id}/${quality}`;
    check(`${tag}: quality applied`, r.quality === quality, r.quality);
    check(`${tag}: nearest() matches brute force`, r.nearestBad === 0, `${r.nearestBad} wrong, worst by ${r.nearestWorst.toFixed(1)} m`);
    check(`${tag}: terrain mesh is finite`, r.nonFinite === 0, `${r.nonFinite} bad values`);
    check(`${tag}: terrain within triangle budget`, r.triangles > 2000 && r.triangles < 80000, r.triangles);
    check(`${tag}: land stays at least 0.2 m under the road corridor`, r.worstGap >= 0.2, `min gap ${r.worstGap.toFixed(3)} m at ${r.worstAt} over ${r.points} points`);
    check(`${tag}: road, kerbs and shoulders exist as named meshes`, /terrain:1 road:1 kerb:2 shoulder:2/.test(r.surfaceCounts), r.surfaceCounts);
    check(`${tag}: from above the land is never the first surface`, r.landFirst === 0 && r.noHit === 0, `${r.landFirst}/${r.rays} rays hit land first${r.firstBad ? ' (' + r.firstBad + ')' : ''}, ${r.noHit} hit nothing`);
    check(`${tag}: heightAt() agrees with the rendered triangles`, r.meshMismatch === 0, `${r.meshMismatch}/${r.rays}`);
    check(`${tag}: no cracks between coarse and fine cells`, r.cracks === 0, r.cracks);
    check(`${tag}: scenery stands clear of the track`, r.props > 50 && r.onTrack === 0 && r.atOrigin === 0, `${r.props} props, ${r.onTrack} reach the barriers${r.firstProp ? ' (' + r.firstProp + ')' : ''}, ${r.atOrigin} at the origin`);
    check(`${tag}: no scenery stands in the sea`, r.inSea === 0, r.inSea);
    if (r.hasWater) {
      check(`${tag}: the sea stays below the road corridor`, r.waterLevel < r.lowRoad - 0.6, `water ${r.waterLevel.toFixed(2)}, lowest road edge near the sea ${r.lowRoad.toFixed(2)}`);
      check(`${tag}: the inland edge of the sea is under dry land`, r.lowShore > r.waterLevel + 0.2, `lowest land on the edge ${r.lowShore.toFixed(2)}, water ${r.waterLevel.toFixed(2)}`);
    }
    check(`${tag}: at least 24 depth bits`, r.depthBits >= 24, `${r.depthBits} bits, composer ${r.composer}`);
    check(`${tag}: near plane keeps depth precision`, r.near >= 0.5, r.near);
  }
}

/* driving: the car's wheels stay above the land for a whole lap, including the banked corners */
const lap = await page.evaluate(() => {
  Game.world.setQuality('high');
  T.start({ mode: 'trial', trackId: 'alpine', laps: 1 });
  T.autopilot(true, 2);
  const p = Game.player,
    w = Game.world;
  let minClear = Infinity,
    frames = 0;
  for (; frames < 20000 && !Game.results; frames++) {
    Game.frame(1 / 60);
    if (Game.state === 'racing') minClear = Math.min(minClear, p.pos.y - w.groundY(p.pos.x, p.pos.z));
  }
  return { finished: !!Game.results, frames, minClear };
});
check('a full lap finishes on the new terrain', lap.finished, `${lap.frames} frames`);
check('the car never sinks into the land', lap.minClear > 0.2, `min clearance ${lap.minClear.toFixed(2)} m`);

/* the time-trial ghost follows the banked surface instead of a fixed height */
const ghost = await page.evaluate(() => {
  /* a recorded lap that parks the ghost on the inside of the most banked corner */
  const t0 = new Track(TRACKS.find((d) => d.id === 'alpine'));
  let b = 0;
  for (let i = 0; i < t0.n; i++) if (Math.abs(t0.bank[i]) > Math.abs(t0.bank[b])) b = i;
  const lat = (t0.bank[b] > 0 ? -1 : 1) * t0.halfWidth * 0.7,
    c0 = t0.point(b, lat),
    rec = [];
  for (let k = 0; k < 20; k++) rec.push([c0.x, c0.z, t0.yawAt(b), k * 5]);
  Profile.data.ghosts = Object.assign({}, Profile.data.ghosts, { alpine: rec });
  T.start({ mode: 'trial', trackId: 'alpine', laps: 1 });
  const t = Game.track,
    c = t.point(b, lat);
  if (!Game.ghost) return { has: false };
  T.run(260);
  return { has: true, state: Game.state, y: Game.ghost.mesh.position.y, want: c.y, roll: Game.ghost.mesh.rotation.z, bank: t.bank[b], visible: Game.ghost.mesh.visible };
});
if (ghost.has) {
  check('ghost sits on the banked surface', Math.abs(ghost.y - ghost.want) < 0.15 && Math.abs(ghost.want) > 0.5, `y ${ghost.y?.toFixed(2)} want ${ghost.want?.toFixed(2)} (${ghost.state})`);
  check('ghost leans with the banking', Math.abs(ghost.roll + ghost.bank) < 0.03, `roll ${ghost.roll?.toFixed(3)} bank ${ghost.bank?.toFixed(3)}`);
} else check('ghost car exists in time trial', false, 'Game.ghost missing');

check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 300));
await close();
finish();
