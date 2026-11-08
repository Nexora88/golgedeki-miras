# Gölgedeki Miras

A low-poly medieval kingdom strategy and narrative game built with Three.js, Vite and a gradually modularized TypeScript simulation layer.

## Play

The game is built as a static web app. After the GitHub Pages workflow is enabled and the first deployment succeeds, it is published at:

https://nexora88.github.io/golgedeki-miras/

GitHub repository Settings → Pages should use **GitHub Actions** as the build and deployment source. The workflow runs unit tests, builds the Vite app and publishes dist.

## Current playable prototype

- Isometric low-poly castle scene and responsive HUD
- Touch/mouse camera interaction, zoom and keyboard movement
- Selectable structures and units
- Farms, lumber camps, quarries and markets
- Militia training and day-based resource production
- Story prologue with branching decisions and local story progress
- Three.js environment animation, skeletal guard rigs and AnimationMixer idle/walk/guard clips
- Region exploration, quest rewards, diplomacy, abstract regional encounters and three campaign endings
- Three local save slots with autosave for resources, buildings, progress and campaign state
- Periodic border events with simple enemy approach AI and automatic kingdom defense resolution

## Story direction

The heir returns to the North Castle after a battle. Their father remains faceless beneath a battle helm and leaves the royal seal with a warning about protecting the people and uncovering the truth behind the North Gate. The campaign begins with choices that shape the player's priorities.

See docs/STORY_BIBLE.md for the current narrative bible and implemented/future story boundaries.

## Three.js and art pipeline

The live visual prototype is still bootstrapped from src/main.js. The TypeScript entrypoint (src/main.ts) imports the single existing presentation runtime. It no longer creates a second invisible scene or duplicate input handlers. The existing scene, camera, HUD and controls remain the only rendered game runtime.

See docs/THREE_ANIMATION_PIPELINE.md and docs/ART_PIPELINE.md. Leonardo-assisted GLB assets are added only after review; the asset catalog remains isolated until the authoritative rendered world group is explicitly wired.

## TypeScript game architecture

- Core: bootstrap, event bus, fixed-step loop, scene manager and versioned local save
- World/camera: terrain, environment, region registry and isometric camera helpers
- Systems: economy, construction costs, army recruitment, battle resolution, campaign regions, scouting, council decisions, loyalty and quest evaluation
- Entities: soldier, commander, enemy, villager and building primitives
- Story: dialogue history, player-choice memory and ending evaluation
- Persistence: IndexedDB save slots with a localStorage fallback and basic payload/version validation

The domain game instance is exposed as window.__SHADOW_LEGACY__.game for development inspection. Call game.advanceDay() to run the typed economy, loyalty and quest simulation; call game.save() to persist the state.

## Run locally

```bash
npm install
npm run dev
```

## Build and tests

```bash
npm run build
npm test
npm run test:watch
npm run test:e2e
```

## Controls

- Drag: rotate the existing game camera
- Mouse wheel or +/- buttons: zoom
- WASD / arrow keys: move the view
- Choose a building, then tap/click an open area to place it
- Advance day to collect production
- Train militia to grow the army
- Use the story button to reopen the current narrative chapter
- Open Sefer Defteri to explore regions, complete quests, improve diplomacy and manage save slots

## Deployment

- Vercel: Vite build publishes dist at the root path.
- GitHub Pages: .github/workflows/deploy-pages.yml builds and deploys dist with relative asset paths. The deployment runs after changes reach main; repository Pages source must be set to GitHub Actions.
- Run npm run build and npm test before considering a change verified.

## License

MIT. Third-party assets added later must retain their own licenses.
