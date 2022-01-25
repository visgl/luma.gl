// luma.gl, MIT license
import {assert} from '../utils/assert';
import {log} from '../utils/log';
import UniformBufferLayout from './uniform-buffer-layout';

/** A uniform block holds a number of uniforms */
export class UniformBlock<TUniforms = Record<string, any>> {
  readonly layout: UniformBufferLayout;
  uniforms: TUniforms;

  protected data: ArrayBuffer;
  protected typedArray: {
    float32: Float32Array,
    sint32: Int32Array,
    uint32: Uint32Array
  };

  constructor(layout: UniformBufferLayout) {
    this.layout = layout;

    // Allocate three typed arrays pointing at same memory
    this.data = new ArrayBuffer(this.layout.size * 4);
    this.typedArray = {
      float32: new Float32Array(this.data),
      sint32: new Int32Array(this.data),
      uint32: new Uint32Array(this.data)
    };
  }

  /** Set a map of uniforms */
  setUniforms(uniforms: TUniforms): void {
    for (const [key, value] of Object.entries(uniforms)) {
      if (this.layout.has(key)) {
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

  _setValue(key: string, value): void {
    const layout = this.layout.layout[key];
    assert(layout, 'UniformLayoutStd140 illegal argument');
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
