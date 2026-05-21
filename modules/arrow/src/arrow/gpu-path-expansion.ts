// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Binding, type Device, type ShaderLayout} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {GeneratedBufferBatch} from './generated-buffer-batches';

export type GpuPathExpansionResourceOptions = {
  id?: string;
};

export type GpuPathExpansionInputState = {
  expansionConfigBuffer: Buffer;
  byteLength: number;
};

export type GpuPathRangeState = {
  pathRangesBuffer: Buffer;
  byteLength: number;
  destroy: () => void;
};

export type GpuPathGeneratedState = {
  compactPathVertexData: Buffer;
  byteLength: number;
};

export type GpuPathExpansionInputProps = {
  generatedBufferBatch: GeneratedBufferBatch;
  componentCount: number;
  recordWordCount: number;
};

const PATH_RANGE_WORD_COUNT = 4;
const COMPACT_PATH_VERTEX_WORD_COUNT = 3;
const LEGACY_PATH_VERTEX_WORD_COUNT = 6;

const GPU_PATH_EXPANSION_COMPUTE_SOURCE = /* wgsl */ `
@group(0) @binding(0) var<storage, read> pathValues : array<f32>;
@group(0) @binding(1) var<storage, read> pathRanges : array<vec4<u32>>;
@group(0) @binding(2) var<storage, read> pathExpansionConfig : array<u32>;
@group(0) @binding(3) var<storage, read_write> generatedPathVertices : array<u32>;

const PATH_SEGMENT_FIRST : u32 = 1u;
const PATH_SEGMENT_LAST : u32 = 2u;
const PATH_SEGMENT_CLOSED : u32 = 4u;
const COMPACT_PATH_RECORD_WORD_COUNT : u32 = ${COMPACT_PATH_VERTEX_WORD_COUNT}u;

fn getPathComponentCount() -> u32 {
  return pathExpansionConfig[1];
}

fn readPathComponent(pointIndex: u32, componentIndex: u32) -> f32 {
  if (componentIndex >= getPathComponentCount()) {
    return 0.0;
  }
  return pathValues[pointIndex * getPathComponentCount() + componentIndex];
}

fn pathIsClosed(pathStart: u32, pointCount: u32) -> bool {
  if (pointCount < 3u) {
    return false;
  }
  let lastPointIndex = pathStart + pointCount - 1u;
  var componentIndex = 0u;
  loop {
    if (componentIndex >= getPathComponentCount()) {
      break;
    }
    if (
      readPathComponent(pathStart, componentIndex) !=
      readPathComponent(lastPointIndex, componentIndex)
    ) {
      return false;
    }
    componentIndex += 1u;
  }
  return true;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {
  let localRowIndex = globalInvocationId.x;
  let rowCount = pathExpansionConfig[0];
  if (localRowIndex >= rowCount) {
    return;
  }

  let rowStart = pathExpansionConfig[2];
  let generatedRecordStart = pathExpansionConfig[3];
  let recordWordCount = pathExpansionConfig[4];
  let pathRange = pathRanges[rowStart + localRowIndex];
  let pathStart = pathRange.x;
  let pathEnd = pathRange.y;
  let outputStart = pathRange.z - generatedRecordStart;
  let rowIndex = pathRange.w;
  let pointCount = select(0u, pathEnd - pathStart, pathEnd >= pathStart);
  let segmentCount = select(0u, pointCount - 1u, pointCount > 0u);
  let closedPath = pathIsClosed(pathStart, pointCount);

  var segmentOffset = 0u;
  loop {
    if (segmentOffset >= segmentCount) {
      break;
    }
    let segmentStartPointIndex = pathStart + segmentOffset;
    let segmentEndPointIndex = segmentStartPointIndex + 1u;
    var previousPointIndex = segmentStartPointIndex;
    if (segmentOffset > 0u) {
      previousPointIndex = segmentStartPointIndex - 1u;
    } else if (closedPath) {
      previousPointIndex = pathEnd - 2u;
    }
    var nextPointIndex = segmentEndPointIndex + 1u;
    if (segmentOffset == segmentCount - 1u) {
      nextPointIndex = segmentEndPointIndex;
      if (closedPath) {
        nextPointIndex = pathStart + 1u;
      }
    }

    var flags = select(0u, PATH_SEGMENT_CLOSED, closedPath);
    if (segmentOffset == 0u) {
      flags |= PATH_SEGMENT_FIRST;
    }
    if (segmentOffset == segmentCount - 1u) {
      flags |= PATH_SEGMENT_LAST;
    }
    let recordWordOffset = (outputStart + segmentOffset) * recordWordCount;
    if (recordWordCount == COMPACT_PATH_RECORD_WORD_COUNT) {
      generatedPathVertices[recordWordOffset] = segmentStartPointIndex;
      generatedPathVertices[recordWordOffset + 1u] = flags;
      generatedPathVertices[recordWordOffset + 2u] = rowIndex;
    } else {
      generatedPathVertices[recordWordOffset] = segmentStartPointIndex;
      generatedPathVertices[recordWordOffset + 1u] = segmentEndPointIndex;
      generatedPathVertices[recordWordOffset + 2u] = previousPointIndex;
      generatedPathVertices[recordWordOffset + 3u] = nextPointIndex;
      generatedPathVertices[recordWordOffset + 4u] = flags;
      generatedPathVertices[recordWordOffset + 5u] = rowIndex;
    }
    segmentOffset += 1u;
  }
}
`;

