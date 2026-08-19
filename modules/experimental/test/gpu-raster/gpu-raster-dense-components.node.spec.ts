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
  GPURasterDenseComponents,
  type GPURasterDenseComponentsProps,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/gpu-raster';
import {describe, expect, test} from 'vitest';

type RecordingGraph = GPUCommandGraph & {
  passes: GPUCommandGraphComputeNode[];
  transientBuffers: GraphBufferHandle[];
};

describe('GPURasterDenseComponents public contracts', () => {
  test('defaults to full component capacity and preserves every offset-backed borrowed view', () => {
    const graph = makeRecordingGraph('dense-defaults');
    const props = makeProps(graph, 3, 2, 4);
    const contributor = new GPURasterDenseComponents(props);

    expect(contributor.id).toBe('gpu-raster-dense-components');
    expect(contributor.width).toBe(3);
    expect(contributor.height).toBe(2);
    expect(contributor.capacity).toBe(6);
    expect(contributor.input).toBe(props.input);
    expect(contributor.inputValidity).toBe(props.inputValidity);
    expect(contributor.converged).toBe(props.converged);
    expect(contributor.output).toBe(props.output);
    expect(contributor.outputValidity).toBe(props.outputValidity);
    expect(contributor.componentCount).toBe(props.componentCount);
    expect(contributor.overflow).toBe(props.overflow);
    expect(contributor.requiredComponentCount).toBe(props.requiredComponentCount);
    expect(contributor.input.byteOffset).toBe(4);
    expect(contributor.componentCount.byteOffset).toBe(4);

    const emptyCapacity = new GPURasterDenseComponents({
      ...props,
      id: 'no-published-regions',
      capacity: 0
    });
    expect(emptyCapacity.id).toBe('no-published-regions');
    expect(emptyCapacity.capacity).toBe(0);
  });

  test('rejects unsafe dimensions, unsigned identifier overflow, and invalid compact capacity', () => {
    const graph = makeRecordingGraph('dense-dimensions');
    const props = makeProps(graph, 3, 2);
    for (const width of [0, -1, 1.25, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => new GPURasterDenseComponents({...props, width})).toThrow(/dimensions/);
    }
    expect(() => new GPURasterDenseComponents({...props, height: 0})).toThrow(/dimensions/);
    expect(() => new GPURasterDenseComponents({...props, width: 65536, height: 65536})).toThrow(
      /uint32/
    );
    for (const capacity of [-1, 1.5, 7, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => new GPURasterDenseComponents({...props, capacity})).toThrow(/capacity/);
    }
  });

  test('requires packed unsigned labels, exact masks, and one-row unsigned scalar outputs', () => {
    const graph = makeRecordingGraph('dense-view-validation');
    const props = makeProps(graph, 3, 2);

    expect(
      () =>
        new GPURasterDenseComponents({
          ...props,
          input: makeView(graph, 'floating-roots', 'float32', 6) as never
        })
    ).toThrow(/uint32/);
    expect(
      () =>
        new GPURasterDenseComponents({
          ...props,
          inputValidity: makeView(graph, 'short-input-mask', 'uint32', 5)
        })
    ).toThrow(/one flag per pixel/);
    expect(
      () =>
        new GPURasterDenseComponents({
          ...props,
          output: makeView(graph, 'short-dense-labels', 'uint32', 5)
        })
    ).toThrow(/one sample per pixel/);
    expect(
      () =>
        new GPURasterDenseComponents({
          ...props,
          outputValidity: makeView(graph, 'floating-output-mask', 'float32', 6) as never
        })
    ).toThrow(/uint32/);
    for (const scalar of [
      'converged',
      'componentCount',
      'overflow',
      'requiredComponentCount'
    ] as const) {
      expect(
        () =>
          new GPURasterDenseComponents({
            ...props,
            [scalar]: makeView(graph, `${scalar}-extra-row`, 'uint32', 2)
          })
      ).toThrow(/one flag per pixel/);
      expect(
        () =>
          new GPURasterDenseComponents({
            ...props,
            [scalar]: makeView(graph, `${scalar}-floating`, 'float32', 1)
          })
      ).toThrow(/uint32/);
    }
  });

  test('rejects foreign owners and physical aliases between convergence, labels, masks, and counts', () => {
    const graph = makeRecordingGraph('dense-ownership');
    const foreign = makeRecordingGraph('dense-foreign');
    const props = makeProps(graph, 3, 2);

    expect(
      () =>
        new GPURasterDenseComponents({
          ...props,
          overflow: makeView(foreign, 'foreign-overflow', 'uint32', 1)
        })
    ).toThrow(/same graph/);
    expect(() => new GPURasterDenseComponents({...props, output: props.input})).toThrow(
      /separate buffers/
    );
    expect(
      () => new GPURasterDenseComponents({...props, outputValidity: props.inputValidity})
    ).toThrow(/separate buffers/);
    expect(() => new GPURasterDenseComponents({...props, overflow: props.converged})).toThrow(
      /separate buffers/
    );
    expect(
      () => new GPURasterDenseComponents({...props, requiredComponentCount: props.componentCount})
    ).toThrow(/separate buffers/);
  });
});

