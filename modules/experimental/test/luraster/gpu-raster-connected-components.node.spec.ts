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
  GPURasterConnectedComponents,
  type GPURasterBufferBand,
  type GPURasterConnectedComponentsProps,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/luraster';
import {describe, expect, test} from 'vitest';

type RecordingGraph = GPUCommandGraph & {
  passes: GPUCommandGraphComputeNode[];
  transientBuffers: GraphBufferHandle[];
};

describe('GPURasterConnectedComponents public contracts', () => {
  test('publishes deterministic four-connectivity defaults and separately owned status outputs', () => {
    const graph = makeRecordingGraph('component-defaults');
    const props = makeProps(graph, 3, 2, 4);
    const contributor = new GPURasterConnectedComponents(props);

    expect(contributor.id).toBe('gpu-raster-connected-components');
    expect(contributor.width).toBe(3);
    expect(contributor.height).toBe(2);
    expect(contributor.connectivity).toBe(4);
    expect(contributor.maximumIterations).toBe(5);
    expect(contributor.input).toBe(props.input);
    expect(contributor.output).toBe(props.output);
    expect(contributor.outputValidity).toBe(props.outputValidity);
    expect(contributor.converged).toBe(props.converged);
    expect(contributor.iterationCount).toBe(props.iterationCount);
    expect(contributor.output.byteOffset).toBe(4);
    expect(contributor.outputValidity.byteOffset).toBe(4);
    expect(contributor.converged.byteOffset).toBe(4);
    expect(contributor.iterationCount?.byteOffset).toBe(4);

    const diagonal = new GPURasterConnectedComponents({
      ...props,
      id: 'diagonal-islands',
      connectivity: 8,
      maximumIterations: 11
    });
    expect(diagonal.id).toBe('diagonal-islands');
    expect(diagonal.connectivity).toBe(8);
    expect(diagonal.maximumIterations).toBe(11);
  });

  test('rejects unstable dimensions, sparse-root overflow, connectivity, and round budgets', () => {
    const graph = makeRecordingGraph('component-dimensions');
    const props = makeProps(graph, 3, 2);
    for (const [width, height] of [
      [0, 2],
      [-1, 2],
      [1.5, 2],
      [3, 0],
      [Number.NaN, 2]
    ]) {
      expect(() => new GPURasterConnectedComponents({...props, width, height})).toThrow(
        /positive safe integers/
      );
    }
    expect(() => new GPURasterConnectedComponents({...props, width: 65536, height: 65536})).toThrow(
      /sparse component roots must fit in uint32/
    );
    for (const connectivity of [0, 1, 5, Number.NaN]) {
      expect(
        () => new GPURasterConnectedComponents({...props, connectivity: connectivity as never})
      ).toThrow(/four or eight/);
    }
    for (const maximumIterations of [0, -1, 1.5, 65, Number.NaN]) {
      expect(() => new GPURasterConnectedComponents({...props, maximumIterations})).toThrow(
        /one through 64/
      );
    }
    expect(
      new GPURasterConnectedComponents({...props, maximumIterations: 1}).maximumIterations
    ).toBe(1);
    expect(
      new GPURasterConnectedComponents({...props, maximumIterations: 64}).maximumIterations
    ).toBe(64);
  });

  test('requires exact uint32 foreground observations and identity source calibration', () => {
    const graph = makeRecordingGraph('component-source');
    const props = makeProps(graph, 3, 2);
    expect(
      () =>
        new GPURasterConnectedComponents({
          ...props,
          input: {
            ...props.input,
            format: 'float32',
            storage: {kind: 'buffer', values: makeView(graph, 'floating-mask', 'float32', 6)}
          } as never
        })
    ).toThrow(/uint32 foreground band/);
    expect(
      () =>
        new GPURasterConnectedComponents({
          ...props,
          input: {...props.input, storage: {kind: 'texture'} as never}
        })
    ).toThrow(/buffer-backed/);
    expect(
      () =>
        new GPURasterConnectedComponents({
          ...props,
          input: {
            ...props.input,
            storage: {kind: 'buffer', values: makeView(graph, 'short', 'uint32', 5)}
          }
        })
    ).toThrow(/one sample per pixel/);
    expect(
      () =>
        new GPURasterConnectedComponents({
          ...props,
          input: {...props.input, validity: makeView(graph, 'short-validity', 'uint32', 5)}
        })
    ).toThrow(/one flag per pixel/);
    for (const scale of [0, 0.5, 2, Number.NaN]) {
      expect(
        () => new GPURasterConnectedComponents({...props, input: {...props.input, scale}})
      ).toThrow(/identity input calibration/);
    }
    for (const offset of [-1, 1, Number.NaN]) {
      expect(
        () => new GPURasterConnectedComponents({...props, input: {...props.input, offset}})
      ).toThrow(/identity input calibration/);
    }
    const exact = new GPURasterConnectedComponents({
      ...props,
      input: {...props.input, noDataValue: 4294967295, scale: 1, offset: 0}
    });
    expect(exact.input.noDataValue).toBe(4294967295);
  });

  test('rejects malformed labels, observation validity, convergence, and optional round counts', () => {
    const graph = makeRecordingGraph('component-output-shape');
    const props = makeProps(graph, 3, 2);
    expect(
      () =>
        new GPURasterConnectedComponents({
          ...props,
          output: makeView(graph, 'floating-labels', 'float32', 6) as never
        })
    ).toThrow(/uint32/);
    expect(
      () =>
        new GPURasterConnectedComponents({
          ...props,
          output: makeView(graph, 'short-labels', 'uint32', 5)
        })
    ).toThrow(/one sample per pixel/);
    expect(
      () =>
        new GPURasterConnectedComponents({
          ...props,
          outputValidity: makeView(graph, 'short-output-validity', 'uint32', 5)
        })
    ).toThrow(/one flag per pixel/);
    expect(
      () =>
        new GPURasterConnectedComponents({
          ...props,
          converged: makeView(graph, 'long-status', 'uint32', 2)
        })
    ).toThrow(/one flag per pixel/);
    expect(
      () =>
        new GPURasterConnectedComponents({
          ...props,
          iterationCount: makeView(graph, 'floating-rounds', 'float32', 1) as never
        })
    ).toThrow(/uint32/);
  });

  test('preserves distinct foreground/background masks and rejects foreign or aliased buffers', () => {
    const graph = makeRecordingGraph('component-ownership');
    const foreign = makeRecordingGraph('foreign-components');
    const props = makeProps(graph, 3, 2);
    expect(
      () =>
        new GPURasterConnectedComponents({
          ...props,
          converged: makeView(foreign, 'foreign-convergence', 'uint32', 1)
        })
    ).toThrow(/same graph/);
    expect(
      () => new GPURasterConnectedComponents({...props, output: props.input.storage.values})
    ).toThrow(/separate buffers/);
    expect(
      () => new GPURasterConnectedComponents({...props, outputValidity: props.input.validity!})
    ).toThrow(/separate buffers/);
    expect(
      () => new GPURasterConnectedComponents({...props, iterationCount: props.converged})
    ).toThrow(/separate buffers/);
    expect(
      () =>
        new GPURasterConnectedComponents({
          ...props,
          input: {...props.input, validity: props.input.storage.values}
        })
    ).toThrow(/separate buffers/);
  });
});

