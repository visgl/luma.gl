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
import {ClipSpace} from '../models/clip-space';
import {ShaderInputs} from '../shader-inputs';
import {
  PBR_ENVIRONMENT_FRAGMENT_GLSL,
  PBR_ENVIRONMENT_FRAGMENT_WGSL,
  pbrEnvironmentFilter
} from '@luma.gl/shaders';

/** Source and quality controls for preparing a portable physically based lighting environment. */
export type PrefilteredEnvironmentOptions = {
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
  /** Renderable and filterable output format. Defaults to rgba16float; LDR fallback is explicit. */
  format?: TextureFormatColor;
  /** Borrow a compatible split-sum lookup. Its lifetime remains caller-owned. */
  brdfLUTTexture?: Texture;
};

/** Generated linear-light textures. Diffuse stores irradiance divided by pi. */
export type PrefilteredEnvironmentTextures = {
  diffuseTexture: Texture;
  specularTexture: Texture;
  brdfLUTTexture: Texture;
};

/** Owns generated resources independently of the generator and source texture. */
export class PrefilteredEnvironment {
  readonly textures: PrefilteredEnvironmentTextures;
  readonly ownsBrdfLUTTexture: boolean;
  private destroyed = false;

  constructor(textures: PrefilteredEnvironmentTextures, ownsBrdfLUTTexture = true) {
    this.textures = textures;
    this.ownsBrdfLUTTexture = ownsBrdfLUTTexture;
  }

  /** Bind directly to the shared IBL shader module without an ANARI scene. */
  getBindings() {
    return {
      pbr_diffuseEnvSampler: this.textures.diffuseTexture,
      pbr_specularEnvSampler: this.textures.specularTexture,
      pbr_brdfLUT: this.textures.brdfLUTTexture
    };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.textures.diffuseTexture.destroy();
    this.textures.specularTexture.destroy();
    if (this.ownsBrdfLUTTexture) this.textures.brdfLUTTexture.destroy();
  }
}

/** Reusable WebGL/WebGPU equirectangular-to-IBL importance-sampling pipeline. */
export class PrefilteredEnvironmentGenerator {
  readonly device: Device;

  private model: ClipSpace | undefined;
  private modelFormat: TextureFormatColor | undefined;

  constructor(device: Device) {
    this.device = device;
  }

  /** Integrates all six cube faces, every roughness mip, diffuse irradiance, and the BRDF LUT. */
  prepare(options: PrefilteredEnvironmentOptions): PrefilteredEnvironment {
    // Equirectangular environment sources require ordinary two-dimensional texture coordinates.
    assert(
      options.source.dimension === '2d' &&
        options.source.device === this.device &&
        !options.source.destroyed
    );
    const size = Math.max(1, Math.floor(options.size ?? 64));
    const irradianceSize = Math.max(1, Math.floor(options.irradianceSize ?? 16));
    const brdfLUTSize = Math.max(1, Math.floor(options.brdfLUTSize ?? 128));
    const sampleCount = Math.max(1, Math.min(Math.floor(options.sampleCount ?? 64), 1024));
    const format = options.format ?? 'rgba16float';
    const capabilities = this.device.getTextureFormatCapabilities(format);
    // Never silently clip HDR radiance to an unorm format.
    assert(capabilities.render && capabilities.filter && !format.endsWith('-srgb'));
    if (options.brdfLUTTexture) {
      // Borrowed LUTs must use the same device and the documented split-sum convention.
      assert(
        options.brdfLUTTexture.device === this.device &&
          !options.brdfLUTTexture.destroyed &&
          options.brdfLUTTexture.dimension === '2d'
      );
    }
    const mipLevels = this.device.getMipLevelCount(size, size);

    const allocatedTextures: Texture[] = [];
    const framebuffers: Framebuffer[] = [];
    const views: TextureView[] = [];
    const allocateTexture = (properties: Parameters<typeof createEnvironmentTexture>[1]) => {
      const texture = createEnvironmentTexture(this.device, properties);
      allocatedTextures.push(texture);
      return texture;
    };
    try {
      const specularTexture = allocateTexture({
        id: 'pbr-environment-specular',
        dimension: 'cube',
        size,
        mipLevels,
        format
      });
      const diffuseTexture = allocateTexture({
        id: 'pbr-environment-diffuse',
        dimension: 'cube',
        size: irradianceSize,
        mipLevels: 1,
        format
      });
      const brdfLUTTexture =
        options.brdfLUTTexture ??
        allocateTexture({
          id: 'pbr-environment-brdf-lut',
          dimension: '2d',
          size: brdfLUTSize,
          mipLevels: 1,
          format
        });

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

      if (!options.brdfLUTTexture)
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

      // Queue order makes subsequent sampling safe; this is not a GPU completion wait.
      this.device.submit();

      return new PrefilteredEnvironment(
        {
          diffuseTexture,
          specularTexture,
          brdfLUTTexture
        },
        !options.brdfLUTTexture
      );
    } catch (error) {
      for (const texture of allocatedTextures) texture.destroy();
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
    try {
      options.model.draw(renderPass);
    } finally {
      renderPass.end();
    }
  }
}

/** Prepares one caller-owned lighting environment without retaining the integration pipeline. */
export function createPrefilteredEnvironment(
  device: Device,
  options: PrefilteredEnvironmentOptions
): PrefilteredEnvironment {
  const generator = new PrefilteredEnvironmentGenerator(device);
  try {
    return generator.prepare(options);
  } finally {
    generator.destroy();
  }
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
