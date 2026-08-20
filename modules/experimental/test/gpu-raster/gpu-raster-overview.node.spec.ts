// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GraphBufferHandle,
  GraphDataView,
  type GPUCommandGraph,
  type GPUCommandGraphComputeNode
} from '@luma.gl/gpgpu/gpu-core';
import {
  GPURaster,
  GPURasterCategoricalOverview,
  GPURasterOverview,
  makeRasterOverviewMetadata,
  type GPURasterBufferBand,
  type GPURasterMetadata,
  type GPURasterOverviewProps,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/gpu-raster';
import {describe, expect, test} from 'vitest';

type GraphOwner = GraphBufferHandle['graph'];
type RecordingGraph = GPUCommandGraph & {passes: GPUCommandGraphComputeNode[]};

const SOURCE_METADATA: GPURasterMetadata = {
  width: 5,
  height: 7,
  affine: [2, 3, 100, -1, -4, 200],
  pixelInterpretation: 'area',
  coordinateReferenceSystem: {authority: 'EPSG:32610'},
  level: 1,
  levelZeroOrigin: [17, 29]
};

describe('makeRasterOverviewMetadata explicit spatial contracts', () => {
  test('preserves ragged anisotropic shape, rotated affine, CRS, and exact level-zero origin', () => {
    const overview = makeRasterOverviewMetadata(SOURCE_METADATA, [2, 3], {
      sourcePixelOrigin: [4, 6]
    });
    expect(overview).toEqual({
      width: 3,
      height: 3,
      affine: [4, 9, 100, -2, -12, 200],
      pixelInterpretation: 'area',
      coordinateReferenceSystem: SOURCE_METADATA.coordinateReferenceSystem,
      level: 2,
      levelZeroOrigin: [17, 29]
    });
    expect(overview.coordinateReferenceSystem).toBe(SOURCE_METADATA.coordinateReferenceSystem);
    expect(Object.isFrozen(overview)).toBe(true);
    expect(Object.isFrozen(overview.affine)).toBe(true);
    expect(Object.isFrozen(overview.levelZeroOrigin)).toBe(true);
    expect(SOURCE_METADATA.affine).toEqual([2, 3, 100, -1, -4, 200]);
  });

  test('retains area and point center conventions and caller-selected later overview levels', () => {
    const point = makeRasterOverviewMetadata(
      {...SOURCE_METADATA, pixelInterpretation: 'point'},
      2,
      {level: 5, sourcePixelOrigin: [0, 0]}
    );
    expect(point.pixelInterpretation).toBe('point');
    expect(point.level).toBe(5);
    expect(point.width).toBe(3);
    expect(point.height).toBe(4);
    expect(point.affine).toEqual([4, 6, 102.5, -2, -8, 197.5]);

    const graph = makeRecordingGraph('overview-world');
    const source = new GPURaster({
      metadata: SOURCE_METADATA,
      bands: [makeBand(graph, 'source', 'float32', 35)]
    });
    const parent = new GPURaster({
      metadata: makeRasterOverviewMetadata(SOURCE_METADATA, [2, 3], {sourcePixelOrigin: [0, 0]}),
      bands: [makeBand(graph, 'parent', 'float32', 9)]
    });
    expect(parent.getPixelWorldPosition(0, 0)).toEqual([106.5, 193]);
    expect(source.getPixelWorldPosition(0.5, 1)).toEqual([106.5, 193]);
    expect(parent.getPixelArea()).toBe(source.getPixelArea() * 6);
  });

  test('transforms anisotropic point footprint centers through rotated and sheared affines', () => {
    const point = makeRasterOverviewMetadata(
      {...SOURCE_METADATA, pixelInterpretation: 'point'},
      [2, 3],
      {sourcePixelOrigin: [0, 0]}
    );
    const area = makeRasterOverviewMetadata(SOURCE_METADATA, [2, 3], {
      sourcePixelOrigin: [0, 0]
    });

    expect(point.affine).toEqual([4, 9, 104, -2, -12, 195.5]);
    expect(area.affine).toEqual([4, 9, 100, -2, -12, 200]);
    expect(SOURCE_METADATA.affine).toEqual([2, 3, 100, -1, -4, 200]);
  });

  test('rejects unsupported scales, invalid levels, and globally misaligned source tiles', () => {
    for (const scale of [0, -1, 1.5, 9, [1], [2, 0], [9, 2], Number.NaN] as never[]) {
      expect(() => makeRasterOverviewMetadata(SOURCE_METADATA, scale)).toThrow(/scale/);
    }
    for (const sourcePixelOrigin of [[1, 0], [2, 1], [-2, 0], [2], [2.5, 0]] as never[]) {
      expect(() =>
        makeRasterOverviewMetadata(SOURCE_METADATA, [2, 3], {sourcePixelOrigin})
      ).toThrow(/origin|align/);
    }
    for (const level of [-1, 0, 1, 1.5, Number.NaN]) {
      expect(() =>
        makeRasterOverviewMetadata(SOURCE_METADATA, 2, {level, sourcePixelOrigin: [0, 0]})
      ).toThrow(/level/);
    }
    expect(() =>
      makeRasterOverviewMetadata({...SOURCE_METADATA, affine: [0, 0, 0, 0, 0, 0]}, 2)
    ).toThrow(/invertible/);
  });

  test('infers native tile origin and rejects ambiguous current-level overview coordinates', () => {
    expect(() =>
      makeRasterOverviewMetadata({...SOURCE_METADATA, level: 0, levelZeroOrigin: [3, 0]}, 2)
    ).toThrow(/align/);
    const aligned = makeRasterOverviewMetadata(
      {...SOURCE_METADATA, level: 0, levelZeroOrigin: [4, 6]},
      [2, 3]
    );
    expect(aligned.levelZeroOrigin).toEqual([4, 6]);

    expect(() => makeRasterOverviewMetadata(SOURCE_METADATA, 2)).toThrow(
      /explicit current-level source coordinates/
    );
    expect(
      makeRasterOverviewMetadata(SOURCE_METADATA, 2, {sourcePixelOrigin: [6, 8]}).levelZeroOrigin
    ).toEqual([17, 29]);
  });

  test('keeps one-pixel and anisotropic scanline coverage instead of dropping partial edges', () => {
    expect(
      makeRasterOverviewMetadata({...SOURCE_METADATA, width: 1, height: 7}, [8, 3], {
        sourcePixelOrigin: [0, 0]
      })
    ).toMatchObject({width: 1, height: 3});
    expect(
      makeRasterOverviewMetadata({...SOURCE_METADATA, width: 5, height: 1}, [2, 8], {
        sourcePixelOrigin: [0, 0]
      })
    ).toMatchObject({width: 3, height: 1});
    expect(
      makeRasterOverviewMetadata({...SOURCE_METADATA, width: 1, height: 1}, 1, {
        sourcePixelOrigin: [0, 0]
      })
    ).toMatchObject({width: 1, height: 1});
  });
});

describe('GPURasterOverview weighted floating contracts', () => {
  test('exposes immutable target metadata, calibrated source identity, and exact output grids', () => {
    const graph = makeRecordingGraph('floating-overview');
    const props = makeOverviewProps(graph);
    const overview = new GPURasterOverview(props);
    expect(overview.width).toBe(3);
    expect(overview.height).toBe(3);
    expect(overview.sourceWidth).toBe(5);
    expect(overview.sourceHeight).toBe(7);
    expect(overview.horizontalScale).toBe(2);
    expect(overview.verticalScale).toBe(3);
    expect(overview.maximumInputValidCount).toBe(1);
    expect(overview.metadata.affine).toEqual([4, 9, 100, -2, -12, 200]);
    expect(overview.sourcePixelOrigin).toEqual([0, 0]);
    expect(overview.input.noDataValue).toBe(-999);
    expect(overview.input.scale).toBe(0.5);
    expect(overview.input.offset).toBe(4);
  });

  test('requires paired child aggregates and an explicit uint32-safe coverage bound', () => {
    const graph = makeRecordingGraph('weighted-overview');
    const props = makeOverviewProps(graph);
    const inputSum = makeView(graph, 'input-sum', 'float32', 35);
    const inputValidCount = makeView(graph, 'input-count', 'uint32', 35);
    expect(() => new GPURasterOverview({...props, inputSum})).toThrow(/both/);
    expect(() => new GPURasterOverview({...props, inputValidCount})).toThrow(/both/);
    expect(() => new GPURasterOverview({...props, inputSum, inputValidCount})).toThrow(/explicit/);
    expect(
      () => new GPURasterOverview({...props, inputSum, inputValidCount, maximumInputValidCount: 0})
    ).toThrow(/positive bound/);
    expect(() => new GPURasterOverview({...props, maximumInputValidCount: 2})).toThrow(
      /positive bound/
    );
    const exactMaximum = Math.floor(0xffffffff / 6);
    expect(
      new GPURasterOverview({
        ...props,
        inputSum,
        inputValidCount,
        maximumInputValidCount: exactMaximum
      }).maximumInputValidCount
    ).toBe(exactMaximum);
    expect(
      () =>
        new GPURasterOverview({
          ...props,
          inputSum,
          inputValidCount,
          maximumInputValidCount: exactMaximum + 1
        })
    ).toThrow(/overflow uint32/);
  });

  test('rejects mismatched native formats, unsafe aliasing, foreign graphs, and short buffers', () => {
    const graph = makeRecordingGraph('overview-layout');
    const props = makeOverviewProps(graph);
    expect(
      () =>
        new GPURasterOverview({...props, input: makeBand(graph, 'integer', 'uint32', 35) as never})
    ).toThrow(/float32/);
    expect(
      () => new GPURasterOverview({...props, output: makeView(graph, 'short', 'float32', 8)})
    ).toThrow(/one sample per pixel/);
    expect(
      () =>
        new GPURasterOverview({
          ...props,
          outputValidity: makeView(graph, 'short-mask', 'uint32', 8)
        })
    ).toThrow(/one flag per pixel/);
    expect(() => new GPURasterOverview({...props, output: props.sum})).toThrow(/separate buffers/);
    const foreign = makeRecordingGraph('foreign-overview');
    expect(
      () => new GPURasterOverview({...props, validCount: makeView(foreign, 'foreign', 'uint32', 9)})
    ).toThrow(/same graph/);
  });

  test('declares direct and weighted graph hazards within portable storage-binding limits', () => {
    const direct = makeRecordingGraph('overview-direct');
    new GPURasterOverview(makeOverviewProps(direct)).addToGraph(direct);
    expect(direct.passes).toHaveLength(1);
    expect(direct.passes[0].resources?.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-write',
      'storage-write',
      'storage-write',
      'storage-write',
      'storage-read'
    ]);

    const weighted = makeRecordingGraph('overview-weighted');
    new GPURasterOverview({
      ...makeOverviewProps(weighted),
      inputSum: makeView(weighted, 'sums', 'float32', 35),
      inputValidCount: makeView(weighted, 'counts', 'uint32', 35),
      maximumInputValidCount: 4
    }).addToGraph(weighted);
    expect(weighted.passes[0].resources).toHaveLength(8);

    const limited = makeRecordingGraph('overview-limited', {maxStorageBuffersPerShaderStage: 7});
    expect(() =>
      new GPURasterOverview({
        ...makeOverviewProps(limited),
        inputSum: makeView(limited, 'sums', 'float32', 35),
        inputValidCount: makeView(limited, 'counts', 'uint32', 35),
        maximumInputValidCount: 4
      }).addToGraph(limited)
    ).toThrow(/binding count/);
    const storage = makeRecordingGraph('overview-small-binding', {maxStorageBufferBindingSize: 32});
    expect(() => new GPURasterOverview(makeOverviewProps(storage)).addToGraph(storage)).toThrow(
      /binding limit/
    );
  });
});

