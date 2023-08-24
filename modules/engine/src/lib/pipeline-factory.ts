// luma.gl, MIT license
import type {RenderPipelineProps} from '@luma.gl/core';
import {Device, RenderPipeline} from '@luma.gl/core';

/** Todo - should be same as RenderPipelineProps */
export type PipelineFactoryProps = Omit<RenderPipelineProps, 'vs' | 'fs'> & {
  // Only accepts string shaders
  vs: string;
  fs: string;
};

/** 
 * Efficiently creates / caches pipelines
 */
export class PipelineFactory {
  static defaultProps: Required<PipelineFactoryProps> = {
    ...RenderPipeline.defaultProps,
    vs: undefined!,
    fs: undefined!
  }

  readonly device: Device;

  private _hashCounter: number = 0;
  private readonly _hashes: Record<string, number> = {};
  private readonly _useCounts: Record<string, number> = {};
  private readonly _pipelineCache: Record<string, RenderPipeline> = {};

  static getDefaultPipelineFactory(device: Device): PipelineFactory {
    device._lumaData.defaultPipelineFactory = device._lumaData.defaultPipelineFactory || new PipelineFactory(device);
    return device._lumaData.defaultPipelineFactory as PipelineFactory;
  }

  constructor(device: Device) {
    this.device = device;
  }

  createRenderPipeline(options: PipelineFactoryProps): RenderPipeline {
    const props: Required<PipelineFactoryProps> = {...PipelineFactory.defaultProps, ...options};

    const hash = this._hashRenderPipeline({...props});

    if (!this._pipelineCache[hash]) {
      const pipeline = this.device.createRenderPipeline({
        ...props,
        vs: this.device.createShader({stage: 'vertex', source: props.vs}),
        fs: props.fs ? this.device.createShader({stage: 'fragment', source: props.fs}) : null,
      });

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

  _createRenderPipeline(props: PipelineFactoryProps): RenderPipeline {
    if (!props.fs) {
      throw new Error('fs');
    }

    const pipeline = this.device.createRenderPipeline({
      ...props,
      vs: this.device.createShader({stage: 'vertex', source: props.vs}),
      fs: props.fs ? this.device.createShader({stage: 'fragment', source: props.fs}) : null,
    });

    return pipeline;
  }

  /** Calculate a hash based on all the inputs for a render pipeline */
  _hashRenderPipeline(props: PipelineFactoryProps): string {
    const vsHash = this._getHash(props.vs);
    const fsHash = props.fs ? this._getHash(props.fs) : 0;

    // WebGL specific
    // const {varyings = [], bufferMode = {}} = props;
    // const varyingHashes = varyings.map((v) => this._getHash(v));
    const varyingHash = '-'; // `${varyingHashes.join('/')}B${bufferMode}`

    switch (this.device.info.type) {
      case 'webgpu':
        // On WebGPU we need to rebuild the pipeline if topology, parameters or bufferLayout change
        const parameterHash = this._getHash(JSON.stringify(props.parameters));
        const bufferLayoutHash = this._getHash(JSON.stringify(props.bufferLayout));
        // TODO - Can json.stringify() generate different strings for equivalent objects if order of params is different?
        // create a deepHash() to deduplicate?
        return `${vsHash}/${fsHash}V${varyingHash}T${props.topology}P${parameterHash}BL${bufferLayoutHash}}`;
      default:
        // WebGL is more dynamic
        return `${vsHash}/${fsHash}V${varyingHash}`;
    }
  }

  _getHash(key: string): number {
    if (this._hashes[key] === undefined) {
      this._hashes[key] = this._hashCounter++;
    }
    return this._hashes[key];
  }
}

