// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, type ShaderLayout} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {GpuExpandedTextStream, GpuUtf8TextInput} from './arrow-text';
import {getGpuUtf8MapShaderBindings, getGpuUtf8MapShaderSource} from './gpu-utf8-map';

export type StorageGlyphMetricState = {
  buffer: Buffer;
  byteLength: number;
};

export type StorageGlyphLookupState = {
  buffer: Buffer;
  byteLength: number;
};

export type GpuExpandedCompactInputState = {
  glyphRangesBuffer: Buffer;
  glyphIdsBuffer: Buffer;
  expansionConfigBuffer: Buffer;
  byteLength: number;
};

export type GpuUtf8ExpandedInputState = {
  rowByteRangesBuffer: Buffer;
  utf8BytesBuffer: Buffer;
  expansionConfigBuffer: Buffer;
  byteLength: number;
};

export type GpuExpandedGeneratedState = {
  glyphOffsetsBuffer: Buffer;
  glyphIndicesBuffer: Buffer;
  rowIndicesBuffer: Buffer;
  byteLength: number;
};

export type GpuTextExpansionResourceOptions = {
  id?: string;
};

const GPU_EXPANDED_TEXT_COMPUTE_SOURCE = /* wgsl */ `
@group(0) @binding(0) var<storage, read> textGlyphRanges : array<vec2<u32>>;
@group(0) @binding(1) var<storage, read> textGlyphIds : array<u32>;
@group(0) @binding(2) var<storage, read> textGlyphMetrics : array<vec2<i32>>;
@group(0) @binding(3) var<storage, read> textExpansionConfig : array<i32>;
@group(0) @binding(4) var<storage, read_write> generatedGlyphOffsets : array<u32>;
@group(0) @binding(5) var<storage, read_write> generatedGlyphIndices : array<u32>;
@group(0) @binding(6) var<storage, read_write> generatedRowIndices : array<u32>;

fn unpackGlyphId(glyphIndex: u32) -> u32 {
  let word = textGlyphIds[glyphIndex >> 1u];
  return select(word & 0xffffu, word >> 16u, (glyphIndex & 1u) == 1u);
}

fn packSignedInt16Pair(lowerValue: i32, upperValue: i32) -> u32 {
  return (u32(lowerValue) & 0xffffu) | ((u32(upperValue) & 0xffffu) << 16u);
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {
  let rowIndex = globalInvocationId.x;
  let labelCount = u32(max(textExpansionConfig[1], 0));
  if (rowIndex >= labelCount) {
    return;
  }

  let glyphRange = textGlyphRanges[rowIndex];
  let baselineOffsetY = textExpansionConfig[0];
  var width = 0i;
  var glyphIndex = glyphRange.x;
  loop {
    if (glyphIndex >= glyphRange.y) {
      break;
    }
    let glyphId = unpackGlyphId(glyphIndex);
    let metrics = textGlyphMetrics[glyphId];
    generatedGlyphOffsets[glyphIndex] = packSignedInt16Pair(width + metrics.x, baselineOffsetY);
    generatedGlyphIndices[glyphIndex] = glyphId & 0xffffu;
    generatedRowIndices[glyphIndex] = rowIndex;
    width += metrics.y;
    glyphIndex += 1u;
  }
}
`;

const GPU_EXPANDED_TEXT_COMPUTE_SHADER_LAYOUT: ShaderLayout = {
  bindings: [
    {name: 'textGlyphRanges', type: 'read-only-storage', group: 0, location: 0},
    {name: 'textGlyphIds', type: 'read-only-storage', group: 0, location: 1},
    {name: 'textGlyphMetrics', type: 'read-only-storage', group: 0, location: 2},
    {name: 'textExpansionConfig', type: 'read-only-storage', group: 0, location: 3},
    {name: 'generatedGlyphOffsets', type: 'storage', group: 0, location: 4},
    {name: 'generatedGlyphIndices', type: 'storage', group: 0, location: 5},
    {name: 'generatedRowIndices', type: 'storage', group: 0, location: 6}
  ],
  attributes: []
};

const GPU_UTF8_MAP_BINDING_OPTIONS = {
  rowByteRanges: 'textRowByteRanges',
  utf8Bytes: 'textUtf8Bytes',
  mapStorage: 'textGlyphLookup',
  mapEntryCountExpression: 'u32(max(textExpansionConfig[2], 0))'
} as const;

