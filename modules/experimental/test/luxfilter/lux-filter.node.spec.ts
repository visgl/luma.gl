// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';

import {Buffer} from '@luma.gl/core';
import * as experimentalModule from '@luma.gl/experimental';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from '@luma.gl/experimental';
import * as luxFilterModule from '@luma.gl/experimental/luxfilter';
import {
  LuxFilter,
  LuxFilterSelection,
  type LuxFilterScalarFormat
} from '@luma.gl/experimental/luxfilter';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';

const LUX_FILTER_RUNTIME_EXPORTS = ['LuxFilter', 'LuxFilterSelection'] as const;

describe('@luma.gl/experimental/luxfilter package boundary', () => {
  test('publishes one side-effect-free conditional experimental subpath', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    ) as {
      name?: string;
      sideEffects?: boolean;
      exports?: Record<string, Record<string, string>>;
    };

    expect(packageJson.name).toBe('@luma.gl/experimental');
    expect(packageJson.sideEffects).toBe(false);
    expect(packageJson.exports?.['./luxfilter']).toEqual({
      import: './dist/luxfilter/index.js',
      require: './dist/luxfilter/index.cjs',
      types: './dist/luxfilter/index.d.ts'
    });
  });

  test('keeps linked-filter runtime exports on their optional subpath', () => {
    for (const exportName of LUX_FILTER_RUNTIME_EXPORTS) {
      expect(typeof luxFilterModule[exportName]).toBe('function');
      expect(exportName in experimentalModule).toBe(false);
    }
  });
});

