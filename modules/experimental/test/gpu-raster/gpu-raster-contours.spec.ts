// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {DrawCommandBuffer, GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  GPURasterContourClassifier,
  GPURasterContours,
  type GPURasterBufferBand,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

type ContourFormat = GPURasterScalarFormat | 'float32x2';

it('GPURaster contour classification covers every marching-squares case and deterministic saddle ties', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'contour-all-cases'});
  const sourceBuffer = makeInputBuffer(device, Float32Array.from([0, 0, 0, 0]));
  const casesBuffer = makeOutputBuffer(device, 1);
  const countBuffer = makeOutputBuffer(device, 1);
  new GPURasterContourClassifier({
    width: 2,
    height: 2,
    input: makeBand(graph, 'source', sourceBuffer, 'float32', 4),
    level: 0.5,
    cases: importView(graph, 'cases', casesBuffer, 'uint32', 1),
    segmentCounts: importView(graph, 'counts', countBuffer, 'uint32', 1)
  }).addToGraph(graph);
  const compiled = graph.compile();

  for (let caseIndex = 0; caseIndex < 16; caseIndex++) {
    sourceBuffer.write(
      Float32Array.from([
        Number((caseIndex & 1) !== 0),
        Number((caseIndex & 2) !== 0),
        Number((caseIndex & 8) !== 0),
        Number((caseIndex & 4) !== 0)
      ])
    );
    submitGraph(device, compiled, `contour-case-${caseIndex}`);
    const expectedCase = caseIndex === 5 ? caseIndex | 16 : caseIndex;
    const expectedCount =
      caseIndex === 0 || caseIndex === 15 ? 0 : caseIndex === 5 || caseIndex === 10 ? 2 : 1;
    expect((await readUint32(casesBuffer, 1))[0], `case ${caseIndex}`).toBe(expectedCase);
    expect((await readUint32(countBuffer, 1))[0], `segments ${caseIndex}`).toBe(expectedCount);
  }

  const saddles = [
    {values: [3, 0, 0, 3], level: 1, expected: 21, label: 'case 5 positive determinant'},
    {values: [1.2, 0, 0, 1.2], level: 1, expected: 5, label: 'case 5 negative determinant'},
    {values: [0.1, 1.1, 1.1, 0.1], level: 1, expected: 26, label: 'case 10 positive determinant'},
    {values: [0.9, 3, 3, 0.9], level: 1, expected: 10, label: 'case 10 negative determinant'}
  ];
  for (const saddle of saddles) {
    sourceBuffer.write(Float32Array.from(saddle.values.map(value => value - saddle.level + 0.5)));
    submitGraph(device, compiled, saddle.label);
    expect((await readUint32(casesBuffer, 1))[0], saddle.label).toBe(saddle.expected);
  }

  compiled.destroy();
  expect(Boolean(sourceBuffer.destroyed), 'the graph never takes ownership of source samples').toBe(
    false
  );
  sourceBuffer.destroy();
  casesBuffer.destroy();
  countBuffer.destroy();
  void 0;
});

