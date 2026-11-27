// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, Framebuffer, Texture, TextureFormat} from '@luma.gl/core';
import {ClipSpace} from '../../models/clip-space';
import {createOccluderLookupTable} from './cortao-occluder-lookup-table';
import {
  getCORTAOFilterPassUniforms,
  getCORTAOMainPassUniforms,
  getCORTAOMipAtlasSize,
  getCORTAOMipmapUniforms,
  getCORTAOPrepassUniforms
} from './cortao-parameters';
import {
  LOOKUP_TABLE_SIZE,
  NEAREST_SAMPLER,
  PASS_PARAMETERS,
  type CORTAOFrame,
  type CORTAOPasses,
  type CORTAOShaderOptions
} from './cortao-passes';
import {
  CORTAO_FILTER_PASS_FS,
  CORTAO_MAIN_PASS_FS,
  CORTAO_MIPMAP_FS,
  CORTAO_PREPASS_FS,
  cortaoFilter,
  cortaoMain,
  cortaoMipmap,
  cortaoPrepass
} from './cortao-shaders';

/** Render targets that depend on the drawing buffer size. */
type WebGLTargets = {
  width: number;
  height: number;
  textures: Texture[];
  packedLevel0Texture: Texture;
  normalTexture: Texture;
  packedAtlasTexture: Texture;
  occlusionTexture: Texture;
  filteredOcclusionTexture: Texture;
  framebuffers: Framebuffer[];
  prepassFramebuffer: Framebuffer;
  mipmapFramebuffer: Framebuffer;
  mainFramebuffer: Framebuffer;
  filterFramebuffer: Framebuffer;
};

/** The pipelines of the passes. */
type WebGLModels = {
  prepass: ClipSpace;
  mipmap: ClipSpace;
  main: ClipSpace;
  filter: ClipSpace;
};

/**
 * The CORTAO passes in GLSL ES 3.00, as full-screen draws. WebGL 2 cannot read one level of a
 * texture and write another level of the same texture in one draw, so the mip levels go into one
 * atlas texture.
 */
export class CORTAOWebGLPasses implements CORTAOPasses {
  private readonly device: Device;
  private readonly id: string;
  private readonly options: CORTAOShaderOptions;
  private readonly models: WebGLModels;
  private readonly lookupTableTexture: Texture;
  private targets: WebGLTargets | null = null;

  constructor(device: Device, id: string, options: CORTAOShaderOptions, scaled: boolean) {
    this.device = device;
    this.id = id;
    this.options = options;
    this.models = this.createModels(scaled);
    this.lookupTableTexture = this.createLookupTable();
  }

  renderOcclusion({camera, configuration, depthView, filter}: CORTAOFrame): Texture {
    const {models} = this;
    const {width, height} = configuration;
    const targets = this.getTargets(width, height);

    models.prepass.shaderInputs.setProps({
      cortaoPrepass: getCORTAOPrepassUniforms(camera, configuration)
    });
    models.prepass.setBindings({depthTexture: depthView.texture});
    this.renderFullScreen(models.prepass, targets.prepassFramebuffer, width, height);

    const [atlasWidth, atlasHeight] = getCORTAOMipAtlasSize(width, height);
    models.mipmap.shaderInputs.setProps({
      cortaoMipmap: getCORTAOMipmapUniforms(configuration)
    });
    models.mipmap.setBindings({
      packedLevel0Texture: targets.packedLevel0Texture
    });
    this.renderFullScreen(models.mipmap, targets.mipmapFramebuffer, atlasWidth, atlasHeight);

    models.main.shaderInputs.setProps({
      cortaoMain: getCORTAOMainPassUniforms(camera, configuration)
    });
    models.main.setBindings({
      packedDataTexture: targets.packedAtlasTexture,
      normalTexture: targets.normalTexture,
      occluderLookupTable: this.lookupTableTexture
    });
    this.renderFullScreen(models.main, targets.mainFramebuffer, width, height);

    if (!filter) {
      return targets.occlusionTexture;
    }
    models.filter.shaderInputs.setProps({
      cortaoFilter: getCORTAOFilterPassUniforms(configuration)
    });
    models.filter.setBindings({
      packedDataTexture: targets.packedAtlasTexture,
      occlusionTexture: targets.occlusionTexture
    });
    this.renderFullScreen(models.filter, targets.filterFramebuffer, width, height);
    return targets.filteredOcclusionTexture;
  }

  destroy(): void {
    this.destroyModels();
    this.destroyTargets();
    this.lookupTableTexture.destroy();
  }

  /** Draws one full-screen pass. The pass writes every pixel, so there is no clear. */
  private renderFullScreen(
    model: ClipSpace,
    framebuffer: Framebuffer,
    width: number,
    height: number
  ): void {
    const renderPass = this.device.beginRenderPass({
      id: model.id,
      framebuffer,
      parameters: {viewport: [0, 0, width, height]},
      clearColor: false,
      clearDepth: false,
      clearStencil: false
    });
    model.draw(renderPass);
    renderPass.end();
  }

