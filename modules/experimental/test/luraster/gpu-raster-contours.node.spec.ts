// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  GraphBufferHandle,
  GraphDataView,
  type DrawCommandBufferView,
  type GPUCommandGraph,
  type GPUCommandGraphComputeNode,
  type GraphBufferDescriptor
} from '@luma.gl/experimental';
import {
  GPURasterContourClassifier,
  GPURasterContours,
  type GPURasterBufferBand,
  type GPURasterContourClassifierProps,
  type GPURasterContoursProps,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/luraster';

type GraphOwner = GraphBufferHandle['graph'];
type ContourFormat = GPURasterScalarFormat | 'float32x2';
type RecordingGraph = GPUCommandGraph & {
  passes: GPUCommandGraphComputeNode[];
  transientBuffers: GraphBufferHandle[];
};

describe('GPURasterContourClassifier graph contributor contracts', () => {
  test('retains a calibrated source, exact nodata, a dynamic level, and row-major cell outputs', () => {
    const owner = {id: 'contour-classification'} as GraphOwner;
    const level = makeView(owner, 'dynamic-level', 'float32', 1);
    const props = makeClassifierProps(owner);
    const classifier = new GPURasterContourClassifier({
      ...props,
      level,
      input: {...props.input, scale: 0.5, offset: 2, noDataValue: -999}
    });

    expect(classifier.id).toBe('gpu-raster-contour-classifier');
    expect(classifier.cellCount).toBe(6);
    expect(classifier.level).toBe(level);
    expect(classifier.input.noDataValue).toBe(-999);
    expect(classifier.segmentCounts).toBe(props.segmentCounts);
  });

  test('rejects malformed dimensions, invalid levels, cell counts, and foreign ownership', () => {
    const owner = {id: 'contour-invalid'} as GraphOwner;
    const foreignOwner = {id: 'contour-foreign'} as GraphOwner;
    const props = makeClassifierProps(owner);

    expect(() => new GPURasterContourClassifier({...props, width: 0})).toThrow(/positive integers/);
    expect(() => new GPURasterContourClassifier({...props, height: 1.5})).toThrow(
      /positive integers/
    );
    expect(() => new GPURasterContourClassifier({...props, width: 65536, height: 65536})).toThrow(
      /fit in uint32/
    );
    expect(() => new GPURasterContourClassifier({...props, level: Number.NaN})).toThrow(/finite/);
    expect(
      () =>
        new GPURasterContourClassifier({
          ...props,
          level: makeView(owner, 'two-levels', 'float32', 2)
        })
    ).toThrow(/one sample per pixel/);
    expect(
      () =>
        new GPURasterContourClassifier({
          ...props,
          cases: makeView(owner, 'short-cases', 'uint32', 5)
        })
    ).toThrow(/one value per raster cell/);
    expect(
      () =>
        new GPURasterContourClassifier({
          ...props,
          segmentCounts: makeView(foreignOwner, 'foreign-counts', 'uint32', 6)
        })
    ).toThrow(/same graph/);
    expect(
      () =>
        new GPURasterContourClassifier({
          ...props,
          level: makeView(foreignOwner, 'foreign-level', 'float32', 1)
        })
    ).toThrow(/same graph/);
  });

  test('rejects aliased output handles and unrepresentable calibration', () => {
    const owner = {id: 'contour-alias'} as GraphOwner;
    const props = makeClassifierProps(owner);

    expect(() => new GPURasterContourClassifier({...props, segmentCounts: props.cases})).toThrow(
      /separate buffers/
    );
    expect(
      () =>
        new GPURasterContourClassifier({
          ...props,
          input: {...props.input, scale: Number.MAX_VALUE}
        })
    ).toThrow(/finite float32/);
    expect(
      () =>
        new GPURasterContourClassifier({
          ...props,
          input: {...props.input, validity: makeView(owner, 'validity', 'uint32', 12)},
          cases: makeView(owner, 'cases', 'uint32', 6)
        })
    ).not.toThrow();
  });

  test('declares source, case, count, validity, and GPU-level graph hazards', () => {
    const graph = makeRecordingGraph('contour-classifier-graph');
    const props = makeClassifierProps(graph);
    const level = makeView(graph, 'level', 'float32', 1);
    const validity = makeView(graph, 'validity', 'uint32', 12);

    new GPURasterContourClassifier({
      ...props,
      level,
      input: {...props.input, validity}
    }).addToGraph(graph);

    expect(graph.passes).toHaveLength(1);
    expect(graph.passes[0].resources.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-write',
      'storage-write',
      'storage-read',
      'storage-read'
    ]);
    expect(graph.transientBuffers).toHaveLength(0);
  });

  test('supports an empty cell grid and rejects unsupported bindings and dispatches', () => {
    const graph = makeRecordingGraph('contour-empty');
    const input = makeBand(graph, 'thin', 'float32', 4);

    new GPURasterContourClassifier({
      width: 1,
      height: 4,
      input,
      level: 0,
      cases: makeView(graph, 'empty-cases', 'uint32', 0),
      segmentCounts: makeView(graph, 'empty-counts', 'uint32', 0)
    }).addToGraph(graph);
    expect(graph.passes).toHaveLength(0);

    const limited = makeRecordingGraph('contour-limited', {maxStorageBufferBindingSize: 8});
    expect(() =>
      new GPURasterContourClassifier(makeClassifierProps(limited)).addToGraph(limited)
    ).toThrow(/storage binding limit/);

    const limitedDispatch = makeRecordingGraph('contour-workgroups', {
      maxComputeInvocationsPerWorkgroup: 32
    });
    expect(() =>
      new GPURasterContourClassifier(makeClassifierProps(limitedDispatch)).addToGraph(
        limitedDispatch
      )
    ).toThrow(/workgroup limits/);
  });
});

