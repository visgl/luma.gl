// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  assert,
  Buffer,
  type Binding,
  type BufferLayout,
  type Device,
  NativeFloat16ArrayConstructor,
  type ShaderLayout,
  type TypedArray
} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';
import {
  getGPUInputAttributeNames,
  validateGPUInputVectors,
  type GPUInputDeclaration,
  type GPUInputSchema
} from './gpu-input-schema';
import {GPUConstant} from '../table/gpu-constant';
import type {GPUData} from '../table/gpu-data';
import type {GPUTable} from '../table/gpu-table';
import {getGPUVectorFormatInfo} from '../table/gpu-vector-format';

type GPUBuffer = Buffer | DynamicBuffer;

/** One normalized shader attribute supplied by a logical GPU input. */
type GPUAttributeInput = {
  input: GPUInputDeclaration;
  attributeName: string;
};

/** Construction props for one table-to-shader binding preparation object. */
export type GPUTableShaderBindingsProps = {
  table: GPUTable;
  gpuInputSchema: GPUInputSchema;
  shaderLayout: ShaderLayout;
};

/** Draw-ready table resources for one preserved GPU record batch. */
export type GPUTableShaderBindingBatch = {
  attributes: Record<string, GPUBuffer>;
  attributeBuffers: GPUBuffer[];
  bindings: Record<string, Binding>;
};

type OwnedBuffer = {
  key: string;
  usage: number;
  buffer: Buffer;
};

type PreparedBindings = {
  table: GPUTable;
  bufferLayout: BufferLayout[];
  batches: GPUTableShaderBindingBatch[];
  constantAttributes: Record<string, TypedArray>;
  ownedBuffers: Map<string, OwnedBuffer>;
  ownedByteLength: number;
};

/**
 * Owns backend resources prepared by resolving a GPUTable against one fixed shader contract.
 */
export class GPUTableShaderBindings {
  readonly device: Device;
  readonly gpuInputSchema: GPUInputSchema;
  readonly shaderLayout: ShaderLayout;
  readonly shaderModule?: ShaderModule;
  table: GPUTable;
  readonly bufferLayout: BufferLayout[] = [];
  readonly batches: GPUTableShaderBindingBatch[] = [];
  readonly constantAttributes: Record<string, TypedArray> = {};
  ownedByteLength = 0;
  private ownedBuffers = new Map<string, OwnedBuffer>();
  private destroyed = false;

  constructor(device: Device, {table, gpuInputSchema, shaderLayout}: GPUTableShaderBindingsProps) {
    this.device = device;
    this.table = table;
    this.gpuInputSchema = gpuInputSchema;
    this.shaderLayout = shaderLayout;
    this.shaderModule = makeGPUTableShaderModule(gpuInputSchema, shaderLayout);
    this.updateBindings(table);
  }

  /** Replaces the table while retaining the fixed schema and shader layout. */
  updateBindings(table: GPUTable): void {
    if (this.destroyed) {
      throw new Error('GPUTableShaderBindings has been destroyed');
    }
    validateGPUInputVectors('GPUTableShaderBindings', this.gpuInputSchema, table.gpuColumns);
    const prepared = prepareBindings(
      this.device,
      table,
      this.gpuInputSchema,
      this.shaderLayout,
      this.ownedBuffers
    );

    for (const [key, ownedBuffer] of this.ownedBuffers) {
      if (prepared.ownedBuffers.get(key)?.buffer !== ownedBuffer.buffer) {
        ownedBuffer.buffer.destroy();
      }
    }
    this.table = table;
    this.bufferLayout.splice(0, this.bufferLayout.length, ...prepared.bufferLayout);
    this.batches.splice(0, this.batches.length, ...prepared.batches);
    replaceRecord(this.constantAttributes, prepared.constantAttributes);
    this.ownedBuffers = prepared.ownedBuffers;
    this.ownedByteLength = prepared.ownedByteLength;
  }