const GPU_PATH_EXPANSION_COMPUTE_SHADER_LAYOUT: ShaderLayout = {
  bindings: [
    {name: 'pathValues', type: 'read-only-storage', group: 0, location: 0},
    {name: 'pathRanges', type: 'read-only-storage', group: 0, location: 1},
    {name: 'pathExpansionConfig', type: 'read-only-storage', group: 0, location: 2},
    {name: 'generatedPathVertices', type: 'storage', group: 0, location: 3}
  ],
  attributes: []
};

export function createGpuPathRangeState(
  device: Device,
  options: GpuPathExpansionResourceOptions,
  props: {
    valueOffsets: Int32Array;
    recordOffsets: readonly number[];
    batchRowIndexBase: number;
    rowCount: number;
  }
): GpuPathRangeState {
  const {valueOffsets, recordOffsets, batchRowIndexBase, rowCount} = props;
  const pathRanges = new Uint32Array(Math.max(rowCount, 1) * PATH_RANGE_WORD_COUNT);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const rangeOffset = rowIndex * PATH_RANGE_WORD_COUNT;
    pathRanges[rangeOffset] = Math.max(0, valueOffsets[rowIndex] ?? 0);
    pathRanges[rangeOffset + 1] = Math.max(
      pathRanges[rangeOffset],
      valueOffsets[rowIndex + 1] ?? pathRanges[rangeOffset]
    );
    pathRanges[rangeOffset + 2] = Math.max(0, recordOffsets[rowIndex] ?? 0);
    pathRanges[rangeOffset + 3] = batchRowIndexBase + rowIndex;
  }

  const pathRangesBuffer = device.createBuffer({
    id: `${options.id || 'gpu-expanded-path-model'}-path-ranges`,
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    data: pathRanges
  });

  return {
    pathRangesBuffer,
    byteLength: pathRanges.byteLength,
    destroy: () => pathRangesBuffer.destroy()
  };
}

export function createGpuPathExpansionInput(
  device: Device,
  options: GpuPathExpansionResourceOptions,
  props: GpuPathExpansionInputProps
): GpuPathExpansionInputState {
  const {generatedBufferBatch, componentCount, recordWordCount} = props;
  const rowCount = generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart;

  if (
    recordWordCount !== COMPACT_PATH_VERTEX_WORD_COUNT &&
    recordWordCount !== LEGACY_PATH_VERTEX_WORD_COUNT
  ) {
    throw new Error(
      `Unsupported GPU path record word count ${recordWordCount}; expected ${COMPACT_PATH_VERTEX_WORD_COUNT} or ${LEGACY_PATH_VERTEX_WORD_COUNT}`
    );
  }

  const expansionConfig = new Uint32Array([
    rowCount,
    componentCount,
    generatedBufferBatch.rowStart,
    generatedBufferBatch.recordStart,
    recordWordCount
  ]);
  return {
    expansionConfigBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-path-model'}-expansion-config`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: expansionConfig
    }),
    byteLength: expansionConfig.byteLength
  };
}

export function createGpuPathGeneratedState(
  device: Device,
  options: GpuPathExpansionResourceOptions,
  segmentCount: number,
  recordWordCount: number
): GpuPathGeneratedState {
  if (
    recordWordCount !== COMPACT_PATH_VERTEX_WORD_COUNT &&
    recordWordCount !== LEGACY_PATH_VERTEX_WORD_COUNT
  ) {
    throw new Error(
      `Unsupported GPU path record word count ${recordWordCount}; expected ${COMPACT_PATH_VERTEX_WORD_COUNT} or ${LEGACY_PATH_VERTEX_WORD_COUNT}`
    );
  }

  const outputRecordCount = Math.max(segmentCount, 1);
  const byteLength = segmentCount * Uint32Array.BYTES_PER_ELEMENT * recordWordCount;
  return {
    compactPathVertexData: device.createBuffer({
      id: `${options.id || 'gpu-expanded-path-model'}-generated-path-vertices`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint32Array(outputRecordCount * recordWordCount)
    }),
    byteLength
  };
}

export function dispatchGpuPathExpansionCompute(
  device: Device,
  options: GpuPathExpansionResourceOptions,
  state: {
    pathValues: Binding;
    pathRanges: Binding | Buffer;
    expansionInput: GpuPathExpansionInputState;
    generated: GpuPathGeneratedState;
    rowCount: number;
    segmentCount: number;
  }
): void {
  const computation = new Computation(device, {
    id: `${options.id || 'gpu-expanded-path-model'}-compute`,
    source: GPU_PATH_EXPANSION_COMPUTE_SOURCE,
    shaderLayout: GPU_PATH_EXPANSION_COMPUTE_SHADER_LAYOUT,
    bindings: {
      pathValues: state.pathValues,
      pathRanges: state.pathRanges,
      pathExpansionConfig: state.expansionInput.expansionConfigBuffer,
      generatedPathVertices: state.generated.compactPathVertexData
    }
  });
  if (state.rowCount > 0 && state.segmentCount > 0) {
    const computePass = device.beginComputePass({});
    computation.dispatch(computePass, Math.ceil(state.rowCount / 64));
    computePass.end();
    device.submit();
  }
  computation.destroy();
}