describe('GPURasterContours bounded geometry contracts', () => {
  test('derives paired vertex capacity and preserves rotated affine metadata', () => {
    const owner = {id: 'contour-geometry'} as GraphOwner;
    const metadata = {
      width: 4,
      height: 3,
      affine: [0, -2, 100, 3, 0, 200] as const,
      pixelInterpretation: 'point' as const,
      coordinateReferenceSystem: {authority: 'EPSG:32610'}
    };
    const contours = new GPURasterContours({...makeContourProps(owner), metadata});

    expect(contours.cellCount).toBe(6);
    expect(contours.capacity).toBe(12);
    expect(contours.metadata).toBe(metadata);
    expect(contours.drawCommandIndex).toBe(0);
  });

  test('rejects odd vertex counts, excess capacity, invalid scalar outputs, and bad metadata', () => {
    const owner = {id: 'contour-capacity'} as GraphOwner;
    const props = makeContourProps(owner);

    expect(
      () =>
        new GPURasterContours({
          ...props,
          vertices: makeView(owner, 'odd-vertices', 'float32x2', 3)
        })
    ).toThrow(/even number/);
    expect(() => new GPURasterContours({...props, capacity: 13})).toThrow(/vertex pairs/);
    expect(() => new GPURasterContours({...props, capacity: -1})).toThrow(/vertex pairs/);
    expect(
      () =>
        new GPURasterContours({
          ...props,
          segmentCount: makeView(owner, 'bad-count', 'uint32', 2)
        })
    ).toThrow(/one sample per pixel/);
    expect(
      () =>
        new GPURasterContours({
          ...props,
          metadata: {
            width: 3,
            height: 3,
            affine: [1, 0, 0, 0, 1, 0],
            pixelInterpretation: 'area'
          }
        })
    ).toThrow(/dimensions must match/);
  });

  test('rejects foreign outputs, duplicate buffers, and incompatible indirect commands', () => {
    const owner = {id: 'contour-owners'} as GraphOwner;
    const foreignOwner = {id: 'contour-foreign-owner'} as GraphOwner;
    const props = makeContourProps(owner);

    expect(
      () =>
        new GPURasterContours({
          ...props,
          overflow: makeView(foreignOwner, 'foreign-overflow', 'uint32', 1)
        })
    ).toThrow(/same graph/);
    expect(() => new GPURasterContours({...props, overflow: props.segmentCount})).toThrow(
      /separate buffers/
    );
    expect(() => new GPURasterContours({...props, drawCommandIndex: 1})).toThrow(
      /requires a draw command/
    );
    const draw = makeDrawView(owner, 'draw', 2);
    expect(() => new GPURasterContours({...props, draw, drawCommandIndex: 2})).toThrow(
      /draw capacity/
    );
    expect(() => new GPURasterContours({...props, draw: {...draw, type: 'draw-indexed'}})).toThrow(
      /non-indexed/
    );
  });

  test('composes classification, exclusive scan, scatter, count publication, and indirect writes', () => {
    const graph = makeRecordingGraph('contour-pipeline');
    const draw = makeDrawView(graph, 'draw', 2);
    const required = makeView(graph, 'required', 'uint32', 1);

    new GPURasterContours({
      ...makeContourProps(graph),
      requiredSegmentCount: required,
      draw,
      drawCommandIndex: 1
    }).addToGraph(graph);

    expect(graph.transientBuffers.map(buffer => buffer.id)).toEqual([
      'gpu-raster-contours-cases',
      'gpu-raster-contours-segment-counts',
      'gpu-raster-contours-segment-offsets'
    ]);
    expect(graph.passes.map(pass => pass.id)).toEqual([
      'gpu-raster-contours-classify',
      'gpu-raster-contours-scan-level-0-scan',
      'gpu-raster-contours-scatter',
      'gpu-raster-contours-publish'
    ]);
    const publication = graph.passes[3];
    expect(publication.resources.some(resource => resource.buffer === draw.words)).toBe(true);
    expect(publication.resources.some(resource => resource.buffer === required)).toBe(true);
  });

  test('publishes empty geometry without scans or dispatching a zero-capacity scatter', () => {
    const emptyGraph = makeRecordingGraph('contour-empty-geometry');
    new GPURasterContours({
      width: 1,
      height: 4,
      input: makeBand(emptyGraph, 'source', 'float32', 4),
      level: 0,
      vertices: makeView(emptyGraph, 'vertices', 'float32x2', 0),
      segmentCount: makeView(emptyGraph, 'count', 'uint32', 1),
      overflow: makeView(emptyGraph, 'overflow', 'uint32', 1)
    }).addToGraph(emptyGraph);
    expect(emptyGraph.passes.map(pass => pass.id)).toEqual(['gpu-raster-contours-publish']);

    const zeroCapacity = makeRecordingGraph('contour-zero-capacity');
    new GPURasterContours({...makeContourProps(zeroCapacity), capacity: 0}).addToGraph(
      zeroCapacity
    );
    expect(zeroCapacity.passes.some(pass => pass.id.endsWith('-scatter'))).toBe(false);

    const limitedScan = makeRecordingGraph('contour-limited-scan', {
      maxComputeInvocationsPerWorkgroup: 128
    });
    expect(() =>
      new GPURasterContours(makeContourProps(limitedScan)).addToGraph(limitedScan)
    ).toThrow(/scan exceeds device workgroup/);
  });
});

