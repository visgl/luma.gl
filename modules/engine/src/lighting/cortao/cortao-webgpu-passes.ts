// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Buffer,
  Texture,
  type BindingDeclaration,
  type Device,
  type Sampler,
  type TextureView
} from '@luma.gl/core';
import {Computation} from '../../compute/computation';
import {createOccluderLookupTable} from './cortao-occluder-lookup-table';
import {
  getCORTAOFilterPassUniforms,
  getCORTAOMainPassUniforms,
  getCORTAOMipCount,
  getCORTAOPrepassUniforms
} from './cortao-parameters';
import {
  LOOKUP_TABLE_SIZE,
  NEAREST_SAMPLER,
  type CORTAOFrame,
  type CORTAOPasses,
  type CORTAOShaderOptions
} from './cortao-passes';
import {
  CORTAO_MIPMAP_WGSL,
  getCORTAOPrepassWGSL,
  CORTAO_WORKGROUP_SIZE,
  getCORTAOFilterPassWGSL,
  getCORTAOMainPassWGSL
} from './cortao-shaders-wgsl';

/** WebGPU shader stage flag of the compute stage. */
const COMPUTE_STAGE = 0x4;

/** The textures that depend on the drawing buffer size. */
type WebGPUTargets = {
  width: number;
  height: number;
  mipCount: number;
  /** Packed depth and normal, with real mip levels. */
  packedTexture: Texture;
  /** One single-level view per mip level of the packed texture. */
  packedLevelViews: TextureView[];
  normalTexture: Texture;
  occlusionTexture: Texture;
  filteredOcclusionTexture: Texture;
};

/** The pipelines of the passes. */
type WebGPUPipelines = {
  prepass: Computation;
  mipmap: Computation;
  main: Computation;
  filter: Computation;
};

/** The uniform buffers of the passes. The mip pass has one buffer per level. */
type WebGPUUniformBuffers = {
  prepass: Buffer;
  mipmap: Buffer[];
  main: Buffer;
  filter: Buffer;
};

/** A field of a WGSL uniform struct: the byte offset, the scalar type and the values. */
type UniformField = [offset: number, type: 'f32' | 'u32' | 'i32', values: readonly number[]];

/**
 * The CORTAO passes in WGSL, as compute passes, for WebGPU.
 *
 * Unlike the GLSL port, this port writes real mip levels, one compute dispatch per level, and the
 * filter pass reads 2 x 2 blocks with `textureGather()`, as the reference does.
 */
export class CORTAOWebGPUPasses implements CORTAOPasses {
  private readonly device: Device;
  private readonly id: string;
  private readonly options: CORTAOShaderOptions;
  private readonly pipelines: WebGPUPipelines;
  private readonly uniformBuffers: WebGPUUniformBuffers;
  private readonly pointSampler: Sampler;
  private readonly lookupTableTexture: Texture;
  private targets: WebGPUTargets | null = null;

  constructor(device: Device, id: string, options: CORTAOShaderOptions, scaled: boolean) {
    this.device = device;
    this.id = id;
    this.options = options;
    const createUniformBuffer = (name: string, byteLength: number) =>
      device.createBuffer({
        id: `${id}-${name}-uniforms`,
        byteLength,
        usage: Buffer.UNIFORM | Buffer.COPY_DST
      });
    this.uniformBuffers = {
      prepass: createUniformBuffer('prepass', 48),
      mipmap: Array.from({length: 8}, (_, level) => createUniformBuffer(`mipmap-${level}`, 16)),
      main: createUniformBuffer('main', 80),
      filter: createUniformBuffer('filter', 16)
    };
    this.pointSampler = device.createSampler({
      id: `${id}-point-sampler`,
      minFilter: 'nearest',
      magFilter: 'nearest',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge'
    });
    this.pipelines = this.createPipelines(scaled);
    this.lookupTableTexture = this.createLookupTable();
  }