it('GPURaster contours scatter stable affine-local geometry and update a GPU-only indirect draw', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'contour-stable-indirect'});
  const sourceBuffer = makeInputBuffer(device, Float32Array.from([99, 0, 1, 0, 1, 0, 1]));
  const levelBuffer = makeInputBuffer(device, Float32Array.from([99, 0.5]));
  const verticesBuffer = makeOutputBuffer(device, 22, Buffer.VERTEX);
  const segmentCountBuffer = makeOutputBuffer(device, 2);
  const overflowBuffer = makeOutputBuffer(device, 2);
  const requiredBuffer = makeOutputBuffer(device, 2);
  const drawCommands = new DrawCommandBuffer(device, {
    id: 'contour-indirect',
    type: 'draw',
    commands: [
      {vertexCount: 5, instanceCount: 7, firstVertex: 3, firstInstance: 9},
      {vertexCount: 19, instanceCount: 123, firstVertex: 11, firstInstance: 17}
    ]
  });
  const draw = drawCommands.importToGraph(graph);

  new GPURasterContours({
    id: 'checkerboard-lines',
    width: 3,
    height: 2,
    input: makeBand(graph, 'source', sourceBuffer, 'float32', 6, 4),
    level: importView(graph, 'level', levelBuffer, 'float32', 1, 4),
    vertices: importView(graph, 'vertices', verticesBuffer, 'float32x2', 10, 8),
    segmentCount: importView(graph, 'segment-count', segmentCountBuffer, 'uint32', 1, 4),
    overflow: importView(graph, 'overflow', overflowBuffer, 'uint32', 1, 4),
    requiredSegmentCount: importView(graph, 'required', requiredBuffer, 'uint32', 1, 4),
    draw,
    drawCommandIndex: 1,
    metadata: {
      width: 3,
      height: 2,
      affine: [0, -2, 100, 3, 0, 200],
      pixelInterpretation: 'area',
      coordinateReferenceSystem: {authority: 'EPSG:32610'}
    }
  }).addToGraph(graph);

  const compiled = graph.compile();
  const execution = submitGraph(device, compiled, 'contour-indirect-first');
  expect(
    Boolean(
      execution.stats.nodeOrder.indexOf('checkerboard-lines-classify') <
        execution.stats.nodeOrder.indexOf('checkerboard-lines-scatter')
    ),
    'declared graph hazards order classification and geometry scatter'
  ).toBe(true);
  expect(await readUint32(segmentCountBuffer, 2), 'offset segment count').toEqual([0, 4]);
  expect(await readUint32(overflowBuffer, 2), 'no overflow').toEqual([0, 0]);
  expect(await readUint32(requiredBuffer, 2), 'offset required count').toEqual([0, 4]);
  expect(
    (await readFloat32(verticesBuffer, 22)).slice(2, 18),
    'row-major exclusive scan writes both deterministic saddle segments per cell'
  ).toEqual([0.5, 1, 1, 0.5, 1.5, 1, 1, 1.5, 2, 0.5, 2.5, 1, 2, 1.5, 1.5, 1]);
  expect(
    await readUint32(drawCommands.buffer, 8),
    'GPU resets the entire selected indirect record while preserving adjacent commands'
  ).toEqual([5, 7, 3, 9, 2, 4, 0, 0]);

  levelBuffer.write(Float32Array.from([99, 2]));
  submitGraph(device, compiled, 'contour-indirect-reuse');
  expect(await readUint32(segmentCountBuffer, 2), 'dynamic GPU level reuses graph').toEqual([0, 0]);
  expect(
    await readUint32(drawCommands.buffer, 8),
    'empty contours reset the entire selected indirect command without CPU polling'
  ).toEqual([5, 7, 3, 9, 2, 0, 0, 0]);

  compiled.destroy();
  expect(
    Boolean(verticesBuffer.destroyed),
    'caller-owned geometry survives graph destruction'
  ).toBe(false);
  expect(
    Boolean(drawCommands.buffer.destroyed),
    'caller-owned indirect records survive graph destruction'
  ).toBe(false);
  sourceBuffer.destroy();
  levelBuffer.destroy();
  verticesBuffer.destroy();
  segmentCountBuffer.destroy();
  overflowBuffer.destroy();
  requiredBuffer.destroy();
  drawCommands.destroy();
  void 0;
});

