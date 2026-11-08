# Three.js animation pipeline

The current rendered game uses one Three.js renderer, one scene, one orthographic camera and one animation loop owned by src/main.js. src/main.ts is deliberately a thin entrypoint; it must not create a second scene or duplicate input listeners.

## Implemented first pass
- Tree sway and deforming cloth banners.
- Hierarchical low-poly guard rigs animated with Three.js AnimationMixer clips: Idle, Walk and Guard.
- Guard patrol movement around the castle.
- Short camera push-in during the opening transition.
- AssetCatalog can load approved GLB files into the existing world group, play named glTF animation clips and advance their mixers from the main frame loop.
- Relative public asset paths work from both the root preview and the GitHub Pages project path.

## GLB asset gate
The manifest intentionally remains empty until a real model has been generated, reviewed and committed. The current guard rigs are procedural hierarchical rigs with animation clips; they are not represented as generated GLB files. For each future character GLB:
1. Confirm the model is rigged and includes named animation clips.
2. Check scale, forward axis, root bone, material count, texture memory and polygon budget.
3. Verify idle/walk/guard clips in a standalone preview.
4. Add an approved versioned file and manifest entry.
5. Test the model on desktop and a physical mobile browser.

## Performance and accessibility
- Keep the render loop capped near 30 FPS for the current low-power baseline.
- Limit shadow map size and device pixel ratio on mobile.
- Keep geometry and animation work proportional to visible units.
- Respect prefers-reduced-motion for UI transitions and provide a future in-game motion setting.
- Avoid loading optional assets as a prerequisite for rendering the base game.
