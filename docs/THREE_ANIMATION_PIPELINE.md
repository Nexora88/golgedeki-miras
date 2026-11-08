# Three.js animation plan

The current renderer and camera remain owned by src/main.js. The first animation pass is intentionally procedural and lightweight:
- subtle tree sway;
- idle soldier breathing and head movement;
- cloth deformation for castle banners;
- a short camera push-in on starting the kingdom;
- frame throttling remains in place for browser/mobile performance.

Future animation milestones:
1. GLB character clips through GLTFLoader and AnimationMixer.
2. Idle, walk, work, carry, salute and combat states.
3. Building construction stages and day/night lighting.
4. Story camera rails and authored cutscene beats.
5. Reduced-motion option and mobile performance checks.

Generated character models must be reviewed for rig compatibility before animation clips are authored. A static GLB is not automatically rigged or animation-ready.