it('GPURaster contours clamp every capacity boundary and preserve guarded vertex storage', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  for (const capacity of [0, 1, 2, 3, 4, 5]) {
    const graph = new GPUCommandGraph(device, {id: `contour-capacity-${capacity}`});
    const sourceBuffer = makeInputBuffer(device, Float32Array.from([0, 1, 0, 1, 0, 1]));
    const vertexScalarCount = capacity * 4 + 2;
    const verticesBuffer = makeInputBuffer(
      device,
      Float32Array.from({length: vertexScalarCount}, () => 12345),
      Buffer.COPY_SRC
    );
    const countBuffer = makeOutputBuffer(device, 1);
    const overflowBuffer = makeOutputBuffer(device, 1);
    const requiredBuffer = makeOutputBuffer(device, 1);
    new GPURasterContours({
      width: 3,
      height: 2,
      input: makeBand(graph, 'source', sourceBuffer, 'float32', 6),
      level: 0.5,
      vertices: importView(graph, 'vertices', verticesBuffer, 'float32x2', capacity * 2, 4),
      segmentCount: importView(graph, 'count', countBuffer, 'uint32', 1),
      overflow: importView(graph, 'overflow', overflowBuffer, 'uint32', 1),
      requiredSegmentCount: importView(graph, 'required', requiredBuffer, 'uint32', 1)
    }).addToGraph(graph);
    const compiled = graph.compile();
    submitGraph(device, compiled, `contour-capacity-${capacity}`);

    expect((await readUint32(countBuffer, 1))[0], `capacity ${capacity}`).toBe(
      Math.min(capacity, 4)
    );
    expect((await readUint32(overflowBuffer, 1))[0], `overflow ${capacity}`).toBe(
      Number(capacity < 4)
    );
    expect((await readUint32(requiredBuffer, 1))[0], `required ${capacity}`).toBe(4);
    const vertexScalars = await readFloat32(verticesBuffer, vertexScalarCount);
    expect(vertexScalars[0], `prefix guard ${capacity}`).toBe(12345);
    expect(vertexScalars[vertexScalars.length - 1], `suffix guard ${capacity}`).toBe(12345);

    compiled.destroy();
    sourceBuffer.destroy();
    verticesBuffer.destroy();
    countBuffer.destroy();
    overflowBuffer.destroy();
    requiredBuffer.destroy();
  }
  void 0;
});

it('GPURaster empty cell grids publish zero counts and clear indirect instances without allocating scratch', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'contour-empty-cell-grid'});
  const sourceBuffer = makeInputBuffer(device, Float32Array.from([0, 1, 2, 3]));
  const verticesBuffer = makeOutputBuffer(device, 2);
  const segmentCountBuffer = makeInputBuffer(device, Uint32Array.from([91]), Buffer.COPY_SRC);
  const overflowBuffer = makeInputBuffer(device, Uint32Array.from([92]), Buffer.COPY_SRC);
  const requiredBuffer = makeInputBuffer(device, Uint32Array.from([93]), Buffer.COPY_SRC);
  const drawCommands = new DrawCommandBuffer(device, {
    id: 'empty-contour-indirect',
    type: 'draw',
    commands: [{vertexCount: 13, instanceCount: 17, firstVertex: 19, firstInstance: 23}]
  });

  new GPURasterContours({
    width: 1,
    height: 4,
    input: makeBand(graph, 'source', sourceBuffer, 'float32', 4),
    level: 0.5,
    vertices: importView(graph, 'vertices', verticesBuffer, 'float32x2', 0),
    segmentCount: importView(graph, 'count', segmentCountBuffer, 'uint32', 1),
    overflow: importView(graph, 'overflow', overflowBuffer, 'uint32', 1),
    requiredSegmentCount: importView(graph, 'required', requiredBuffer, 'uint32', 1),
    draw: drawCommands.importToGraph(graph)
  }).addToGraph(graph);

  const compiled = graph.compile();
  expect(
    compiled.stats.nodeOrder,
    'empty grids contribute only one scalar publication pass'
  ).toEqual(['gpu-raster-contours-publish']);
  expect(compiled.stats.physicalTransientBytes, 'unused empty scratch has no allocation').toBe(0);
  submitGraph(device, compiled, 'contour-empty-cell-grid');

  expect(await readUint32(segmentCountBuffer, 1), 'stale segment count cleared').toEqual([0]);
  expect(await readUint32(overflowBuffer, 1), 'stale overflow cleared').toEqual([0]);
  expect(await readUint32(requiredBuffer, 1), 'stale required count cleared').toEqual([0]);
  expect(
    await readUint32(drawCommands.buffer, 4),
    'indirect instances are cleared without classification or readback'
  ).toEqual([2, 0, 0, 0]);

  compiled.destroy();
  sourceBuffer.destroy();
  verticesBuffer.destroy();
  segmentCountBuffer.destroy();
  overflowBuffer.destroy();
  requiredBuffer.destroy();
  drawCommands.destroy();
  void 0;
});