describe('LuxFilterSelection control-state contracts without GPU execution', () => {
  test('preserves full uint32 precision and destroys only its private control buffer', async () => {
    const fixture = createGraphFixture('unsigned-selection');
    const input = createScalarView(
      fixture,
      'unsigned-values',
      Uint32Array.from([0xfffffffe, 0xffffffff]),
      'uint32'
    );
    const sourceBuffer = fixture.buffers[0];
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');
    const selection = new LuxFilterSelection(fixture.graph, {
      id: 'unsigned',
      kind: 'range',
      input
    });
    const stateBuffer = createBufferSpy.mock.results.at(-1)?.value;

    expect(stateBuffer).toBeDefined();
    expect(await readControlWords(stateBuffer!)).toEqual([0, 0, 0, 0, 0]);

    selection.setRange([0xfffffffe, 0xffffffff]);
    expect(await readControlWords(stateBuffer!)).toEqual([1, 0xfffffffe, 0xffffffff, 0, 0]);
    expect(() => selection.setRange([0, 0x100000000])).toThrow(/input scalar format/);
    expect(() => selection.setRange([0.5, 1])).toThrow(/input scalar format/);
    expect(() => selection.setBounds([0, 0, 1, 1])).toThrow(/bounds selection/);

    selection.clear();
    expect(await readControlWords(stateBuffer!)).toEqual([0, 0, 0, 0, 0]);

    selection.destroy();
    selection.destroy();
    expect(stateBuffer!.destroyed).toBe(true);
    expect(sourceBuffer.destroyed).toBe(false);
    expect(() => selection.setRange([0, 1])).toThrow(/destroyed/);

    createBufferSpy.mockRestore();
    destroyGraphFixture(fixture);
  });

  test('stores signed and floating-point endpoints using native scalar bit patterns', async () => {
    const fixture = createGraphFixture('scalar-selection');
    const signedInput = createScalarView(
      fixture,
      'signed-values',
      Int32Array.from([-0x80000000, -1, 0x7fffffff]),
      'sint32'
    );
    const floatingInput = createScalarView(
      fixture,
      'floating-values',
      Float32Array.from([-1.5, 2.75]),
      'float32'
    );
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');
    const signedSelection = new LuxFilterSelection(fixture.graph, {
      id: 'signed',
      kind: 'range',
      input: signedInput
    });
    const signedState = createBufferSpy.mock.results.at(-1)?.value;
    const floatingSelection = new LuxFilterSelection(fixture.graph, {
      id: 'floating',
      kind: 'range',
      input: floatingInput
    });
    const floatingState = createBufferSpy.mock.results.at(-1)?.value;

    signedSelection.setRange([-0x80000000, -1]);
    expect(await readControlWords(signedState!)).toEqual([1, 0x80000000, 0xffffffff, 0, 0]);
    expect(() => signedSelection.setRange([-0x80000001, 0])).toThrow(/input scalar format/);

    floatingSelection.setRange([-1.5, 2.75]);
    const floatingWords = Uint32Array.from(await readControlWords(floatingState!));
    const floatingEndpoints = new Float32Array(floatingWords.buffer);
    expect(floatingWords[0]).toBe(1);
    expect(floatingEndpoints[1]).toBe(-1.5);
    expect(floatingEndpoints[2]).toBe(2.75);
    expect(() => floatingSelection.setRange([1, Number.NaN])).toThrow(/ordered finite endpoints/);
    expect(() => floatingSelection.setRange([2, 1])).toThrow(/ordered finite endpoints/);

    signedSelection.destroy();
    floatingSelection.destroy();
    createBufferSpy.mockRestore();
    destroyGraphFixture(fixture);
  });

  test('rejects overflowing float32 ranges without changing an existing selection', async () => {
    const fixture = createGraphFixture('floating-range-overflow');
    const input = createScalarView(
      fixture,
      'floating-range-values',
      Float32Array.from([-1, 0, 1]),
      'float32'
    );
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');
    const selection = new LuxFilterSelection(fixture.graph, {
      id: 'floating-range',
      kind: 'range',
      input
    });
    const stateBuffer = createBufferSpy.mock.results.at(-1)?.value;
    const maximumFloat32 = 3.4028234663852886e38;

    expect(stateBuffer).toBeDefined();
    selection.setRange([-maximumFloat32, maximumFloat32]);
    const previousControlWords = await readControlWords(stateBuffer!);
    expect(previousControlWords).toEqual([1, 0xff7fffff, 0x7f7fffff, 0, 0]);

    const writeSpy = vi.spyOn(stateBuffer!, 'write');
    const overflowingRanges = [
      [-Number.MAX_VALUE, 0],
      [0, Number.MAX_VALUE]
    ] as const;

    for (const range of overflowingRanges) {
      expect(() => selection.setRange(range)).toThrow(/input scalar format/);
      expect(await readControlWords(stateBuffer!)).toEqual(previousControlWords);
    }
    expect(writeSpy).not.toHaveBeenCalled();

    selection.destroy();
    writeSpy.mockRestore();
    createBufferSpy.mockRestore();
    destroyGraphFixture(fixture);
  });

  test('rejects overflowing float32 brush axes without changing an existing selection', async () => {
    const fixture = createGraphFixture('floating-bounds-overflow');
    const horizontal = createScalarView(
      fixture,
      'floating-horizontal-values',
      Float32Array.from([-1, 0, 1]),
      'float32'
    );
    const vertical = createScalarView(
      fixture,
      'floating-vertical-values',
      Float32Array.from([-1, 0, 1]),
      'float32'
    );
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');
    const selection = new LuxFilterSelection(fixture.graph, {
      id: 'floating-bounds',
      kind: 'bounds',
      x: horizontal,
      y: vertical
    });
    const stateBuffer = createBufferSpy.mock.results.at(-1)?.value;
    const maximumFloat32 = 3.4028234663852886e38;

    expect(stateBuffer).toBeDefined();
    selection.setBounds([-maximumFloat32, -maximumFloat32, maximumFloat32, maximumFloat32]);
    const previousControlWords = await readControlWords(stateBuffer!);
    expect(previousControlWords).toEqual([1, 0xff7fffff, 0x7f7fffff, 0xff7fffff, 0x7f7fffff]);

    const writeSpy = vi.spyOn(stateBuffer!, 'write');
    const overflowingBounds = [
      [-Number.MAX_VALUE, 0, 0, 1],
      [0, 0, Number.MAX_VALUE, 1],
      [0, -Number.MAX_VALUE, 1, 0],
      [0, 0, 1, Number.MAX_VALUE]
    ] as const;

    for (const bounds of overflowingBounds) {
      expect(() => selection.setBounds(bounds)).toThrow(/input scalar format/);
      expect(await readControlWords(stateBuffer!)).toEqual(previousControlWords);
    }
    expect(writeSpy).not.toHaveBeenCalled();

    selection.destroy();
    writeSpy.mockRestore();
    createBufferSpy.mockRestore();
    destroyGraphFixture(fixture);
  });

  test.each([
    'horizontal',
    'vertical'
  ] as const)('rejects overflowing float32 values on a mixed-format %s brush axis', async floatingAxis => {
    const fixture = createGraphFixture(`mixed-floating-${floatingAxis}`);
    const floatingValues = Float32Array.from([-1, 0, 1]);
    const unsignedValues = Uint32Array.from([0, 1, 2]);
    const horizontal = createScalarView(
      fixture,
      'mixed-horizontal-values',
      floatingAxis === 'horizontal' ? floatingValues : unsignedValues,
      floatingAxis === 'horizontal' ? 'float32' : 'uint32'
    );
    const vertical = createScalarView(
      fixture,
      'mixed-vertical-values',
      floatingAxis === 'vertical' ? floatingValues : unsignedValues,
      floatingAxis === 'vertical' ? 'float32' : 'uint32'
    );
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');
    const selection = new LuxFilterSelection(fixture.graph, {
      id: `mixed-${floatingAxis}`,
      kind: 'bounds',
      x: horizontal,
      y: vertical
    });
    const stateBuffer = createBufferSpy.mock.results.at(-1)?.value;
    const maximumFloat32 = 3.4028234663852886e38;
    const acceptedBounds =
      floatingAxis === 'horizontal'
        ? ([-maximumFloat32, 0, maximumFloat32, 1] as const)
        : ([0, -maximumFloat32, 1, maximumFloat32] as const);
    const overflowingBounds =
      floatingAxis === 'horizontal'
        ? ([
            [-Number.MAX_VALUE, 0, 0, 1],
            [0, 0, Number.MAX_VALUE, 1]
          ] as const)
        : ([
            [0, -Number.MAX_VALUE, 1, 0],
            [0, 0, 1, Number.MAX_VALUE]
          ] as const);

    expect(stateBuffer).toBeDefined();
    selection.setBounds(acceptedBounds);
    const previousControlWords = await readControlWords(stateBuffer!);
    expect(previousControlWords).toEqual(
      floatingAxis === 'horizontal'
        ? [1, 0xff7fffff, 0x7f7fffff, 0, 1]
        : [1, 0, 1, 0xff7fffff, 0x7f7fffff]
    );

    const writeSpy = vi.spyOn(stateBuffer!, 'write');
    for (const bounds of overflowingBounds) {
      expect(() => selection.setBounds(bounds)).toThrow(/input scalar format/);
      expect(await readControlWords(stateBuffer!)).toEqual(previousControlWords);
    }
    expect(writeSpy).not.toHaveBeenCalled();

    selection.destroy();
    writeSpy.mockRestore();
    createBufferSpy.mockRestore();
    destroyGraphFixture(fixture);
  });

  test('orders rectangular brush endpoints by axis without converting integer coordinates', async () => {
    const fixture = createGraphFixture('bounds-selection');
    const horizontal = createScalarView(
      fixture,
      'horizontal-values',
      Int32Array.from([-2, -1]),
      'sint32'
    );
    const vertical = createScalarView(
      fixture,
      'vertical-values',
      Uint32Array.from([0xfffffffe, 0xffffffff]),
      'uint32'
    );
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');
    const selection = new LuxFilterSelection(fixture.graph, {
      id: 'rectangle',
      kind: 'bounds',
      x: horizontal,
      y: vertical
    });
    const stateBuffer = createBufferSpy.mock.results.at(-1)?.value;

    selection.setBounds([-2, 0xfffffffe, -1, 0xffffffff]);
    expect(await readControlWords(stateBuffer!)).toEqual([
      1, 0xfffffffe, 0xffffffff, 0xfffffffe, 0xffffffff
    ]);
    expect(() => selection.setRange([0, 1])).toThrow(/scalar range selection/);
    expect(() => selection.setBounds([0, 1, -1, 2])).toThrow(/horizontal bounds/);
    expect(() => selection.setBounds([-2, 2, -1, 1])).toThrow(/vertical bounds/);

    selection.destroy();
    createBufferSpy.mockRestore();
    destroyGraphFixture(fixture);
  });

  test('retains empty vector chunks and emits passes only for nonempty source chunks', () => {
    const fixture = createGraphFixture('chunked-selection');
    const input = createScalarVector(
      fixture,
      'chunked-values',
      [Float32Array.from([1, 2]), new Float32Array(0), Float32Array.from([3])],
      'float32'
    );
    const selection = new LuxFilterSelection(fixture.graph, {
      id: 'chunked',
      kind: 'range',
      input
    });
    const addComputePassSpy = vi.spyOn(fixture.graph, 'addComputePass');

    expect(selection.mask).toBeInstanceOf(GraphVectorView);
    if (!(selection.mask instanceof GraphVectorView)) {
      throw new Error('Expected a chunked selection mask');
    }
    expect(selection.mask.data.map(chunk => chunk.length)).toEqual([2, 0, 1]);

    selection.addToGraph(fixture.graph);
    expect(addComputePassSpy.mock.calls.map(([pass]) => pass.id)).toEqual([
      'lux-filter-chunked-chunk-0',
      'lux-filter-chunked-chunk-2'
    ]);

    selection.destroy();
    for (const buffer of fixture.buffers) expect(buffer.destroyed).toBe(false);
    addComputePassSpy.mockRestore();
    destroyGraphFixture(fixture);
  });

  test('rejects mismatched bounds, mismatched caller masks, and aliased output buffers', () => {
    const fixture = createGraphFixture('invalid-selection');
    const primary = createScalarView(
      fixture,
      'primary-values',
      Uint32Array.from([1, 2, 3]),
      'uint32'
    );
    const shorter = createScalarView(fixture, 'shorter-values', Uint32Array.from([1, 2]), 'uint32');

    expect(
      () =>
        new LuxFilterSelection(fixture.graph, {
          id: 'mismatched-bounds',
          kind: 'bounds',
          x: primary,
          y: shorter
        })
    ).toThrow(/same chunk topology/);
    expect(
      () =>
        new LuxFilterSelection(fixture.graph, {
          id: 'mismatched-mask',
          kind: 'range',
          input: primary,
          mask: shorter
        })
    ).toThrow(/same chunk topology/);
    expect(
      () =>
        new LuxFilterSelection(fixture.graph, {
          id: 'aliased-mask',
          kind: 'range',
          input: primary,
          mask: primary
        })
    ).toThrow(/separate buffers/);

    destroyGraphFixture(fixture);
  });

  test('controller ownership leaves imported source buffers alive after destruction', () => {
    const fixture = createGraphFixture('controller-lifecycle');
    const input = createScalarView(
      fixture,
      'controller-values',
      Float32Array.from([0, 0.5, 1]),
      'float32'
    );
    const sourceBuffer = fixture.buffers[0];
    const controller = new LuxFilter(fixture.graph, {
      id: 'dashboard',
      dimensions: [{id: 'values', kind: 'range', input}]
    });

    expect(controller.getDimensionMask('values').length).toBe(3);
    expect(controller.setRange('values', [0, 1])).toBe(controller);
    expect(controller.clearAll()).toBe(controller);
    expect(() => controller.setBounds('values', [0, 0, 1, 1])).toThrow(/bounds selection/);

    controller.destroy();
    controller.destroy();
    expect(sourceBuffer.destroyed).toBe(false);
    expect(() => controller.clearAll()).toThrow(/destroyed/);

    destroyGraphFixture(fixture);
  });
});

