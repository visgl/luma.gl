import type {RenderPipelineProps, RenderPipelineParameters, PrimitiveTopology, ShaderLayout} from '@luma.gl/api';
import {Device, RenderPipeline, ComputePipeline} from '@luma.gl/api/';
import type { ShaderModule } from '@luma.gl/shadertools';
import {assembleShaders} from '@luma.gl/shadertools';

export type GetRenderPipelineOptions = {
  vs: string;
  fs: string;
  topology: PrimitiveTopology;
  layout?: ShaderLayout;
  parameters?: RenderPipelineParameters;

  modules?: ShaderModule[];
  defines?: Record<string, string | number | boolean>;
  inject?: Record<string, string>;
  transpileToGLSL100?: boolean;

  varyings?: string[];
  bufferMode?: number,  
};

export type GetComputePipelineOptions = {
  cs: string;
    parameters?: RenderPipelineParameters;

  modules?: ShaderModule[];
  defines?: Record<string, string>;
  inject?: Record<string, string>;
  transpileToGLSL100?: boolean;

  varyings?: string[];
  bufferMode?: number;
};

const DEFAULT_RENDER_PIPELINE_OPTIONS: Required<GetRenderPipelineOptions> = {
  vs: '',
  fs: '',
  modules: [],
  defines: {},
  inject: {},
  transpileToGLSL100: false,
  layout: null,

  varyings: [],
  bufferMode: 0x8c8d, // // varyings/bufferMode for xform feedback, 0x8c8d: SEPARATE_ATTRIBS
  topology: 'triangle-list',
  parameters: {} 
};

/** Efficiently create shared pipelines with varying parameters */
export class PipelineFactory {
  readonly device: Device;

  stateHash: number = 0; // Used to change hashing if hooks are modified
  private _hashCounter: number = 0;
  private readonly _hashes: Record<string, number> = {};
  private readonly _useCounts: Record<string, number> = {};

  private readonly _pipelineCache: Record<string, RenderPipeline> = {};

  private readonly _getUniforms: Record<string, any> = {};
  private readonly _hookFunctions: any[] = [];
  private _defaultModules: any[] = [];
  // private readonly _registeredModules = {}; // TODO: Remove? This isn't used anywhere in luma.gl

  static getDefaultPipelineFactory(device: Device): PipelineFactory {
    // @ts-expect-error Add to device
    device.defaultPipelineFactory = device.defaultPipelineFactory || new PipelineFactory(device);
    // @ts-expect-error Add to device
    return device.defaultPipelineFactory;
  }

  constructor(device: Device) {
    this.device = device;
  }

  addDefaultModule(module: ShaderModule): void {
    if (!this._defaultModules.find((m) => m.name === (typeof module === 'string' ? module : module.name))) {
      this._defaultModules.push(module);
    }
    this.stateHash++;
  }

  removeDefaultModule(module: ShaderModule): void {
    const moduleName = typeof module === 'string' ? module : module.name;
    this._defaultModules = this._defaultModules.filter((m) => m.name !== moduleName);
    this.stateHash++;
  }

  addShaderHook(hook, opts?): void {
    if (opts) {
      hook = Object.assign(opts, {hook});
    }
    this._hookFunctions.push(hook);
    this.stateHash++;
  }

  createRenderPipeline(options: GetRenderPipelineOptions): {
    pipeline: RenderPipeline;
    getUniforms: (props: Record<string, Record<string, any>>) => Record<string, any>;
  } {
    const props: Required<GetRenderPipelineOptions> = {...DEFAULT_RENDER_PIPELINE_OPTIONS, ...options};

    const modules = this._getModuleList(props.modules); // Combine with default modules

    const hash = this._hashRenderPipeline({...props, modules});

    if (!this._pipelineCache[hash]) {
      const {pipeline, getUniforms} = this._createRenderPipeline({...props, modules});
      pipeline.hash = hash;
      this._pipelineCache[hash] = pipeline;
      this._getUniforms[hash] = getUniforms || ((x: Record<string, Record<string, any>>) => {});
      this._useCounts[hash] = 0;
    }

    this._useCounts[hash]++;

    return {
      pipeline: this._pipelineCache[hash],
      getUniforms: this._getUniforms[hash]
    };
  }

  release(pipeline: RenderPipeline): void {
    const hash = pipeline.hash;
    this._useCounts[hash]--;
    if (this._useCounts[hash] === 0) {
      this._pipelineCache[hash].destroy();
      delete this._pipelineCache[hash];
      delete this._getUniforms[hash];
      delete this._useCounts[hash];
    }
  }

  getUniforms(pipeline: RenderPipeline) {
    return this._getUniforms[pipeline.hash] || null;
  }

  // PRIVATE

  _createRenderPipeline(props: GetRenderPipelineOptions): {
    pipeline: RenderPipeline,
    getUniforms: (props: Record<string, Record<string, any>>) => Record<string, any>
  } {
    const platformInfo = {
      gpu: this.device.info.gpu,
      features: this.device.features
    };

    const assembled = assembleShaders(platformInfo, {...props, hookFunctions: this._hookFunctions});

    const pipeline = this.device.createRenderPipeline({
      ...props,
      vs: this.device.createShader({stage: 'vertex', source: assembled.vs}),
      fs: assembled.fs && this.device.createShader({stage: 'fragment', source: assembled.fs}),
    });

    return {pipeline, getUniforms: assembled.getUniforms};
  }

  /** Calculate a hash based on all the inputs for a render pipeline */
  _hashRenderPipeline(props: GetRenderPipelineOptions): string {
    const vsHash = this._getHash(props.vs);
    const fsHash = this._getHash(props.fs);

    const moduleHashes = props.modules.map((m) => this._getHash(typeof m === 'string' ? m : m.name)).sort();
    const varyingHashes = props.varyings.map((v) => this._getHash(v));

    const defineKeys = Object.keys(props.defines).sort();
    const injectKeys = Object.keys(props.inject).sort();
    const defineHashes: number[] = [];
    const injectHashes: number[] = [];

    for (const key of defineKeys) {
      defineHashes.push(this._getHash(key));
      defineHashes.push(this._getHash(String(props.defines[key])));
    }

    for (const key of injectKeys) {
      injectHashes.push(this._getHash(key));
      injectHashes.push(this._getHash(props.inject[key]));
    }

    // TODO - hash parameters!
    const parameterHash = JSON.stringify(props.parameters);

    return `${vsHash}/${fsHash}D${defineHashes.join('/')}M${moduleHashes.join(
      '/'
    )}I${injectHashes.join('/')}V${varyingHashes.join('/')}H${this.stateHash}B${props.bufferMode}${
      props.transpileToGLSL100 ? 'T' : ''
    }P${parameterHash}`;
  }

  _getHash(key: string): number {
    if (this._hashes[key] === undefined) {
      this._hashes[key] = this._hashCounter++;
    }
    return this._hashes[key];
  }

  // Dedupe and combine with default modules
  _getModuleList(appModules: ShaderModule[] = []): ShaderModule[] {
    const modules = new Array(this._defaultModules.length + appModules.length);
    const seen: Record<string, boolean> = {};
    let count = 0;

    for (let i = 0, len = this._defaultModules.length; i < len; ++i) {
      const module = this._defaultModules[i];
      const name = module.name;
      modules[count++] = module;
      seen[name] = true;
    }

    for (let i = 0, len = appModules.length; i < len; ++i) {
      const module = appModules[i];
      const name = module.name;
      if (!seen[name]) {
        modules[count++] = module;
        seen[name] = true;
      }
    }

    modules.length = count;

    return modules;
  }
}
