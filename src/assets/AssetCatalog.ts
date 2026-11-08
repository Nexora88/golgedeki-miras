import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { isGameAssetDefinition, type GameAssetDefinition } from './assetTypes';

export interface AssetCatalogOptions {
  /** Public URL prefix served by Vite. Defaults to /assets/generated. */
  baseUrl?: string;
}

/**
 * Loads approved GLB files into an existing Three.js group.
 *
 * This class does not create or replace a renderer, scene, camera, game loop,
 * input handler, or UI. The caller explicitly supplies the target group, so
 * existing game presentation remains in control.
 */
export class AssetCatalog {
  private readonly loader = new GLTFLoader();
  private readonly loaded = new Map<string, THREE.Group>();
  private readonly baseUrl: string;

  constructor(
    private readonly target: THREE.Group,
    options: AssetCatalogOptions = {},
  ) {
    this.baseUrl = (options.baseUrl ?? '/assets/generated').replace(/\/$/, '');
  }

  async load(definition: GameAssetDefinition): Promise<THREE.Group | null> {
    if (!isGameAssetDefinition(definition)) {
      throw new Error('Invalid game asset definition.');
    }

    if (definition.status !== 'approved') return null;

    const existing = this.loaded.get(definition.id);
    if (existing) return existing;

    const url = `${this.baseUrl}/${definition.file}`;
    const gltf = await this.loader.loadAsync(url);
    const model = gltf.scene;

    const transform = definition.transform;
    if (transform?.position) model.position.set(...transform.position);
    if (transform?.rotation) model.rotation.set(...transform.rotation);

    if (Array.isArray(transform?.scale)) {
      model.scale.set(...transform.scale);
    } else if (typeof transform?.scale === 'number') {
      model.scale.setScalar(transform.scale);
    }

    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = definition.castShadow ?? true;
      object.receiveShadow = definition.receiveShadow ?? true;
    });

    model.name = definition.id;
    model.userData.assetId = definition.id;
    model.userData.assetVersion = definition.version;
    model.userData.assetCategory = definition.category;

    this.target.add(model);
    this.loaded.set(definition.id, model);
    return model;
  }

  unload(assetId: string): boolean {
    const model = this.loaded.get(assetId);
    if (!model) return false;

    this.target.remove(model);
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) material.dispose();
    });
    this.loaded.delete(assetId);
    return true;
  }

  getLoaded(assetId: string): THREE.Group | undefined {
    return this.loaded.get(assetId);
  }

  unloadAll(): void {
    for (const assetId of this.loaded.keys()) this.unload(assetId);
  }
}