describe('GPURasterDenseComponents graph composition', () => {
  test('marks canonical roots, composes an exclusive hierarchical GPU scan, then scatters and publishes', () => {
    const graph = makeRecordingGraph('dense-hierarchy');
    const contributor = new GPURasterDenseComponents({
      ...makeProps(graph, 33, 9),
      id: 'compact-representatives',
      capacity: 17
    });
    contributor.addToGraph(graph);

    expect(graph.passes.map(pass => pass.id)).toEqual([
      'compact-representatives-mark-roots',
      'compact-representatives-scan-level-0-scan',
      'compact-representatives-scan-level-1-scan',
      'compact-representatives-scan-level-0-add-offsets',
      'compact-representatives-scatter',
      'compact-representatives-publish'
    ]);
    expect(graph.transientBuffers.map(buffer => buffer.id)).toEqual([
      'compact-representatives-root-flags',
      'compact-representatives-root-offsets',
      'compact-representatives-scan-level-0-block-sums',
      'compact-representatives-scan-level-0-block-offsets'
    ]);
    expect(graph.transientBuffers.every(buffer => buffer.transient)).toBe(true);
    expect(graph.passes[0]?.resources?.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-read',
      'storage-read',
      'storage-write'
    ]);
    expect(graph.passes.at(-2)?.resources?.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-read',
      'storage-read',
      'storage-read',
      'storage-read',
      'storage-write',
      'storage-write'
    ]);
    expect(graph.passes.at(-1)?.resources?.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-read',
      'storage-read',
      'storage-write',
      'storage-write',
      'storage-write'
    ]);
    expect(graph.passes.every(pass => (pass.resources?.length ?? 0) <= 7)).toBe(true);
  });

  test('supports zero compact capacity and omits the optional exact-total binding', () => {
    const graph = makeRecordingGraph('dense-zero-capacity');
    const {requiredComponentCount: _requiredComponentCount, ...props} = makeProps(graph, 1, 1);
    const contributor = new GPURasterDenseComponents({...props, capacity: 0});
    contributor.addToGraph(graph);

    expect(contributor.requiredComponentCount).toBeUndefined();
    expect(contributor.capacity).toBe(0);
    expect(graph.passes.map(pass => pass.id)).toEqual([
      'gpu-raster-dense-components-mark-roots',
      'gpu-raster-dense-components-scan-level-0-scan',
      'gpu-raster-dense-components-scatter',
      'gpu-raster-dense-components-publish'
    ]);
    expect(graph.passes.at(-1)?.resources).toHaveLength(5);
  });

  test('preflights WebGPU, seven bindings, 256-thread scan limits, offsets, and bounded dispatches', () => {
    const notWebGPU = makeRecordingGraph('dense-webgl', {}, 'webgl');
    expect(() =>
      new GPURasterDenseComponents(makeProps(notWebGPU, 3, 2)).addToGraph(notWebGPU)
    ).toThrow(/WebGPU device/);

    const limitedBindings = makeRecordingGraph('dense-binding-limit', {
      maxStorageBuffersPerShaderStage: 6
    });
    expect(() =>
      new GPURasterDenseComponents(makeProps(limitedBindings, 3, 2)).addToGraph(limitedBindings)
    ).toThrow(/binding count/);

    const limitedInvocations = makeRecordingGraph('dense-scan-invocations', {
      maxComputeInvocationsPerWorkgroup: 255
    });
    expect(() =>
      new GPURasterDenseComponents(makeProps(limitedInvocations, 3, 2)).addToGraph(
        limitedInvocations
      )
    ).toThrow(/scan exceeds device workgroup limits/);

    const limitedHorizontalThreads = makeRecordingGraph('dense-scan-horizontal', {
      maxComputeWorkgroupSizeX: 255
    });
    expect(() =>
      new GPURasterDenseComponents(makeProps(limitedHorizontalThreads, 3, 2)).addToGraph(
        limitedHorizontalThreads
      )
    ).toThrow(/scan exceeds device workgroup limits/);

    const limitedStorage = makeRecordingGraph('dense-storage-limit', {
      maxStorageBufferBindingSize: 27
    });
    expect(() =>
      new GPURasterDenseComponents(makeProps(limitedStorage, 3, 2, 4)).addToGraph(limitedStorage)
    ).toThrow(/storage binding limit/);

    const limitedDispatch = makeRecordingGraph('dense-dispatch-limit', {
      maxComputeWorkgroupsPerDimension: 1
    });
    expect(() =>
      new GPURasterDenseComponents(makeProps(limitedDispatch, 9, 2)).addToGraph(limitedDispatch)
    ).toThrow(/dispatch limits/);
  });

  test('refuses to add borrowed views or scratch to a different command graph', () => {
    const owner = makeRecordingGraph('dense-original-owner');
    const target = makeRecordingGraph('dense-other-target');
    expect(() => new GPURasterDenseComponents(makeProps(owner, 3, 2)).addToGraph(target)).toThrow(
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
  width: number,
  height: number,
  byteOffset: number = 0
): GPURasterDenseComponentsProps {
  const pixelCount = width * height;
  return {
    width,
    height,
    input: makeView(graph, 'sparse-labels', 'uint32', pixelCount, byteOffset),
    inputValidity: makeView(graph, 'sparse-validity', 'uint32', pixelCount, byteOffset),
    converged: makeView(graph, 'converged', 'uint32', 1, byteOffset),
    output: makeView(graph, 'dense-labels', 'uint32', pixelCount, byteOffset),
    outputValidity: makeView(graph, 'dense-validity', 'uint32', pixelCount, byteOffset),
    componentCount: makeView(graph, 'bounded-component-count', 'uint32', 1, byteOffset),
    overflow: makeView(graph, 'component-overflow', 'uint32', 1, byteOffset),
    requiredComponentCount: makeView(graph, 'required-component-count', 'uint32', 1, byteOffset)
  };
}

function makeView<Format extends GPURasterScalarFormat>(
  graph: RecordingGraph,
  id: string,
  format: Format,
  length: number,
  byteOffset: number = 0
): GraphDataView<Format> {
  const buffer = new GraphBufferHandle(
    graph,
    {id, byteLength: byteOffset + Math.max(length, 1) * 4, usage: Buffer.STORAGE},
    false
  );
  return new GraphDataView(buffer, {
    format,
    length,
    byteOffset,
    byteStride: 4,
    rowByteLength: 4
  });
}
