// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RenderPipelineProps, ComputePipelineProps} from '@luma.gl/core';
import {Device, RenderPipeline, ComputePipeline} from '@luma.gl/core';

export type PipelineFactoryProps = RenderPipelineProps;

type RenderPipelineCacheItem = {pipeline: RenderPipeline; useCount: number};
type ComputePipelineCacheItem = {pipeline: ComputePipeline; useCount: number};

/**
 * Efficiently creates / caches pipelines
 */
export class PipelineFactory {
  static defaultProps: Required<PipelineFactoryProps> = {...RenderPipeline.defaultProps};

  /** Get the singleton default pipeline factory for the specified device */
  static getDefaultPipelineFactory(device: Device): PipelineFactory {
    device._lumaData.defaultPipelineFactory =
      device._lumaData.defaultPipelineFactory || new PipelineFactory(device);
    return device._lumaData.defaultPipelineFactory as PipelineFactory;
  }

  readonly device: Device;
  readonly destroyPolicy: 'unused' | 'never';

  private _hashCounter: number = 0;
  private readonly _hashes: Record<string, number> = {};
  private readonly _renderPipelineCache: Record<string, RenderPipelineCacheItem> = {};
  private readonly _computePipelineCache: Record<string, ComputePipelineCacheItem> = {};

  constructor(device: Device) {
    this.device = device;
    this.destroyPolicy = device.props._factoryDestroyPolicy;
  }

  /** Return a RenderPipeline matching props. Reuses a similar pipeline if already created. */
  createRenderPipeline(props: RenderPipelineProps): RenderPipeline {
    const allProps: Required<RenderPipelineProps> = {...RenderPipeline.defaultProps, ...props};

    const hash = this._hashRenderPipeline(allProps);

    if (!this._renderPipelineCache[hash]) {
      const pipeline = this.device.createRenderPipeline({
        ...allProps,
        id: allProps.id ? `${allProps.id}-cached` : undefined
      });
      pipeline.hash = hash;
      this._renderPipelineCache[hash] = {pipeline, useCount: 0};
    }

    this._renderPipelineCache[hash].useCount++;
    return this._renderPipelineCache[hash].pipeline;
  }

  createComputePipeline(props: ComputePipelineProps): ComputePipeline {
    const allProps: Required<ComputePipelineProps> = {...ComputePipeline.defaultProps, ...props};

    const hash = this._hashComputePipeline(allProps);

    if (!this._computePipelineCache[hash]) {
      const pipeline = this.device.createComputePipeline({
        ...allProps,
        id: allProps.id ? `${allProps.id}-cached` : undefined
      });
      pipeline.hash = hash;
      this._computePipelineCache[hash] = {pipeline, useCount: 0};
    }

    this._computePipelineCache[hash].useCount++;
    return this._computePipelineCache[hash].pipeline;
  }

  release(pipeline: RenderPipeline | ComputePipeline): void {
    const hash = pipeline.hash;
    const cache =
      pipeline instanceof ComputePipeline ? this._computePipelineCache : this._renderPipelineCache;
    cache[hash].useCount--;
    if (cache[hash].useCount === 0) {
      if (this.destroyPolicy === 'unused') {
        cache[hash].pipeline.destroy();
        delete cache[hash];
      }
    }
  }

  // PRIVATE
  private _hashComputePipeline(props: ComputePipelineProps): string {
    const shaderHash = this._getHash(props.shader.source);
    return `${shaderHash}`;
  }

  /** Calculate a hash based on all the inputs for a render pipeline */
  private _hashRenderPipeline(props: RenderPipelineProps): string {
    const vsHash = props.vs ? this._getHash(props.vs.source) : 0;
    const fsHash = props.fs ? this._getHash(props.fs.source) : 0;

    // WebGL specific
    // const {varyings = [], bufferMode = {}} = props;
    // const varyingHashes = varyings.map((v) => this._getHash(v));
    const varyingHash = '-'; // `${varyingHashes.join('/')}B${bufferMode}`
    const bufferLayoutHash = this._getHash(JSON.stringify(props.bufferLayout));

    switch (this.device.type) {
      case 'webgl':
        // WebGL is more dynamic
        return `${vsHash}/${fsHash}V${varyingHash}BL${bufferLayoutHash}`;

      default:
        // On WebGPU we need to rebuild the pipeline if topology, parameters or bufferLayout change
        const parameterHash = this._getHash(JSON.stringify(props.parameters));
        // TODO - Can json.stringify() generate different strings for equivalent objects if order of params is different?
        // create a deepHash() to deduplicate?
        return `${vsHash}/${fsHash}V${varyingHash}T${props.topology}P${parameterHash}BL${bufferLayoutHash}`;
    }
  }

  private _getHash(key: string): number {
    if (this._hashes[key] === undefined) {
      this._hashes[key] = this._hashCounter++;
    }
    return this._hashes[key];
  }
}
