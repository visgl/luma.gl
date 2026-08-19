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
  GPURasterBandMath,
  GPURasterNDVI,
  type GPURasterBandMathOperation,
  type GPURasterBandMathProps,
  type GPURasterBufferBand,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/gpu-raster';

type GraphOwner = GraphBufferHandle['graph'];
type RecordingGraph = GPUCommandGraph & {passes: GPUCommandGraphComputeNode[]};

describe('GPURasterBandMath contributor validation', () => {
  test('accepts every operation and preserves independent source calibration', () => {
    const owner = {id: 'band-math-operations'};
    const operations: GPURasterBandMathOperation[] = [
      'add',
      'subtract',
      'multiply',
      'divide',
      'normalized-difference'
    ];

    for (const operation of operations) {
      const props = makeBandMathProps(owner, operation);
      const contributor = new GPURasterBandMath({
        ...props,
        left: {...props.left, scale: 0.5, offset: 10},
        right: {...props.right, scale: 2, offset: -3}
      });

      expect(contributor.operation).toBe(operation);
      expect(contributor.left.scale).toBe(0.5);
      expect(contributor.right.offset).toBe(-3);
      expect(contributor.epsilon).toBe(0);
      expect(contributor.clamp).toBeUndefined();
    }
  });

  test('retains exact native integer nodata and explicit epsilon/clamp policies', () => {
    const owner = {id: 'band-math-policies'};
    const props = makeBandMathProps(owner, 'divide');
    const contributor = new GPURasterBandMath({
      ...props,
      left: {...makeBand(owner, 'maximum', 'uint32', 6), noDataValue: 4294967295},
      right: {...makeBand(owner, 'minimum', 'sint32', 6), noDataValue: -2147483648},
      epsilon: 0.001,
      clamp: [-1, 1]
    });

    expect(contributor.left.noDataValue).toBe(4294967295);
    expect(contributor.right.noDataValue).toBe(-2147483648);
    expect(contributor.epsilon).toBe(0.001);
    expect(contributor.clamp).toEqual([-1, 1]);
  });

  test('rejects invalid grids, unsupported operations, and unstable numeric options', () => {
    const owner = {id: 'band-math-options'};
    const props = makeBandMathProps(owner);
    for (const dimensions of [
      {width: 0, height: 2},
      {width: 1.5, height: 2},
      {width: 3, height: -1}
    ]) {
      expect(() => new GPURasterBandMath({...props, ...dimensions})).toThrow(/positive integers/);
    }
    expect(() => new GPURasterBandMath({...props, width: 65536, height: 65536})).toThrow(
      /fit in uint32/
    );
    expect(
      () =>
        new GPURasterBandMath({
          ...props,
          operation: 'modulo' as GPURasterBandMathOperation
        })
    ).toThrow(/not supported/);
    for (const epsilon of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => new GPURasterBandMath({...props, epsilon})).toThrow(/epsilon/);
    }
    for (const clamp of [
      [1, -1],
      [Number.NaN, 1],
      [0, Number.POSITIVE_INFINITY]
    ] as Array<[number, number]>) {
      expect(() => new GPURasterBandMath({...props, clamp})).toThrow(/clamp/);
    }
    expect(() => new GPURasterBandMath({...props, epsilon: Number.MAX_VALUE})).toThrow(
      /finite float32/
    );
    expect(
      () => new GPURasterBandMath({...props, left: {...props.left, scale: Number.MAX_VALUE}})
    ).toThrow(/finite float32/);
  });

  test('requires packed source-aligned destinations on one graph', () => {
    const owner = {id: 'band-math-layout'};
    const foreignOwner = {id: 'foreign-band-math-layout'};
    const props = makeBandMathProps(owner);

    expect(
      () =>
        new GPURasterBandMath({...props, right: makeBand(foreignOwner, 'foreign', 'float32', 6)})
    ).toThrow(/same graph/);
    expect(
      () =>
        new GPURasterBandMath({...props, output: makeView(foreignOwner, 'output', 'float32', 6)})
    ).toThrow(/same graph/);
    expect(
      () => new GPURasterBandMath({...props, output: makeView(owner, 'short-output', 'float32', 5)})
    ).toThrow(/one sample per pixel/);
    expect(
      () =>
        new GPURasterBandMath({
          ...props,
          outputValidity: makeView(owner, 'short-validity', 'uint32', 5)
        })
    ).toThrow(/one flag per pixel/);
  });

  test('rejects output aliases while retaining shared read-only sources and masks', () => {
    const owner = {id: 'band-math-aliases'};
    const props = makeBandMathProps(owner);
    const aliasedValidity = new GraphDataView(props.output.buffer, {
      format: 'uint32',
      length: 6,
      byteOffset: 0,
      byteStride: 4,
      rowByteLength: 4
    });

    expect(() => new GPURasterBandMath({...props, outputValidity: aliasedValidity})).toThrow(
      /separate buffers/
    );
    expect(
      () =>
        new GPURasterBandMath({
          ...props,
          left: {...props.left, validity: props.outputValidity}
        })
    ).toThrow(/separate buffers/);

    const sharedValidity = makeView(owner, 'shared-validity', 'uint32', 6);
    const sharedSource = {...props.left, validity: sharedValidity};
    expect(new GPURasterBandMath({...props, left: sharedSource, right: sharedSource}).left).toBe(
      sharedSource
    );
  });

  test('declares all graph hazards without encoding or submitting commands', () => {
    const graph = makeRecordingGraph('band-math-graph');
    const props = makeBandMathProps(graph, 'normalized-difference');
    const contributor = new GPURasterBandMath({
      ...props,
      left: {...props.left, validity: makeView(graph, 'left-validity', 'uint32', 6)},
      right: {...props.right, validity: makeView(graph, 'right-validity', 'uint32', 6)}
    });

    contributor.addToGraph(graph);

    expect(graph.passes).toHaveLength(1);
    expect(graph.passes[0].id).toBe(contributor.id);
    expect(graph.passes[0].resources.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-read',
      'storage-write',
      'storage-write',
      'storage-read',
      'storage-read'
    ]);
  });

  test('rejects unsupported portable workgroups and oversized aligned storage bindings', () => {
    const smallWorkgroupGraph = makeRecordingGraph('small-workgroups', {
      maxComputeInvocationsPerWorkgroup: 32
    });
    expect(() =>
      new GPURasterBandMath(makeBandMathProps(smallWorkgroupGraph)).addToGraph(smallWorkgroupGraph)
    ).toThrow(/workgroup limits/);

    const smallBindingGraph = makeRecordingGraph('small-bindings', {
      maxStorageBufferBindingSize: 20
    });
    expect(() =>
      new GPURasterBandMath(makeBandMathProps(smallBindingGraph)).addToGraph(smallBindingGraph)
    ).toThrow(/storage binding limit/);
  });
});

