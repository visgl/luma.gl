// luma.gl, MIT license
import type {ShaderUniformType} from '../../adapter/types/shader-types';
import type {UniformValue} from '../../adapter/types/types';
import type {Device} from '../../adapter/device';
import {Buffer} from '../../adapter/resources/buffer';
import {UniformBlock} from './uniform-block';
import {UniformBufferLayout} from './uniform-buffer-layout';
import {log} from '../utils/log';

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
    blocks: Record<
      keyof TUniformGroups,
      {
        uniformTypes?: Record<string, ShaderUniformType>;
        defaultUniforms?: Record<string, UniformValue>;
      }
    >
  ) {
    this.uniformBlocks = {} as Record<
      keyof TUniformGroups,
      UniformBlock<Record<string, UniformValue>>
    >;
    this.uniformBufferLayouts = {} as Record<keyof TUniformGroups, UniformBufferLayout>;
    this.uniformBuffers = {} as Record<keyof TUniformGroups, Buffer>;

    for (const [bufferName, block] of Object.entries(blocks)) {
      const uniformBufferName = bufferName as keyof TUniformGroups;

      // Create a layout object to help us generate correctly formatted binary uniform buffers
      const uniformBufferLayout = new UniformBufferLayout(block.uniformTypes || {});
      this.uniformBufferLayouts[uniformBufferName] = uniformBufferLayout;

      // Create a Uniform block to store the uniforms for each buffer.
      const uniformBlock = new UniformBlock({name: bufferName});
      uniformBlock.setUniforms(block.defaultUniforms || {});
      this.uniformBlocks[uniformBufferName] = uniformBlock;
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
  setUniforms(
    uniforms: Partial<{[group in keyof TUniformGroups]: Partial<TUniformGroups[group]>}>
  ): void {
    for (const [blockName, uniformValues] of Object.entries(uniforms)) {
      this.uniformBlocks[blockName].setUniforms(uniformValues);
      // We leverage logging in updateUniformBuffers(), even though slightly less efficient
      // this.updateUniformBuffer(blockName);
    }

    this.updateUniformBuffers();
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

  /** Create an unmanaged uniform buffer, initialized with current / supplied values */
  createUniformBuffer(
    device: Device,
    uniformBufferName: keyof TUniformGroups,
    uniforms?: Partial<{[group in keyof TUniformGroups]: Partial<TUniformGroups[group]>}>
  ): Buffer {
    const byteLength = this.getUniformBufferByteLength(uniformBufferName);
    const uniformBuffer = device.createBuffer({usage: Buffer.UNIFORM, byteLength});
    if (uniforms) {
      this.setUniforms(uniforms);
    }
    // This clears the needs redraw flag
    const uniformBufferData = this.getUniformBufferData(uniformBufferName);
    uniformBuffer.write(uniformBufferData);
    return uniformBuffer;
  }

  /** Get the managed uniform buffer */
  getManagedUniformBuffer(device: Device, uniformBufferName: keyof TUniformGroups): Buffer {
    if (!this.uniformBuffers[uniformBufferName]) {
      const byteLength = this.getUniformBufferByteLength(uniformBufferName);
      const uniformBuffer = device.createBuffer({usage: Buffer.UNIFORM, byteLength});
      this.uniformBuffers[uniformBufferName] = uniformBuffer;
    }
    this.updateUniformBuffers();
    return this.uniformBuffers[uniformBufferName];
  }

  /** Update one uniform buffer. Only updates if values have changed */
  updateUniformBuffer(uniformBufferName: keyof TUniformGroups): false | string {
    const uniformBlock = this.uniformBlocks[uniformBufferName];
    const uniformBuffer = this.uniformBuffers[uniformBufferName];

    let reason: false | string = false;
    if (uniformBuffer && uniformBlock.needsRedraw) {
      reason ||= uniformBlock.needsRedraw;
      // This clears the needs redraw flag
      const uniformBufferData = this.getUniformBufferData(uniformBufferName);

      const uniformBuffer = this.uniformBuffers[uniformBufferName];
      uniformBuffer.write(uniformBufferData);

      // logging - TODO - don't query the values unnecessarily
      const uniformValues = this.uniformBlocks[uniformBufferName].getAllUniforms();
      log.log(
        4,
        `Writing to uniform buffer ${String(uniformBufferName)}`,
        uniformBufferData,
        uniformValues
      )();
    }
    return reason;
  }

  /** Updates all uniform buffers where values have changed */
  updateUniformBuffers(): false | string {
    let reason: false | string = false;
    for (const uniformBufferName of Object.keys(this.uniformBlocks)) {
      reason ||= this.updateUniformBuffer(uniformBufferName);
    }
    if (reason) {
      log.log(3, `UniformStore.updateUniformBuffers(): ${reason}`)();
    }
    return reason;
  }
}
