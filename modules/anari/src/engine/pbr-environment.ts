// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, Texture} from '@luma.gl/core';
import {
  PrefilteredEnvironment,
  PrefilteredEnvironmentGenerator,
  type PrefilteredEnvironmentOptions,
  type PrefilteredEnvironmentTextures
} from '@luma.gl/engine/lighting';
import type {SceneEnvironment} from './scene-renderer';

/** Legacy scene preparation options. New engine users can choose an explicit HDR format. */
export type PreparePBREnvironmentOptions = Omit<PrefilteredEnvironmentOptions, 'brdfLUTTexture'> & {
  /** Scene radiance multiplier; does not change the generated textures. */
  intensity?: number;
  /** Horizontal scene environment rotation in radians. */
  rotation?: number;
};

/** Compatibility view of engine-owned resources with ANARI scene settings. */
export class PreparedPBREnvironment extends PrefilteredEnvironment implements SceneEnvironment {
  readonly diffuseTexture: Texture;
  readonly specularTexture: Texture;
  readonly brdfLUTTexture: Texture;
  intensity: number;
  rotation: number;

  constructor(resources: PrefilteredEnvironmentTextures & {intensity?: number; rotation?: number}) {
    super(resources);
    this.diffuseTexture = resources.diffuseTexture;
    this.specularTexture = resources.specularTexture;
    this.brdfLUTTexture = resources.brdfLUTTexture;
    this.intensity = resources.intensity ?? 1;
    this.rotation = resources.rotation ?? 0;
  }
}

/** Preserves the ANARI API and its automatic LDR fallback through the engine generator. */
export class PBREnvironmentGenerator {
  readonly device: Device;
  private readonly generator: PrefilteredEnvironmentGenerator;

  constructor(device: Device) {
    this.device = device;
    this.generator = new PrefilteredEnvironmentGenerator(device);
  }

  prepare(options: PreparePBREnvironmentOptions): PreparedPBREnvironment {
    const capabilities = this.device.getTextureFormatCapabilities('rgba16float');
    const format =
      options.format ?? (capabilities.render && capabilities.filter ? 'rgba16float' : 'rgba8unorm');
    const environment = this.generator.prepare({...options, format});
    // Transfer generated resource ownership to the compatibility object.
    return new PreparedPBREnvironment({
      ...environment.textures,
      intensity: options.intensity,
      rotation: options.rotation
    });
  }

  destroy(): void {
    this.generator.destroy();
  }
}

/** One-shot preparation retains the legacy submission and ownership behavior. */
export function preparePBREnvironment(
  device: Device,
  options: PreparePBREnvironmentOptions
): PreparedPBREnvironment {
  const generator = new PBREnvironmentGenerator(device);
  try {
    return generator.prepare(options);
  } finally {
    generator.destroy();
  }
}