it('GPURaster contours reject masked corners, exact nodata, nonfinite samples, and invalid GPU levels', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'contour-invalid-corners'});
  const sourceBuffer = makeInputBuffer(device, Float32Array.from([77, 0, 1, 0, 1]));
  const validityBuffer = makeInputBuffer(device, Uint32Array.from([77, 1, 1, 1, 1]));
  const levelBuffer = makeInputBuffer(device, Float32Array.from([77, 1]));
  const casesBuffer = makeOutputBuffer(device, 2);
  const countsBuffer = makeOutputBuffer(device, 2);
  new GPURasterContourClassifier({
    width: 2,
    height: 2,
    input: {
      ...makeBand(graph, 'source', sourceBuffer, 'float32', 4, 4),
      validity: importView(graph, 'validity', validityBuffer, 'uint32', 4, 4),
      noDataValue: -999,
      scale: 2
    },
    level: importView(graph, 'level', levelBuffer, 'float32', 1, 4),
    cases: importView(graph, 'cases', casesBuffer, 'uint32', 1, 4),
    segmentCounts: importView(graph, 'counts', countsBuffer, 'uint32', 1, 4)
  }).addToGraph(graph);
  const compiled = graph.compile();
  submitGraph(device, compiled, 'contour-valid-calibration');
  expect(await readUint32(casesBuffer, 2), 'calibrated samples respect offsets').toEqual([0, 6]);

  const invalidCases = [
    {source: [0, Number.NaN, 0, 1], label: 'NaN corner'},
    {source: [0, Number.POSITIVE_INFINITY, 0, 1], label: 'infinite corner'},
    {source: [0, -999, 0, 1], label: 'exact raw nodata'}
  ];
  for (const invalid of invalidCases) {
    sourceBuffer.write(Float32Array.from([77, ...invalid.source]));
    submitGraph(device, compiled, invalid.label);
    expect(await readUint32(casesBuffer, 2), invalid.label).toEqual([0, 0]);
    expect(await readUint32(countsBuffer, 2), `${invalid.label} emits no line`).toEqual([0, 0]);
  }

  sourceBuffer.write(Float32Array.from([77, 0, 1, 0, 1]));
  validityBuffer.write(Uint32Array.from([77, 1, 0, 1, 1]));
  submitGraph(device, compiled, 'contour-masked-corner');
  expect(await readUint32(casesBuffer, 2), 'one invalid mask rejects whole cell').toEqual([0, 0]);

  validityBuffer.write(Uint32Array.from([77, 1, 1, 1, 1]));
  levelBuffer.write(Float32Array.from([77, Number.NaN]));
  submitGraph(device, compiled, 'contour-nonfinite-level');
  expect(await readUint32(casesBuffer, 2), 'invalid GPU contour level clears cell').toEqual([0, 0]);

  compiled.destroy();
  sourceBuffer.destroy();
  validityBuffer.destroy();
  levelBuffer.destroy();
  casesBuffer.destroy();
  countsBuffer.destroy();
  void 0;
});

it('GPURaster contours classify exact-threshold ties and native signed or unsigned nodata', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const tie = await runClassification(device, 'float32', Float32Array.from([0.5, 0, 0, 0]), 0.5);
  const flat = await runClassification(
    device,
    'float32',
    Float32Array.from([0.5, 0.5, 0.5, 0.5]),
    0.5
  );
  const signed = await runClassification(
    device,
    'sint32',
    Int32Array.from([-2147483648, 1, 0, 1]),
    0.5,
    -2147483648
  );
  const unsigned = await runClassification(
    device,
    'uint32',
    Uint32Array.from([4294967295, 1, 0, 1]),
    0.5,
    4294967295
  );

  expect(tie, 'an exactly equal corner belongs to the high side').toEqual([1, 1]);
  expect(flat, 'a flat exactly equal cell has no line').toEqual([15, 0]);
  expect(signed, 'native signed minimum nodata never converts through float').toEqual([0, 0]);
  expect(unsigned, 'native unsigned maximum nodata never converts through float').toEqual([0, 0]);
  void 0;
});

