// luma.gl, MIT license
import type {ShaderUniformType} from '../../adapter/types/shader-types';
import type {UniformValue} from '../../adapter/types/types';
import type {Device} from '../../adapter/device';
import {Buffer} from '../../adapter/resources/buffer';
import {UniformBlock} from './uniform-block';
import {UniformBufferLayout} from './uniform-buffer-layout';

/** 
 * A uniform store holds a uniform values for one or more uniform blocks,
 * - It can generate binary data for any uniform buffer
 * - It can manage a uniform buffer for each block
 * - It can update managed uniform buffers with a single call
 * - It performs some book keeping on what has changed to minimize unnecessary writes to uniform buffers.
 */
export class UniformStore<TUniformGroups extends Record<string, Record<string, UniformValue>>> {
  /** Stores the uniform values for each uniform block */
  uniformBlocks: Record<keyof TUniformGroups, UniformBlock<Record<string, UniformValue>>>;
  /** Can generate data for a uniform buffer for each block from data */
  uniformBufferLayouts: Record<keyof TUniformGroups, UniformBufferLayout>;
  /** Actual buffer for the blocks */
  uniformBuffers: Partial<Record<keyof TUniformGroups, Buffer>>;

  /**
   * Create a new UniformStore instance
   * @param blocks 
   */
  constructor(
    blocks: Record<keyof TUniformGroups, {
      uniformTypes?: Record<string, ShaderUniformType>;
      defaultValues?: Record<string, UniformValue>;
    }>
  ) {
    this.uniformBlocks = {} as Record<keyof TUniformGroups, UniformBlock<Record<string, UniformValue>>>;
    this.uniformBufferLayouts = {} as Record<keyof TUniformGroups, UniformBufferLayout>;
    this.uniformBuffers = {} as Record<keyof TUniformGroups, Buffer>;

    for (const [bufferName, uniformBlock] of Object.entries(blocks)) {
      const uniformBufferName = bufferName as keyof TUniformGroups;

      // Create a Uniform block to store the uniforms for each buffer.
      this.uniformBlocks[uniformBufferName] = new UniformBlock({name: bufferName})

      // Create a layout object to help us generate correctly formatted binary uniform buffers 
      const uniformBufferLayout = new UniformBufferLayout(uniformBlock.uniformTypes || {});
      this.uniformBufferLayouts[uniformBufferName] = uniformBufferLayout;
    }
  }

  /** Destroy any managed uniform buffers */
  destroy(): void {
    for (const uniformBuffer of Object.values(this.uniformBuffers)) {
      uniformBuffer.destroy();
    }
  }

  /** 
   * Set uniforms 
   * Makes all properties partial
   */
  setUniforms(uniforms: Partial<{[group in keyof TUniformGroups]: Partial<TUniformGroups[group]>}>): void {
    for (const [blockName, uniformValues] of Object.entries(uniforms)) {
      this.uniformBlocks[blockName].setUniforms(uniformValues);
    }
  }

  /** Get the required minimum length of the uniform buffer */
  getUniformBufferByteLength(uniformBufferName: keyof TUniformGroups): number {
    return this.uniformBufferLayouts[uniformBufferName].byteLength;
  }

  /** Get formatted binary memory that can be uploaded to a buffer */
  getUniformBufferData(uniformBufferName: keyof TUniformGroups): Uint8Array {
    const uniformValues = this.uniformBlocks[uniformBufferName].getAllUniforms();
    return this.uniformBufferLayouts[uniformBufferName].getData(uniformValues);
  }

  /** Get the managed uniform buffer */
  getManagedUniformBuffer(device: Device, uniformBufferName: keyof TUniformGroups): Buffer {
    if (!this.uniformBuffers[uniformBufferName]) {
      const byteLength = this.getUniformBufferByteLength(uniformBufferName);
      this.uniformBuffers[uniformBufferName] = 
        this.uniformBuffers[uniformBufferName] || 
        device.createBuffer({usage: Buffer.UNIFORM, byteLength});
    }
    return this.uniformBuffers[uniformBufferName];
  }

  /** Update one uniform buffer. Only updates if values have changed */
  updateUniformBuffer(uniformBufferName: keyof TUniformGroups): void {
    const uniformBlock = this.uniformBlocks[uniformBufferName];
    const uniformBuffer = this.uniformBuffers[uniformBufferName];
    if (uniformBuffer && uniformBlock.needsRedraw) {
      const uniformBufferData = this.getUniformBufferData(uniformBufferName);
      const uniformBuffer = this.uniformBuffers[uniformBufferName];
      uniformBuffer.write(uniformBufferData);
    }
  }

  /** Updates all uniform buffers where values have changed */
  updateUniformBuffers(): void {
    for (const uniformBufferName of Object.keys(this.uniformBlocks)) {
      this.updateUniformBuffer(uniformBufferName)
    }
  }
}