describe('GPURasterCategoricalOverview exact integer contracts', () => {
  test.each([
    'uint32',
    'sint32'
  ] as const)('retains exact %s nearest/mode selections and optional coverage hazards', format => {
    for (const policy of ['nearest', 'mode'] as const) {
      const graph = makeRecordingGraph(`categorical-${format}-${policy}`);
      const outputLength = 9;
      const overview = new GPURasterCategoricalOverview({
        metadata: SOURCE_METADATA,
        scale: [2, 3],
        sourcePixelOrigin: [0, 0],
        input: {
          ...makeBand(graph, 'labels', format, 35),
          noDataValue: format === 'uint32' ? 4294967295 : -2147483648,
          validity: makeView(graph, 'source-validity', 'uint32', 35)
        } as GPURasterBufferBand<typeof format>,
        policy,
        output: makeView(graph, 'selected', format, outputLength),
        outputValidity: makeView(graph, 'selected-validity', 'uint32', outputLength),
        validCount: makeView(graph, 'coverage', 'uint32', outputLength)
      });
      overview.addToGraph(graph);
      expect(overview.policy).toBe(policy);
      expect(overview.width).toBe(3);
      expect(overview.height).toBe(3);
      expect(graph.passes[0].resources).toHaveLength(5);
    }
  });

  test('rejects interpolation policies, floating labels, mismatched outputs, and aliases', () => {
    const graph = makeRecordingGraph('categorical-validation');
    const props = {
      metadata: SOURCE_METADATA,
      scale: [2, 3] as const,
      sourcePixelOrigin: [0, 0] as const,
      input: makeBand(graph, 'labels', 'uint32', 35),
      policy: 'mode' as const,
      output: makeView(graph, 'selected', 'uint32', 9),
      outputValidity: makeView(graph, 'selected-validity', 'uint32', 9)
    };
    expect(() => new GPURasterCategoricalOverview({...props, policy: 'mean' as never})).toThrow(
      /nearest or mode/
    );
    expect(
      () =>
        new GPURasterCategoricalOverview({
          ...props,
          input: makeBand(graph, 'float-label', 'float32', 35) as never
        })
    ).toThrow(/uint32 or sint32/);
    expect(
      () =>
        new GPURasterCategoricalOverview({
          ...props,
          output: makeView(graph, 'signed', 'sint32', 9) as never
        })
    ).toThrow(/uint32/);
    expect(
      () => new GPURasterCategoricalOverview({...props, output: props.outputValidity})
    ).toThrow(/separate buffers/);
    const foreign = makeRecordingGraph('foreign-categories');
    expect(
      () =>
        new GPURasterCategoricalOverview({
          ...props,
          validCount: makeView(foreign, 'foreign-count', 'uint32', 9)
        })
    ).toThrow(/same graph/);
  });

  test('supports exactly three bindings when source flags and optional coverage are absent', () => {
    const graph = makeRecordingGraph('categorical-minimal', {maxStorageBuffersPerShaderStage: 3});
    new GPURasterCategoricalOverview({
      metadata: SOURCE_METADATA,
      scale: [2, 3],
      sourcePixelOrigin: [0, 0],
      input: makeBand(graph, 'labels', 'sint32', 35),
      policy: 'nearest',
      output: makeView(graph, 'selected', 'sint32', 9),
      outputValidity: makeView(graph, 'selected-validity', 'uint32', 9)
    }).addToGraph(graph);
    expect(graph.passes[0].resources).toHaveLength(3);
  });
});

