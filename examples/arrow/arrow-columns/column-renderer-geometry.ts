// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeGPUVectorFromArrow} from '@luma.gl/arrow';
import {Buffer, type Binding, type Device, type ShaderLayout} from '@luma.gl/core';
import {Computation, DynamicBuffer} from '@luma.gl/engine';
import {GPUVector} from '@luma.gl/tables';
import {dggs, type ShaderModule} from '@luma.gl/shadertools';
import * as arrow from 'apache-arrow';
import {CELL_GEOMETRY_POINT_COUNT, COLUMN_GEOMETRY_WORKGROUP_SIZE} from './column-renderer-shaders';

const COLUMN_GEOMETRY_SHADER_LAYOUT = {
  bindings: [
    {name: 'h3Cells', type: 'read-only-storage', group: 0, location: 0},
    {name: 'geometryConfig', type: 'read-only-storage', group: 0, location: 1},
    {name: 'cellGeometryPoints', type: 'storage', group: 0, location: 2}
  ],
  attributes: []
} satisfies ShaderLayout;

const COLUMN_GEOMETRY_WGSL_SHADER = /* wgsl */ `\
@group(0) @binding(0) var<storage, read> h3Cells : array<vec2<u32>>;
@group(0) @binding(1) var<storage, read> geometryConfig : array<u32>;
@group(0) @binding(2) var<storage, read_write> cellGeometryPoints : array<vec2<f32>>;

const BOUNDARY_POINT_COUNT : u32 = ${CELL_GEOMETRY_POINT_COUNT - 1}u;
const CELL_GEOMETRY_POINT_COUNT : u32 = ${CELL_GEOMETRY_POINT_COUNT}u;
const CELL_CENTROID_POINT_INDEX : u32 = ${CELL_GEOMETRY_POINT_COUNT - 1}u;

fn getH3CellCentroid(cellKey : vec2<u32>) -> vec2<f32> {
  let center = dggs_h3_get_center_face_ijk(cellKey);
  if (center.valid == 0u) {
    return vec2<f32>(0.0);
  }

  let hexPoint = dggs_h3_ijk_to_hex2d(center.coord);
  return dggs_h3_hex2d_to_lnglat(
    hexPoint,
    center.face,
    dggs_h3_get_resolution(cellKey),
    false
  );
}

@compute @workgroup_size(${COLUMN_GEOMETRY_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalInvocationId : vec3<u32>) {
  let cellIndex = globalInvocationId.x;
  if (cellIndex >= geometryConfig[0]) {
    return;
  }

  let cellKey = dggs_u64_from_little_endian_words(h3Cells[cellIndex]);
  let pointOffset = cellIndex * CELL_GEOMETRY_POINT_COUNT;
  cellGeometryPoints[pointOffset + CELL_CENTROID_POINT_INDEX] = getH3CellCentroid(cellKey);

  var pointIndex = 0u;
  loop {
    if (pointIndex >= BOUNDARY_POINT_COUNT) {
      break;
    }

    let boundaryPoint = dggs_h3_get_boundary_point(cellKey, pointIndex);
    cellGeometryPoints[pointOffset + pointIndex] = boundaryPoint;
    pointIndex += 1u;
  }
}
`;

export type ColumnRendererGeometry = {
  points: GPUVector<'float32x2'>;
  cellCount: number;
  decodeTimeMilliseconds: number;
  destroy: () => void;
};

export async function makeColumnRendererGeometry(
  device: Device,
  geometryTable: arrow.Table
): Promise<ColumnRendererGeometry> {
  const startedAt = performance.now();
  const h3Cells = makeGPUVectorFromArrow(
    device,
    getRequiredArrowVector<arrow.Uint64>(geometryTable, 'h3Cells'),
    {name: 'geometryH3Cells', id: 'arrow-columns-geometry-h3-cells', format: 'uint32x2'}
  );
  const cellCount = geometryTable.numRows;
  const pointCount = cellCount * CELL_GEOMETRY_POINT_COUNT;
  const cellGeometryBuffer = new DynamicBuffer(device, {
    id: 'arrow-columns-cell-geometry-points',
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    byteLength: Math.max(Float32Array.BYTES_PER_ELEMENT * 2, pointCount * 2 * 4)
  });
  const geometryConfig = device.createBuffer({
    id: 'arrow-columns-cell-geometry-config',
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    data: new Uint32Array([cellCount])
  });

  try {
    dispatchColumnGeometryDecode(device, {
      cellCount,
      h3Cells: getBufferBinding(getGPUVectorBuffer(h3Cells)),
      geometryConfig,
      cellGeometryPoints: getBufferBinding(cellGeometryBuffer)
    });
    await waitForSubmittedWork(device);
  } finally {
    h3Cells.destroy();
    geometryConfig.destroy();
  }

  const points = new GPUVector({
    type: 'buffer',
    name: 'cellGeometryPoints',
    buffer: cellGeometryBuffer,
    dataType: makeCellGeometryPointType(),
    format: 'float32x2',
    length: pointCount,
    stride: 2,
    byteStride: Float32Array.BYTES_PER_ELEMENT * 2,
    rowByteLength: Float32Array.BYTES_PER_ELEMENT * 2,
    ownsBuffer: true
  });

  return {
    points,
    cellCount,
    decodeTimeMilliseconds: performance.now() - startedAt,
    destroy: () => points.destroy()
  };
}

function dispatchColumnGeometryDecode(
  device: Device,
  props: {
    cellCount: number;
    h3Cells: Binding;
    geometryConfig: Binding;
    cellGeometryPoints: Binding;
  }
): void {
  const computation = new Computation(device, {
    id: 'arrow-columns-cell-geometry-compute',
    source: COLUMN_GEOMETRY_WGSL_SHADER,
    modules: [dggs as ShaderModule],
    shaderLayout: COLUMN_GEOMETRY_SHADER_LAYOUT,
    bindings: {
      h3Cells: props.h3Cells,
      geometryConfig: props.geometryConfig,
      cellGeometryPoints: props.cellGeometryPoints
    }
  });

  if (props.cellCount > 0) {
    const computePass = device.beginComputePass({});
    computation.dispatch(computePass, Math.ceil(props.cellCount / COLUMN_GEOMETRY_WORKGROUP_SIZE));
    computePass.end();
    device.submit();
  }
  computation.destroy();
}

function makeCellGeometryPointType(): arrow.FixedSizeList<arrow.Float32> {
  return new arrow.FixedSizeList(2, new arrow.Field('value', new arrow.Float32(), false));
}

function getRequiredArrowVector<T extends arrow.DataType>(
  table: arrow.Table,
  columnName: string
): arrow.Vector<T> {
  const vector = table.getChild(columnName);
  if (!vector) {
    throw new Error(`ArrowColumnRenderer geometry is missing Arrow column "${columnName}"`);
  }
  return vector as arrow.Vector<T>;
}

function getBufferBinding(buffer: Buffer | DynamicBuffer): Binding {
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

function getGPUVectorBuffer(vector: GPUVector): Buffer | DynamicBuffer {
  const [data, ...remainingData] = vector.data;
  if (!data || remainingData.length > 0) {
    throw new Error(
      `ArrowColumnRenderer geometry vector "${vector.name}" requires one GPUData chunk`
    );
  }
  return data.buffer;
}

async function waitForSubmittedWork(device: Device): Promise<void> {
  const queue = (
    device as Device & {handle?: {queue?: {onSubmittedWorkDone?: () => Promise<void>}}}
  ).handle?.queue;
  await queue?.onSubmittedWorkDone?.();
}