describe('LuxFilter controller contracts without GPU execution', () => {
  test('rejects excluded histogram and group views with different source row counts', () => {
    const fixture = createGraphFixture('view-row-count-validation');
    const dimensionInput = createScalarView(
      fixture,
      'dimension-values',
      Float32Array.from([0, 0.5, 1]),
      'float32'
    );
    const shorterHistogramInput = createScalarView(
      fixture,
      'shorter-histogram-values',
      Float32Array.from([0, 1]),
      'float32'
    );
    const shorterGroupKeys = createScalarView(
      fixture,
      'shorter-group-keys',
      Uint32Array.from([0, 1]),
      'uint32'
    );
    const histogramOutput = createScalarView(
      fixture,
      'histogram-output',
      new Uint32Array(2),
      'uint32'
    );
    const groupOutput = createScalarView(fixture, 'group-output', new Uint32Array(2), 'uint32');

    expect(
      () =>
        new LuxFilter(fixture.graph, {
          id: 'invalid-histogram-rows',
          dimensions: [{id: 'values', kind: 'range', input: dimensionInput}],
          views: [
            {
              id: 'distribution',
              kind: 'histogram',
              dimension: 'values',
              input: shorterHistogramInput,
              output: histogramOutput,
              domain: [0, 1]
            }
          ]
        })
    ).toThrow(/same row count|same chunk topology/);

    expect(
      () =>
        new LuxFilter(fixture.graph, {
          id: 'invalid-group-rows',
          dimensions: [{id: 'values', kind: 'range', input: dimensionInput}],
          views: [
            {
              id: 'categories',
              kind: 'group',
              dimension: 'values',
              keys: shorterGroupKeys,
              output: groupOutput
            }
          ]
        })
    ).toThrow(/same row count|same chunk topology/);

    destroyGraphFixture(fixture);
  });

  test('rejects excluded histogram and group views with different source chunk boundaries', () => {
    const fixture = createGraphFixture('view-chunk-validation');
    const dimensionInput = createScalarVector(
      fixture,
      'dimension-chunks',
      [Float32Array.from([0, 0.5]), Float32Array.from([1])],
      'float32'
    );
    const histogramInput = createScalarVector(
      fixture,
      'histogram-chunks',
      [Float32Array.from([0]), Float32Array.from([0.5, 1])],
      'float32'
    );
    const groupKeys = createScalarVector(
      fixture,
      'group-chunks',
      [Uint32Array.from([0]), Uint32Array.from([1, 0])],
      'uint32'
    );
    const histogramOutput = createScalarView(
      fixture,
      'chunk-histogram-output',
      new Uint32Array(2),
      'uint32'
    );
    const groupOutput = createScalarView(
      fixture,
      'chunk-group-output',
      new Uint32Array(2),
      'uint32'
    );

    expect(
      () =>
        new LuxFilter(fixture.graph, {
          id: 'invalid-histogram-chunks',
          dimensions: [{id: 'values', kind: 'range', input: dimensionInput}],
          views: [
            {
              id: 'distribution',
              kind: 'histogram',
              dimension: 'values',
              input: histogramInput,
              output: histogramOutput,
              domain: [0, 1]
            }
          ]
        })
    ).toThrow(/same chunk topology/);

    expect(
      () =>
        new LuxFilter(fixture.graph, {
          id: 'invalid-group-chunks',
          dimensions: [{id: 'values', kind: 'range', input: dimensionInput}],
          views: [
            {
              id: 'categories',
              kind: 'group',
              dimension: 'values',
              keys: groupKeys,
              output: groupOutput
            }
          ]
        })
    ).toThrow(/same chunk topology/);

    destroyGraphFixture(fixture);
  });

  test('releases every control buffer when a later dimension has incompatible topology', () => {
    const fixture = createGraphFixture('dimension-cleanup');
    const firstInput = createScalarView(
      fixture,
      'first-dimension',
      Float32Array.from([0, 0.5, 1]),
      'float32'
    );
    const shorterInput = createScalarView(
      fixture,
      'second-dimension',
      Float32Array.from([0, 1]),
      'float32'
    );
    const sourceBuffers = [...fixture.buffers];
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');

    expect(
      () =>
        new LuxFilter(fixture.graph, {
          id: 'cleanup-dashboard',
          dimensions: [
            {id: 'first', kind: 'range', input: firstInput},
            {id: 'second', kind: 'range', input: shorterInput}
          ]
        })
    ).toThrow(/same row count|same chunk topology/);

    const controlBuffers = createBufferSpy.mock.results
      .map(result => result.value)
      .filter((buffer): buffer is Buffer => buffer instanceof Buffer);
    expect(controlBuffers).toHaveLength(2);
    expect(controlBuffers.every(buffer => buffer.destroyed)).toBe(true);
    expect(sourceBuffers.every(buffer => !buffer.destroyed)).toBe(true);

    createBufferSpy.mockRestore();
    destroyGraphFixture(fixture);
  });

  test('rejects duplicate dimensions, duplicate views, and unknown view dimensions', () => {
    const fixture = createGraphFixture('identifier-validation');
    const input = createScalarView(
      fixture,
      'identifier-values',
      Float32Array.from([0, 1]),
      'float32'
    );
    const maskOutput = createScalarView(
      fixture,
      'identifier-mask-output',
      new Uint32Array(2),
      'uint32'
    );
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');

    expect(
      () =>
        new LuxFilter(fixture.graph, {
          id: 'duplicate-dimensions',
          dimensions: [
            {id: 'values', kind: 'range', input},
            {id: 'values', kind: 'range', input}
          ]
        })
    ).toThrow(/unique identifiers/);
    expect(
      () =>
        new LuxFilter(fixture.graph, {
          id: 'duplicate-views',
          dimensions: [{id: 'values', kind: 'range', input}],
          views: [
            {id: 'same-view', kind: 'mask', output: maskOutput},
            {id: 'same-view', kind: 'mask', output: maskOutput}
          ]
        })
    ).toThrow(/unique identifiers/);
    expect(
      () =>
        new LuxFilter(fixture.graph, {
          id: 'unknown-dimension',
          dimensions: [{id: 'values', kind: 'range', input}],
          views: [{id: 'unknown-view', kind: 'mask', dimension: 'missing', output: maskOutput}]
        })
    ).toThrow(/unknown dimension/);

    const controlBuffers = createBufferSpy.mock.results
      .map(result => result.value)
      .filter((buffer): buffer is Buffer => buffer instanceof Buffer);
    expect(controlBuffers).toHaveLength(3);
    expect(controlBuffers.every(buffer => buffer.destroyed)).toBe(true);

    createBufferSpy.mockRestore();
    destroyGraphFixture(fixture);
  });

  test('separates selection and linked-view passes even when view suffixes overlap', () => {
    const fixture = createGraphFixture('linked-view-node-namespaces');
    const input = createScalarView(
      fixture,
      'linked-view-values',
      Float32Array.from([0, 0.5, 1]),
      'float32'
    );
    const groupKeys = createScalarView(
      fixture,
      'linked-view-group-keys',
      Uint32Array.from([0, 1, 0]),
      'uint32'
    );
    const valueMask = createScalarView(fixture, 'linked-value-mask', new Uint32Array(3), 'uint32');
    const distributionMask = createScalarView(
      fixture,
      'linked-distribution-mask',
      new Uint32Array(3),
      'uint32'
    );
    const histogramOutput = createScalarView(
      fixture,
      'linked-histogram-output',
      new Uint32Array(2),
      'uint32'
    );
    const groupOutput = createScalarView(
      fixture,
      'linked-group-output',
      new Uint32Array(2),
      'uint32'
    );
    const visibilityOutput = createScalarView(
      fixture,
      'linked-visible-indices',
      new Uint32Array(3),
      'uint32'
    );
    const visibilityCount = createScalarView(
      fixture,
      'linked-visible-count',
      new Uint32Array(1),
      'uint32'
    );
    const controller = new LuxFilter(fixture.graph, {
      id: 'linked-namespace',
      dimensions: [
        'compose',
        'controller-compose',
        'controller/compose',
        'compose-without-foo-mask',
        'foo-mask',
        'without-foo',
        'value',
        'distribution-clear',
        'categories-clear',
        'points-identity'
      ].map(id => ({id, kind: 'range', input})),
      views: [
        {id: 'value', kind: 'mask', output: valueMask},
        {
          id: 'distribution',
          kind: 'histogram',
          dimension: 'foo-mask',
          input,
          output: histogramOutput,
          domain: [0, 1]
        },
        {id: 'distribution-clear', kind: 'mask', output: distributionMask},
        {id: 'categories', kind: 'group', keys: groupKeys, output: groupOutput},
        {id: 'points', kind: 'visibility', output: visibilityOutput, count: visibilityCount}
      ]
    });
    const addComputePassSpy = vi.spyOn(fixture.graph, 'addComputePass');

    controller.addToGraph();

    const nodeIdentifiers = addComputePassSpy.mock.calls.map(([pass]) => pass.id);
    expect(nodeIdentifiers).toEqual(
      expect.arrayContaining([
        'linked-namespace-compose',
        'linked-namespace-controller-compose',
        'linked-namespace-controller/compose',
        'linked-namespace-compose-without-foo-mask',
        'linked-namespace-value',
        'linked-namespace-distribution-clear',
        'linked-namespace-categories-clear',
        'linked-namespace-points-identity',
        'linked-namespace/controller/compose',
        'linked-namespace/controller/compose-without/foo-mask',
        'linked-namespace/view/5:value',
        'linked-namespace/view/12:distribution-clear',
        'linked-namespace/view/18:distribution-clear',
        'linked-namespace/view/10:categories-clear',
        'linked-namespace/view/6:points-identity'
      ])
    );
    expect(new Set(nodeIdentifiers).size).toBe(nodeIdentifiers.length);
    expect(controller.getViewMask('value')).toBe(valueMask);
    expect(controller.getViewMask('distribution-clear')).toBe(distributionMask);
    const excludedSelectionMask = controller.getViewMask('distribution');
    const existingDimensionMask = controller.getDimensionMask('without-foo');
    if (!excludedSelectionMask || excludedSelectionMask instanceof GraphVectorView) {
      throw new Error('Expected a scalar leave-one-out mask');
    }
    if (existingDimensionMask instanceof GraphVectorView) {
      throw new Error('Expected a scalar dimension mask');
    }
    expect(excludedSelectionMask.buffer.id).toBe(
      'linked-namespace/controller/mask/without/foo-mask'
    );
    expect(existingDimensionMask.buffer.id).toBe('linked-namespace-without-foo-mask');
    expect(controller.setRange('compose', [0, 1])).toBe(controller);

    controller.destroy();
    addComputePassSpy.mockRestore();
    destroyGraphFixture(fixture);
  });

  test('separates reserved-looking chunked dimensions from chunked composition passes', () => {
    const fixture = createGraphFixture('chunked-controller-node-namespaces');
    const input = createScalarVector(
      fixture,
      'chunked-namespace-values',
      [Float32Array.from([0, 0.5]), new Float32Array(0), Float32Array.from([1])],
      'float32'
    );
    const controller = new LuxFilter(fixture.graph, {
      id: 'chunked-dashboard',
      dimensions: [{id: 'compose', kind: 'range', input}]
    });
    const addComputePassSpy = vi.spyOn(fixture.graph, 'addComputePass');

    controller.addToGraph();

    expect(addComputePassSpy.mock.calls.map(([pass]) => pass.id)).toEqual([
      'chunked-dashboard-compose-chunk-0',
      'chunked-dashboard-compose-chunk-2',
      'chunked-dashboard/controller/compose-chunk-0',
      'chunked-dashboard/controller/compose-chunk-2'
    ]);

    controller.destroy();
    addComputePassSpy.mockRestore();
    destroyGraphFixture(fixture);
  });

  test.each([
    'selection-all-not',
    'selection-all-compose'
  ])('separates dimension "%s" from controller-owned all-rows helper passes', dimensionIdentifier => {
    const fixture = createGraphFixture(`all-rows-${dimensionIdentifier}`);
    const input = createScalarView(
      fixture,
      'all-rows-namespace-values',
      Float32Array.from([0, 0.5, 1]),
      'float32'
    );
    const output = createScalarView(
      fixture,
      'all-rows-namespace-output',
      new Uint32Array(3),
      'uint32'
    );
    const controller = new LuxFilter(fixture.graph, {
      id: 'all-rows-dashboard',
      dimensions: [{id: dimensionIdentifier, kind: 'range', input}],
      views: [
        {
          id: 'selection',
          kind: 'mask',
          dimension: dimensionIdentifier,
          includeOwnSelection: false,
          output
        }
      ]
    });
    const addComputePassSpy = vi.spyOn(fixture.graph, 'addComputePass');
    const createTransientBufferSpy = vi.spyOn(fixture.graph, 'createTransientBuffer');

    controller.addToGraph();

    const nodeIdentifiers = addComputePassSpy.mock.calls.map(([pass]) => pass.id);
    expect(nodeIdentifiers).toEqual(
      expect.arrayContaining([
        `all-rows-dashboard-${dimensionIdentifier}`,
        'all-rows-dashboard/controller/view/selection/all/not',
        'all-rows-dashboard/controller/view/selection/all/compose'
      ])
    );
    expect(new Set(nodeIdentifiers).size).toBe(nodeIdentifiers.length);
    expect(controller.getViewMask('selection')).toBe(output);
    expect(createTransientBufferSpy.mock.calls.map(([descriptor]) => descriptor.id)).toEqual(
      expect.arrayContaining([
        'all-rows-dashboard/controller/mask/view/selection/all-inverse',
        'all-rows-dashboard/controller/mask/view/selection/all'
      ])
    );

    controller.destroy();
    addComputePassSpy.mockRestore();
    createTransientBufferSpy.mockRestore();
    destroyGraphFixture(fixture);
  });

  test('excludes the only dimension from distributions and materializes all-row rendering masks', () => {
    const fixture = createGraphFixture('excluded-selection');
    const input = createScalarView(
      fixture,
      'selection-values',
      Float32Array.from([0, 0.5, 1]),
      'float32'
    );
    const groupKeys = createScalarView(
      fixture,
      'selection-group-keys',
      Uint32Array.from([0, 1, 0]),
      'uint32'
    );
    const histogramOutput = createScalarView(
      fixture,
      'excluded-histogram',
      new Uint32Array(2),
      'uint32'
    );
    const selectedHistogramOutput = createScalarView(
      fixture,
      'selected-histogram',
      new Uint32Array(2),
      'uint32'
    );
    const groupOutput = createScalarView(fixture, 'excluded-groups', new Uint32Array(2), 'uint32');
    const allRowsOutput = createScalarView(
      fixture,
      'all-rows-output',
      new Uint32Array(3),
      'uint32'
    );
    const visibleIndices = createScalarView(
      fixture,
      'all-visible-indices',
      new Uint32Array(3),
      'uint32'
    );
    const visibleCount = createScalarView(
      fixture,
      'all-visible-count',
      new Uint32Array(1),
      'uint32'
    );
    const controller = new LuxFilter(fixture.graph, {
      id: 'single-dimension',
      dimensions: [{id: 'values', kind: 'range', input}],
      views: [
        {
          id: 'distribution',
          kind: 'histogram',
          dimension: 'values',
          input,
          output: histogramOutput,
          domain: [0, 1]
        },
        {
          id: 'categories',
          kind: 'group',
          dimension: 'values',
          keys: groupKeys,
          output: groupOutput
        },
        {
          id: 'selected-distribution',
          kind: 'histogram',
          dimension: 'values',
          includeOwnSelection: true,
          input,
          output: selectedHistogramOutput,
          domain: [0, 1]
        },
        {
          id: 'all-rows',
          kind: 'mask',
          dimension: 'values',
          includeOwnSelection: false,
          output: allRowsOutput
        },
        {
          id: 'all-visible',
          kind: 'visibility',
          dimension: 'values',
          includeOwnSelection: false,
          output: visibleIndices,
          count: visibleCount
        }
      ]
    });
    const addComputePassSpy = vi.spyOn(fixture.graph, 'addComputePass');

    expect(() => controller.getViewMask('distribution')).toThrow(/after addToGraph/);
    expect(() => controller.getViewMask('missing')).toThrow(/does not contain view/);

    controller.addToGraph();

    expect(controller.getViewMask('distribution')).toBeUndefined();
    expect(controller.getViewMask('categories')).toBeUndefined();
    expect(controller.getViewMask('selected-distribution')).toBe(controller.mask);
    expect(controller.getViewMask('all-rows')).toBe(allRowsOutput);
    expect(controller.getViewMask('all-visible')?.length).toBe(3);
    expect(controller.getViewMask('all-visible')).not.toBe(controller.mask);
    expect(addComputePassSpy.mock.calls.map(([pass]) => pass.id)).toEqual(
      expect.arrayContaining([
        'single-dimension/controller/view/all-rows/all/not',
        'single-dimension/controller/view/all-rows/all/compose',
        'single-dimension/controller/view/all-visible/all/not',
        'single-dimension/controller/view/all-visible/all/compose'
      ])
    );

    controller.destroy();
    addComputePassSpy.mockRestore();
    destroyGraphFixture(fixture);
  });

  test('shares leave-one-out masks between linked views while retaining other dimensions', () => {
    const fixture = createGraphFixture('shared-excluded-masks');
    const firstInput = createScalarView(
      fixture,
      'first-values',
      Float32Array.from([0, 0.5, 1]),
      'float32'
    );
    const secondInput = createScalarView(
      fixture,
      'second-values',
      Float32Array.from([1, 0.5, 0]),
      'float32'
    );
    const groupKeys = createScalarView(
      fixture,
      'linked-group-keys',
      Uint32Array.from([0, 1, 0]),
      'uint32'
    );
    const firstHistogramOutput = createScalarView(
      fixture,
      'first-histogram',
      new Uint32Array(2),
      'uint32'
    );
    const secondHistogramOutput = createScalarView(
      fixture,
      'second-histogram',
      new Uint32Array(2),
      'uint32'
    );
    const groupOutput = createScalarView(
      fixture,
      'linked-group-output',
      new Uint32Array(2),
      'uint32'
    );
    const controller = new LuxFilter(fixture.graph, {
      id: 'linked-dimensions',
      dimensions: [
        {id: 'first', kind: 'range', input: firstInput},
        {id: 'second', kind: 'range', input: secondInput}
      ],
      views: [
        {
          id: 'first-distribution',
          kind: 'histogram',
          dimension: 'first',
          input: firstInput,
          output: firstHistogramOutput,
          domain: [0, 1]
        },
        {
          id: 'first-groups',
          kind: 'group',
          dimension: 'first',
          keys: groupKeys,
          output: groupOutput
        },
        {
          id: 'second-distribution',
          kind: 'histogram',
          dimension: 'second',
          input: secondInput,
          output: secondHistogramOutput,
          domain: [0, 1]
        }
      ]
    });
    const addComputePassSpy = vi.spyOn(fixture.graph, 'addComputePass');

    controller.addToGraph();

    const firstDimensionMask = controller.getViewMask('first-distribution');
    const secondDimensionMask = controller.getViewMask('second-distribution');
    expect(firstDimensionMask).toBe(controller.getViewMask('first-groups'));
    expect(firstDimensionMask).not.toBe(controller.mask);
    expect(firstDimensionMask).not.toBe(secondDimensionMask);
    expect(
      addComputePassSpy.mock.calls.filter(
        ([pass]) => pass.id === 'linked-dimensions/controller/compose-without/first'
      )
    ).toHaveLength(1);
    expect(
      addComputePassSpy.mock.calls.filter(
        ([pass]) => pass.id === 'linked-dimensions/controller/compose-without/second'
      )
    ).toHaveLength(1);

    controller.destroy();
    addComputePassSpy.mockRestore();
    destroyGraphFixture(fixture);
  });
});

