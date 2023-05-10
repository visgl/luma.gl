// luma.gl, MIT license
import type {NumberArray} from '../types';
import {assert} from './utils/assert';
import {log} from './utils/log';
import {ShaderLayout, UniformBufferBindingLayout, UniformInfo} from '../adapter/types/shader-layout';

/** A uniform block holds a number of uniforms */
export class UniformBlock<TUniforms extends object = Record<string, unknown>> {
  // readonly layout: UniformBufferLayout;
  readonly layout: Record<string, UniformInfo> = {};
  uniforms: Record<string, unknown> = {};

  protected size: number;
  protected data: ArrayBuffer;
  protected typedArray: {
    float32: Float32Array,
    sint32: Int32Array,
    uint32: Uint32Array
  };

  constructor(layout: ShaderLayout, blockName: string) {
    const binding = layout.bindings
      .find(binding => binding.type === 'uniform' && binding.name === blockName);
    if (!binding) {
      throw new Error(blockName);
    }

    const uniformBlock = binding as UniformBufferBindingLayout;
    for (const uniform of uniformBlock.uniforms || []) {
      this.layout[uniform.name] = uniform;
    }

    // TODO calculate
    this.size = 256;

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
      if (this.layout[key] !== undefined) {
        this._setValue(key, value);
      } else {
        log.warn(`Unknown uniform ${key}`)
      }
    }
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
}