function makeClassifierProps(owner: GraphOwner): GPURasterContourClassifierProps {
  return {
    width: 4,
    height: 3,
    input: makeBand(owner, 'source', 'float32', 12),
    level: 0.5,
    cases: makeView(owner, 'cases', 'uint32', 6),
    segmentCounts: makeView(owner, 'segment-counts', 'uint32', 6)
  };
}

function makeContourProps(owner: GraphOwner): GPURasterContoursProps {
  return {
    width: 4,
    height: 3,
    input: makeBand(owner, 'source', 'float32', 12),
    level: 0.5,
    vertices: makeView(owner, 'vertices', 'float32x2', 24),
    segmentCount: makeView(owner, 'count', 'uint32', 1),
    overflow: makeView(owner, 'overflow', 'uint32', 1)
  };
}

function makeRecordingGraph(
  id: string,
  limitOverrides: Partial<GPUCommandGraph['device']['limits']> = {}
): RecordingGraph {
  const passes: GPUCommandGraphComputeNode[] = [];
  const transientBuffers: GraphBufferHandle[] = [];
  const graph = {
    id,
    device: {
      limits: {
        maxComputeInvocationsPerWorkgroup: 256,
        maxComputeWorkgroupSizeX: 256,
        maxComputeWorkgroupSizeY: 256,
        maxComputeWorkgroupsPerDimension: 65535,
        maxStorageBufferBindingSize: 134217728,
        ...limitOverrides
      }
    },
    passes,
    transientBuffers,
    addComputePass(pass: GPUCommandGraphComputeNode): void {
      passes.push(pass);
    },
    createTransientBuffer(descriptor: GraphBufferDescriptor): GraphBufferHandle {
      const handle = new GraphBufferHandle(graph as unknown as GraphOwner, descriptor, true);
      transientBuffers.push(handle);
      return handle;
    },
    createDataView<Format extends ContourFormat>(
      handle: GraphBufferHandle,
      props: {format: Format; length: number}
    ): GraphDataView<Format> {
      const rowByteLength = props.format === 'float32x2' ? 8 : 4;
      return new GraphDataView(handle, {
        ...props,
        byteOffset: 0,
        byteStride: rowByteLength,
        rowByteLength
      });
    }
  };
  return graph as unknown as RecordingGraph;
}

function makeBand<Format extends GPURasterScalarFormat>(
  owner: GraphOwner,
  id: string,
  format: Format,
  length: number
): GPURasterBufferBand<Format> {
  return {
    id,
    format,
    storage: {kind: 'buffer', values: makeView(owner, id, format, length)}
  } as GPURasterBufferBand<Format>;
}

function makeView<Format extends ContourFormat>(
  owner: GraphOwner,
  id: string,
  format: Format,
  length: number
): GraphDataView<Format> {
  const byteLength = format === 'float32x2' ? 8 : 4;
  const handle = new GraphBufferHandle(
    owner,
    {id, byteLength: Math.max(length, 1) * byteLength, usage: 0},
    false
  );
  return new GraphDataView(handle, {
    format,
    length,
    byteOffset: 0,
    byteStride: byteLength,
    rowByteLength: byteLength
  });
}

function makeDrawView(owner: GraphOwner, id: string, capacity: number): DrawCommandBufferView {
  const words = makeView(owner, id, 'uint32', capacity * 4);
  return {
    type: 'draw',
    capacity,
    recordByteLength: 16,
    buffer: words.buffer,
    words,
    instanceCounts: new GraphDataView(words.buffer, {
      format: 'uint32',
      length: capacity,
      byteOffset: 4,
      byteStride: 16,
      rowByteLength: 4
    }),
    firstInstances: new GraphDataView(words.buffer, {
      format: 'uint32',
      length: capacity,
      byteOffset: 12,
      byteStride: 16,
      rowByteLength: 4
    })
  };
}
