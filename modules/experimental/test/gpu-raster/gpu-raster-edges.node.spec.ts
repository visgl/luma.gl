// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  GraphBufferHandle,
  GraphDataView,
  type GPUCommandGraph,
  type GPUCommandGraphComputeNode
} from '@luma.gl/experimental';
import {
  GPURasterGradient,
  GPURasterGradientMagnitude,
  GPURasterLaplacian,
  GPURasterScharr,
  GPURasterSobel,
  type GPURasterBufferBand,
  type GPURasterEdgeProps,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/gpu-raster';

type GraphOwner = GraphBufferHandle['graph'];
type RecordingGraph = GPUCommandGraph & {
  passes: GPUCommandGraphComputeNode[];
  transientHandles: GraphBufferHandle[];
};

describe('GPURaster signed derivative contracts', () => {
  test('exposes positive-rightward/downward raw Sobel and Scharr kernels', () => {
    const owner = {id: 'gradient-kernels'} as GraphOwner;
    const props = makeEdgeProps(owner);
    const horizontalSobel = new GPURasterGradient({
      ...props,
      operator: 'sobel',
      direction: 'x'
    });
    const verticalSobel = new GPURasterSobel({...props, direction: 'y'});
    const horizontalScharr = new GPURasterScharr({...props, direction: 'x'});
    const verticalScharr = new GPURasterGradient({
      ...props,
      operator: 'scharr',
      direction: 'y',
      scale: 0.25
    });

    expect(horizontalSobel.kernel).toEqual([-1, 0, 1, -2, 0, 2, -1, 0, 1]);
    expect(verticalSobel.kernel).toEqual([-1, -2, -1, 0, 0, 0, 1, 2, 1]);
    expect(horizontalScharr.kernel).toEqual([-3, 0, 3, -10, 0, 10, -3, 0, 3]);
    expect(verticalScharr.kernel).toEqual([-0.75, -2.5, -0.75, 0, 0, 0, 0.75, 2.5, 0.75]);
    expect(horizontalSobel.id).toBe('gpu-raster-gradient');
    expect(verticalSobel.id).toBe('gpu-raster-sobel');
    expect(horizontalScharr.id).toBe('gpu-raster-scharr');
    expect(horizontalSobel.requiredHalo).toBe(1);
    expect(horizontalSobel.scale).toBe(1);
    expect(verticalScharr.scale).toBe(0.25);
    expect(Object.isFrozen(horizontalSobel.kernel)).toBe(true);
  });

  test('exposes signed four- and eight-connected Laplacian impulse kernels', () => {
    const owner = {id: 'laplacian-kernels'} as GraphOwner;
    const props = makeEdgeProps(owner);
    const fourConnected = new GPURasterLaplacian(props);
    const eightConnected = new GPURasterLaplacian({
      ...props,
      connectivity: 8,
      scale: 0.5
    });

    expect(fourConnected.connectivity).toBe(4);
    expect(fourConnected.kernel).toEqual([0, 1, 0, 1, -4, 1, 0, 1, 0]);
    expect(eightConnected.connectivity).toBe(8);
    expect(eightConnected.kernel).toEqual([0.5, 0.5, 0.5, 0.5, -4, 0.5, 0.5, 0.5, 0.5]);
    expect(fourConnected.noDataPolicy).toBe('propagate');
    expect(fourConnected.normalize).toBe(false);
    expect(fourConnected.requiredHalo).toBe(1);
  });

  test('rejects unsupported operators, directions, connectivity, and unstable scales', () => {
    const owner = {id: 'gradient-validation'} as GraphOwner;
    const props = makeEdgeProps(owner);
    expect(
      () => new GPURasterGradient({...props, operator: 'prewitt' as never, direction: 'x'})
    ).toThrow(/operator/);
    expect(
      () => new GPURasterGradient({...props, operator: 'sobel', direction: 'z' as never})
    ).toThrow(/direction/);
    expect(() => new GPURasterLaplacian({...props, connectivity: 6 as never})).toThrow(
      /connectivity/
    );
    expect(() => new GPURasterGradientMagnitude({...props, operator: 'prewitt' as never})).toThrow(
      /operator/
    );

    for (const scale of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => new GPURasterSobel({...props, direction: 'x', scale})).toThrow(/scale/);
      expect(() => new GPURasterScharr({...props, direction: 'y', scale})).toThrow(/scale/);
      expect(() => new GPURasterLaplacian({...props, scale})).toThrow(/scale/);
      expect(() => new GPURasterGradientMagnitude({...props, scale})).toThrow(/scale/);
    }
    expect(() => new GPURasterSobel({...props, direction: 'x', scale: 1e-100})).toThrow(/float32/);
    expect(() => new GPURasterScharr({...props, direction: 'x', scale: 1e300})).toThrow(/float32/);
  });

  test('preserves raw nodata, calibration, offsets, borders, and strict non-aliasing', () => {
    const owner = {id: 'gradient-borrowed-contract'} as GraphOwner;
    const props = makeEdgeProps(owner, 'uint32', 4);
    const gradient = new GPURasterSobel({
      ...props,
      input: {
        ...props.input,
        noDataValue: 4294967295,
        scale: 0.5,
        offset: 2,
        validity: makeView(owner, 'input-validity', 'uint32', 9, 4)
      },
      direction: 'x',
      borderMode: 'constant',
      borderValue: 7,
      scale: 0.25
    });
    expect(gradient.input.noDataValue).toBe(4294967295);
    expect(gradient.input.scale).toBe(0.5);
    expect(gradient.input.offset).toBe(2);
    expect(gradient.input.storage.values.byteOffset).toBe(4);
    expect(gradient.output.byteOffset).toBe(4);
    expect(gradient.borderMode).toBe('constant');
    expect(gradient.borderValue).toBe(7);
    expect(gradient.noDataPolicy).toBe('propagate');
    expect(gradient.normalize).toBe(false);

    const foreignOwner = {id: 'foreign-gradient'} as GraphOwner;
    expect(
      () =>
        new GPURasterSobel({
          ...props,
          direction: 'x',
          output: makeView(foreignOwner, 'foreign-output', 'float32', 9)
        })
    ).toThrow(/same graph/);
    expect(
      () =>
        new GPURasterGradientMagnitude({
          ...props,
          output: props.input.storage.values as never
        })
    ).toThrow(/float32|separate buffers/);
    expect(
      () =>
        new GPURasterLaplacian({
          ...props,
          outputValidity: makeView(owner, 'short-validity', 'uint32', 8)
        })
    ).toThrow(/one flag per pixel/);
  });

  test('contributes one scratch-free signed neighborhood pass', () => {
    const graph = makeRecordingGraph('directional-graph');
    const props = makeEdgeProps(graph);
    new GPURasterScharr({
      ...props,
      id: 'signed-scharr',
      direction: 'y',
      input: {...props.input, validity: makeView(graph, 'source-validity', 'uint32', 9)}
    }).addToGraph(graph);

    expect(graph.passes.map(pass => pass.id)).toEqual(['signed-scharr']);
    expect(graph.transientHandles).toHaveLength(0);
    expect(graph.passes[0].resources.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-write',
      'storage-write',
      'storage-read'
    ]);
  });
});

