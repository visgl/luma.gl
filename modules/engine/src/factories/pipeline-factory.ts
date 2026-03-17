// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RenderPipelineProps, ComputePipelineProps, SharedRenderPipeline} from '@luma.gl/core';
import {Device, RenderPipeline, ComputePipeline, Resource, log} from '@luma.gl/core';
import type {EngineModuleState} from '../types';
import {uid} from '../utils/uid';

export type PipelineFactoryProps = RenderPipelineProps;

type CacheItem<ResourceT extends Resource<any>> = {resource: ResourceT; useCount: number};

/**
 * Efficiently creates / caches pipelines
 */
export class PipelineFactory {
  static defaultProps: Required<PipelineFactoryProps> = {...RenderPipeline.defaultProps};

  /** Get the singleton default pipeline factory for the specified device */
  static getDefaultPipelineFactory(device: Device): PipelineFactory {
    const moduleData = device.getModuleData<EngineModuleState>('@luma.gl/engine');
    moduleData.defaultPipelineFactory ||= new PipelineFactory(device);
    return moduleData.defaultPipelineFactory;
  }

  readonly device: Device;

  private _hashCounter: number = 0;
  private readonly _hashes: Record<string, number> = {};
  private readonly _renderPipelineCache: Record<string, CacheItem<RenderPipeline>> = {};
  private readonly _computePipelineCache: Record<string, CacheItem<ComputePipeline>> = {};
  private readonly _sharedRenderPipelineCache: Record<string, CacheItem<SharedRenderPipeline>> = {};

  get [Symbol.toStringTag](): string {
    return 'PipelineFactory';
  }

  toString(): string {
    return `PipelineFactory(${this.device.id})`;
  }

  constructor(device: Device) {
    this.device = device;
  }

  /** Return a RenderPipeline matching supplied props. Reuses an equivalent pipeline if already created. */
  createRenderPipeline(props: RenderPipelineProps): RenderPipeline {
    if (!this.device.props._cachePipelines) {
      return this.device.createRenderPipeline(props);
    }

    const allProps: Required<RenderPipelineProps> = {...RenderPipeline.defaultProps, ...props};

    const cache = this._renderPipelineCache;
    const hash = this._hashRenderPipeline(allProps);

    let pipeline: RenderPipeline = cache[hash]?.resource;
    if (!pipeline) {
      const sharedRenderPipeline =
        this.device.type === 'webgl' && this.device.props._sharePipelines
          ? this.createSharedRenderPipeline(allProps)
          : undefined;
      pipeline = this.device.createRenderPipeline({
        ...allProps,
        id: allProps.id ? `${allProps.id}-cached` : uid('unnamed-cached'),
        _sharedRenderPipeline: sharedRenderPipeline
      });
      pipeline.hash = hash;
      cache[hash] = {resource: pipeline, useCount: 1};
      if (this.device.props.debugFactories) {
        log.log(3, `${this}: ${pipeline} created, count=${cache[hash].useCount}`)();
      }
    } else {
      cache[hash].useCount++;
      if (this.device.props.debugFactories) {
        log.log(
          3,
          `${this}: ${cache[hash].resource} reused, count=${cache[hash].useCount}, (id=${props.id})`
        )();
      }
    }

    return pipeline;
  }

  /** Return a ComputePipeline matching supplied props. Reuses an equivalent pipeline if already created. */
  createComputePipeline(props: ComputePipelineProps): ComputePipeline {
    if (!this.device.props._cachePipelines) {
      return this.device.createComputePipeline(props);
    }

    const allProps: Required<ComputePipelineProps> = {...ComputePipeline.defaultProps, ...props};

    const cache = this._computePipelineCache;
    const hash = this._hashComputePipeline(allProps);

    let pipeline: ComputePipeline = cache[hash]?.resource;
    if (!pipeline) {
      pipeline = this.device.createComputePipeline({
        ...allProps,
        id: allProps.id ? `${allProps.id}-cached` : undefined
      });
      pipeline.hash = hash;
      cache[hash] = {resource: pipeline, useCount: 1};
      if (this.device.props.debugFactories) {
        log.log(3, `${this}: ${pipeline} created, count=${cache[hash].useCount}`)();
      }
    } else {
      cache[hash].useCount++;
      if (this.device.props.debugFactories) {
        log.log(
          3,
          `${this}: ${cache[hash].resource} reused, count=${cache[hash].useCount}, (id=${props.id})`
        )();
      }
    }

    return pipeline;
  }

  release(pipeline: RenderPipeline | ComputePipeline): void {
    if (!this.device.props._cachePipelines) {
      pipeline.destroy();
      return;
    }

    const cache = this._getCache(pipeline);
    const hash = pipeline.hash;

    cache[hash].useCount--;
    if (cache[hash].useCount === 0) {
      this._destroyPipeline(pipeline);
      if (this.device.props.debugFactories) {
        log.log(3, `${this}: ${pipeline} released and destroyed`)();
      }
    } else if (cache[hash].useCount < 0) {
      log.error(`${this}: ${pipeline} released, useCount < 0, resetting`)();
      cache[hash].useCount = 0;
    } else if (this.device.props.debugFactories) {
      log.log(3, `${this}: ${pipeline} released, count=${cache[hash].useCount}`)();
    }
  }

