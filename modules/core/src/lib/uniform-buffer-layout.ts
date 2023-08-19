// luma.gl, MIT license
import type {ShaderUniformType, ShaderDataType} from '../adapter/types/shader-formats';
import {decodeShaderUniformType, alignTo} from '../adapter/type-utils/decode-uniform-type';

// const ERR_ARGUMENT = 'UniformBufferLayout illegal argument';

/**
 * Std140 layout for uniform buffers
 * Supports manual listing of uniforms
 * TODO - Parse shader and build a layout?
 */
export class UniformBufferLayout {
  readonly layout: Record<string, {offset: number, size: number, type: ShaderDataType}> = {};
  readonly size: number = 0;

  constructor(uniforms: Record<string, ShaderUniformType>) {
    // Add layout (type, size and offset) definitions for each uniform in the layout
    for (const [key, uniformType] of Object.entries(uniforms)) {
      const typeAndComponents = decodeShaderUniformType(uniformType);
      const {type, components: count} = typeAndComponents;
      // First, align (bump) current offset to an even multiple of current object (1, 2, 4)
      this.size = alignTo(this.size, count);
      // Use the aligned size as the offset of the current uniform.
      const offset = this.size;
      // Then, add our object's padded size ((1, 2, multiple of 4) to the current offset
      this.size += count;
      this.layout[key] = {type, size: count, offset};
    }
    this.size += (4 - (this.size % 4)) % 4;
  }

  /** number of bytes needed for buffer allocation */
  get byteLength(): number {
    return this.size * 4;
  }

  has(name: string) {
    return Boolean(this.layout[name]);
  }

  get(name: string): {offset: number, size: number} | undefined {
    const layout = this.layout[name];
    return layout;
  }
}
