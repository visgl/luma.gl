// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  assert,
  type Device,
  type Framebuffer,
  Texture,
  type TextureFormatColor,
  type TextureView
} from '@luma.gl/core';
import {ClipSpace, ShaderInputs} from '@luma.gl/engine';
import {
  PBR_ENVIRONMENT_FRAGMENT_GLSL,
  PBR_ENVIRONMENT_FRAGMENT_WGSL,
  pbrEnvironmentFilter
} from './pbr-environment-shaders';
import type {SceneEnvironment} from './scene-renderer';

/** Source and quality controls for preparing a portable physically based lighting environment. */
export type PreparePBREnvironmentOptions = {
  /** Caller-owned linear HDR or sRGB equirectangular source texture. */
  source: Texture;
  /** Source color encoding. HDR and floating-point sources are linear by default. */
  sourceEncoding?: 'linear' | 'srgb';
  /** Base dimension of the GGX-prefiltered specular cubemap. Defaults to 64 pixels. */
  size?: number;
  /** Dimension of the cosine-weighted diffuse irradiance cubemap. Defaults to 16 pixels. */
  irradianceSize?: number;
  /** Dimension of the integrated split-sum BRDF lookup texture. Defaults to 128 pixels. */
  brdfLUTSize?: number;
  /** Number of importance samples for each destination texel. Defaults to 64. */
  sampleCount?: number;
  /** Renderable output format. Defaults to rgba16float when filterable, otherwise rgba8unorm. */
  format?: TextureFormatColor;
  /** Environment radiance multiplier consumed by SceneRenderer. */
  intensity?: number;
  /** Horizontal environment rotation consumed by SceneRenderer, in radians. */
  rotation?: number;
};

/** Complete, owned irradiance, filtered radiance, and BRDF integration resources. */
export class PreparedPBREnvironment implements SceneEnvironment {
  readonly diffuseTexture: Texture;
  readonly specularTexture: Texture;
  readonly brdfLUTTexture: Texture;
  intensity: number;
  rotation: number;

  constructor(resources: {
    diffuseTexture: Texture;
    specularTexture: Texture;
    brdfLUTTexture: Texture;
    intensity?: number;
    rotation?: number;
  }) {
    this.diffuseTexture = resources.diffuseTexture;
    this.specularTexture = resources.specularTexture;
    this.brdfLUTTexture = resources.brdfLUTTexture;
    this.intensity = resources.intensity ?? 1;
    this.rotation = resources.rotation ?? 0;
  }

  /** Releases only the generated resources; the original equirectangular source remains owned. */
  destroy(): void {
    this.diffuseTexture.destroy();
    this.specularTexture.destroy();
    this.brdfLUTTexture.destroy();
  }
}

/** Reusable WebGL/WebGPU equirectangular-to-IBL importance-sampling pipeline. */
export class PBREnvironmentGenerator {
  readonly device: Device;

  private model: ClipSpace | undefined;
  private modelFormat: TextureFormatColor | undefined;

  constructor(device: Device) {
    this.device = device;
  }

  /** Integrates all six cube faces, every roughness mip, diffuse irradiance, and the BRDF LUT. */
  prepare(options: PreparePBREnvironmentOptions): PreparedPBREnvironment {
    // Equirectangular environment sources require ordinary two-dimensional texture coordinates.
    assert(options.source.dimension === '2d');
    const size = Math.max(1, Math.floor(options.size ?? 64));
    const irradianceSize = Math.max(1, Math.floor(options.irradianceSize ?? 16));
    const brdfLUTSize = Math.max(1, Math.floor(options.brdfLUTSize ?? 128));
    const sampleCount = Math.max(1, Math.min(Math.floor(options.sampleCount ?? 64), 1024));
    const format = options.format || getEnvironmentTextureFormat(this.device);
    const mipLevels = this.device.getMipLevelCount(size, size);

    const specularTexture = createEnvironmentTexture(this.device, {
      id: 'pbr-environment-specular',
      dimension: 'cube',
      size,
      mipLevels,
      format
    });
    const diffuseTexture = createEnvironmentTexture(this.device, {
      id: 'pbr-environment-diffuse',
      dimension: 'cube',
      size: irradianceSize,
      mipLevels: 1,
      format
    });
    const brdfLUTTexture = createEnvironmentTexture(this.device, {
      id: 'pbr-environment-brdf-lut',
      dimension: '2d',
      size: brdfLUTSize,
      mipLevels: 1,
      format
    });

    const framebuffers: Framebuffer[] = [];
    const views: TextureView[] = [];

    try {
      const model = this.getFilterModel(format);
      const sourceEncoding =
        options.sourceEncoding === 'srgb' && !options.source.format.endsWith('-srgb') ? 1 : 0;

      for (let mipLevel = 0; mipLevel < mipLevels; mipLevel++) {
        const mipSize = Math.max(1, size >> mipLevel);
        const roughness = mipLevels > 1 ? mipLevel / (mipLevels - 1) : 0;
        for (let face = 0; face < 6; face++) {
          this.drawEnvironmentView({
            texture: specularTexture,
            size: mipSize,
            mipLevel,
            face,
            roughness,
            mode: 0,
            source: options.source,
            sourceEncoding,
            sampleCount,
            model,
            framebuffers,
            views
          });
        }
      }

      for (let face = 0; face < 6; face++) {
        this.drawEnvironmentView({
          texture: diffuseTexture,
          size: irradianceSize,
          mipLevel: 0,
          face,
          roughness: 1,
          mode: 1,
          source: options.source,
          sourceEncoding,
          sampleCount,
          model,
          framebuffers,
          views
        });
      }

      this.drawEnvironmentView({
        texture: brdfLUTTexture,
        size: brdfLUTSize,
        mipLevel: 0,
        face: 0,
        roughness: 0,
        mode: 2,
        source: options.source,
        sourceEncoding,
        sampleCount,
        model,
        framebuffers,
        views
      });

      // Destination resources are complete and safe for immediate reuse by the next render pass.
      this.device.submit();

      return new PreparedPBREnvironment({
        diffuseTexture,
        specularTexture,
        brdfLUTTexture,
        intensity: options.intensity,
        rotation: options.rotation
      });
    } catch (error) {
      specularTexture.destroy();
      diffuseTexture.destroy();
      brdfLUTTexture.destroy();
      throw error;
    } finally {
      for (const framebuffer of framebuffers) {
        framebuffer.destroy();
      }
      for (const view of views) {
        view.destroy();
      }
    }
  }