  createSharedRenderPipeline(props: RenderPipelineProps): SharedRenderPipeline {
    const sharedPipelineHash = this._hashSharedRenderPipeline(props);
    let sharedCacheItem = this._sharedRenderPipelineCache[sharedPipelineHash];
    if (!sharedCacheItem) {
      const sharedRenderPipeline = this.device._createSharedRenderPipelineWebGL(props);
      sharedCacheItem = {resource: sharedRenderPipeline, useCount: 0};
      this._sharedRenderPipelineCache[sharedPipelineHash] = sharedCacheItem;
    }
    sharedCacheItem.useCount++;
    return sharedCacheItem.resource;
  }

  releaseSharedRenderPipeline(pipeline: RenderPipeline): void {
    if (!pipeline.sharedRenderPipeline) {
      return;
    }

    const sharedPipelineHash = this._hashSharedRenderPipeline(pipeline.sharedRenderPipeline.props);
    const sharedCacheItem = this._sharedRenderPipelineCache[sharedPipelineHash];
    if (!sharedCacheItem) {
      return;
    }

    sharedCacheItem.useCount--;
    if (sharedCacheItem.useCount === 0) {
      sharedCacheItem.resource.destroy();
      delete this._sharedRenderPipelineCache[sharedPipelineHash];
    }
  }

  // PRIVATE

  /** Destroy a cached pipeline, removing it from the cache if configured to do so. */
  private _destroyPipeline(pipeline: RenderPipeline | ComputePipeline): boolean {
    const cache = this._getCache(pipeline);

    if (!this.device.props._destroyPipelines) {
      return false;
    }

    delete cache[pipeline.hash];
    pipeline.destroy();
    if (pipeline instanceof RenderPipeline) {
      this.releaseSharedRenderPipeline(pipeline);
    }
    return true;
  }

  /** Get the appropriate cache for the type of pipeline */
  private _getCache(
    pipeline: RenderPipeline | ComputePipeline
  ): Record<string, CacheItem<RenderPipeline>> | Record<string, CacheItem<ComputePipeline>> {
    let cache:
      | Record<string, CacheItem<RenderPipeline>>
      | Record<string, CacheItem<ComputePipeline>>
      | undefined;
    if (pipeline instanceof ComputePipeline) {
      cache = this._computePipelineCache;
    }
    if (pipeline instanceof RenderPipeline) {
      cache = this._renderPipelineCache;
    }
    if (!cache) {
      throw new Error(`${this}`);
    }
    if (!cache[pipeline.hash]) {
      throw new Error(`${this}: ${pipeline} matched incorrect entry`);
    }
    return cache;
  }

  /** Calculate a hash based on all the inputs for a compute pipeline */
  private _hashComputePipeline(props: ComputePipelineProps): string {
    const {type} = this.device;
    const shaderHash = this._getHash(props.shader.source);
    return `${type}/C/${shaderHash}`;
  }

  /** Calculate a hash based on all the inputs for a render pipeline */
  private _hashRenderPipeline(props: RenderPipelineProps): string {
    const vsHash = props.vs ? this._getHash(props.vs.source) : 0;
    const fsHash = props.fs ? this._getHash(props.fs.source) : 0;
    const varyingHash = this._getWebGLVaryingHash(props);
    const bufferLayoutHash = this._getHash(JSON.stringify(props.bufferLayout));

    const {type} = this.device;
    switch (type) {
      case 'webgl':
        // WebGL wrappers preserve default topology and parameter semantics for direct
        // callers, even though the underlying linked program may be shared separately.
        const webglParameterHash = this._getHash(JSON.stringify(props.parameters));
        return `${type}/R/${vsHash}/${fsHash}V${varyingHash}T${props.topology}P${webglParameterHash}BL${bufferLayoutHash}`;

      case 'webgpu':
      default:
        // On WebGPU we need to rebuild the pipeline if topology, parameters or bufferLayout change
        const parameterHash = this._getHash(JSON.stringify(props.parameters));
        const colorAttachmentFormatsHash = this._getHash(
          JSON.stringify(props.colorAttachmentFormats || [])
        );
        const depthStencilAttachmentFormatHash = this._getHash(
          JSON.stringify(props.depthStencilAttachmentFormat || null)
        );
        // TODO - Can json.stringify() generate different strings for equivalent objects if order of params is different?
        // create a deepHash() to deduplicate?
        return `${type}/R/${vsHash}/${fsHash}V${varyingHash}T${props.topology}P${parameterHash}BL${bufferLayoutHash}CA${colorAttachmentFormatsHash}DA${depthStencilAttachmentFormatHash}`;
    }
  }

  private _hashSharedRenderPipeline(props: RenderPipelineProps): string {
    const vsHash = props.vs ? this._getHash(props.vs.source) : 0;
    const fsHash = props.fs ? this._getHash(props.fs.source) : 0;
    const varyingHash = this._getWebGLVaryingHash(props);
    return `webgl/S/${vsHash}/${fsHash}V${varyingHash}`;
  }

  private _getHash(key: string): number {
    if (this._hashes[key] === undefined) {
      this._hashes[key] = this._hashCounter++;
    }
    return this._hashes[key];
  }

  private _getWebGLVaryingHash(props: RenderPipelineProps): number {
    const {varyings = [], bufferMode = null} = props;
    return this._getHash(JSON.stringify({varyings, bufferMode}));
  }
}