describe('GPURasterNDVI contributor validation', () => {
  test('retains named inputs and delegates calibrated normalized differences to band math', () => {
    const owner = {id: 'ndvi-contract'};
    const props = makeBandMathProps(owner);
    const nearInfrared = {...props.left, scale: 0.002, noDataValue: Number.NaN};
    const red = {...props.right, scale: 0.001};
    const contributor = new GPURasterNDVI({
      width: 3,
      height: 2,
      nearInfrared,
      red,
      output: props.output,
      outputValidity: props.outputValidity,
      epsilon: 0.0001
    });

    expect(contributor.id).toBe('gpu-raster-ndvi');
    expect(contributor.nearInfrared).toBe(nearInfrared);
    expect(contributor.red).toBe(red);
    expect(contributor.epsilon).toBe(0.0001);
    expect(contributor.clamp).toBeUndefined();
    expect(
      () =>
        new GPURasterNDVI({
          width: 3,
          height: 2,
          nearInfrared,
          red,
          output: props.output,
          outputValidity: props.outputValidity,
          epsilon: -1
        })
    ).toThrow(/epsilon/);
  });
});

function makeBandMathProps(
  owner: GraphOwner,
  operation: GPURasterBandMathOperation = 'add'
): GPURasterBandMathProps {
  return {
    width: 3,
    height: 2,
    left: makeBand(owner, 'left', 'float32', 6),
    right: makeBand(owner, 'right', 'float32', 6),
    operation,
    output: makeView(owner, 'output', 'float32', 6),
    outputValidity: makeView(owner, 'output-validity', 'uint32', 6)
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
