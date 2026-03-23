// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CompositeShaderType} from '../shadertypes/shader-types/shader-types';
import type {CompositeUniformValue} from '../adapter/types/uniforms';
import type {Device} from '../adapter/device';
import {Buffer} from '../adapter/resources/buffer';
import {log} from '../utils/log';
import {
  makeShaderBlockLayout,
  type ShaderBlockLayout
} from '../shadertypes/shader-types/shader-block-layout';
import {UniformBlock} from './uniform-block';
import {ShaderBlockWriter} from './shader-block-writer';

/** Definition of a single managed uniform block. */
export type UniformStoreBlockDefinition = {
  /** Declared shader types for the block's uniforms. */
  uniformTypes?: Record<string, CompositeShaderType>;
  /** Reserved for future prop-level defaults. */
  defaultProps?: Record<string, unknown>;
  /** Initial uniform values written into the backing block. */
  defaultUniforms?: Record<string, CompositeUniformValue>;
  /** Explicit buffer layout format override. */
  format?: 'std140' | 'wgsl-uniform' | 'wgsl-storage';
};

/** Uniform block definitions keyed by block name. */
export type UniformStoreBlocks<TPropGroups extends Record<string, Record<string, unknown>>> =
  Record<keyof TPropGroups, UniformStoreBlockDefinition>;

/**
 * Smallest buffer size that can be used for uniform buffers.
 *
 * This is an allocation policy rather than part of {@link ShaderBlockLayout}.
 * Layouts report the exact packed size, while the store applies any minimum
 * buffer-size rule when allocating GPU buffers.
 *
 * TODO - does this depend on device?
 */
const minUniformBufferSize = 1024;

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
  /** Device used to infer layout format and allocate buffers. */
  readonly device: Device;
  /** Stores the uniform values for each uniform block */
  uniformBlocks = new Map<keyof TPropGroups, UniformBlock>();
  /** Flattened layout metadata for each block. */
  shaderBlockLayouts = new Map<keyof TPropGroups, ShaderBlockLayout>();
  /** Serializers for block-backed uniform data. */
  shaderBlockWriters = new Map<keyof TPropGroups, ShaderBlockWriter>();
  /** Actual buffer for the blocks */
  uniformBuffers = new Map<keyof TPropGroups, Buffer>();

  /**
   * Creates a new {@link UniformStore} for the supplied device and block definitions.
   */
  constructor(device: Device, blocks: UniformStoreBlocks<TPropGroups>) {
    this.device = device;

    for (const [bufferName, block] of Object.entries(blocks)) {
      const uniformBufferName = bufferName as keyof TPropGroups;

      // Create a layout object to help us generate correctly formatted binary uniform buffers
      const shaderBlockLayout = makeShaderBlockLayout(block.uniformTypes ?? {}, {
        format: block.format ?? getDefaultUniformBufferFormat(device)
      });
      const shaderBlockWriter = new ShaderBlockWriter(shaderBlockLayout);
      this.shaderBlockLayouts.set(uniformBufferName, shaderBlockLayout);
      this.shaderBlockWriters.set(uniformBufferName, shaderBlockWriter);

      // Create a Uniform block to store the uniforms for each buffer.
      const uniformBlock = new UniformBlock({name: bufferName});
      uniformBlock.setUniforms(shaderBlockWriter.getFlatUniformValues(block.defaultUniforms || {}));
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
   *
   * Makes all group properties partial and eagerly propagates changes to any
   * managed GPU buffers.
   */
  setUniforms(
    uniforms: Partial<{[group in keyof TPropGroups]: Partial<TPropGroups[group]>}>
  ): void {
    for (const [blockName, uniformValues] of Object.entries(uniforms)) {
      const uniformBufferName = blockName as keyof TPropGroups;
      const shaderBlockWriter = this.shaderBlockWriters.get(uniformBufferName);
      const flattenedUniforms = shaderBlockWriter?.getFlatUniformValues(
        (uniformValues || {}) as Record<string, CompositeUniformValue>
      );
      this.uniformBlocks.get(uniformBufferName)?.setUniforms(flattenedUniforms || {});
      // We leverage logging in updateUniformBuffers(), even though slightly less efficient
      // this.updateUniformBuffer(blockName);
    }

    this.updateUniformBuffers();
  }

  /**
   * Returns the allocation size for the named uniform buffer.
   *
   * This may exceed the packed layout size because minimum buffer-size policy is
   * applied at the store layer.
   */
  getUniformBufferByteLength(uniformBufferName: keyof TPropGroups): number {
    const packedByteLength = this.shaderBlockLayouts.get(uniformBufferName)?.byteLength || 0;
    return Math.max(packedByteLength, minUniformBufferSize);
  }

  /**
   * Returns packed binary data that can be uploaded to the named uniform buffer.
   *
   * The returned view length matches the packed block size and is not padded to
   * the store's minimum allocation size.
   */
  getUniformBufferData(uniformBufferName: keyof TPropGroups): Uint8Array {
    const uniformValues = this.uniformBlocks.get(uniformBufferName)?.getAllUniforms() || {};
    const shaderBlockWriter = this.shaderBlockWriters.get(uniformBufferName);
    return shaderBlockWriter?.getData(uniformValues) || new Uint8Array(0);
  }

  /**
   * Creates an unmanaged uniform buffer initialized with the current or supplied values.
   */
  createUniformBuffer(
    uniformBufferName: keyof TPropGroups,
    uniforms?: Partial<{[group in keyof TPropGroups]: Partial<TPropGroups[group]>}>
  ): Buffer {
    if (uniforms) {
      this.setUniforms(uniforms);
    }
    const byteLength = this.getUniformBufferByteLength(uniformBufferName);
    const uniformBuffer = this.device.createBuffer({
      usage: Buffer.UNIFORM | Buffer.COPY_DST,
      byteLength
    });
    // Note that this clears the needs redraw flag
    const uniformBufferData = this.getUniformBufferData(uniformBufferName);
    uniformBuffer.write(uniformBufferData);
    return uniformBuffer;
  }

  /** Returns the managed uniform buffer for the named block. */
  getManagedUniformBuffer(uniformBufferName: keyof TPropGroups): Buffer {
    if (!this.uniformBuffers.get(uniformBufferName)) {
      const byteLength = this.getUniformBufferByteLength(uniformBufferName);
      const uniformBuffer = this.device.createBuffer({
        usage: Buffer.UNIFORM | Buffer.COPY_DST,
        byteLength
      });
      this.uniformBuffers.set(uniformBufferName, uniformBuffer);
    }
    // this.updateUniformBuffers();
    // @ts-ignore
    return this.uniformBuffers.get(uniformBufferName);
  }

  /**
   * Updates every managed uniform buffer whose source uniforms have changed.
   *
   * @returns The first redraw reason encountered, or `false` if nothing changed.
   */
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

  /**
   * Updates one managed uniform buffer if its corresponding block is dirty.
   *
   * @returns The redraw reason for the update, or `false` if no write occurred.
   */
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

/**
 * Returns the default uniform-buffer layout format for the supplied device.
 */
function getDefaultUniformBufferFormat(device: Device): 'std140' | 'wgsl-uniform' | 'wgsl-storage' {
  return device.type === 'webgpu' ? 'wgsl-uniform' : 'std140';
}
