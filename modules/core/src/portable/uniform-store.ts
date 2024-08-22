// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderUniformType} from '../gpu-type-utils/shader-types';
import type {UniformValue} from '../adapter/types/uniforms';
import type {Device} from '../adapter/device';
import {Buffer} from '../adapter/resources/buffer';
import {log} from '../utils/log';
import {UniformBlock} from './uniform-block';
import {UniformBufferLayout} from './uniform-buffer-layout';

/**
 * A uniform store holds a uniform values for one or more uniform blocks,
 * - It can generate binary data for any uniform buffer
 * - It can manage a uniform buffer for each block
 * - It can update managed uniform buffers with a single call
 * - It performs some book keeping on what has changed to minimize unnecessary writes to uniform buffers.
 */
export class UniformStore<
  TPropGroups extends Record<string, Record<string, unknown>> = Record<
    string,
    Record<string, unknown>
  >
> {
  /** Stores the uniform values for each uniform block */
  uniformBlocks = new Map<keyof TPropGroups, UniformBlock>();
  /** Can generate data for a uniform buffer for each block from data */
  uniformBufferLayouts = new Map<keyof TPropGroups, UniformBufferLayout>();
  /** Actual buffer for the blocks */
  uniformBuffers = new Map<keyof TPropGroups, Buffer>();

  /**
   * Create a new UniformStore instance
   * @param blocks
   */
  constructor(
    blocks: Record<
      keyof TPropGroups,
      {
        uniformTypes?: Record<string, ShaderUniformType>;
        defaultProps?: Record<string, unknown>;
        defaultUniforms?: Record<string, UniformValue>;
      }
    >
  ) {
    for (const [bufferName, block] of Object.entries(blocks)) {
      const uniformBufferName = bufferName as keyof TPropGroups;

      // Create a layout object to help us generate correctly formatted binary uniform buffers
      const uniformBufferLayout = new UniformBufferLayout(block.uniformTypes || {});
      this.uniformBufferLayouts.set(uniformBufferName, uniformBufferLayout);

      // Create a Uniform block to store the uniforms for each buffer.
      const uniformBlock = new UniformBlock({name: bufferName});
      uniformBlock.setUniforms(block.defaultUniforms || {});
      this.uniformBlocks.set(uniformBufferName, uniformBlock);
    }
  }

  /** Destroy any managed uniform buffers */
  destroy(): void {
    for (const uniformBuffer of this.uniformBuffers.values()) {
      uniformBuffer.destroy();
    }
  }

  /**
   * Set uniforms
   * Makes all properties partial
   */
  setUniforms(
    uniforms: Partial<{[group in keyof TPropGroups]: Partial<TPropGroups[group]>}>
  ): void {
    for (const [blockName, uniformValues] of Object.entries(uniforms)) {
      this.uniformBlocks.get(blockName)?.setUniforms(uniformValues);
      // We leverage logging in updateUniformBuffers(), even though slightly less efficient
      // this.updateUniformBuffer(blockName);
    }

    this.updateUniformBuffers();
  }

  /** Get the required minimum length of the uniform buffer */
  getUniformBufferByteLength(uniformBufferName: keyof TPropGroups): number {
    return this.uniformBufferLayouts.get(uniformBufferName)?.byteLength || 0;
  }

  /** Get formatted binary memory that can be uploaded to a buffer */
  getUniformBufferData(uniformBufferName: keyof TPropGroups): Uint8Array {
    const uniformValues = this.uniformBlocks.get(uniformBufferName)?.getAllUniforms() || {};
    // @ts-ignore
    return this.uniformBufferLayouts.get(uniformBufferName)?.getData(uniformValues);
  }

  /**
   * Creates an unmanaged uniform buffer (umnanaged means that application is responsible for destroying it)
   * The new buffer is initialized with current / supplied values
   */
  createUniformBuffer(
    device: Device,
    uniformBufferName: keyof TPropGroups,
    uniforms?: Partial<{[group in keyof TPropGroups]: Partial<TPropGroups[group]>}>
  ): Buffer {
    if (uniforms) {
      this.setUniforms(uniforms);
    }
    const byteLength = this.getUniformBufferByteLength(uniformBufferName);
    const uniformBuffer = device.createBuffer({
      usage: Buffer.UNIFORM | Buffer.COPY_DST,
      byteLength
    });
    // Note that this clears the needs redraw flag
    const uniformBufferData = this.getUniformBufferData(uniformBufferName);
    uniformBuffer.write(uniformBufferData);
    return uniformBuffer;
  }

  /** Get the managed uniform buffer. "managed" resources are destroyed when the uniformStore is destroyed. */
  getManagedUniformBuffer(device: Device, uniformBufferName: keyof TPropGroups): Buffer {
    if (!this.uniformBuffers.get(uniformBufferName)) {
      const byteLength = this.getUniformBufferByteLength(uniformBufferName);
      const uniformBuffer = device.createBuffer({
        usage: Buffer.UNIFORM | Buffer.COPY_DST,
        byteLength
      });
      this.uniformBuffers.set(uniformBufferName, uniformBuffer);
    }
    // this.updateUniformBuffers();
    // @ts-ignore
    return this.uniformBuffers.get(uniformBufferName);
  }

  /** Updates all uniform buffers where values have changed */
  updateUniformBuffers(): false | string {
    let reason: false | string = false;
    for (const uniformBufferName of this.uniformBlocks.keys()) {
      const bufferReason = this.updateUniformBuffer(uniformBufferName);
      reason ||= bufferReason;
    }
    if (reason) {
      log.log(3, `UniformStore.updateUniformBuffers(): ${reason}`)();
    }
    return reason;
  }

  /** Update one uniform buffer. Only updates if values have changed */
  updateUniformBuffer(uniformBufferName: keyof TPropGroups): false | string {
    const uniformBlock = this.uniformBlocks.get(uniformBufferName);
    let uniformBuffer = this.uniformBuffers.get(uniformBufferName);

    let reason: false | string = false;
    if (uniformBuffer && uniformBlock?.needsRedraw) {
      reason ||= uniformBlock.needsRedraw;
      // This clears the needs redraw flag
      const uniformBufferData = this.getUniformBufferData(uniformBufferName);

      uniformBuffer = this.uniformBuffers.get(uniformBufferName);
      uniformBuffer?.write(uniformBufferData);

      // logging - TODO - don't query the values unnecessarily
      const uniformValues = this.uniformBlocks.get(uniformBufferName)?.getAllUniforms();
      log.log(
        4,
        `Writing to uniform buffer ${String(uniformBufferName)}`,
        uniformBufferData,
        uniformValues
      )();
    }
    return reason;
  }
}