const GPU_UTF8_EXPANDED_TEXT_COMPUTE_SOURCE = /* wgsl */ `
${getGpuUtf8MapShaderSource(GPU_UTF8_MAP_BINDING_OPTIONS)}
@group(0) @binding(3) var<storage, read> textGlyphMetrics : array<vec2<i32>>;
@group(0) @binding(4) var<storage, read> textExpansionConfig : array<i32>;
@group(0) @binding(5) var<storage, read_write> generatedGlyphOffsets : array<u32>;
@group(0) @binding(6) var<storage, read_write> generatedGlyphIndices : array<u32>;
@group(0) @binding(7) var<storage, read_write> generatedRowIndices : array<u32>;

fn packSignedInt16Pair(lowerValue: i32, upperValue: i32) -> u32 {
  return (u32(lowerValue) & 0xffffu) | ((u32(upperValue) & 0xffffu) << 16u);
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {
  let rowIndex = globalInvocationId.x;
  let labelCount = u32(max(textExpansionConfig[1], 0));
  if (rowIndex >= labelCount) {
    return;
  }

  let rowByteRange = getGpuUtf8MapRowByteRange(rowIndex);
  let baselineOffsetY = textExpansionConfig[0];
  var width = 0i;
  var byteIndex = rowByteRange.x;
  loop {
    if (byteIndex >= rowByteRange.y) {
      break;
    }
    let firstByte = readGpuUtf8MapByte(byteIndex);
    if (isGpuUtf8MapCodePointStart(firstByte)) {
      let glyphId = mapGpuUtf8CodePoint(decodeGpuUtf8MapCodePoint(byteIndex));
      let metrics = textGlyphMetrics[glyphId];
      generatedGlyphOffsets[byteIndex] =
        packSignedInt16Pair(width + metrics.x, baselineOffsetY);
      generatedGlyphIndices[byteIndex] = glyphId & 0xffffu;
      generatedRowIndices[byteIndex] = rowIndex;
      width += metrics.y;
    }
    byteIndex += 1u;
  }
}
`;

const GPU_UTF8_EXPANDED_TEXT_COMPUTE_SHADER_LAYOUT: ShaderLayout = {
  bindings: [
    ...getGpuUtf8MapShaderBindings(GPU_UTF8_MAP_BINDING_OPTIONS),
    {name: 'textGlyphMetrics', type: 'read-only-storage', group: 0, location: 3},
    {name: 'textExpansionConfig', type: 'read-only-storage', group: 0, location: 4},
    {name: 'generatedGlyphOffsets', type: 'storage', group: 0, location: 5},
    {name: 'generatedGlyphIndices', type: 'storage', group: 0, location: 6},
    {name: 'generatedRowIndices', type: 'storage', group: 0, location: 7}
  ],
  attributes: []
};

export function createStorageGlyphMetrics(
  device: Device,
  options: GpuTextExpansionResourceOptions,
  glyphMetricData: Int32Array
): StorageGlyphMetricState {
  return {
    buffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-glyph-metrics`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: glyphMetricData.byteLength > 0 ? glyphMetricData : new Int32Array(2)
    }),
    byteLength: glyphMetricData.byteLength
  };
}

export function createStorageGlyphLookup(
  device: Device,
  options: GpuTextExpansionResourceOptions,
  glyphLookupData: Uint32Array
): StorageGlyphLookupState {
  return {
    buffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-glyph-lookup`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: glyphLookupData.byteLength > 0 ? glyphLookupData : new Uint32Array(2)
    }),
    byteLength: glyphLookupData.byteLength
  };
}

export function createGpuExpandedCompactInput(
  device: Device,
  options: GpuTextExpansionResourceOptions,
  glyphStream: GpuExpandedTextStream
): GpuExpandedCompactInputState {
  const expansionConfig = new Int32Array([
    glyphStream.baselineOffsetY,
    glyphStream.labelGlyphRanges.length / 2
  ]);
  return {
    glyphRangesBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-glyph-ranges`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data:
        glyphStream.labelGlyphRanges.byteLength > 0
          ? glyphStream.labelGlyphRanges
          : new Uint32Array(2)
    }),
    glyphIdsBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-glyph-ids`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data:
        glyphStream.packedGlyphIds.byteLength > 0 ? glyphStream.packedGlyphIds : new Uint32Array(1)
    }),
    expansionConfigBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-expansion-config`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: expansionConfig
    }),
    byteLength:
      glyphStream.labelGlyphRanges.byteLength +
      glyphStream.packedGlyphIds.byteLength +
      expansionConfig.byteLength
  };
}

export function createGpuUtf8ExpandedInput(
  device: Device,
  options: GpuTextExpansionResourceOptions,
  {
    utf8TextInput,
    baselineOffsetY,
    glyphLookupCount,
    labelCount
  }: {
    utf8TextInput: GpuUtf8TextInput;
    baselineOffsetY: number;
    glyphLookupCount: number;
    labelCount: number;
  }
): GpuUtf8ExpandedInputState {
  const expansionConfig = new Int32Array([baselineOffsetY, labelCount, glyphLookupCount]);
  return {
    rowByteRangesBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-utf8-row-byte-ranges`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data:
        utf8TextInput.rowByteRanges.byteLength > 0
          ? utf8TextInput.rowByteRanges
          : new Uint32Array(2)
    }),
    utf8BytesBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-utf8-bytes`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data:
        utf8TextInput.packedUtf8Bytes.byteLength > 0
          ? utf8TextInput.packedUtf8Bytes
          : new Uint32Array(1)
    }),
    expansionConfigBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-utf8-expansion-config`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: expansionConfig
    }),
    byteLength: utf8TextInput.inputByteLength + expansionConfig.byteLength
  };
}

