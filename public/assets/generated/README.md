# Generated game assets

Only reviewed and approved game assets belong in this directory.

## File naming

Use stable IDs and immutable versions:

`gm_<category>_<asset-name>_v001.glb`

Examples:
- `gm_building_castle_keep_v001.glb`
- `gm_character_royal_guard_v001.glb`
- `gm_prop_torch_v001.glb`

Keep source/reference images and generation prompts in the project's art records, not as runtime dependencies.

## Runtime use

Register an asset in `src/assets/assetManifest.ts` only after review. Set its status to `approved`; draft or disabled assets are not loaded. Use `AssetCatalog` with the existing scene/world group when the rendering architecture is ready to mount the new asset.

Do not commit API keys, private Leonardo URLs, or temporary generation links here. Download approved GLB files and store them as versioned project assets.
