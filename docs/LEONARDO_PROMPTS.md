# Leonardo.ai prompt pack — Gölgedeki Miras

Project art direction for every prompt:
Stylized low-poly medieval kingdom, readable silhouette at isometric gameplay scale, hand-crafted geometry, restrained PBR materials, muted forest green, warm stone grey, dark timber, aged gold and deep muted crimson accents. Soft warm directional daylight, gentle atmospheric depth, clean composition, no photorealistic micro-detail. The existing Three.js prototype uses an elevated orthographic/isometric camera.

## Canonical visual identity — the father

**Purpose:** recurring story silhouette and future cinematic reference. Keep his face hidden in every approved version until the story explicitly reveals it.

**Image prompt**
A mysterious medieval northern king, full body character concept sheet, face completely hidden in the deep shadow of a closed battle helmet, weathered dark steel armor with subtle aged-gold royal details, deep forest-green cloak, a small royal seal hanging at the chest, calm protective posture, grounded heroic silhouette, stylized low-poly game art, front three-quarter view, neutral studio background, clean readable shapes, consistent proportions, soft warm key light, game character reference, no text.

**Negative prompt**
visible face, modern clothing, fantasy sci-fi armor, oversized weapons, excessive spikes, glowing eyes, photorealistic skin, anime, busy background, text, logo, watermark, extra limbs, malformed hands.

## First runtime asset — North Castle torch

**Purpose:** first GLB import and scale test; small prop with simple silhouette.

**Image prompt**
Single medieval wall torch prop for a stylized low-poly strategy game, forged iron wall bracket, dark timber handle, small warm flame, readable silhouette, three-quarter view, centered isolated object, neutral plain background, consistent low-poly medieval kingdom art direction, clean geometry, subtle PBR material appearance, no text.

**Rodin V2 API-ready plan**
- output_format: glb
- material: PBR
- quality: low
- mesh_mode: Triangle
- quantity: 1
- Target: web/mobile prop; inspect triangle count, origin/pivot and texture sizes before approval.

## North Castle — modular environment reference

**Purpose:** visual reference only; do not replace the existing playable castle until modular pieces fit its footprint and selection behavior.

**Image prompt**
Stylized low-poly medieval northern castle modular environment kit, compact stone keep, four squat corner towers, dark timber gate, muted crimson royal banners, warm grey stone, forest-green landscape, elevated orthographic isometric three-quarter camera, clear modular separation between keep, towers, walls and gate, soft warm overcast lighting, game-ready visual reference, no characters, no labels, no text.

## Royal guard — future animated character

**Purpose:** canonical character reference before attempting rigging.

**Image prompt**
Stylized low-poly medieval royal guard character, full body neutral A-pose, simple readable proportions, muted steel helmet and chest armor, dark forest-green cloth tunic, aged-gold trim, small muted crimson shoulder insignia, simple boots and belt, front three-quarter view, clean neutral background, orthographic character reference, consistent low-poly game art.

**Rodin V2 API-ready plan**
- output_format: glb
- material: PBR
- quality: low or medium only after reviewing mobile budget
- mesh_mode: Quad for a candidate that may need deformation; verify topology
- quantity: 1
- ta_pose: true only if the current API schema supports it for this model
- A-pose/GLB is not proof of a rig or animation clips; inspect in Blender before runtime.

## Approval gates

1. Compare generated images against the existing game palette and isometric camera.
2. Keep the father face hidden; approve one canonical reference before variants.
3. Treat each 3D output as a candidate, not a finished production asset.
4. Inspect GLB scale, axes, origin, normals, UVs, materials, texture memory and polygon count.
5. Add only approved, optimized files to public/assets/generated with immutable versioned names.
6. Keep prompt, source reference, generation ID and review status in the project asset record.

No actual Leonardo image, GLB or video is included by this prompt pack. Image generation requires the connected Leonardo MCP tool; Rodin 3D/video direct execution still requires the separately secured API bridge described in the plugin.