export function createGpuExpandedGeneratedState(
  device: Device,
  options: GpuTextExpansionResourceOptions,
  glyphCount: number
): GpuExpandedGeneratedState {
  const outputWordCount = Math.max(glyphCount, 1);
  const byteLength = glyphCount * Uint32Array.BYTES_PER_ELEMENT * 3;
  return {
    glyphOffsetsBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-generated-glyph-offsets`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint32Array(outputWordCount)
    }),
    glyphIndicesBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-generated-glyph-indices`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint32Array(outputWordCount)
    }),
    rowIndicesBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-generated-row-indices`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint32Array(outputWordCount)
    }),
    byteLength
  };
}

export function dispatchGpuExpandedTextCompute(
  device: Device,
  options: GpuTextExpansionResourceOptions,
  state: {
    compactInput: GpuExpandedCompactInputState;
    glyphMetrics: StorageGlyphMetricState;
    generated: GpuExpandedGeneratedState;
    glyphCount: number;
    labelCount: number;
  }
): void {
  const computation = new Computation(device, {
    id: `${options.id || 'gpu-expanded-text-model'}-compute`,
    source: GPU_EXPANDED_TEXT_COMPUTE_SOURCE,
    shaderLayout: GPU_EXPANDED_TEXT_COMPUTE_SHADER_LAYOUT,
    bindings: {
      textGlyphRanges: state.compactInput.glyphRangesBuffer,
      textGlyphIds: state.compactInput.glyphIdsBuffer,
      textGlyphMetrics: state.glyphMetrics.buffer,
      textExpansionConfig: state.compactInput.expansionConfigBuffer,
      generatedGlyphOffsets: state.generated.glyphOffsetsBuffer,
      generatedGlyphIndices: state.generated.glyphIndicesBuffer,
      generatedRowIndices: state.generated.rowIndicesBuffer
    }
  });
  if (state.glyphCount > 0 && state.labelCount > 0) {
    const computePass = device.beginComputePass({});
    computation.dispatch(computePass, Math.ceil(state.labelCount / 64));
    computePass.end();
    device.submit();
  }
  computation.destroy();
}

export function dispatchGpuUtf8ExpandedTextCompute(
  device: Device,
  options: GpuTextExpansionResourceOptions,
  state: {
    utf8Input: GpuUtf8ExpandedInputState;
    glyphLookup: StorageGlyphLookupState;
    glyphMetrics: StorageGlyphMetricState;
    generated: GpuExpandedGeneratedState;
    outputSlotCount: number;
    labelCount: number;
  }
): void {
  const computation = new Computation(device, {
    id: `${options.id || 'gpu-expanded-text-model'}-utf8-compute`,
    source: GPU_UTF8_EXPANDED_TEXT_COMPUTE_SOURCE,
    shaderLayout: GPU_UTF8_EXPANDED_TEXT_COMPUTE_SHADER_LAYOUT,
    bindings: {
      textRowByteRanges: state.utf8Input.rowByteRangesBuffer,
      textUtf8Bytes: state.utf8Input.utf8BytesBuffer,
      textGlyphLookup: state.glyphLookup.buffer,
      textGlyphMetrics: state.glyphMetrics.buffer,
      textExpansionConfig: state.utf8Input.expansionConfigBuffer,
      generatedGlyphOffsets: state.generated.glyphOffsetsBuffer,
      generatedGlyphIndices: state.generated.glyphIndicesBuffer,
      generatedRowIndices: state.generated.rowIndicesBuffer
    }
  });
  if (state.outputSlotCount > 0 && state.labelCount > 0) {
    const computePass = device.beginComputePass({});
    computation.dispatch(computePass, Math.ceil(state.labelCount / 64));
    computePass.end();
    device.submit();
  }
  computation.destroy();
}