  /** Releases buffers allocated while preparing constants and storage row multipliers. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    for (const ownedBuffer of this.ownedBuffers.values()) {
      ownedBuffer.buffer.destroy();
    }
    this.ownedBuffers.clear();
    this.bufferLayout.length = 0;
    this.batches.length = 0;
    replaceRecord(this.constantAttributes, {});
    this.ownedByteLength = 0;
    this.destroyed = true;
  }
}

/** Returns the generated uniform field used by a storage binding. */
export function getGPUTableRowMultiplierFieldName(storageBindingName: string): string {
  return `${storageBindingName}RowMultiplier`;
}

function prepareBindings(
  device: Device,
  table: GPUTable,
  gpuInputSchema: GPUInputSchema,
  shaderLayout: ShaderLayout,
  reusableBuffers: Map<string, OwnedBuffer>
): PreparedBindings {
  const shaderAttributeNames = new Set(shaderLayout.attributes.map(attribute => attribute.name));
  const storageBindingNames = new Set(
    shaderLayout.bindings
      .filter(binding => binding.type === 'storage' || binding.type === 'read-only-storage')
      .map(binding => binding.name)
  );
  const attributeInputs = gpuInputSchema.flatMap(input =>
    getGPUInputAttributeNames(input)
      .filter(attributeName => shaderAttributeNames.has(attributeName))
      .map(attributeName => ({input, attributeName}))
  );
  const storageInputs = gpuInputSchema.filter(
    input => input.storageBindingName && storageBindingNames.has(input.storageBindingName)
  );
  const ownedBuffers = new Map<string, OwnedBuffer>();
  const varyingLayouts = getVaryingAttributeLayouts(table, attributeInputs);
  const constantAttributes: Record<string, TypedArray> = {};
  const constantLayouts: BufferLayout[] = [];
  const constantAttributeBuffers: Record<string, Buffer> = {};

  validateCompositeConstantInputs(table, gpuInputSchema);

  if (device.type === 'webgl') {
    for (const {input, attributeName} of attributeInputs) {
      const constant = table.gpuConstants[input.columnName];
      if (constant) {
        constantAttributes[attributeName] = getWebGLConstantValue(constant);
      }
    }
  } else {
    for (const stepMode of ['vertex', 'instance'] as const) {
      const stepInputs = attributeInputs.filter(({input, attributeName}) => {
        const shaderAttribute = shaderLayout.attributes.find(
          attribute => attribute.name === attributeName
        );
        return (
          table.gpuConstants[input.columnName] &&
          (shaderAttribute?.stepMode ?? 'vertex') === stepMode
        );
      });
      if (stepInputs.length === 0) {
        continue;
      }
      const packed = packConstantAttributes(stepInputs, table.gpuConstants);
      const key = `attribute:${stepMode}`;
      const buffer = acquireBuffer(
        device,
        reusableBuffers,
        ownedBuffers,
        key,
        Buffer.VERTEX | Buffer.COPY_DST,
        packed.data
      );
      const layoutName = `gpu-table-constant-${stepMode}`;
      constantLayouts.push({
        name: layoutName,
        stepMode,
        byteStride: 0,
        attributes: packed.attributes
      });
      constantAttributeBuffers[layoutName] = buffer;
    }
  }

  const constantStorageBindings: Record<string, Binding> = {};
  for (const input of storageInputs) {
    const constant = table.gpuConstants[input.columnName];
    if (!constant || !input.storageBindingName) {
      continue;
    }
    const key = `storage:${input.storageBindingName}`;
    const data = getPaddedBufferData(constant.value, 16);
    const buffer = acquireBuffer(
      device,
      reusableBuffers,
      ownedBuffers,
      key,
      Buffer.STORAGE | Buffer.COPY_DST,
      data
    );
    constantStorageBindings[input.storageBindingName] = {
      buffer,
      offset: 0,
      size: buffer.byteLength
    };
  }

  let rowMultiplierBinding: Binding | undefined;
  if (storageInputs.length > 0) {
    const multipliers = new Uint32Array(
      storageInputs.map(input => (table.gpuConstants[input.columnName] ? 0 : 1))
    );
    const buffer = acquireBuffer(
      device,
      reusableBuffers,
      ownedBuffers,
      'uniform:gpuTableColumns',
      Buffer.UNIFORM | Buffer.COPY_DST,
      getPaddedBufferData(multipliers, 16)
    );
    rowMultiplierBinding = buffer;
  }

  const bufferLayout = sortBufferLayoutsByShaderLocation(
    [...varyingLayouts, ...constantLayouts],
    shaderLayout
  );
  const batches = table.batches.map(batch => {
    const attributes: Record<string, GPUBuffer> = {};
    for (const layout of varyingLayouts) {
      const data = batch.gpuData[layout.name];
      if (!data) {
        throw new Error(`GPUTableShaderBindings batch is missing GPUData "${layout.name}"`);
      }
      attributes[layout.name] = data.buffer;
    }
    for (const layout of constantLayouts) {
      const buffer = constantAttributeBuffers[layout.name];
      attributes[layout.name] = buffer;
    }
    const attributeBuffers = bufferLayout.map(layout => attributes[layout.name]);

    const bindings: Record<string, Binding> = {};
    for (const input of storageInputs) {
      const storageBindingName = input.storageBindingName;
      if (!storageBindingName) {
        continue;
      }
      const constantBinding = constantStorageBindings[storageBindingName];
      if (constantBinding) {
        bindings[storageBindingName] = constantBinding;
        continue;
      }
      const data = batch.gpuData[input.columnName];
      if (data) {
        bindings[storageBindingName] = getGPUDataBinding(data);
      }
    }
    if (rowMultiplierBinding) {
      bindings['gpuTableColumns'] = rowMultiplierBinding;
    }
    return {attributes, attributeBuffers, bindings};
  });

  return {
    table,
    bufferLayout,
    batches,
    constantAttributes,
    ownedBuffers,
    ownedByteLength: Array.from(ownedBuffers.values()).reduce(
      (byteLength, ownedBuffer) => byteLength + ownedBuffer.buffer.byteLength,
      0
    )
  };
}

function sortBufferLayoutsByShaderLocation(
  bufferLayouts: BufferLayout[],
  shaderLayout: ShaderLayout
): BufferLayout[] {
  const locations = new Map(
    shaderLayout.attributes.map(attribute => [attribute.name, attribute.location])
  );
  const sortedLayouts = bufferLayouts.map(layout => ({
    ...layout,
    ...(layout.attributes
      ? {
          attributes: [...layout.attributes].sort(
            (attributeA, attributeB) =>
              (locations.get(attributeA.attribute) ?? Infinity) -
              (locations.get(attributeB.attribute) ?? Infinity)
          )
        }
      : {})
  }));
  return sortedLayouts.sort((layoutA, layoutB) => {
    const getLocation = (layout: BufferLayout): number =>
      Math.min(
        ...(layout.attributes ?? [{attribute: layout.name}]).map(
          attribute => locations.get(attribute.attribute) ?? Infinity
        )
      );
    return getLocation(layoutA) - getLocation(layoutB);
  });
}

function getVaryingAttributeLayouts(
  table: GPUTable,
  attributeInputs: GPUAttributeInput[]
): BufferLayout[] {
  const layouts = new Map<string, BufferLayout>();
  for (const {input, attributeName} of attributeInputs) {
    if (table.gpuConstants[input.columnName]) {
      continue;
    }
    const sourceLayout = table.bufferLayout.find(layout => layout.name === input.columnName);
    // Every active varying input must have a physical table layout.
    assert(sourceLayout);
    if (!sourceLayout.attributes) {
      // Flat layouts expose exactly one shader attribute.
      assert(getGPUInputAttributeNames(input).length === 1);
      layouts.set(sourceLayout.name, getShaderAttributeBufferLayout(sourceLayout, attributeName));
      continue;
    }
    const attribute = sourceLayout.attributes.find(
      candidate => candidate.attribute === attributeName
    );
    // Composite layouts must expose every active declared view.
    assert(attribute);
    const existing = layouts.get(sourceLayout.name);
    if (existing?.attributes) {
      existing.attributes.push(attribute);
    } else {
      layouts.set(sourceLayout.name, {...sourceLayout, attributes: [attribute]});
    }
  }
  return Array.from(layouts.values());
}

function packConstantAttributes(
  inputs: GPUAttributeInput[],
  constants: Record<string, GPUConstant>
): {data: Uint8Array; attributes: NonNullable<BufferLayout['attributes']>} {
  const offsets: number[] = [];
  let byteLength = 0;
  for (const {input} of inputs) {
    const constant = constants[input.columnName];
    const alignment = Math.min(4, constant.byteLength);
    byteLength = Math.ceil(byteLength / alignment) * alignment;
    offsets.push(byteLength);
    byteLength += constant.byteLength;
  }
  const data = new Uint8Array(Math.max(4, Math.ceil(byteLength / 4) * 4));
  const attributes = inputs.map(({input, attributeName}, index) => {
    const constant = constants[input.columnName];
    data.set(
      new Uint8Array(constant.value.buffer, constant.value.byteOffset, constant.value.byteLength),
      offsets[index]
    );
    return {
      attribute: attributeName,
      format: constant.format,
      byteOffset: offsets[index]
    };
  });
  return {data, attributes};
}

/** Rejects constants that cannot represent a composite input's complete physical row. */
function validateCompositeConstantInputs(table: GPUTable, gpuInputSchema: GPUInputSchema): void {
  for (const input of gpuInputSchema) {
    // GPUConstant describes one formatted value, not a composite physical row.
    assert(!(getGPUInputAttributeNames(input).length > 1 && table.gpuConstants[input.columnName]));
  }
}

function acquireBuffer(
  device: Device,
  reusableBuffers: Map<string, OwnedBuffer>,
  nextBuffers: Map<string, OwnedBuffer>,
  key: string,
  usage: number,
  data: Uint8Array | Uint32Array
): Buffer {
  const reusable = reusableBuffers.get(key);
  let buffer: Buffer;
  if (reusable && reusable.usage === usage && reusable.buffer.byteLength === data.byteLength) {
    buffer = reusable.buffer;
    buffer.write(data);
  } else {
    buffer = device.createBuffer({id: `gpu-table-${key}`, usage, data});
  }
  nextBuffers.set(key, {key, usage, buffer});
  return buffer;
}

function getPaddedBufferData(value: TypedArray, alignment = 4): Uint8Array {
  const byteLength = Math.max(alignment, Math.ceil(value.byteLength / alignment) * alignment);
  const data = new Uint8Array(byteLength);
  data.set(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
  return data;
}

function makeGPUTableShaderModule(
  gpuInputSchema: GPUInputSchema,
  shaderLayout: ShaderLayout
): ShaderModule | undefined {
  const storageBindingNames = new Set(
    shaderLayout.bindings
      .filter(binding => binding.type === 'storage' || binding.type === 'read-only-storage')
      .map(binding => binding.name)
  );
  const storageInputs = gpuInputSchema.filter(
    input => input.storageBindingName && storageBindingNames.has(input.storageBindingName)
  );
  if (storageInputs.length === 0) {
    return undefined;
  }
  const fields = storageInputs
    .map(input => `  ${getGPUTableRowMultiplierFieldName(input.storageBindingName!)} : u32,`)
    .join('\n');
  return {
    name: 'gpuTableColumns',
    source: `
struct GPUTableColumnUniforms {
${fields}
};

@group(0) @binding(auto) var<uniform> gpuTableColumns : GPUTableColumnUniforms;

fn gpuTable_getRowIndex(rowIndex : u32, rowMultiplier : u32) -> u32 {
  return rowIndex * rowMultiplier;
}
`,
    bindingLayout: [{name: 'gpuTableColumns', group: 0}]
  };
}

function getWebGLConstantValue(constant: GPUConstant): TypedArray {
  const formatInfo = getGPUVectorFormatInfo(constant.format);
  if (constant.format === 'unorm10-10-10-2') {
    const word = (constant.value as Uint32Array)[0];
    return new Float32Array([
      (word & 0x3ff) / 0x3ff,
      ((word >>> 10) & 0x3ff) / 0x3ff,
      ((word >>> 20) & 0x3ff) / 0x3ff,
      ((word >>> 30) & 0x3) / 0x3
    ]);
  }
  const values = Array.from(constant.value as ArrayLike<number>);
  if (constant.format === 'unorm8x4-bgra') {
    [values[0], values[2]] = [values[2], values[0]];
  }
  if (formatInfo.normalized) {
    const bits = constant.value.BYTES_PER_ELEMENT * 8;
    const divisor = formatInfo.signed ? 2 ** (bits - 1) - 1 : 2 ** bits - 1;
    return new Float32Array(values.map(value => Math.max(-1, value / divisor)));
  }
  if (formatInfo.primitiveType === 'f16') {
    return new Float32Array(
      constant.value.constructor === NativeFloat16ArrayConstructor
        ? values
        : values.map(value => decodeFloat16(value))
    );
  }
  if (formatInfo.primitiveType === 'f32') {
    return new Float32Array(values);
  }
  const paddedValues = [...values, 0, 0, 1].slice(0, 4);
  return formatInfo.signed ? new Int32Array(paddedValues) : new Uint32Array(paddedValues);
}

function decodeFloat16(value: number): number {
  const sign = value & 0x8000 ? -1 : 1;
  const exponent = (value >>> 10) & 0x1f;
  const fraction = value & 0x03ff;
  if (exponent === 0) {
    return sign * 2 ** -14 * (fraction / 1024);
  }
  if (exponent === 0x1f) {
    return fraction ? Number.NaN : sign * Number.POSITIVE_INFINITY;
  }
  return sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
}

function getShaderAttributeBufferLayout(
  bufferLayout: BufferLayout,
  attributeName: string
): BufferLayout {
  if (bufferLayout.name === attributeName) {
    return bufferLayout;
  }
  if (!bufferLayout.format) {
    throw new Error(
      `GPUTableShaderBindings buffer layout "${bufferLayout.name}" cannot map shader attribute "${attributeName}" without a format`
    );
  }
  return {
    name: bufferLayout.name,
    stepMode: bufferLayout.stepMode,
    byteStride: bufferLayout.byteStride,
    attributes: [{attribute: attributeName, format: bufferLayout.format, byteOffset: 0}]
  };
}

function getGPUDataBinding(data: GPUData): Binding {
  return {
    buffer: data.buffer instanceof DynamicBuffer ? data.buffer.buffer : data.buffer,
    offset: data.byteOffset,
    size: data.valueByteLength ?? data.valueLength * data.byteStride
  };
}

function replaceRecord<T>(target: Record<string, T>, source: Record<string, T>): void {
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  Object.assign(target, source);
}
