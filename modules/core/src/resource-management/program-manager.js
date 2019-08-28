import {assembleShaders} from '@luma.gl/shadertools';
import {Program} from '@luma.gl/webgl';

export default class ProgramManager {
  constructor(gl) {
    this.gl = gl;

    this._programCache = {};
    this._getUniforms = {};
    this._moduleInjections = {
      vs: {},
      fs: {}
    };
    this._hookFunctions = {
      vs: {},
      fs: {}
    };
    this._defaultModules = [];

    this._hashes = {};
    this._hashCounter = 0;
    this._hookStateCounter = 0; // Used change hashing if hooks are modified
    this._useCounts = {};
  }

  addDefaultModule(module) {
    if (!this._defaultModules.find(m => m.name === module.name)) {
      this._defaultModules.push(module);
    }
  }

  removeDefaultModule(module) {
    const moduleName = typeof module === 'string' ? module : module.name;
    this._defaultModules = this._defaultModules.filter(m => m.name !== moduleName);
  }

  addModuleInjection(module, opts) {
    const moduleName = module.name;
    const {hook, injection, order = 0} = opts;
    const shaderStage = hook.slice(0, 2);

    const moduleInjections = this._moduleInjections[shaderStage];
    moduleInjections[moduleName] = moduleInjections[moduleName] || {};

    moduleInjections[moduleName][hook] = {
      injection,
      order
    };

    this._hookStateCounter++;
  }

  addShaderHook(hook, opts = {}) {
    hook = hook.trim();
    const [stage, signature] = hook.split(':');
    const name = hook.replace(/\(.+/, '');
    this._hookFunctions[stage][name] = Object.assign(opts, {signature});

    this._hookStateCounter++;
  }

  get(props = {}) {
    const {
      vs = '',
      fs = '',
      defines = {},
      modules = [],
      inject = {},
      varyings = [],
      bufferMode = 0x8c8d
    } = props; // varyings/bufferMode for xform feedback, 0x8c8d = SEPARATE_ATTRIBS

    const vsHash = this._getHash(vs);
    const fsHash = this._getHash(fs);
    const moduleHashes = this._getModuleNameList(modules);
    const varyingHashes = varyings.map(v => this._getHash(v));

    const defineKeys = Object.keys(defines).sort();
    const injectKeys = Object.keys(inject).sort();
    const defineHashes = [];
    const injectHashes = [];

    for (const key of defineKeys) {
      defineHashes.push(this._getHash(key));
      defineHashes.push(this._getHash(defines[key]));
    }

    for (const key of injectKeys) {
      defineHashes.push(this._getHash(key));
      defineHashes.push(this._getHash(inject[key]));
    }

    const hash = `${vsHash}/${fsHash}D${defineHashes.join('/')}M${moduleHashes.join(
      '/'
    )}I${injectHashes.join('/')}V${varyingHashes.join('/')}H${
      this._hookStateCounter
    }B${bufferMode}`;

    if (!this._programCache[hash]) {
      const assembled = assembleShaders(this.gl, {
        vs,
        fs,
        modules,
        inject,
        defines,
        hookFunctions: this._hookFunctions,
        moduleInjections: this._moduleInjections
      });

      this._programCache[hash] = new Program(this.gl, {
        hash,
        vs: assembled.vs,
        fs: assembled.fs,
        varyings,
        bufferMode
      });

      this._getUniforms[hash] = assembled.getUniforms || (x => {});
      this._useCounts[hash] = 0;
    }

    this._useCounts[hash]++;
    return this._programCache[hash];
  }

  getUniforms(program) {
    return this._getUniforms[program.hash] || null;
  }

  release(program) {
    const hash = program.hash;
    this._useCounts[hash]--;

    if (this._useCounts[hash] === 0) {
      this._programCache[hash].delete();
      delete this._programCache[hash];
      delete this._getUniforms[hash];
      delete this._useCounts[hash];
    }
  }

  _getHash(key) {
    if (this._hashes[key] === undefined) {
      this._hashes[key] = this._hashCounter++;
    }

    return this._hashes[key];
  }

  // Dedup and combine with default modules
  _getModuleNameList(modules) {
    const moduleNames = new Array(this._defaultModules.length + modules.length);
    const seen = {};
    let count = 0;

    for (let i = 0, len = this._defaultModules.length; i < len; ++i) {
      const name = this._defaultModules[i].name;
      moduleNames[count++] = name;
      seen[name] = true;
    }

    for (let i = 0, len = modules.length; i < len; ++i) {
      const name = modules[i].name;
      if (!seen[name]) {
        moduleNames[count++] = name;
        seen[name] = true;
      }
    }

    moduleNames.length = count;

    return moduleNames.sort();
  }
}
