// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  GraphBufferHandle,
  GraphDataView,
  type GPUCommandGraph,
  type GPUCommandGraphComputeNode
} from '@luma.gl/experimental';
import {
  GPURasterCrossTileComponents,
  type GPURasterCrossTile,
  type GPURasterCrossTileComponentsProps,
  type GPURasterMetadata,
  type GPURasterPixelBounds,
  type GPURasterRegionMeasurementOutputs,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/luraster';
import {describe, expect, test} from 'vitest';

type RecordingGraph = GPUCommandGraph & {
  passes: GPUCommandGraphComputeNode[];
  transientBuffers: GraphBufferHandle[];
};

describe('GPURasterCrossTileComponents public contracts', () => {
  test('canonically sorts selected tiles and publishes deterministic bounded graph defaults', () => {
    const graph = makeRecordingGraph('cross-tile-defaults');
    const props = makeProps(graph);
    const contributor = new GPURasterCrossTileComponents({
      ...props,
      tiles: [...props.tiles].reverse()
    });

    expect(contributor.id).toBe('gpu-raster-cross-tile-components');
    expect(contributor.metadata).toBe(props.metadata);
    expect(contributor.tiles.map(tile => tile.pixelBounds)).toEqual([
      [0, 0, 2, 2],
      [2, 0, 4, 2]
    ]);
    expect(contributor.connectivity).toBe(4);
    expect(contributor.maximumIterations).toBe(5);
    expect(contributor.capacity).toBe(4);
    expect(contributor.componentCount).toBe(props.componentCount);
    expect(contributor.requiredComponentCount).toBe(props.requiredComponentCount);
    expect(contributor.converged).toBe(props.converged);
    expect(contributor.overflow).toBe(props.overflow);
    expect(contributor.output).toBe(props.output);
    expect(new GPURasterCrossTileComponents({...props, capacity: 0}).capacity).toBe(0);
    expect(
      new GPURasterCrossTileComponents({...props, connectivity: 8, maximumIterations: 64})
        .maximumIterations
    ).toBe(64);
  });

  test('rejects unsupported connectivity, unstable iteration/capacity bounds, and absent tiles', () => {
    const graph = makeRecordingGraph('cross-tile-options');
    const props = makeProps(graph);
    expect(() => new GPURasterCrossTileComponents({...props, tiles: []})).toThrow(/at least one/);
    expect(() => new GPURasterCrossTileComponents({...props, connectivity: 6 as never})).toThrow(
      /connectivity/
    );
    for (const maximumIterations of [0, 65, 1.25, Number.NaN]) {
      expect(() => new GPURasterCrossTileComponents({...props, maximumIterations})).toThrow(
        /maximum iterations/
      );
    }
    for (const capacity of [-1, 5, 1.5, Number.NaN]) {
      expect(() => new GPURasterCrossTileComponents({...props, capacity})).toThrow(/capacity/);
    }
    expect(
      () =>
        new GPURasterCrossTileComponents({
          ...props,
          metadata: {...props.metadata, width: 65536, height: 65536}
        })
    ).toThrow(/uint32/);
  });

  test('requires disjoint current-level half-open cores and translated affine/CRS consistency', () => {
    const graph = makeRecordingGraph('cross-tile-spatial');
    const props = makeProps(graph);
    const first = props.tiles[0]!;
    const second = props.tiles[1]!;
    expect(
      () =>
        new GPURasterCrossTileComponents({
          ...props,
          tiles: [
            first,
            {
              ...second,
              pixelBounds: [1, 0, 3, 2],
              metadata: tileMetadata(props.metadata, [1, 0, 3, 2])
            }
          ]
        })
    ).toThrow(/must not overlap/);
    expect(
      () =>
        new GPURasterCrossTileComponents({
          ...props,
          tiles: [first, {...second, pixelBounds: [2, 0, 5, 2]}]
        })
    ).toThrow(/in-bounds half-open/);
    expect(
      () =>
        new GPURasterCrossTileComponents({
          ...props,
          tiles: [first, {...second, metadata: {...second.metadata, level: 1}}]
        })
    ).toThrow(/overview level/);
    expect(
      () =>
        new GPURasterCrossTileComponents({
          ...props,
          tiles: [first, {...second, metadata: {...second.metadata, pixelInterpretation: 'point'}}]
        })
    ).toThrow(/pixel interpretation/);
    expect(
      () =>
        new GPURasterCrossTileComponents({
          ...props,
          tiles: [
            first,
            {
              ...second,
              metadata: {
                ...second.metadata,
                coordinateReferenceSystem: {authority: 'EPSG:4326'}
              }
            }
          ]
        })
    ).toThrow(/coordinate reference system/);
    expect(
      () =>
        new GPURasterCrossTileComponents({
          ...props,
          tiles: [
            first,
            {...second, metadata: {...second.metadata, affine: [2, 0, 100, 0, 3, 200]}}
          ]
        })
    ).toThrow(/translated global overview/);
  });

  test('validates eleven local/global columns, packed labels, scalar statuses, and distinct outputs', () => {
    const graph = makeRecordingGraph('cross-tile-column-validation');
    const props = makeProps(graph);
    const first = props.tiles[0]!;
    expect(
      () =>
        new GPURasterCrossTileComponents({
          ...props,
          tiles: [
            {...first, labels: makeView(graph, 'floating-label', 'float32', 4) as never},
            props.tiles[1]!
          ]
        })
    ).toThrow(/uint32/);
    expect(
      () =>
        new GPURasterCrossTileComponents({
          ...props,
          tiles: [
            {...first, labelValidity: makeView(graph, 'short-mask', 'uint32', 3)},
            props.tiles[1]!
          ]
        })
    ).toThrow(/one flag per pixel/);
    expect(
      () =>
        new GPURasterCrossTileComponents({
          ...props,
          tiles: [
            {
              ...first,
              measurements: {
                ...first.measurements,
                areas: makeView(graph, 'short-local-area', 'float32', 2)
              }
            },
            props.tiles[1]!
          ]
        })
    ).toThrow(/identical lengths/);
    expect(
      () =>
        new GPURasterCrossTileComponents({
          ...props,
          output: {
            ...props.output,
            intensityCounts: makeView(graph, 'floating-counts', 'float32', 4) as never
          }
        })
    ).toThrow(/uint32/);
    expect(
      () =>
        new GPURasterCrossTileComponents({
          ...props,
          output: {...props.output, intensityCounts: props.output.pixelCounts}
        })
    ).toThrow(/distinct buffers/);
    expect(
      () =>
        new GPURasterCrossTileComponents({
          ...props,
          tiles: [{...first, outputLabels: first.labels}, props.tiles[1]!]
        })
    ).toThrow(/distinct buffers/);

    const foreign = makeRecordingGraph('cross-tile-foreign');
    expect(
      () =>
        new GPURasterCrossTileComponents({
          ...props,
          converged: makeView(foreign, 'foreign-convergence', 'uint32', 1)
        })
    ).toThrow(/same graph/);
  });
});

describe('GPURasterCrossTileComponents graph composition', () => {
  test('composes globally ordered GPUSort, bounded edge unions, GPUScan, publication, and metrics', () => {
    const graph = makeRecordingGraph('cross-tile-plan');
    const contributor = new GPURasterCrossTileComponents({
      ...makeProps(graph),
      id: 'global-segmentation',
      connectivity: 8,
      maximumIterations: 2
    });
    contributor.addToGraph(graph);

    const passIds = graph.passes.map(pass => pass.id);
    expect(passIds).toContain('global-segmentation-tile-0-global-representatives');
    expect(passIds).toContain('global-segmentation-tile-1-global-representatives');
    expect(passIds.some(id => id.startsWith('global-segmentation-sort-global-roots'))).toBe(true);
    expect(passIds).toContain('global-segmentation-seam-0-1-0');
    expect(passIds).toContain('global-segmentation-seam-0-1-1');
    expect(passIds).toContain('global-segmentation-compress-0');
    expect(passIds).toContain('global-segmentation-convergence-1');
    expect(passIds.some(id => id.startsWith('global-segmentation-scan-global-roots'))).toBe(true);
    expect(passIds).toContain('global-segmentation-publish-counts');
    expect(passIds).toContain('global-segmentation-tile-0-publish-labels');
    expect(passIds).toContain('global-segmentation-tile-1-merge-pixel-counts');
    expect(passIds).toContain('global-segmentation-tile-1-merge-intensity-counts');
    expect(passIds).toContain('global-segmentation-tile-1-merge-column');
    expect(passIds).toContain('global-segmentation-finalize-intensity');
    expect(passIds).toContain('global-segmentation-finalize-geometry');
    expect(
      graph.transientBuffers.some(buffer => buffer.id === 'global-segmentation-root-positions')
    ).toBe(true);
    expect(graph.transientBuffers.every(buffer => buffer.transient)).toBe(true);
    expect(graph.passes.every(pass => (pass.resources?.length ?? 0) <= 8)).toBe(true);
  });

  test('records diagonal four-tile corner contacts only under eight-connectivity', () => {
    for (const connectivity of [4, 8] as const) {
      const graph = makeRecordingGraph(`cross-tile-corners-${connectivity}`);
      const metadata: GPURasterMetadata = {
        width: 2,
        height: 2,
        affine: [1, 0, 100, 0, 1, 200],
        pixelInterpretation: 'area'
      };
      const bounds: GPURasterPixelBounds[] = [
        [0, 0, 1, 1],
        [1, 0, 2, 1],
        [0, 1, 1, 2],
        [1, 1, 2, 2]
      ];
      const base = makeProps(graph, metadata);
      const tiles = bounds.map((tileBounds, index) =>
        makeTile(graph, metadata, tileBounds, 1, `corner-${index}`)
      );
      new GPURasterCrossTileComponents({
        ...base,
        tiles,
        connectivity,
        maximumIterations: 1
      }).addToGraph(graph);
      const seamPasses = graph.passes.filter(pass => pass.id.includes('-seam-'));
      expect(seamPasses).toHaveLength(connectivity === 4 ? 4 : 6);
    }
  });

  test('preflights WebGPU, eight bindings, sorted workgroups, aligned storage, and dispatch limits', () => {
    const notWebGPU = makeRecordingGraph('cross-tile-webgl', {}, 'webgl');
    expect(() =>
      new GPURasterCrossTileComponents(makeProps(notWebGPU)).addToGraph(notWebGPU)
    ).toThrow(/WebGPU device/);

    const limitedBindings = makeRecordingGraph('cross-tile-binding-limit', {
      maxStorageBuffersPerShaderStage: 7
    });
    expect(() =>
      new GPURasterCrossTileComponents(makeProps(limitedBindings)).addToGraph(limitedBindings)
    ).toThrow(/binding count/);

    const limitedThreads = makeRecordingGraph('cross-tile-thread-limit', {
      maxComputeWorkgroupSizeX: 255
    });
    expect(() =>
      new GPURasterCrossTileComponents(makeProps(limitedThreads)).addToGraph(limitedThreads)
    ).toThrow(/workgroup limits/);

    const limitedStorage = makeRecordingGraph('cross-tile-storage-limit', {
      maxStorageBufferBindingSize: 15
    });
    expect(() =>
      new GPURasterCrossTileComponents(makeProps(limitedStorage)).addToGraph(limitedStorage)
    ).toThrow(/storage binding limit/);

    const limitedDispatch = makeRecordingGraph('cross-tile-dispatch-limit', {
      maxComputeWorkgroupsPerDimension: 1
    });
    const metadata: GPURasterMetadata = {
      width: 9,
      height: 1,
      affine: [1, 0, 100, 0, 1, 200],
      pixelInterpretation: 'area'
    };
    const props = makeProps(limitedDispatch, metadata);
    const tile = makeTile(limitedDispatch, metadata, [0, 0, 9, 1], 2, 'wide-tile');
    expect(() =>
      new GPURasterCrossTileComponents({...props, tiles: [tile]}).addToGraph(limitedDispatch)
    ).toThrow(/dispatch limits/);
  });

  test('rejects target graphs different from every validated caller-owned resource', () => {
    const owner = makeRecordingGraph('cross-tile-owner');
    const target = makeRecordingGraph('cross-tile-target');
    expect(() => new GPURasterCrossTileComponents(makeProps(owner)).addToGraph(target)).toThrow(
      /target graph/
    );
  });
});

function makeRecordingGraph(
  id: string,
  limitOverrides: Partial<GPUCommandGraph['device']['limits']> = {},
  deviceType: string = 'webgpu'
): RecordingGraph {
  const passes: GPUCommandGraphComputeNode[] = [];
  const transientBuffers: GraphBufferHandle[] = [];
  const graph = {
    id,
    device: {
      type: deviceType,
      limits: {
        maxTextureDimension2D: 8192,
        maxComputeInvocationsPerWorkgroup: 256,
        maxComputeWorkgroupSizeX: 256,
        maxComputeWorkgroupSizeY: 256,
        maxComputeWorkgroupsPerDimension: 65535,
        maxStorageBuffersPerShaderStage: 8,
        maxStorageBufferBindingSize: 134217728,
        maxBufferSize: 134217728,
        minStorageBufferOffsetAlignment: 256,
        ...limitOverrides
      }
    },
    passes,
    transientBuffers,
    addComputePass(pass: GPUCommandGraphComputeNode): void {
      passes.push(pass);
    },
    createTransientBuffer(descriptor: {
      id: string;
      byteLength: number;
      usage: number;
    }): GraphBufferHandle {
      const buffer = new GraphBufferHandle(graph as never, descriptor, true);
      transientBuffers.push(buffer);
      return buffer;
    },
    createDataView<Format extends GPURasterScalarFormat>(
      buffer: GraphBufferHandle,
      props: {format: Format; length: number; byteOffset?: number}
    ): GraphDataView<Format> {
      return new GraphDataView(buffer, {
        format: props.format,
        length: props.length,
        byteOffset: props.byteOffset ?? 0,
        byteStride: 4,
        rowByteLength: 4
      });
    }
  };
  return graph as unknown as RecordingGraph;
}

function makeProps(
  graph: RecordingGraph,
  metadata: GPURasterMetadata = {
    width: 4,
    height: 2,
    affine: [2, 0, 100, 0, 3, 200],
    pixelInterpretation: 'area'
  }
): GPURasterCrossTileComponentsProps {
  const tiles =
    metadata.width === 4 && metadata.height === 2
      ? [
          makeTile(graph, metadata, [0, 0, 2, 2], 3, 'west'),
          makeTile(graph, metadata, [2, 0, 4, 2], 3, 'east')
        ]
      : [makeTile(graph, metadata, [0, 0, metadata.width, metadata.height], 2, 'full')];
  return {
    metadata,
    tiles,
    componentCount: makeView(graph, 'global-count', 'uint32', 1),
    requiredComponentCount: makeView(graph, 'global-required-count', 'uint32', 1),
    converged: makeView(graph, 'global-converged', 'uint32', 1),
    overflow: makeView(graph, 'global-overflow', 'uint32', 1),
    output: makeMeasurements(graph, 'global', 4)
  };
}

function makeTile(
  graph: RecordingGraph,
  metadata: GPURasterMetadata,
  bounds: GPURasterPixelBounds,
  regionCapacity: number,
  id: string
): GPURasterCrossTile {
  const pixelCount = (bounds[2] - bounds[0]) * (bounds[3] - bounds[1]);
  return {
    metadata: tileMetadata(metadata, bounds),
    pixelBounds: bounds,
    labels: makeView(graph, `${id}-labels`, 'uint32', pixelCount),
    labelValidity: makeView(graph, `${id}-validity`, 'uint32', pixelCount),
    componentCount: makeView(graph, `${id}-count`, 'uint32', 1),
    converged: makeView(graph, `${id}-converged`, 'uint32', 1),
    overflow: makeView(graph, `${id}-overflow`, 'uint32', 1),
    measurements: makeMeasurements(graph, `${id}-local`, regionCapacity),
    outputLabels: makeView(graph, `${id}-global-labels`, 'uint32', pixelCount),
    outputValidity: makeView(graph, `${id}-global-validity`, 'uint32', pixelCount)
  };
}

function tileMetadata(
  metadata: GPURasterMetadata,
  bounds: GPURasterPixelBounds
): GPURasterMetadata {
  const [
    horizontalScale,
    horizontalShear,
    horizontalOrigin,
    verticalShear,
    verticalScale,
    verticalOrigin
  ] = metadata.affine;
  return {
    width: bounds[2] - bounds[0],
    height: bounds[3] - bounds[1],
    affine: [
      horizontalScale,
      horizontalShear,
      horizontalOrigin + horizontalScale * bounds[0] + horizontalShear * bounds[1],
      verticalShear,
      verticalScale,
      verticalOrigin + verticalShear * bounds[0] + verticalScale * bounds[1]
    ],
    pixelInterpretation: metadata.pixelInterpretation,
    ...(metadata.level !== undefined ? {level: metadata.level} : {}),
    ...(metadata.coordinateReferenceSystem
      ? {coordinateReferenceSystem: metadata.coordinateReferenceSystem}
      : {})
  };
}

function makeMeasurements(
  graph: RecordingGraph,
  id: string,
  capacity: number
): GPURasterRegionMeasurementOutputs {
  return {
    pixelCounts: makeView(graph, `${id}-pixels`, 'uint32', capacity),
    intensityCounts: makeView(graph, `${id}-intensity-counts`, 'uint32', capacity),
    intensitySums: makeView(graph, `${id}-sums`, 'float32', capacity),
    intensityMinimums: makeView(graph, `${id}-minimums`, 'float32', capacity),
    intensityMaximums: makeView(graph, `${id}-maximums`, 'float32', capacity),
    intensityMeans: makeView(graph, `${id}-means`, 'float32', capacity),
    columnSums: makeView(graph, `${id}-column-sums`, 'float32', capacity),
    rowSums: makeView(graph, `${id}-row-sums`, 'float32', capacity),
    centroidColumns: makeView(graph, `${id}-centroid-columns`, 'float32', capacity),
    centroidRows: makeView(graph, `${id}-centroid-rows`, 'float32', capacity),
    areas: makeView(graph, `${id}-areas`, 'float32', capacity)
  };
}

function makeView<Format extends GPURasterScalarFormat>(
  graph: RecordingGraph,
  id: string,
  format: Format,
  length: number
): GraphDataView<Format> {
  const buffer = new GraphBufferHandle(
    graph,
    {id, byteLength: Math.max(length, 1) * 4, usage: Buffer.STORAGE},
    false
  );
  return new GraphDataView(buffer, {
    format,
    length,
    byteOffset: 0,
    byteStride: 4,
    rowByteLength: 4
  });
}
