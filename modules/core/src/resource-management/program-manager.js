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

    this._hashes = {};
    this._hashCounter = 0;
    this._useCounts = {};
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
  }

  addShaderHook(hook, opts = {}) {
    hook = hook.trim();
    const [stage, signature] = hook.split(':');
    const name = hook.replace(/\(.+/, '');
    this._hookFunctions[stage][name] = Object.assign(opts, {signature});
  }

  get(vs, fs, opts = {}) {
    const {defines = {}, modules = [], inject = {}, varyings = [], bufferMode = 0x8c8d} = opts; // varyings/bufferMode for xform feedback, 0x8c8d = SEPARATE_ATTRIBS

    const vsHash = this._getHash(vs);
    const fsHash = this._getHash(fs);
    const moduleHashes = modules.map(m => this._getHash(m.name)).sort();
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
    )}I${injectHashes.join('/')}V${varyingHashes.join('/')}B${bufferMode}`;

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
}