it('GPURaster point pixels retain unshifted local coordinates and precise edge interpolation', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'contour-point-coordinates'});
  const sourceBuffer = makeInputBuffer(device, Float32Array.from([0, 4, 0, 4]));
  const verticesBuffer = makeOutputBuffer(device, 4);
  const countBuffer = makeOutputBuffer(device, 1);
  const overflowBuffer = makeOutputBuffer(device, 1);
  new GPURasterContours({
    width: 2,
    height: 2,
    input: makeBand(graph, 'source', sourceBuffer, 'float32', 4),
    level: 1,
    vertices: importView(graph, 'vertices', verticesBuffer, 'float32x2', 2),
    segmentCount: importView(graph, 'count', countBuffer, 'uint32', 1),
    overflow: importView(graph, 'overflow', overflowBuffer, 'uint32', 1),
    metadata: {
      width: 2,
      height: 2,
      affine: [0, -2, 100, 3, 0, 200],
      pixelInterpretation: 'point'
    }
  }).addToGraph(graph);
  const compiled = graph.compile();
  submitGraph(device, compiled, 'contour-point-interpolation');

  expect(await readFloat32(verticesBuffer, 4), 'local point-pixel edge positions').toEqual([
    0.25, 0, 0.25, 1
  ]);
  expect(await readUint32(countBuffer, 1), 'one interpolated segment').toEqual([1]);

  compiled.destroy();
  sourceBuffer.destroy();
  verticesBuffer.destroy();
  countBuffer.destroy();
  overflowBuffer.destroy();
  void 0;
});

async function runClassification<Format extends GPURasterScalarFormat>(
  device: Device,
  format: Format,
  values: Float32Array | Uint32Array | Int32Array,
  level: number,
  noDataValue?: number
): Promise<number[]> {
  const graph = new GPUCommandGraph(device, {id: `contour-${format}-${noDataValue ?? 'ties'}`});
  const sourceBuffer = makeInputBuffer(device, values);
  const caseBuffer = makeOutputBuffer(device, 1);
  const countBuffer = makeOutputBuffer(device, 1);
  new GPURasterContourClassifier({
    width: 2,
    height: 2,
    input: {...makeBand(graph, 'source', sourceBuffer, format, 4), noDataValue},
    level,
    cases: importView(graph, 'cases', caseBuffer, 'uint32', 1),
    segmentCounts: importView(graph, 'counts', countBuffer, 'uint32', 1)
  }).addToGraph(graph);
  const compiled = graph.compile();
  submitGraph(device, compiled, 'contour-format-classification');
  const result = [(await readUint32(caseBuffer, 1))[0], (await readUint32(countBuffer, 1))[0]];
  compiled.destroy();
  sourceBuffer.destroy();
  caseBuffer.destroy();
  countBuffer.destroy();
  return result;
}

function makeBand<Format extends GPURasterScalarFormat>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: Format,
  length: number,
  byteOffset: number = 0
): GPURasterBufferBand<Format> {
  return {
    id,
    format,
    storage: {kind: 'buffer', values: importView(graph, id, buffer, format, length, byteOffset)}
  } as GPURasterBufferBand<Format>;
}

function makeInputBuffer(
  device: Device,
  data: Float32Array | Uint32Array | Int32Array,
  usage: number = 0
): Buffer {
  return device.createBuffer({data, usage: Buffer.STORAGE | Buffer.COPY_DST | usage});
}

function makeOutputBuffer(device: Device, scalarLength: number, usage: number = 0): Buffer {
  return device.createBuffer({
    byteLength: Math.max(scalarLength, 1) * 4,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | usage
  });
}

function importView<Format extends ContourFormat>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: Format,
  length: number,
  byteOffset: number = 0
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length, byteOffset});
}

function submitGraph(
  device: Device,
  compiled: ReturnType<GPUCommandGraph['compile']>,
  id: string
): ReturnType<GPUCommandGraph['compile']> {
  const encoder = device.createCommandEncoder({id});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
  return compiled;
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readFloat32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}