  renderOcclusion({camera, configuration, depthView, filter}: CORTAOFrame): Texture {
    const {pipelines, uniformBuffers} = this;
    const {width, height} = configuration;
    const targets = this.getTargets(width, height);

    const prepassUniforms = getCORTAOPrepassUniforms(camera, configuration);
    writeUniforms(uniformBuffers.prepass, 48, [
      [0, 'f32', prepassUniforms.unprojectParams],
      [16, 'f32', prepassUniforms.resolution],
      [24, 'f32', [prepassUniforms.depthScale, prepassUniforms.depthOffset]],
      [32, 'u32', [prepassUniforms.randomSeed]]
    ]);
    this.dispatch(pipelines.prepass, width, height, {
      cortaoPrepass: uniformBuffers.prepass,
      depthTexture: depthView,
      packedOutput: targets.packedLevelViews[0],
      normalOutput: targets.normalTexture.view
    });

    for (let level = 1; level < targets.mipCount; level++) {
      const buffer = uniformBuffers.mipmap[level];
      writeUniforms(buffer, 16, [
        [0, 'f32', [width, height]],
        [8, 'u32', [level, configuration.randomSeed >>> 0]]
      ]);
      this.dispatch(pipelines.mipmap, Math.max(width >> level, 1), Math.max(height >> level, 1), {
        cortaoMipmap: buffer,
        sourceLevel: targets.packedLevelViews[level - 1],
        targetLevel: targets.packedLevelViews[level]
      });
    }

    const mainUniforms = getCORTAOMainPassUniforms(camera, configuration);
    writeUniforms(uniformBuffers.main, 80, [
      [0, 'f32', mainUniforms.unprojectParams],
      [16, 'f32', mainUniforms.projectionParams],
      [32, 'f32', mainUniforms.resolution],
      [
        40,
        'f32',
        [
          mainUniforms.normalBias,
          mainUniforms.radius,
          mainUniforms.maxApparentCircleRadiusCoefficient,
          mainUniforms.mipBias,
          mainUniforms.inverseMaxSlopeCompensation,
          mainUniforms.backfaceThreshold,
          mainUniforms.backfaceBoost,
          mainUniforms.intensity
        ]
      ],
      [72, 'i32', [mainUniforms.mipCount]],
      [76, 'u32', [mainUniforms.randomSeed]]
    ]);
    this.dispatch(pipelines.main, width, height, {
      cortaoMain: uniformBuffers.main,
      packedDataTexture: targets.packedTexture.view,
      normalTexture: targets.normalTexture.view,
      occluderLookupTable: this.lookupTableTexture.view,
      occlusionOutput: targets.occlusionTexture.view
    });

    if (!filter) {
      return targets.occlusionTexture;
    }
    const filterUniforms = getCORTAOFilterPassUniforms(configuration);
    writeUniforms(uniformBuffers.filter, 16, [
      [0, 'f32', filterUniforms.resolution],
      [8, 'f32', [filterUniforms.depthSensitivity, filterUniforms.normalSensitivity]]
    ]);
    // One invocation per 2 x 2 block.
    this.dispatch(pipelines.filter, (width >> 1) + 1, (height >> 1) + 1, {
      cortaoFilter: uniformBuffers.filter,
      packedDataTexture: targets.packedLevelViews[0],
      occlusionTexture: targets.occlusionTexture.view,
      pointSampler: this.pointSampler,
      occlusionOutput: targets.filteredOcclusionTexture.view
    });
    return targets.filteredOcclusionTexture;
  }

  destroy(): void {
    this.destroyPipelines();
    this.destroyTargets();
    this.lookupTableTexture.destroy();
    this.pointSampler.destroy();
    const {prepass, mipmap, main, filter} = this.uniformBuffers;
    for (const buffer of [prepass, ...mipmap, main, filter]) {
      buffer.destroy();
    }
  }

  /** Runs one compute pass over a width x height grid of invocations. */
  private dispatch(
    computation: Computation,
    width: number,
    height: number,
    bindings: Record<string, Buffer | TextureView | Sampler>
  ): void {
    computation.setBindings(bindings);
    computation.predraw(this.device.commandEncoder);
    const computePass = this.device.beginComputePass({id: computation.id});
    computation.dispatch(
      computePass,
      Math.ceil(width / CORTAO_WORKGROUP_SIZE),
      Math.ceil(height / CORTAO_WORKGROUP_SIZE)
    );
    computePass.end();
  }

