// luma.gl, MIT license
import {NumberArray, isNumberArray} from '@luma.gl/core';
import {Device, Buffer, UniformBufferLayout, ShaderUniformType} from '@luma.gl/core';
import {ShaderModule} from '@luma.gl/shadertools';

/** Duplicates definition in core module to avoid cross dependencies */
export type UniformValue = number | boolean | Float32Array | Int32Array | Uint32Array | NumberArray;

/** A uniform store holds a number of uniform values and does some book keeping on what has changes */
export class ShaderModuleUniforms<TUniforms extends Record<string, UniformValue>> {
  device: Device;
  shaderModule: ShaderModule<TUniforms>;

  useUniformBuffers: boolean;
  uniformBufferLayout: UniformBufferLayout;
  uniformBuffer: Buffer | null = null;

  uniforms: Record<string, UniformValue> = {};
  modifiedUniforms: Record<string, boolean> = {};
  modified: boolean = true;

  needsRedraw: string | false = 'initialized';

  constructor(props?: {
    device: Device;
    shaderModule: ShaderModule<TUniforms>
  }) {
    this.device = props.device;
    this.shaderModule = props.shaderModule;
    this.useUniformBuffers = this.device.info.type !== 'webgl';

    // extract uniform formats and create a uniform buffer layout
    const uniformTypes: Record<string, ShaderUniformType> = {};
    for (const [name, {format}] of Object.entries(props.shaderModule.uniforms)) {
      uniformTypes[name] = format;
    }
    this.uniformBufferLayout = new UniformBufferLayout(uniformTypes);

    // create a uniform buffer
    if (this.useUniformBuffers) {
      this.uniformBuffer = this.device.createBuffer({
        usage: Buffer.UNIFORM,
        byteLength: this.uniformBufferLayout.byteLength
      });  
    }
  }

  /** Set a map of uniforms */
  setUniforms(uniforms: TUniforms): void {
    for (const [key, value] of Object.entries(uniforms)) {
      this._setUniform(key, value);
      this.setNeedsRedraw(key);
    }
  }

  setNeedsRedraw(reason: string): void {
    this.needsRedraw = this.needsRedraw || reason;
  }

  /** 
   * Updates the uniform buffer if needed. 
   * Clears the dirty flag.
   */
  getUniformBuffer(): Buffer {
    if (this.needsRedraw) {
      const modifiedUniforms = this.getModifiedUniforms();
      const data = this.uniformBufferLayout.getData(modifiedUniforms);
      this.uniformBuffer.write(data);
    }
    return this.uniformBuffer;
  }

  /** Returns all uniforms */
  getUniforms(groupName: string): Record<string, UniformValue> {
    this.modifiedUniforms = {};
    this.needsRedraw = false;
    return (this.uniforms[groupName] || {}) as Record<string, UniformValue>;
  }

  /** Returns modified uniforms */
  getModifiedUniforms() {
    const modifiedUniforms = this.modifiedUniforms;
    this.modifiedUniforms = {};
    this.needsRedraw = false;
    return modifiedUniforms;
  }

  /** Set a single uniform */
  private _setUniform(key: string, value: UniformValue) {
    // if (this.layout[key] !== undefined) {
    //   this.uniforms[key] = value;
    //   this.modifiedUniforms[key] = true;
    //   this.modified = true;
    // } else {
    //   log.warn(`Unknown uniform ${key}`)
    // }
    if (arrayEqual(this.uniforms[key], value)) {
      return;
    }
    this.uniforms[key] = value;
    this.modifiedUniforms[key] = true;
    this.modified = true;
  }
}

function arrayEqual(a: unknown, b: unknown, limit: number = 16) {
  if (a !== b) {
    return false;
  }
  const arrayA = isNumberArray(a);
  if (!arrayA) {
    return false;
  }
  const arrayB = isNumberArray(b);
  if (arrayB && arrayA.length === arrayB.length) {
    for (let i = 0; i < arrayA.length; ++i) {
      if (arrayB[i] !== arrayA[i]) {
        return false;
      }
    }
  }
  return true;
}


// export function makeUniformStore<I extends Record<string, Record<string, unknown>>>(name: string, uniforms: I): UniformStore<{ [P in keyof I]: I[P] }> {
//   return new UniformStore<{ [P in keyof I]: I[P] }>({name, uniforms});
// }

// type ShaderModule<Uniforms extends Record<string, unknown> = {}> = {
//   uniformTypes: Record<keyof Uniforms, string>;
// };

// type Module1Uniforms = {
//   uniform1?: number;
//   uniform2?: [number, number];
// }

// type Module2Uniforms = {
//   uniform3: number;
//   uniform4: [number, number];
// }

// const shaderModule: ShaderModule<Module1Uniforms> = {
//   uniformTypes: {
//     uniform1: 'aaa',
//     uniform2: 'aaa'
//   }
// }


// const module1Uniforms = new ShaderModuleUniforms<Module1Uniforms>();

// module1Uniforms.setUniforms({
//   uniform1: 1,
//   uniform2: [1, 1]
// });



// setUniformStore(pipeline, blockIndex, block);

// GLSL utilities


// TYPE TESTS

/*
new UniformStore<ModuleUniforms>().setUniforms({
  uniform1: 1,
  uniform2: 1,
});

new UniformStore<ModuleUniforms>().setUniforms({
  three: 1,
  uniform1: 1,
});
*/
