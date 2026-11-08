# Gölgedeki Miras — Nexora Game Art Studio pipeline

## Goal

Add Leonardo-assisted art production without replacing the existing playable prototype, camera, HUD, simulation, save system, or input behavior. The initial target is the current Three.js/Vite browser game.

## Existing project constraints

- The live visual prototype is currently bootstrapped from `src/main.ts`, which imports `src/main.js`.
- `src/main.js` owns the current renderer, isometric orthographic camera, lights, procedural castle/buildings/units, pointer controls, HUD wiring, and animation loop.
- The modular TypeScript layer has a separate `SceneManager`, `World`, `Terrain`, and camera helpers. Do not assume this second scene is currently the rendered scene.
- Preserve existing scene colors, orthographic/isometric framing, low-poly silhouette language, selection behavior, construction placement, resource UI, and save/simulation logic.
- Do not remove procedural geometry until a replacement asset is approved and visually checked in the actual game.

## Art direction baseline

Use the existing prototype as the source of truth:
- Low-poly medieval kingdom; readable, slightly stylized silhouettes.
- Muted forest greens, warm stone grey, dark timber, restrained red banners, aged gold accents.
- Soft warm directional sunlight, readable shadows, atmospheric distance fog.
- Orthographic/isometric composition; assets must read clearly from the current elevated camera.
- Avoid photorealistic materials, noisy micro-detail, excessive emissive effects, and high-frequency textures that fight the current style.

## Production order

1. **Small props:** torches, barrels, crates, carts, market goods, fences, rocks. Safest first integration test.
2. **Vegetation and terrain dressing:** trees, shrubs, rocks and small ground details; keep silhouettes and color range consistent.
3. **Buildings:** house, farm, lumber camp, quarry, market; preserve each building's footprint and selectable gameplay area.
4. **Castle kit:** keep, towers, walls, gate, roof and banners. Replace only as a complete tested set; preserve the current castle footprint and interaction targets.
5. **Characters:** royal guard, villagers, commander and enemies. Confirm scale, pivot, orientation and future rigging needs before replacing procedural units.
6. **Story/cinematic assets:** character portraits, dialogue illustrations, location establishing images and trailer shots.

## Leonardo production brief

For each asset, create:
- one clean reference render with a plain or transparent background when supported;
- a stable asset ID and immutable version;
- a prompt that repeats the shared low-poly medieval art direction;
- a negative prompt to avoid text, watermarks, floating parts, inconsistent perspective and unwanted background clutter;
- GLB output with PBR materials when a 3D API bridge is available;
- a preview image and an approval note before runtime use.

Keep one canonical reference for recurring characters and buildings. New variants may change pose, damage state or season, but not the approved silhouette, palette, proportions or signature details without an explicit art-direction revision.

## Three.js runtime contract

The initial integration adds a small GLB catalog layer:
- `src/assets/assetTypes.ts`: typed and path-validated asset metadata.
- `src/assets/AssetCatalog.ts`: loads approved GLB files into a caller-provided `THREE.Group`.
- `src/assets/assetManifest.ts`: project asset registry; remains empty until files are approved.
- `public/assets/generated/`: versioned runtime GLB files.

The catalog does not create a renderer, scene, camera or animation loop. It must be mounted into the actual rendered world group only after the existing dual-entry scene flow is reconciled. Until then, keep the loader isolated and do not change `src/main.js` or `src/main.ts` bootstrapping.

## Initial performance budgets (provisional)

These are starting review limits, not guaranteed engine constraints:
- Small prop: target up to 2k triangles.
- Common building: target up to 8k triangles.
- Large castle set: split into modular pieces; target up to 25k triangles per major set.
- Character: target up to 12k triangles before LOD review.
- Texture maps: start at 512–1024 px; avoid 2K+ unless close-up use is proven.
- Prefer shared materials, atlases, compressed textures and instancing for repeated props.
- Validate frame time, draw calls, memory and visual quality on both desktop and a mid-range mobile device.

## Asset manifest example

```ts
{
  id: 'gm_prop_torch',
  version: 1,
  category: 'prop',
  file: 'props/gm_prop_torch_v001.glb',
  status: 'approved',
  transform: { position: [0, 0, 0], scale: 1 },
  castShadow: true,
  receiveShadow: true
}
```

The loader rejects unsafe paths and ignores anything not explicitly marked approved. Keep old versions; do not overwrite an approved asset in place.

## Acceptance checklist

- Existing game starts and remains visually unchanged when the manifest is empty.
- Existing camera, selection, construction, HUD and simulation tests still pass.
- Each imported GLB has sensible scale, orientation, pivot, material appearance and shadow behavior.
- New assets do not intercept gameplay selection unexpectedly; collision/picking proxies remain separate where needed.
- No API key, private URL, or unreviewed generated output is committed.
- Build and unit tests pass before opening a pull request.

## Next integration gate

Before mounting assets into the live scene, consolidate which scene is authoritative: the renderer currently lives in `src/main.js`, while the modular `SceneManager` creates a separate scene in `src/main.ts`. This is a separate architecture task and should be handled without changing the current presentation in the same asset-import patch.
