// luma.gl, MIT license
import type {NumberArray} from '../types';
import {assert} from './utils/assert';
// import {log} from './utils/log';
import {ShaderLayout, UniformBufferBindingLayout, UniformInfo} from '../adapter/types/shader-layout';

type UniformValue = unknown;

/** A uniform block holds a number of uniforms */
export class UniformBlock<TUniforms = Record<string, UniformValue>> {
  name: string;

  // Block definition
  // readonly layout: UniformBufferLayout;
  readonly layout: Record<string, UniformInfo> = {};

  // Current values
  // @ts-expect-error
  uniforms: TUniforms = {};
  modifiedUniforms: Record<keyof TUniforms, UniformValue> = {} as Record<keyof TUniforms, UniformValue>;
  modified: boolean = true;

  protected size: number;
  protected data: ArrayBuffer;
  protected typedArray: {
    float32: Float32Array,
    sint32: Int32Array,
    uint32: Uint32Array
  };

  constructor({name, shaderLayout}: {name: string, shaderLayout?: ShaderLayout}) {
    this.name = name
    if (shaderLayout) {
      const binding = shaderLayout.bindings
        ?.find(binding => binding.type === 'uniform' && binding.name === name);
      if (!binding) {
        throw new Error(name);
      }

      const uniformBlock = binding as UniformBufferBindingLayout;
      for (const uniform of uniformBlock.uniforms || []) {
        this.layout[uniform.name] = uniform;
      }
    }

    // TODO calculate
    this.size = calculateSize(this.layout);

    // Allocate three typed arrays pointing at same memory
    this.data = new ArrayBuffer(this.size * 4);
    this.typedArray = {
      float32: new Float32Array(this.data),
      sint32: new Int32Array(this.data),
      uint32: new Uint32Array(this.data)
    };
  }

  /** Set a map of uniforms */
  setUniforms(uniforms: TUniforms): void {
    for (const [key, value] of Object.entries(uniforms)) {
      this.setUniform(key as keyof TUniforms, value);
    }
  }

  /** Set a single uniform */
  setUniform(key: keyof TUniforms, value: UniformValue) {
    // if (this.layout[key] !== undefined) {
    //   this.uniforms[key] = value;
    //   this.modifiedUniforms[key] = true;
    //   this.modified = true;
    // } else {
    //   log.warn(`Unknown uniform ${key}`)
    // }
  }

  /** Get the current data ArrayBuffer */
  getData(): ArrayBuffer {
    return this.data;
  }

  _setValue(key: string, value: number | NumberArray): void {
    // @ts-ignore
    const layout = this.layout.layout[key];
    assert(layout, 'UniformLayoutStd140 illegal argument');
    // @ts-ignore
    const typedArray = this.typedArray[layout.type];
    if (layout.size === 1) {
      // single value -> just set it
      typedArray[layout.offset] = value;
    } else {
      // vector/matrix -> copy the supplied (typed) array, starting from offset
      typedArray.set(value, layout.offset);
    }
  }

  getModifiedUniforms() {
    Object.assign(this.uniforms, this.modifiedUniforms);
    // this.modifiedUniforms = {};
    return this.uniforms;
  }
}

function calculateSize(layout: Record<string, UniformInfo>) {
  // TODO - calculate size
  return 256;
}

export type Module2Uniforms = {
  uniform1: number;
  uniform2: [number, number];
}

type ModuleUniforms = {
  uniform1?: number;
  uniform2?: [number, number];
}

const block = new UniformBlock<ModuleUniforms>({name: 'block1'});
block.setUniforms({
  uniform1: 1,
  uniform2: [1, 1]
});

// setUniformBlock(pipeline, blockIndex, block);

// GLSL utilities

// import {decodeUniformFormat} from '../adapter/utils/decode-uniform-format';
// import {UniformFormat} from 'modules/api';



// TYPE TESTS

/*
new UniformBlock<ModuleUniforms>().setUniforms({
  uniform1: 1,
  uniform2: 1,
});

new UniformBlock<ModuleUniforms>().setUniforms({
  three: 1,
  uniform1: 1,
});
*/
