// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  GraphBufferHandle,
  GraphDataView,
  type GPUCommandGraph,
  type GPUCommandGraphComputeNode
} from '@luma.gl/gpgpu/gpu-core';
import {
  GPURasterBoxBlur,
  GPURasterConvolution,
  GPURasterGaussianBlur,
  GPURasterNeighborhood,
  type GPURasterBorderMode,
  type GPURasterBufferBand,
  type GPURasterNeighborhoodProps,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/gpu-raster';

type GraphOwner = GraphBufferHandle['graph'];
type RecordingGraph = GPUCommandGraph & {
  passes: GPUCommandGraphComputeNode[];
  transientHandles: GraphBufferHandle[];
};

describe('GPURasterNeighborhood portable stencil contract', () => {
  test('retains immutable anisotropic kernels, explicit halo, and exact raw calibration', () => {
    const owner = {id: 'neighborhood-contract'} as GraphOwner;
    const coefficients = [0.25, 0.5, 0.25];
    const props = makeNeighborhoodProps(owner);
    const contributor = new GPURasterNeighborhood({
      ...props,
      input: {
        ...makeBand(owner, 'integer-input', 'uint32', 9),
        noDataValue: 4294967295,
        scale: 0.5,
        offset: 2
      },
      radius: [1, 0],
      kernel: coefficients,
      borderMode: 'reflect',
      noDataPolicy: 'ignore-renormalize',
      normalize: true
    });
    coefficients[0] = 99;

    expect(contributor.horizontalRadius).toBe(1);
    expect(contributor.verticalRadius).toBe(0);
    expect(contributor.requiredHalo).toBe(1);
    expect(contributor.kernel).toEqual([0.25, 0.5, 0.25]);
    expect(Object.isFrozen(contributor.kernel)).toBe(true);
    expect(contributor.input.noDataValue).toBe(4294967295);
    expect(contributor.input.scale).toBe(0.5);
    expect(contributor.input.offset).toBe(2);
  });

  test('accepts every explicit border mode and radius zero', () => {
    const owner = {id: 'neighborhood-border-modes'} as GraphOwner;
    const modes: GPURasterBorderMode[] = ['clamp', 'reflect', 'constant', 'nodata'];
    for (const borderMode of modes) {
      const contributor = new GPURasterNeighborhood({
        ...makeNeighborhoodProps(owner),
        radius: 0,
        kernel: [1],
        borderMode,
        borderValue: 7
      });
      expect(contributor.borderMode).toBe(borderMode);
      expect(contributor.borderValue).toBe(7);
      expect(contributor.requiredHalo).toBe(0);
    }
    const defaults = new GPURasterNeighborhood(makeNeighborhoodProps(owner));
    expect(defaults.borderMode).toBe('clamp');
    expect(defaults.borderValue).toBe(0);
    expect(defaults.noDataPolicy).toBe('propagate');
    expect(defaults.normalize).toBe(false);
  });

  test('rejects invalid grids, radii, kernel shape, and unstable coefficients', () => {
    const owner = {id: 'neighborhood-validation'} as GraphOwner;
    const props = makeNeighborhoodProps(owner);
    for (const dimensions of [
      {width: 0, height: 3},
      {width: 3.5, height: 3},
      {width: 3, height: -1}
    ]) {
      expect(() => new GPURasterNeighborhood({...props, ...dimensions})).toThrow(/positive/);
    }
    expect(() => new GPURasterNeighborhood({...props, width: 65536, height: 65536})).toThrow(
      /fit in uint32/
    );
    for (const radius of [-1, 1.5, 9, [1, -1], [0, 9], [1]] as never[]) {
      expect(() => new GPURasterNeighborhood({...props, radius})).toThrow(/radii/);
    }
    expect(() => new GPURasterNeighborhood({...props, kernel: [1]})).toThrow(/one coefficient/);
    expect(
      () => new GPURasterNeighborhood({...props, kernel: [1, 2, 3, 4, Number.NaN, 6, 7, 8, 9]})
    ).toThrow(/finite/);
    expect(
      () => new GPURasterNeighborhood({...props, kernel: Array.from({length: 9}, () => 1e300)})
    ).toThrow(/finite float32/);
    expect(() => new GPURasterNeighborhood({...props, borderMode: 'wrap' as never})).toThrow(
      /border mode/
    );
    expect(() => new GPURasterNeighborhood({...props, borderValue: Number.NaN})).toThrow(
      /border value/
    );
    expect(() => new GPURasterNeighborhood({...props, noDataPolicy: 'skip' as never})).toThrow(
      /nodata policy/
    );
    expect(() => new GPURasterNeighborhood({...props, normalize: 1 as never})).toThrow(/boolean/);
  });

  test('keeps signed kernels explicit and rejects invalid missing-sample renormalization', () => {
    const owner = {id: 'neighborhood-signed-kernel'} as GraphOwner;
    const props = makeNeighborhoodProps(owner);
    const signedKernel = [0, -1, 0, -1, 4, -1, 0, -1, 0];
    expect(new GPURasterNeighborhood({...props, kernel: signedKernel}).kernel).toEqual(
      signedKernel
    );
    expect(
      () =>
        new GPURasterNeighborhood({
          ...props,
          kernel: signedKernel,
          noDataPolicy: 'ignore-renormalize'
        })
    ).toThrow(/nonnegative/);
    expect(
      () => new GPURasterNeighborhood({...props, kernel: signedKernel, normalize: true})
    ).toThrow(/nonzero/);
    expect(
      () =>
        new GPURasterNeighborhood({
          ...props,
          kernel: Array.from({length: 9}, () => 0),
          noDataPolicy: 'ignore-renormalize'
        })
    ).toThrow(/nonzero/);
  });

  test('requires one graph, packed complete views, and nonaliased writable resources', () => {
    const owner = {id: 'neighborhood-layout'} as GraphOwner;
    const foreignOwner = {id: 'foreign-neighborhood'} as GraphOwner;
    const props = makeNeighborhoodProps(owner);

    expect(
      () =>
        new GPURasterNeighborhood({
          ...props,
          output: makeView(foreignOwner, 'foreign-output', 'float32', 9)
        })
    ).toThrow(/same graph/);
    expect(
      () =>
        new GPURasterNeighborhood({
          ...props,
          output: makeView(owner, 'short-output', 'float32', 8)
        })
    ).toThrow(/one sample per pixel/);
    expect(
      () =>
        new GPURasterNeighborhood({
          ...props,
          outputValidity: makeView(owner, 'short-validity', 'uint32', 8)
        })
    ).toThrow(/one flag per pixel/);
    expect(
      () => new GPURasterNeighborhood({...props, output: props.input.storage.values as never})
    ).toThrow(/separate buffers/);
    expect(
      () =>
        new GPURasterNeighborhood({
          ...props,
          input: {...props.input, validity: props.outputValidity}
        })
    ).toThrow(/separate buffers/);
  });

  test('declares every borrowed hazard and rejects unsupported device capabilities', () => {
    const graph = makeRecordingGraph('neighborhood-hazards');
    const props = makeNeighborhoodProps(graph);
    new GPURasterNeighborhood({
      ...props,
      input: {...props.input, validity: makeView(graph, 'input-validity', 'uint32', 9)}
    }).addToGraph(graph);
    expect(graph.passes).toHaveLength(1);
    expect(graph.passes[0].resources.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-write',
      'storage-write',
      'storage-read'
    ]);

    const storageGraph = makeRecordingGraph('neighborhood-small-local-storage', {
      maxComputeWorkgroupStorageSize: 64
    });
    expect(() =>
      new GPURasterNeighborhood(makeNeighborhoodProps(storageGraph)).addToGraph(storageGraph)
    ).toThrow(/workgroup storage/);

    const bindingGraph = makeRecordingGraph('neighborhood-few-bindings', {
      maxStorageBuffersPerShaderStage: 2
    });
    expect(() =>
      new GPURasterNeighborhood(makeNeighborhoodProps(bindingGraph)).addToGraph(bindingGraph)
    ).toThrow(/binding count/);

    const workgroupGraph = makeRecordingGraph('neighborhood-small-workgroups', {
      maxComputeInvocationsPerWorkgroup: 32
    });
    expect(() =>
      new GPURasterNeighborhood(makeNeighborhoodProps(workgroupGraph)).addToGraph(workgroupGraph)
    ).toThrow(/workgroup limits/);

    const capacityGraph = makeRecordingGraph('neighborhood-small-binding', {
      maxStorageBufferBindingSize: 32
    });
    expect(() =>
      new GPURasterNeighborhood(makeNeighborhoodProps(capacityGraph)).addToGraph(capacityGraph)
    ).toThrow(/storage binding limit/);
  });
});