  private createPipelines(scaled: boolean): WebGPUPipelines {
    const {device, id, options} = this;
    const uniform = (name: string, location: number): BindingDeclaration => ({
      name,
      type: 'uniform',
      group: 0,
      location,
      visibility: COMPUTE_STAGE
    });
    const texture = (
      name: string,
      location: number,
      sampleType: 'float' | 'uint' | 'depth',
      viewDimension: '2d' | '3d' = '2d'
    ): BindingDeclaration => ({
      name,
      type: 'texture',
      group: 0,
      location,
      visibility: COMPUTE_STAGE,
      sampleType,
      viewDimension
    });
    const storage = (
      name: string,
      location: number,
      format: 'r32uint' | 'rgba8unorm'
    ): BindingDeclaration => ({
      name,
      type: 'storage',
      group: 0,
      location,
      visibility: COMPUTE_STAGE,
      access: 'write-only',
      format,
      viewDimension: '2d'
    });
    return {
      prepass: new Computation(device, {
        id: `${id}-prepass`,
        source: getCORTAOPrepassWGSL(scaled),
        shaderLayout: {
          bindings: [
            uniform('cortaoPrepass', 0),
            texture('depthTexture', 1, 'depth'),
            storage('packedOutput', 2, 'r32uint'),
            storage('normalOutput', 3, 'rgba8unorm')
          ]
        }
      }),
      mipmap: new Computation(device, {
        id: `${id}-mipmap`,
        source: CORTAO_MIPMAP_WGSL,
        shaderLayout: {
          bindings: [
            uniform('cortaoMipmap', 0),
            texture('sourceLevel', 1, 'uint'),
            storage('targetLevel', 2, 'r32uint')
          ]
        }
      }),
      main: new Computation(device, {
        id: `${id}-main`,
        source: getCORTAOMainPassWGSL({
          sampleCount: options.sampleCount,
          rayCount: options.rayCount,
          lookupDirectionResolution: LOOKUP_TABLE_SIZE.directionResolution,
          lookupRadiusResolution: LOOKUP_TABLE_SIZE.radiusResolution
        }),
        shaderLayout: {
          bindings: [
            uniform('cortaoMain', 0),
            texture('packedDataTexture', 1, 'uint'),
            texture('normalTexture', 2, 'float'),
            texture('occluderLookupTable', 3, 'uint', '3d'),
            storage('occlusionOutput', 4, 'rgba8unorm')
          ]
        }
      }),
      filter: new Computation(device, {
        id: `${id}-filter`,
        source: getCORTAOFilterPassWGSL(options),
        shaderLayout: {
          bindings: [
            uniform('cortaoFilter', 0),
            texture('packedDataTexture', 1, 'uint'),
            texture('occlusionTexture', 2, 'float'),
            {
              name: 'pointSampler',
              type: 'sampler',
              group: 0,
              location: 3,
              visibility: COMPUTE_STAGE,
              samplerType: 'non-filtering'
            },
            storage('occlusionOutput', 4, 'rgba8unorm')
          ]
        }
      })
    };
  }

  private destroyPipelines(): void {
    for (const pipeline of Object.values(this.pipelines)) {
      pipeline.destroy();
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
      usage: Texture.SAMPLE | Texture.COPY_DST,
      sampler: NEAREST_SAMPLER
    });
    texture.writeData(table.data);
    return texture;
  }

  /** Gets the textures for a drawing buffer size. Creates them again when the size changes. */
  private getTargets(width: number, height: number): WebGPUTargets {
    if (this.targets && this.targets.width === width && this.targets.height === height) {
      return this.targets;
    }
    this.destroyTargets();
    const {device, id} = this;
    const usage = Texture.SAMPLE | Texture.STORAGE;
    const mipCount = getCORTAOMipCount(width, height);
    const packedTexture = device.createTexture({
      id: `${id}-packed`,
      format: 'r32uint',
      width,
      height,
      mipLevels: mipCount,
      usage,
      sampler: NEAREST_SAMPLER
    });
    const createTarget = (name: string, targetUsage = usage) =>
      device.createTexture({
        id: `${id}-${name}`,
        format: 'rgba8unorm',
        width,
        height,
        usage: targetUsage,
        sampler: NEAREST_SAMPLER
      });
    this.targets = {
      width,
      height,
      mipCount,
      packedTexture,
      packedLevelViews: Array.from({length: mipCount}, (_, level) =>
        packedTexture.createView({
          baseMipLevel: level,
          mipLevelCount: 1,
          arrayLayerCount: 1
        })
      ),
      normalTexture: createTarget('normal'),
      occlusionTexture: createTarget('occlusion', usage | Texture.COPY_SRC),
      filteredOcclusionTexture: createTarget('filtered-occlusion', usage | Texture.COPY_SRC)
    };
    return this.targets;
  }

  private destroyTargets(): void {
    const {targets} = this;
    if (!targets) {
      return;
    }
    for (const view of targets.packedLevelViews) {
      view.destroy();
    }
    for (const texture of [
      targets.packedTexture,
      targets.normalTexture,
      targets.occlusionTexture,
      targets.filteredOcclusionTexture
    ]) {
      texture.destroy();
    }
    this.targets = null;
  }
}

/** Writes the fields of a WGSL uniform struct to a uniform buffer. */
function writeUniforms(buffer: Buffer, byteLength: number, fields: UniformField[]): void {
  const data = new ArrayBuffer(byteLength);
  const views = {
    f32: new Float32Array(data),
    u32: new Uint32Array(data),
    i32: new Int32Array(data)
  };
  for (const [offset, type, values] of fields) {
    views[type].set(values, offset / 4);
  }
  buffer.write(new Uint8Array(data));
}
