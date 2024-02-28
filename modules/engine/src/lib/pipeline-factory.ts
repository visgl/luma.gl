// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RenderPipelineProps} from '@luma.gl/core';
import {Device, RenderPipeline} from '@luma.gl/core';

export type PipelineFactoryProps = RenderPipelineProps;

/**
 * Efficiently creates / caches pipelines
 */
export class PipelineFactory {
  static defaultProps: Required<PipelineFactoryProps> = {...RenderPipeline.defaultProps};

  readonly device: Device;

  private _hashCounter: number = 0;
  private readonly _hashes: Record<string, number> = {};
  private readonly _useCounts: Record<string, number> = {};
  private readonly _pipelineCache: Record<string, RenderPipeline> = {};

  static getDefaultPipelineFactory(device: Device): PipelineFactory {
    device._lumaData.defaultPipelineFactory =
      device._lumaData.defaultPipelineFactory || new PipelineFactory(device);
    return device._lumaData.defaultPipelineFactory as PipelineFactory;
  }

  constructor(device: Device) {
    this.device = device;
  }

  createRenderPipeline(options: PipelineFactoryProps): RenderPipeline {
    const props: Required<PipelineFactoryProps> = {...PipelineFactory.defaultProps, ...options};

    const hash = this._hashRenderPipeline({...props});

    if (!this._pipelineCache[hash]) {
      const pipeline = this.device.createRenderPipeline({...props});

      pipeline.hash = hash;
      this._pipelineCache[hash] = pipeline;
      this._useCounts[hash] = 0;
    }

    this._useCounts[hash]++;

    return this._pipelineCache[hash];
  }

  release(pipeline: RenderPipeline): void {
    const hash = pipeline.hash;
    this._useCounts[hash]--;
    if (this._useCounts[hash] === 0) {
      this._pipelineCache[hash].destroy();
      delete this._pipelineCache[hash];
      delete this._useCounts[hash];
    }
  }

  // PRIVATE

  /** Calculate a hash based on all the inputs for a render pipeline */
  private _hashRenderPipeline(props: PipelineFactoryProps): string {
    const vsHash = this._getHash(props.vs.source);
    const fsHash = props.fs ? this._getHash(props.fs.source) : 0;

    // WebGL specific
    // const {varyings = [], bufferMode = {}} = props;
    // const varyingHashes = varyings.map((v) => this._getHash(v));
    const varyingHash = '-'; // `${varyingHashes.join('/')}B${bufferMode}`
    const bufferLayoutHash = this._getHash(JSON.stringify(props.bufferLayout));

    switch (this.device.info.type) {
      case 'webgpu':
        // On WebGPU we need to rebuild the pipeline if topology, parameters or bufferLayout change
        const parameterHash = this._getHash(JSON.stringify(props.parameters));
        // TODO - Can json.stringify() generate different strings for equivalent objects if order of params is different?
        // create a deepHash() to deduplicate?
        return `${vsHash}/${fsHash}V${varyingHash}T${props.topology}P${parameterHash}BL${bufferLayoutHash}`;
      default:
        // WebGL is more dynamic
        return `${vsHash}/${fsHash}V${varyingHash}BL${bufferLayoutHash}`;
    }
  }

  private _getHash(key: string): number {
    if (this._hashes[key] === undefined) {
      this._hashes[key] = this._hashCounter++;
    }
    return this._hashes[key];
  }
}
