// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Buffer,
  assert,
  vertexFormatDecoder,
  type BufferLayout,
  type Device,
  type TypedArray,
  type VertexFormat
} from '@luma.gl/core';
import {validateGPUVectorBatchStructure} from '../utils/gpu-vector-batch-structure';
import {DynamicBuffer} from '../dynamic-buffer/dynamic-buffer';
import type {GPUVectorModelInput} from './gpu-vector-model-batches';

/** One raw typed constant, structurally implemented by GPUConstant. */
export type GPUVectorModelConstant = {
  readonly isConstant: true;
  readonly format: VertexFormat;
  readonly value: TypedArray;
  readonly byteLength: number;
};

/** Borrowed vectors and constants keyed by shader attribute or packed-buffer name. */
export type GPUVectorModelAttributes = Readonly<
  Record<string, GPUVectorModelInput | GPUVectorModelConstant | undefined>
>;

/** Prepares one independently replaceable vector input group. */
export class GPUVectorBindings {
  inputs: GPUVectorModelAttributes = {};
  sourceLayouts: BufferLayout[] | undefined;
  stepMode: 'vertex' | 'instance' = 'vertex';
  readonly claimedNames = new Set<string>();
  layouts: BufferLayout[] = [];
  buffers: Record<string, Buffer | DynamicBuffer> = {};
  byteOffsets: Record<string, number> = {};
  constants: Record<string, TypedArray> = {};
  rowCount: number | undefined;
  vertexCount: number | undefined;
  instanceCount: number | undefined;
  private constantBuffers: Record<string, Buffer> = {};

  constructor(
    private readonly device: Device,
    private readonly id: string
  ) {}

  setInputs(
    columns: GPUVectorModelAttributes,
    explicitLayouts: BufferLayout[] | undefined,
    stepMode: 'vertex' | 'instance'
  ): void {
    validateGPUVectorBatchStructure(columns);
    this.claimedNames.clear();
    this.inputs = columns;
    this.sourceLayouts = explicitLayouts;
    this.stepMode = stepMode;
    this.rowCount = undefined;
    this.vertexCount = undefined;
    this.instanceCount = undefined;
    const providedLayouts =
      explicitLayouts ??
      Object.entries(columns).flatMap<BufferLayout>(([name, column]) =>
        column && !isConstant(column) && column.bufferLayout ? [{...column.bufferLayout, name}] : []
      );
    const layouts: BufferLayout[] = [
      ...providedLayouts,
      ...Object.entries(columns).flatMap<BufferLayout>(([name, column]) => {
        if (
          !column ||
          providedLayouts.some(
            layout =>
              layout.name === name ||
              layout.attributes?.some(attribute => attribute.attribute === name)
          )
        )
          return [];
        assert(column.format);
        const format = column.format as VertexFormat;
        const byteStride = isConstant(column) ? 0 : column.byteStride;
        return [
          {name, stepMode, byteStride, attributes: [{attribute: name, format, byteOffset: 0}]}
        ];
      })
    ];
    for (const [name, column] of Object.entries(columns)) {
      if (!column) continue;
      // Inputs must describe a typed vector or a typed constant, never raw buffers or arrays.
      if (!isConstant(column) && !Array.isArray(column.data))
        throw new TypeError(`Expected a GPU vector or constant for ${name}`);
      if (!isConstant(column)) {
        const layout = layouts.find(
          layout =>
            layout.name === name ||
            layout.attributes?.some(attribute => attribute.attribute === name)
        );
        const mode = layout?.stepMode ?? stepMode;
        if (mode === 'instance') {
          assert(this.instanceCount === undefined || this.instanceCount === column.length);
          this.instanceCount = column.length;
        } else {
          assert(this.vertexCount === undefined || this.vertexCount === column.length);
          this.vertexCount = column.length;
        }
        this.rowCount = stepMode === 'instance' ? this.instanceCount : this.vertexCount;
      }
      this.claimedNames.add(name);
    }
    this.layouts = layouts.flatMap<BufferLayout>(layout => {
      const packed = columns[layout.name];
      const definitions =
        layout.attributes ??
        (layout.format ? [{attribute: layout.name, format: layout.format, byteOffset: 0}] : []);
      const constants = definitions.filter(definition => isConstant(columns[definition.attribute]));
      const resolved = {...layout, stepMode: layout.stepMode ?? stepMode};
      if (
        this.device.type !== 'webgpu' ||
        (packed && !isConstant(packed) && packed.bufferLayout) ||
        !constants.length ||
        constants.length === definitions.length
      ) {
        return [
          {
            ...resolved,
            byteStride:
              constants.length === definitions.length && constants.length ? 0 : resolved.byteStride
          }
        ];
      }
      return [
        {
          ...resolved,
          attributes: definitions.filter(definition => !isConstant(columns[definition.attribute]))
        },
        {...resolved, name: `${layout.name}-constants`, byteStride: 0, attributes: constants}
      ];
    });
    this.buffers = {};
    this.byteOffsets = {};
    this.constants = {};
    const usedConstantBuffers = new Set<string>();
    for (const layout of this.layouts) {
      this.claimedNames.add(layout.name);
      const definitions =
        layout.attributes ??
        (layout.format ? [{attribute: layout.name, format: layout.format, byteOffset: 0}] : []);
      for (const definition of definitions) this.claimedNames.add(definition.attribute);
      const packed = columns[layout.name];
      if (packed && !isConstant(packed)) {
        const layoutOffset =
          packed.bufferLayout || !packed.format
            ? 0
            : ((
                definitions.find(definition => definition.attribute === layout.name) ??
                definitions[0]
              )?.byteOffset ?? 0);
        this.bindVector(layout.name, packed, layoutOffset);
      }
      let constantByteLength = 0;
      for (const definition of definitions) {
        const column =
          columns[definition.attribute] ??
          (definition.attribute === layout.name ? columns[layout.name] : undefined);
        if (!column) continue;
        // Explicit layouts describe the stored bytes, independently of the shader value type.
        assert(column.format === undefined || column.format === definition.format);
        if (isConstant(column)) {
          this.constants[definition.attribute] = getShaderConstant(column);
          constantByteLength = Math.max(
            constantByteLength,
            (definition.byteOffset ?? 0) + column.byteLength
          );
        } else if (!this.buffers[layout.name]) {
          this.bindVector(layout.name, column, definition.byteOffset ?? 0);
        }
      }
      if (this.device.type === 'webgpu' && constantByteLength && !this.buffers[layout.name]) {
        const bytes = new Uint8Array(Math.ceil(constantByteLength / 4) * 4);
        for (const definition of definitions) {
          const column = columns[definition.attribute];
          if (isConstant(column))
            bytes.set(
              new Uint8Array(column.value.buffer, column.value.byteOffset, column.byteLength),
              definition.byteOffset ?? 0
            );
        }
        let buffer = this.constantBuffers[layout.name];
        if (!buffer || buffer.byteLength < bytes.byteLength) {
          buffer?.destroy();
          buffer = this.device.createBuffer({
            id: `${this.id}-${layout.name}-constant`,
            byteLength: bytes.byteLength,
            usage: Buffer.VERTEX | Buffer.COPY_DST | Buffer.COPY_SRC
          });
          this.constantBuffers[layout.name] = buffer;
        }
        buffer.write(bytes);
        this.buffers[layout.name] = buffer;
        usedConstantBuffers.add(layout.name);
      }
    }
    for (const [name, buffer] of Object.entries(this.constantBuffers)) {
      if (!usedConstantBuffers.has(name)) {
        buffer.destroy();
        delete this.constantBuffers[name];
      }
    }
  }