function makeOverviewProps(graph: RecordingGraph): GPURasterOverviewProps {
  return {
    metadata: SOURCE_METADATA,
    scale: [2, 3],
    sourcePixelOrigin: [0, 0],
    input: {
      ...makeBand(graph, 'samples', 'float32', 35),
      validity: makeView(graph, 'source-validity', 'uint32', 35),
      noDataValue: -999,
      scale: 0.5,
      offset: 4
    },
    output: makeView(graph, 'means', 'float32', 9),
    outputValidity: makeView(graph, 'validity', 'uint32', 9),
    sum: makeView(graph, 'sums', 'float32', 9),
    validCount: makeView(graph, 'counts', 'uint32', 9)
  };
}

function makeRecordingGraph(
  id: string,
  limitOverrides: Partial<GPUCommandGraph['device']['limits']> = {}
): RecordingGraph {
  const passes: GPUCommandGraphComputeNode[] = [];
  return {
    id,
    device: {
      limits: {
        maxComputeInvocationsPerWorkgroup: 256,
        maxComputeWorkgroupSizeX: 256,
        maxComputeWorkgroupSizeY: 256,
        maxComputeWorkgroupsPerDimension: 65535,
        maxStorageBuffersPerShaderStage: 8,
        maxStorageBufferBindingSize: 134217728,
        ...limitOverrides
      }
    },
    passes,
    addComputePass(pass: GPUCommandGraphComputeNode): void {
      passes.push(pass);
    }
  } as unknown as RecordingGraph;
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

function makeView<Format extends GPURasterScalarFormat>(
  owner: GraphOwner,
  id: string,
  format: Format,
  length: number
): GraphDataView<Format> {
  const buffer = new GraphBufferHandle(
    owner,
    {id, byteLength: Math.max(length, 1) * 4, usage: 0},
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