describe('GPURasterGradientMagnitude graph composition', () => {
  test('declares two strict derivative passes and one six-binding stable magnitude pass', () => {
    const graph = makeRecordingGraph('magnitude-graph');
    const props = makeEdgeProps(graph);
    const contributor = new GPURasterGradientMagnitude({
      ...props,
      id: 'edge-strength',
      input: {...props.input, validity: makeView(graph, 'source-validity', 'uint32', 9)},
      operator: 'scharr',
      borderMode: 'reflect',
      scale: 0.125
    });
    contributor.addToGraph(graph);

    expect(contributor.operator).toBe('scharr');
    expect(contributor.borderMode).toBe('reflect');
    expect(contributor.requiredHalo).toBe(1);
    expect(contributor.scale).toBe(0.125);
    expect(graph.passes.map(pass => pass.id)).toEqual([
      'edge-strength-horizontal',
      'edge-strength-vertical',
      'edge-strength-magnitude'
    ]);
    expect(graph.transientHandles.map(handle => handle.id)).toEqual([
      'edge-strength-horizontal-values',
      'edge-strength-horizontal-validity',
      'edge-strength-vertical-values',
      'edge-strength-vertical-validity'
    ]);
    expect(graph.transientHandles.every(handle => handle.transient)).toBe(true);
    expect(graph.transientHandles.map(handle => handle.byteLength)).toEqual([36, 36, 36, 36]);
    expect(graph.passes[2].resources.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-read',
      'storage-read',
      'storage-read',
      'storage-write',
      'storage-write'
    ]);
    expect(new GPURasterGradientMagnitude(props).operator).toBe('sobel');
  });

  test('rejects foreign graphs and insufficient limits before allocating scratch', () => {
    const owner = makeRecordingGraph('magnitude-owner');
    const foreignGraph = makeRecordingGraph('magnitude-foreign');
    const contributor = new GPURasterGradientMagnitude(makeEdgeProps(owner));
    expect(() => contributor.addToGraph(foreignGraph)).toThrow(/target graph/);
    expect(foreignGraph.transientHandles).toHaveLength(0);

    const fewBindings = makeRecordingGraph('magnitude-few-bindings', {
      maxStorageBuffersPerShaderStage: 5
    });
    expect(() =>
      new GPURasterGradientMagnitude(makeEdgeProps(fewBindings)).addToGraph(fewBindings)
    ).toThrow(/binding count/);
    expect(fewBindings.transientHandles).toHaveLength(0);

    const smallWorkgroup = makeRecordingGraph('magnitude-small-workgroup', {
      maxComputeInvocationsPerWorkgroup: 32
    });
    expect(() =>
      new GPURasterGradientMagnitude(makeEdgeProps(smallWorkgroup)).addToGraph(smallWorkgroup)
    ).toThrow(/workgroup limits/);
    expect(smallWorkgroup.transientHandles).toHaveLength(0);

    const smallBinding = makeRecordingGraph('magnitude-small-binding', {
      maxStorageBufferBindingSize: 32
    });
    expect(() =>
      new GPURasterGradientMagnitude(makeEdgeProps(smallBinding)).addToGraph(smallBinding)
    ).toThrow(/storage binding limit/);
    expect(smallBinding.transientHandles).toHaveLength(0);
  });
});

