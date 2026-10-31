# Gölgedeki Miras

A lightweight, low-poly 3D medieval kingdom strategy game built with Three.js.

## Current prototype

- Isometric orthographic camera and low-poly castle environment
- Pointer/touch camera rotation, zoom and keyboard movement
- Selectable castle structures and units
- Build farms, lumber camps, quarries and markets
- Train militia and advance the kingdom day
- Resource economy, happiness and population UI
- Responsive desktop and mobile layout

## Run locally

```bash
npm install
npm run dev
```

Create a production build:

```bash
npm run build
npm run preview
```

## Controls

- Drag: rotate the camera
- Mouse wheel or +/- buttons: zoom
- WASD / arrow keys: move the view
- Select a building from the left panel, then tap/click an open area to place it
- Advance day to collect production
- Train militia to grow the army

## Performance approach

The prototype uses procedural low-poly geometry, a capped device pixel ratio, limited shadow-map resolution and a throttled render loop. It avoids large downloaded 3D assets.

## Deployment

The project is configured for Vercel's static Vite build. Use `npm run build` and publish the `dist` directory.

## License

MIT. Third-party assets, if added later, must retain their own licenses.