type GraphFixture = {
  device: NullDevice;
  graph: GPUCommandGraph;
  buffers: Buffer[];
  vectors: GPUVector[];
};

/** Uses in-memory null buffers while exercising real command-graph construction contracts. */
function createGraphFixture(id: string): GraphFixture {
  const device = new NullDevice({id: `${id}-device`});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  Object.defineProperty(device.limits, 'maxComputeWorkgroupsPerDimension', {value: 65535});
  return {
    device,
    graph: new GPUCommandGraph(device, {id}),
    buffers: [],
    vectors: []
  };
}

/** Imports one caller-owned scalar buffer without allocating a real WebGPU device. */
function createScalarView<Format extends LuxFilterScalarFormat>(
  fixture: GraphFixture,
  id: string,
  values: Float32Array | Int32Array | Uint32Array,
  format: Format
): GraphDataView<Format> {
  const buffer = createInputBuffer(fixture, id, values);
  const handle = fixture.graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return fixture.graph.createDataView(handle, {format, length: values.length});
}

/** Imports ordered borrowed scalar chunks while retaining explicit empty chunk boundaries. */
function createScalarVector<Format extends LuxFilterScalarFormat>(
  fixture: GraphFixture,
  id: string,
  chunks: Array<Float32Array | Int32Array | Uint32Array>,
  format: Format
): GraphVectorView<Format> {
  const data = chunks.map((chunk, chunkIndex) => {
    const buffer = createInputBuffer(fixture, `${id}-chunk-${chunkIndex}`, chunk);
    return new GPUData({buffer, format, length: chunk.length, ownsBuffer: false});
  });
  const vector = new GPUVector({type: 'data', name: id, format, data, ownsData: false});
  fixture.vectors.push(vector);
  return fixture.graph.importGPUVector(id, vector);
}

/** Allocates a caller-owned in-memory scalar buffer, including backing storage for empty chunks. */
function createInputBuffer(
  fixture: GraphFixture,
  id: string,
  values: Float32Array | Int32Array | Uint32Array
): Buffer {
  const buffer = fixture.device.createBuffer({
    id,
    data: values.length === 0 ? new Uint32Array(1) : values,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  fixture.buffers.push(buffer);
  return buffer;
}

/** Reads the small CPU-backed control block without reading any imported source rows. */
async function readControlWords(buffer: Buffer): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
}

/** Explicitly releases fixture-owned resources after selection ownership has been checked. */
function destroyGraphFixture(fixture: GraphFixture): void {
  for (const vector of fixture.vectors) vector.destroy();
  for (const buffer of fixture.buffers) buffer.destroy();
  fixture.device.destroy();
}
