import { describe, expect, it } from 'vitest';
import { isGameAssetDefinition } from '../src/assets/assetTypes';

describe('isGameAssetDefinition', () => {
  it('accepts a safe approved GLB definition', () => {
    expect(isGameAssetDefinition({
      id: 'gm_prop_torch',
      version: 1,
      category: 'prop',
      file: 'props/gm_prop_torch_v001.glb',
      status: 'approved',
    })).toBe(true);
  });

  it('rejects paths that could escape the generated asset directory', () => {
    expect(isGameAssetDefinition({
      id: 'unsafe',
      version: 1,
      category: 'prop',
      file: '../private/file.glb',
      status: 'approved',
    })).toBe(false);
  });

  it('rejects unsupported formats and unapproved statuses', () => {
    expect(isGameAssetDefinition({
      id: 'draft-model',
      version: 1,
      category: 'building',
      file: 'castle.obj',
      status: 'approved',
    })).toBe(false);

    expect(isGameAssetDefinition({
      id: 'draft-model',
      version: 1,
      category: 'building',
      file: 'castle.glb',
      status: 'pending',
    })).toBe(false);
  });
});
