export type GameAssetCategory =
  | 'character'
  | 'building'
  | 'environment'
  | 'prop'
  | 'vegetation'
  | 'vehicle'
  | 'effect';

export type GameAssetStatus = 'draft' | 'approved' | 'disabled';

export interface GameAssetTransform {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}

export interface GameAssetDefinition {
  id: string;
  version: number;
  category: GameAssetCategory;
  file: string;
  status: GameAssetStatus;
  transform?: GameAssetTransform;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * Validate untrusted manifest data before it is used to construct a public asset URL.
 * Asset paths must stay relative to the generated-assets directory.
 */
export function isGameAssetDefinition(value: unknown): value is GameAssetDefinition {
  if (!value || typeof value !== 'object') return false;

  const asset = value as Partial<GameAssetDefinition>;
  const safeFile = typeof asset.file === 'string'
    && asset.file.length > 0
    && !asset.file.startsWith('/')
    && !asset.file.includes('..')
    && !asset.file.includes('\\')
    && asset.file.toLowerCase().endsWith('.glb');

  return typeof asset.id === 'string'
    && asset.id.length > 0
    && Number.isInteger(asset.version)
    && (asset.version ?? 0) > 0
    && ['character', 'building', 'environment', 'prop', 'vegetation', 'vehicle', 'effect'].includes(String(asset.category))
    && safeFile
    && ['draft', 'approved', 'disabled'].includes(String(asset.status));
}
