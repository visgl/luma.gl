import {Device} from '@luma.gl/api/';
import {assembleShaders} from '@luma.gl/shadertools';
import {Program} from '@luma.gl/webgl';

type Module = 'string' | {name: string}; // TODO

type GetProgramOptions = {
  vs?: string,
  fs?: string,
  defines?: {},
  inject?: {},
  varyings?: string[],
  bufferMode?: number,
  modules?: Module[];
  transpileToGLSL100?: boolean
};

export default class ProgramManager {
  readonly device: Device;

  stateHash = 0; // Used change hashing if hooks are modified
  private _hashCounter = 0;
  private readonly _hashes = {};
  private readonly _useCounts = {};

  private readonly _programCache = {};
  private readonly _getUniforms = {};
  private readonly _registeredModules = {}; // TODO: Remove? This isn't used anywhere in luma.gl
  private readonly _hookFunctions = [];
  private _defaultModules = [];

  static getDefaultProgramManager(device: Device): ProgramManager {
    // @ts-expect-error
    device.defaultProgramManager = device.defaultProgramManager || new ProgramManager(device);
    // @ts-expect-error
    return device.defaultProgramManager;
  }

  constructor(device: Device) {
    this.device = device;
  }

  addDefaultModule(module: Module): void {
    // @ts-expect-error
    if (!this._defaultModules.find((m) => m.name === module.name)) {
      this._defaultModules.push(module);
    }

    this.stateHash++;
  }

  removeDefaultModule(module: Module): void {
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

  get(props: GetProgramOptions = {}): Program {
    const {
      vs = '',
      fs = '',
      defines = {},
      inject = {},
      varyings = [],
      bufferMode = 0x8c8d,
      transpileToGLSL100 = false
    } = props; // varyings/bufferMode for xform feedback, 0x8c8d = SEPARATE_ATTRIBS

    const modules = this._getModuleList(props.modules); // Combine with default modules

    const vsHash = this._getHash(vs);
    const fsHash = this._getHash(fs);
    // @ts-expect-error
    const moduleHashes = modules.map((m) => this._getHash(m.name)).sort();
    const varyingHashes = varyings.map((v) => this._getHash(v));

    const defineKeys = Object.keys(defines).sort();
    const injectKeys = Object.keys(inject).sort();
    const defineHashes = [];
    const injectHashes = [];

    for (const key of defineKeys) {
      defineHashes.push(this._getHash(key));
      defineHashes.push(this._getHash(defines[key]));
    }

    for (const key of injectKeys) {
      injectHashes.push(this._getHash(key));
      injectHashes.push(this._getHash(inject[key]));
    }

    const hash = `${vsHash}/${fsHash}D${defineHashes.join('/')}M${moduleHashes.join(
      '/'
    )}I${injectHashes.join('/')}V${varyingHashes.join('/')}H${this.stateHash}B${bufferMode}${
      transpileToGLSL100 ? 'T' : ''
    }`;

    if (!this._programCache[hash]) {
      const assembled = assembleShaders(this.device, {
        vs,
        fs,
        modules,
        inject,
        defines,
        hookFunctions: this._hookFunctions,
        transpileToGLSL100
      });

      // @ts-expect-error TODO - program should be created from device
      this._programCache[hash] = new Program(this.device.gl, {
        hash,
        vs: assembled.vs,
        fs: assembled.fs,
        varyings,
        bufferMode
      });

      this._getUniforms[hash] = assembled.getUniforms || ((x) => {});
      this._useCounts[hash] = 0;
    }

    this._useCounts[hash]++;

    return this._programCache[hash];
  }

  getUniforms(program: Program) {
    return this._getUniforms[program.hash] || null;
  }

  release(program: Program): void {
    const hash = program.hash;
    this._useCounts[hash]--;

    if (this._useCounts[hash] === 0) {
      this._programCache[hash].delete();
      delete this._programCache[hash];
      delete this._getUniforms[hash];
      delete this._useCounts[hash];
    }
  }

  _getHash(key: string): string {
    if (this._hashes[key] === undefined) {
      this._hashes[key] = this._hashCounter++;
    }

    return this._hashes[key];
  }

  // Dedup and combine with default modules
  _getModuleList(appModules: Module[] = []): Module[] {
    const modules = new Array(this._defaultModules.length + appModules.length);
    const seen = {};
    let count = 0;

    for (let i = 0, len = this._defaultModules.length; i < len; ++i) {
      const module = this._defaultModules[i];
      const name = module.name;
      modules[count++] = module;
      seen[name] = true;
    }

    for (let i = 0, len = appModules.length; i < len; ++i) {
      const module = appModules[i];
      // @ts-expect-error
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