function makeEdgeProps(
  owner: GraphOwner,
  format: GPURasterScalarFormat = 'float32',
  byteOffset = 0
): GPURasterEdgeProps {
  return {
    width: 3,
    height: 3,
    input: {
      id: 'input',
      format,
      storage: {kind: 'buffer', values: makeView(owner, 'input', format, 9, byteOffset)}
    } as GPURasterBufferBand,
    output: makeView(owner, 'output', 'float32', 9, byteOffset),
    outputValidity: makeView(owner, 'output-validity', 'uint32', 9, byteOffset)
  };
}

function makeRecordingGraph(
  id: string,
  limitOverrides: Partial<GPUCommandGraph['device']['limits']> = {}
): RecordingGraph {
  const passes: GPUCommandGraphComputeNode[] = [];
  const transientHandles: GraphBufferHandle[] = [];
  const graph = {
    id,
    device: {
      limits: {
        maxComputeInvocationsPerWorkgroup: 256,
        maxComputeWorkgroupSizeX: 256,
        maxComputeWorkgroupSizeY: 256,
        maxComputeWorkgroupsPerDimension: 65535,
        maxComputeWorkgroupStorageSize: 16384,
        maxStorageBuffersPerShaderStage: 8,
        maxStorageBufferBindingSize: 134217728,
        ...limitOverrides
      }
    },
    passes,
    transientHandles,
    addComputePass(pass: GPUCommandGraphComputeNode): void {
      passes.push(pass);
    },
    createTransientBuffer(descriptor: {
      id: string;
      byteLength: number;
      usage: number;
    }): GraphBufferHandle {
      const handle = new GraphBufferHandle(graph as unknown as GraphOwner, descriptor, true);
      transientHandles.push(handle);
      return handle;
    },
    createDataView<Format extends GPURasterScalarFormat>(
      buffer: GraphBufferHandle,
      props: {format: Format; length: number}
    ): GraphDataView<Format> {
      return new GraphDataView(buffer, {
        format: props.format,
        length: props.length,
        byteOffset: 0,
        byteStride: 4,
        rowByteLength: 4
      });
    }
  };
  return graph as unknown as RecordingGraph;
}

function makeView<Format extends GPURasterScalarFormat>(
  owner: GraphOwner,
  id: string,
  format: Format,
  length: number,
  byteOffset = 0
): GraphDataView<Format> {
  const buffer = new GraphBufferHandle(
    owner,
    {id, byteLength: Math.max(length, 1) * 4 + byteOffset, usage: 0},
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