describe('GPURasterConvolution and separable smoothing contracts', () => {
  test('infers square kernels and accepts explicit odd rectangular signed kernels', () => {
    const owner = {id: 'convolution-kernel-shape'} as GraphOwner;
    const props = makeNeighborhoodProps(owner);
    const square = new GPURasterConvolution(props);
    expect(square.kernelWidth).toBe(3);
    expect(square.kernelHeight).toBe(3);
    expect(square.horizontalRadius).toBe(1);
    expect(square.verticalRadius).toBe(1);

    const rectangular = new GPURasterConvolution({
      ...props,
      kernel: [-1, 0, 1],
      kernelWidth: 3,
      kernelHeight: 1
    });
    expect(rectangular.kernel).toEqual([-1, 0, 1]);
    expect(rectangular.horizontalRadius).toBe(1);
    expect(rectangular.verticalRadius).toBe(0);
    expect(
      () => new GPURasterConvolution({...props, kernel: [1, 1], kernelWidth: 2, kernelHeight: 1})
    ).toThrow(/odd/);
    expect(() => new GPURasterConvolution({...props, kernel: [1, 2, 3]})).toThrow(/odd/);
    expect(() => new GPURasterConvolution({...props, kernelWidth: 1, kernelHeight: 5})).toThrow(
      /odd/
    );
  });

  test('validates Gaussian sigma and preserves normalized box and Gaussian defaults', () => {
    const owner = {id: 'smoothing-options'} as GraphOwner;
    const props = makeNeighborhoodProps(owner);
    const box = new GPURasterBoxBlur({...props, radius: 2});
    expect(box.kernel).toEqual([1, 1, 1, 1, 1]);
    expect(box.requiredHalo).toBe(2);

    const gaussian = new GPURasterGaussianBlur({...props, radius: 3});
    expect(gaussian.sigma).toBe(1.5);
    expect(gaussian.kernel).toHaveLength(7);
    expect(gaussian.kernel[0]).toBeCloseTo(gaussian.kernel[6], 6);
    expect(gaussian.kernel[3]).toBe(1);
    expect(new GPURasterGaussianBlur({...props, radius: 0}).sigma).toBe(0.5);

    for (const radius of [-1, 1.5, 9, Number.NaN]) {
      expect(() => new GPURasterBoxBlur({...props, radius})).toThrow(/radius/);
      expect(() => new GPURasterGaussianBlur({...props, radius})).toThrow(/radius/);
    }
    for (const sigma of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => new GPURasterGaussianBlur({...props, radius: 1, sigma})).toThrow(/sigma/);
    }
  });

  test('declares two ordered separable passes and graph-owned sample/validity scratch', () => {
    const graph = makeRecordingGraph('smoothing-ping-pong');
    const props = makeNeighborhoodProps(graph);
    new GPURasterGaussianBlur({
      ...props,
      id: 'smoothing',
      radius: 2,
      noDataPolicy: 'ignore-renormalize'
    }).addToGraph(graph);

    expect(graph.passes.map(pass => pass.id)).toEqual([
      'smoothing-horizontal',
      'smoothing-vertical'
    ]);
    expect(graph.transientHandles.map(handle => handle.id)).toEqual([
      'smoothing-intermediate-values',
      'smoothing-intermediate-validity'
    ]);
    expect(graph.transientHandles.every(handle => handle.transient)).toBe(true);
    expect(graph.passes[0].resources.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-write',
      'storage-write'
    ]);
    expect(graph.passes[1].resources.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-write',
      'storage-write',
      'storage-read'
    ]);
  });

  test('uses one scratch-free calibration pass when the smoothing radius is zero', () => {
    const graph = makeRecordingGraph('smoothing-radius-zero');
    new GPURasterBoxBlur({...makeNeighborhoodProps(graph), id: 'identity', radius: 0}).addToGraph(
      graph
    );
    expect(graph.passes.map(pass => pass.id)).toEqual(['identity']);
    expect(graph.transientHandles).toHaveLength(0);
  });
});

function makeNeighborhoodProps(owner: GraphOwner): GPURasterNeighborhoodProps {
  return {
    width: 3,
    height: 3,
    input: makeBand(owner, 'input', 'float32', 9),
    output: makeView(owner, 'output', 'float32', 9),
    outputValidity: makeView(owner, 'output-validity', 'uint32', 9),
    radius: 1,
    kernel: Array.from({length: 9}, () => 1)
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