describe('GPURasterConnectedComponents graph composition', () => {
  test('allocates bounded atomic parent/change/indirect scratch and declares every ordered round', () => {
    const graph = makeRecordingGraph('component-round-plan');
    const contributor = new GPURasterConnectedComponents({
      ...makeProps(graph, 3, 2, 4),
      id: 'deterministic-regions',
      connectivity: 8,
      maximumIterations: 3
    });
    contributor.addToGraph(graph);

    expect(graph.passes.map(pass => pass.id)).toEqual([
      'deterministic-regions-initialize',
      'deterministic-regions-hook-0',
      'deterministic-regions-compress-0',
      'deterministic-regions-convergence-0',
      'deterministic-regions-hook-1',
      'deterministic-regions-compress-1',
      'deterministic-regions-convergence-1',
      'deterministic-regions-hook-2',
      'deterministic-regions-compress-2',
      'deterministic-regions-convergence-2',
      'deterministic-regions-publish'
    ]);
    expect(graph.transientBuffers.map(buffer => [buffer.id, buffer.byteLength])).toEqual([
      ['deterministic-regions-parents', 24],
      ['deterministic-regions-changed', 4],
      ['deterministic-regions-active-dispatch', 12]
    ]);
    expect(graph.transientBuffers.every(buffer => buffer.transient)).toBe(true);
    expect(graph.transientBuffers[2]?.usage).toBe(Buffer.STORAGE | Buffer.INDIRECT);
    expect(graph.passes[0]?.resources).toHaveLength(8);
    expect(graph.passes[0]?.resources?.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-write',
      'storage-write',
      'storage-write',
      'storage-write',
      'storage-write',
      'storage-read',
      'storage-write'
    ]);
    for (const iteration of [0, 1, 2]) {
      const hooking = graph.passes.find(
        pass => pass.id === `deterministic-regions-hook-${iteration}`
      );
      const compression = graph.passes.find(
        pass => pass.id === `deterministic-regions-compress-${iteration}`
      );
      expect(hooking?.resources?.at(-1)?.usage).toBe('indirect');
      expect(compression?.resources?.at(-1)?.usage).toBe('indirect');
      expect(hooking?.resources?.at(-1)?.buffer).toBe(graph.transientBuffers[2]);
      expect(compression?.resources?.at(-1)?.buffer).toBe(graph.transientBuffers[2]);
    }
    const publication = graph.passes.at(-1)!;
    expect(publication.resources?.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-read',
      'storage-write',
      'storage-read-write'
    ]);
    expect(
      graph.passes.every(
        pass => (pass.resources?.filter(resource => resource.usage !== 'indirect').length ?? 0) <= 8
      )
    ).toBe(true);
  });

  test('supports source bands without masks and omits optional iteration diagnostics cleanly', () => {
    const graph = makeRecordingGraph('component-minimal-bindings');
    const full = makeProps(graph, 1, 1);
    const {iterationCount: _iterationCount, ...props} = full;
    const {validity: _sourceValidity, ...input} = full.input;
    const contributor = new GPURasterConnectedComponents({
      ...props,
      input,
      maximumIterations: 1
    });
    contributor.addToGraph(graph);
    expect(contributor.iterationCount).toBeUndefined();
    expect(graph.passes).toHaveLength(5);
    expect(graph.passes[0]?.resources).toHaveLength(6);
    expect(graph.passes[3]?.resources).toHaveLength(3);
  });

  test('preflights WebGPU identity, eight storage bindings, aligned prefixes, and dispatch limits', () => {
    const notWebGPU = makeRecordingGraph('components-webgl', {}, 'webgl');
    expect(() =>
      new GPURasterConnectedComponents(makeProps(notWebGPU, 3, 2)).addToGraph(notWebGPU)
    ).toThrow(/WebGPU device/);

    const limitedBindings = makeRecordingGraph('components-binding-limit', {
      maxStorageBuffersPerShaderStage: 7
    });
    expect(() =>
      new GPURasterConnectedComponents(makeProps(limitedBindings, 3, 2)).addToGraph(limitedBindings)
    ).toThrow(/binding count/);

    const limitedStorage = makeRecordingGraph('components-storage-limit', {
      maxStorageBufferBindingSize: 27
    });
    expect(() =>
      new GPURasterConnectedComponents(makeProps(limitedStorage, 3, 2, 4)).addToGraph(
        limitedStorage
      )
    ).toThrow(/storage binding limit/);

    const limitedDispatch = makeRecordingGraph('components-dispatch-limit', {
      maxComputeWorkgroupsPerDimension: 1
    });
    expect(() =>
      new GPURasterConnectedComponents(makeProps(limitedDispatch, 9, 2)).addToGraph(limitedDispatch)
    ).toThrow(/dispatch limits/);

    const limitedWorkgroup = makeRecordingGraph('components-workgroup-limit', {
      maxComputeInvocationsPerWorkgroup: 32
    });
    expect(() =>
      new GPURasterConnectedComponents(makeProps(limitedWorkgroup, 3, 2)).addToGraph(
        limitedWorkgroup
      )
    ).toThrow(/workgroup limits/);
  });

  test('rejects target graphs different from every validated caller-owned input and output', () => {
    const owner = makeRecordingGraph('component-original-owner');
    const target = makeRecordingGraph('component-other-target');
    expect(() =>
      new GPURasterConnectedComponents(makeProps(owner, 3, 2)).addToGraph(target)
    ).toThrow(/target graph/);
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
): GPURasterConnectedComponentsProps {
  const pixelCount = width * height;
  return {
    width,
    height,
    input: {
      id: 'foreground',
      format: 'uint32',
      storage: {
        kind: 'buffer',
        values: makeView(graph, 'foreground', 'uint32', pixelCount, byteOffset)
      },
      validity: makeView(graph, 'observation-validity', 'uint32', pixelCount, byteOffset)
    } as GPURasterBufferBand<'uint32'>,
    output: makeView(graph, 'component-roots', 'uint32', pixelCount, byteOffset),
    outputValidity: makeView(graph, 'component-validity', 'uint32', pixelCount, byteOffset),
    converged: makeView(graph, 'component-converged', 'uint32', 1, byteOffset),
    iterationCount: makeView(graph, 'component-rounds', 'uint32', 1, byteOffset)
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