  private createModels(scaled: boolean): WebGLModels {
    const {device, id, options} = this;
    return {
      prepass: new ClipSpace(device, {
        id: `${id}-prepass`,
        fs: CORTAO_PREPASS_FS,
        modules: [cortaoPrepass],
        defines: {CORTAO_SCALED_DEPTH: scaled ? 1 : 0},
        parameters: PASS_PARAMETERS
      }),
      mipmap: new ClipSpace(device, {
        id: `${id}-mipmap`,
        fs: CORTAO_MIPMAP_FS,
        modules: [cortaoMipmap],
        parameters: PASS_PARAMETERS
      }),
      main: new ClipSpace(device, {
        id: `${id}-main`,
        fs: CORTAO_MAIN_PASS_FS,
        modules: [cortaoMain],
        defines: {
          CORTAO_SAMPLE_COUNT: options.sampleCount,
          CORTAO_RAY_COUNT: options.rayCount,
          CORTAO_LOOKUP_DIRECTION_RESOLUTION: LOOKUP_TABLE_SIZE.directionResolution,
          CORTAO_LOOKUP_RADIUS_RESOLUTION: LOOKUP_TABLE_SIZE.radiusResolution
        },
        parameters: PASS_PARAMETERS
      }),
      filter: new ClipSpace(device, {
        id: `${id}-filter`,
        fs: CORTAO_FILTER_PASS_FS,
        modules: [cortaoFilter],
        defines: {
          CORTAO_LARGE_FILTER: options.largeFilter ? 1 : 0,
          CORTAO_FILTER_SYMMETRY: options.filterSymmetry ? 1 : 0
        },
        parameters: PASS_PARAMETERS
      })
    };
  }

  private destroyModels(): void {
    for (const model of Object.values(this.models)) {
      model.destroy();
    }
  }

  /** Creates the occluder lookup table texture for the current ray count. */
  private createLookupTable(): Texture {
    const table = createOccluderLookupTable({
      rayCount: this.options.rayCount
    });
    const texture = this.device.createTexture({
      id: `${this.id}-occluder-lookup-table`,
      dimension: '3d',
      format: table.format,
      width: table.directionResolution,
      height: table.directionResolution,
      depth: table.radiusResolution,
      sampler: NEAREST_SAMPLER
    });
    texture.writeData(table.data);
    return texture;
  }

  /** Gets the render targets for a drawing buffer size. Creates them again when the size changes. */
  private getTargets(width: number, height: number): WebGLTargets {
    if (this.targets && this.targets.width === width && this.targets.height === height) {
      return this.targets;
    }
    this.destroyTargets();
    const {device, id} = this;
    const textures: Texture[] = [];
    const createTarget = (name: string, format: TextureFormat, size = [width, height]) => {
      const texture = device.createTexture({
        id: `${id}-${name}`,
        format,
        width: size[0],
        height: size[1],
        sampler: NEAREST_SAMPLER
      });
      textures.push(texture);
      return texture;
    };
    const packedLevel0Texture = createTarget('packed-level-0', 'r32uint');
    const normalTexture = createTarget('normal', 'rgba8unorm');
    const packedAtlasTexture = createTarget(
      'packed-atlas',
      'r32uint',
      getCORTAOMipAtlasSize(width, height)
    );
    const occlusionTexture = createTarget('occlusion', 'rgba8unorm');
    const filteredOcclusionTexture = createTarget('filtered-occlusion', 'rgba8unorm');
    const createFramebuffer = (name: string, colorAttachments: Texture[]) =>
      device.createFramebuffer({
        id: `${id}-${name}`,
        width: colorAttachments[0].width,
        height: colorAttachments[0].height,
        colorAttachments
      });
    const prepassFramebuffer = createFramebuffer('prepass', [packedLevel0Texture, normalTexture]);
    const mipmapFramebuffer = createFramebuffer('mipmap', [packedAtlasTexture]);
    const mainFramebuffer = createFramebuffer('main', [occlusionTexture]);
    const filterFramebuffer = createFramebuffer('filter', [filteredOcclusionTexture]);
    this.targets = {
      width,
      height,
      textures,
      packedLevel0Texture,
      normalTexture,
      packedAtlasTexture,
      occlusionTexture,
      filteredOcclusionTexture,
      framebuffers: [prepassFramebuffer, mipmapFramebuffer, mainFramebuffer, filterFramebuffer],
      prepassFramebuffer,
      mipmapFramebuffer,
      mainFramebuffer,
      filterFramebuffer
    };
    return this.targets;
  }

  private destroyTargets(): void {
    const {targets} = this;
    if (!targets) {
      return;
    }
    for (const framebuffer of targets.framebuffers) {
      framebuffer.destroy();
    }
    for (const texture of targets.textures) {
      texture.destroy();
    }
    this.targets = null;
  }
}