  get batchCount(): number {
    const vector = Object.values(this.inputs).find(column => column && !isConstant(column));
    return vector && !isConstant(vector) ? vector.data.length : 1;
  }

  getBatch(batchIndex: number): GPUVectorModelAttributes {
    return Object.fromEntries(
      Object.entries(this.inputs).map(([name, column]) => {
        if (!column || isConstant(column)) return [name, column];
        const chunk = column.data[batchIndex];
        return [name, {...column, length: chunk?.length ?? 0, data: chunk ? [chunk] : []}];
      })
    );
  }

  destroy(): void {
    for (const buffer of Object.values(this.constantBuffers)) buffer.destroy();
    this.constantBuffers = {};
  }

  private bindVector(name: string, vector: GPUVectorModelInput, layoutOffset: number): void {
    const chunk = vector.data[0];
    if (!chunk) return;
    const byteOffset = chunk.byteOffset - layoutOffset;
    // The binding offset and layout offset together address the first vector value.
    assert(byteOffset >= 0);
    this.buffers[name] = chunk.buffer;
    this.byteOffsets[name] = byteOffset;
  }
}

function isConstant(
  column: GPUVectorModelInput | GPUVectorModelConstant | undefined
): column is GPUVectorModelConstant {
  return Boolean(column && 'isConstant' in column && column.isConstant);
}

function getShaderConstant(column: GPUVectorModelConstant): TypedArray {
  const information = vertexFormatDecoder.getVertexFormatInfo(column.format);
  if (column.format === 'unorm10-10-10-2') {
    const word = column.value[0];
    return new Float32Array([
      (word & 1023) / 1023,
      ((word >>> 10) & 1023) / 1023,
      ((word >>> 20) & 1023) / 1023,
      (word >>> 30) / 3
    ]);
  }
  const values = Array.from(column.value);
  if (column.format === 'unorm8x4-bgra') [values[0], values[2]] = [values[2], values[0]];
  if (information.normalized) {
    const bits = column.value.BYTES_PER_ELEMENT * 8;
    const maximum = 2 ** bits - 1;
    // Preserve deck.gl's shader-facing signed constant normalization.
    return new Float32Array(
      values.map(value =>
        information.signed ? ((value + 2 ** (bits - 1)) / maximum) * 2 - 1 : value / maximum
      )
    );
  }
  if (information.integer)
    return information.signed ? new Int32Array(values) : new Uint32Array(values);
  return new Float32Array(values);
}
