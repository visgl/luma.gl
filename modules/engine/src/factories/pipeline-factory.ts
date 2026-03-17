// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RenderPipelineProps, ComputePipelineProps, SharedRenderPipeline} from '@luma.gl/core';
import {Device, RenderPipeline, ComputePipeline, log} from '@luma.gl/core';
import type {EngineModuleState} from '../types';
import {uid} from '../utils/uid';

export type PipelineFactoryProps = RenderPipelineProps;

type RenderPipelineCacheItem = {pipeline: RenderPipeline; useCount: number};
type ComputePipelineCacheItem = {pipeline: ComputePipeline; useCount: number};
type SharedRenderPipelineCacheItem = {sharedRenderPipeline: SharedRenderPipeline; useCount: number};
type WebGLRenderPipelineCacheProps = RenderPipelineProps & {
  varyings?: string[];
  bufferMode?: number;
};

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
  readonly cachingEnabled: boolean;
  readonly sharingEnabled: boolean;
  readonly destroyPolicy: 'unused' | 'never';
  readonly debug: boolean;

  private _hashCounter: number = 0;
  private readonly _hashes: Record<string, number> = {};
  private readonly _renderPipelineCache: Record<string, RenderPipelineCacheItem> = {};
  private readonly _computePipelineCache: Record<string, ComputePipelineCacheItem> = {};
  private readonly _sharedRenderPipelineCache: Record<string, SharedRenderPipelineCacheItem> = {};

  get [Symbol.toStringTag](): string {
    return 'PipelineFactory';
  }

  toString(): string {
    return `PipelineFactory(${this.device.id})`;
  }

  constructor(device: Device) {
    this.device = device;
    this.cachingEnabled = device.props._cachePipelines;
    this.sharingEnabled = device.props._sharePipelines;
    this.destroyPolicy = device.props._destroyPipelines ? 'unused' : 'never';
    this.debug = device.props.debugFactories;
  }

  /** Return a RenderPipeline matching supplied props. Reuses an equivalent pipeline if already created. */
  createRenderPipeline(props: RenderPipelineProps): RenderPipeline {
    if (!this.cachingEnabled) {
      return this.device.createRenderPipeline(props);
    }

    const allProps: Required<RenderPipelineProps> = {...RenderPipeline.defaultProps, ...props};

    const cache = this._renderPipelineCache;
    const hash = this._hashRenderPipeline(allProps);

    let pipeline: RenderPipeline = cache[hash]?.pipeline;
    if (!pipeline) {
      const implementationHash = this._shouldShareRenderPipelines()
        ? this._hashSharedRenderPipeline(allProps)
        : '';
      const sharedRenderPipeline = this._shouldShareRenderPipelines()
        ? this._getOrCreateSharedRenderPipeline(allProps, implementationHash)
        : undefined;
      pipeline = this.device.createRenderPipeline({
        ...allProps,
        id: allProps.id ? `${allProps.id}-cached` : uid('unnamed-cached'),
        _sharedRenderPipeline: sharedRenderPipeline
      });
      pipeline.hash = hash;
      pipeline.implementationHash = implementationHash;
      cache[hash] = {pipeline, useCount: 1};
      if (this.debug) {
        log.log(3, `${this}: ${pipeline} created, count=${cache[hash].useCount}`)();
      }
    } else {
      cache[hash].useCount++;
      if (this.debug) {
        log.log(
          3,
          `${this}: ${cache[hash].pipeline} reused, count=${cache[hash].useCount}, (id=${props.id})`
        )();
      }
    }

    return pipeline;
  }

  /** Return a ComputePipeline matching supplied props. Reuses an equivalent pipeline if already created. */
  createComputePipeline(props: ComputePipelineProps): ComputePipeline {
    if (!this.cachingEnabled) {
      return this.device.createComputePipeline(props);
    }

    const allProps: Required<ComputePipelineProps> = {...ComputePipeline.defaultProps, ...props};

    const cache = this._computePipelineCache;
    const hash = this._hashComputePipeline(allProps);

    let pipeline: ComputePipeline = cache[hash]?.pipeline;
    if (!pipeline) {
      pipeline = this.device.createComputePipeline({
        ...allProps,
        id: allProps.id ? `${allProps.id}-cached` : undefined
      });
      pipeline.hash = hash;
      cache[hash] = {pipeline, useCount: 1};
      if (this.debug) {
        log.log(3, `${this}: ${pipeline} created, count=${cache[hash].useCount}`)();
      }
    } else {
      cache[hash].useCount++;
      if (this.debug) {
        log.log(
          3,
          `${this}: ${cache[hash].pipeline} reused, count=${cache[hash].useCount}, (id=${props.id})`
        )();
      }
    }

    return pipeline;
  }

  release(pipeline: RenderPipeline | ComputePipeline): void {
    if (!this.cachingEnabled) {
      pipeline.destroy();
      return;
    }

    const cache = this._getCache(pipeline);
    const hash = pipeline.hash;

    cache[hash].useCount--;
    if (cache[hash].useCount === 0) {
      this._destroyPipeline(pipeline);
      if (this.debug) {
        log.log(3, `${this}: ${pipeline} released and destroyed`)();
      }
    } else if (cache[hash].useCount < 0) {
      log.error(`${this}: ${pipeline} released, useCount < 0, resetting`)();
      cache[hash].useCount = 0;
    } else if (this.debug) {
      log.log(3, `${this}: ${pipeline} released, count=${cache[hash].useCount}`)();
    }
  }

  // PRIVATE

  /** Destroy a cached pipeline, removing it from the cache (depending on destroy policy) */
  private _destroyPipeline(pipeline: RenderPipeline | ComputePipeline): boolean {
    const cache = this._getCache(pipeline);

    switch (this.destroyPolicy) {
      case 'never':
        return false;
      case 'unused':
        delete cache[pipeline.hash];
        pipeline.destroy();
        if (
          pipeline instanceof RenderPipeline &&
          pipeline.implementationHash &&
          this._sharedRenderPipelineCache[pipeline.implementationHash]
        ) {
          const sharedCacheItem = this._sharedRenderPipelineCache[pipeline.implementationHash];
          sharedCacheItem.useCount--;
          if (sharedCacheItem.useCount === 0) {
            sharedCacheItem.sharedRenderPipeline.destroy();
            delete this._sharedRenderPipelineCache[pipeline.implementationHash];
          }
        }
        return true;
    }
  }

  /** Get the appropriate cache for the type of pipeline */
  private _getCache(
    pipeline: RenderPipeline | ComputePipeline
  ): Record<string, RenderPipelineCacheItem> | Record<string, ComputePipelineCacheItem> {
    let cache:
      | Record<string, RenderPipelineCacheItem>
      | Record<string, ComputePipelineCacheItem>
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
        // TODO - Can json.stringify() generate different strings for equivalent objects if order of params is different?
        // create a deepHash() to deduplicate?
        return `${type}/R/${vsHash}/${fsHash}V${varyingHash}T${props.topology}P${parameterHash}BL${bufferLayoutHash}`;
    }
  }

  private _hashSharedRenderPipeline(props: RenderPipelineProps): string {
    const vsHash = props.vs ? this._getHash(props.vs.source) : 0;
    const fsHash = props.fs ? this._getHash(props.fs.source) : 0;
    const varyingHash = this._getWebGLVaryingHash(props);
    return `webgl/S/${vsHash}/${fsHash}V${varyingHash}`;
  }

  private _getOrCreateSharedRenderPipeline(
    props: RenderPipelineProps,
    implementationHash: string
  ): SharedRenderPipeline {
    let sharedCacheItem = this._sharedRenderPipelineCache[implementationHash];
    if (!sharedCacheItem) {
      const sharedRenderPipeline = this.device._createSharedRenderPipelineWebGL(props);
      sharedCacheItem = {sharedRenderPipeline, useCount: 0};
      this._sharedRenderPipelineCache[implementationHash] = sharedCacheItem;
    }
    sharedCacheItem.useCount++;
    return sharedCacheItem.sharedRenderPipeline;
  }

  private _getHash(key: string): number {
    if (this._hashes[key] === undefined) {
      this._hashes[key] = this._hashCounter++;
    }
    return this._hashes[key];
  }

  private _shouldShareRenderPipelines(): boolean {
    return this.device.type === 'webgl' && this.sharingEnabled;
  }

  private _getWebGLVaryingHash(props: RenderPipelineProps): number {
    const {varyings = [], bufferMode = null} = props as WebGLRenderPipelineCacheProps;
    return this._getHash(JSON.stringify({varyings, bufferMode}));
  }
}