  /** Releases the reusable integration pipeline without destroying generated environments. */
  destroy(): void {
    this.model?.destroy();
    this.model = undefined;
    this.modelFormat = undefined;
  }

  private getFilterModel(format: TextureFormatColor): ClipSpace {
    if (this.model && this.modelFormat !== format) {
      this.model.destroy();
      this.model = undefined;
    }

    if (!this.model) {
      this.model = new ClipSpace(this.device, {
        id: 'pbr-environment-integration-model',
        fs: PBR_ENVIRONMENT_FRAGMENT_GLSL,
        source: PBR_ENVIRONMENT_FRAGMENT_WGSL,
        modules: [pbrEnvironmentFilter],
        shaderInputs: new ShaderInputs({pbrEnvironmentFilter}),
        colorAttachmentFormats: [format],
        parameters: {depthWriteEnabled: false}
      });
      this.modelFormat = format;
    }

    return this.model;
  }

  private drawEnvironmentView(options: {
    texture: Texture;
    size: number;
    mipLevel: number;
    face: number;
    roughness: number;
    mode: number;
    source: Texture;
    sourceEncoding: number;
    sampleCount: number;
    model: ClipSpace;
    framebuffers: Framebuffer[];
    views: TextureView[];
  }): void {
    const view = options.texture.createView({
      id: `${options.texture.id}-${options.face}-${options.mipLevel}`,
      dimension: '2d',
      baseMipLevel: options.mipLevel,
      mipLevelCount: 1,
      baseArrayLayer: options.face,
      arrayLayerCount: 1
    });
    options.views.push(view);

    const framebuffer = this.device.createFramebuffer({
      id: `${view.id}-framebuffer`,
      width: options.size,
      height: options.size,
      colorAttachments: [view],
      depthStencilAttachment: null
    });
    options.framebuffers.push(framebuffer);

    options.model.shaderInputs.setProps({
      pbrEnvironmentFilter: {
        face: options.face,
        roughness: options.roughness,
        mode: options.mode,
        sampleCount: options.sampleCount,
        sourceEncoding: options.sourceEncoding,
        pbrEnvironmentSource: options.source
      }
    });
    options.model.predraw(this.device.commandEncoder);

    const renderPass = this.device.beginRenderPass({
      id: `${view.id}-integration`,
      framebuffer,
      clearColor: [0, 0, 0, 1],
      clearDepth: false
    });
    options.model.draw(renderPass);
    renderPass.end();
  }
}

/** Prepares one caller-owned lighting environment without retaining the integration pipeline. */
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

function getEnvironmentTextureFormat(device: Device): TextureFormatColor {
  const capabilities = device.getTextureFormatCapabilities('rgba16float');
  return capabilities.render && capabilities.filter ? 'rgba16float' : 'rgba8unorm';
}

function createEnvironmentTexture(
  device: Device,
  options: {
    id: string;
    dimension: '2d' | 'cube';
    size: number;
    mipLevels: number;
    format: TextureFormatColor;
  }
): Texture {
  return device.createTexture({
    id: options.id,
    dimension: options.dimension,
    width: options.size,
    height: options.size,
    depth: options.dimension === 'cube' ? 6 : 1,
    mipLevels: options.mipLevels,
    format: options.format,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_SRC,
    sampler: {
      minFilter: 'linear',
      magFilter: 'linear',
      mipmapFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge'
    }
  });
}
