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
  GPURasterContrast,
  type GPURasterBufferBand,
  type GPURasterContrastMode,
  type GPURasterContrastProps,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/gpu-raster';

type GraphOwner = GraphBufferHandle['graph'];
type RecordingGraph = GPUCommandGraph & {passes: GPUCommandGraphComputeNode[]};

describe('GPURasterContrast contributor validation', () => {
  test('preserves calibrated domains, exact source nodata, and explicit transform policy', () => {
    const owner = {id: 'raster-contrast-options'};
    const props = makeContrastProps(owner);
    const contributor = new GPURasterContrast({
      ...props,
      input: {
        ...makeBand(owner, 'unsigned-source', 'uint32', 6),
        scale: 0.001,
        offset: -1,
        noDataValue: 4294967295
      },
      domain: [-1, 1],
      contrast: 1.75,
      gamma: 2.2,
      mode: 'gamma'
    });

    expect(contributor.id).toBe('gpu-raster-contrast');
    expect(contributor.domain).toEqual([-1, 1]);
    expect(contributor.contrast).toBe(1.75);
    expect(contributor.gamma).toBe(2.2);
    expect(contributor.mode).toBe('gamma');
    expect(contributor.input.noDataValue).toBe(4294967295);
    expect(new GPURasterContrast(props).domain).toEqual([0, 1]);
  });

  test('rejects unsupported grids, transform modes, and unsafe numeric controls', () => {
    const owner = {id: 'raster-contrast-invalid-options'};
    const props = makeContrastProps(owner);

    for (const dimensions of [
      {width: 0, height: 2},
      {width: 1.5, height: 2},
      {width: 3, height: -1}
    ]) {
      expect(() => new GPURasterContrast({...props, ...dimensions})).toThrow(/positive integers/);
    }
    expect(() => new GPURasterContrast({...props, width: 65536, height: 65536})).toThrow(
      /fit in uint32/
    );
    expect(
      () => new GPURasterContrast({...props, mode: 'logarithmic' as GPURasterContrastMode})
    ).toThrow(/not supported/);
    for (const contrast of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => new GPURasterContrast({...props, contrast})).toThrow(/contrast/);
    }
    for (const gamma of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.MIN_VALUE, 1e-40]) {
      expect(() => new GPURasterContrast({...props, gamma})).toThrow(/gamma/);
    }
    expect(() => new GPURasterContrast({...props, contrast: Number.MAX_VALUE})).toThrow(
      /finite float32/
    );
  });

  test('requires increasing float32 domains and graph-owned two-row GPU ranges', () => {
    const owner = {id: 'raster-contrast-domains'};
    const foreignOwner = {id: 'foreign-raster-contrast-domain'};
    const props = makeContrastProps(owner);

    for (const domain of [
      [1, 0],
      [1, 1],
      [Number.NaN, 1],
      [0, Number.POSITIVE_INFINITY]
    ] as Array<[number, number]>) {
      expect(() => new GPURasterContrast({...props, domain})).toThrow(/domain/);
    }
    expect(() => new GPURasterContrast({...props, domain: [1, 1 + Number.EPSILON]})).toThrow(
      /domain width/
    );
    expect(() => new GPURasterContrast({...props, domain: [-3e38, 3e38]})).toThrow(/domain width/);
    expect(
      () => new GPURasterContrast({...props, domain: makeView(owner, 'short-domain', 'float32', 1)})
    ).toThrow(/exactly two/);
    expect(
      () =>
        new GPURasterContrast({
          ...props,
          domain: makeView(foreignOwner, 'foreign-domain', 'float32', 2)
        })
    ).toThrow(/same graph/);
    expect(
      new GPURasterContrast({...props, domain: makeView(owner, 'gpu-domain', 'float32', 2)}).domain
    ).toBeInstanceOf(GraphDataView);
  });

  test('requires caller-owned nonaliasing outputs and explicit equalization histograms', () => {
    const owner = {id: 'raster-contrast-layout'};
    const foreignOwner = {id: 'foreign-raster-contrast-layout'};
    const props = makeContrastProps(owner);
    const histogram = makeView(owner, 'histogram', 'uint32', 8);

    expect(
      () => new GPURasterContrast({...props, output: makeView(owner, 'short-output', 'float32', 5)})
    ).toThrow(/one sample per pixel/);
    expect(
      () =>
        new GPURasterContrast({
          ...props,
          outputValidity: makeView(owner, 'short-validity', 'uint32', 5)
        })
    ).toThrow(/one flag per pixel/);
    expect(
      () =>
        new GPURasterContrast({
          ...props,
          output: makeView(foreignOwner, 'foreign-output', 'float32', 6)
        })
    ).toThrow(/same graph/);
    expect(
      () =>
        new GPURasterContrast({
          ...props,
          input: {...props.input, validity: props.outputValidity}
        })
    ).toThrow(/separate buffers/);
    expect(() => new GPURasterContrast({...props, mode: 'equalize'})).toThrow(/requires histogram/);
    expect(() => new GPURasterContrast({...props, histogram})).toThrow(/require equalize mode/);
    expect(
      () =>
        new GPURasterContrast({
          ...props,
          mode: 'equalize',
          histogram: makeView(owner, 'empty-histogram', 'uint32', 0)
        })
    ).toThrow(/positive bin count/);
    expect(new GPURasterContrast({...props, mode: 'equalize', histogram}).histogram).toBe(
      histogram
    );
  });

  test('declares source, validity, dynamic domain, and destination graph hazards', () => {
    const graph = makeRecordingGraph('raster-contrast-hazards');
    const props = makeContrastProps(graph);
    const contributor = new GPURasterContrast({
      ...props,
      input: {...props.input, validity: makeView(graph, 'source-validity', 'uint32', 6)},
      domain: makeView(graph, 'domain', 'float32', 2)
    });

    contributor.addToGraph(graph);

    expect(graph.passes).toHaveLength(1);
    expect(graph.passes[0].id).toBe(contributor.id);
    expect(graph.passes[0].resources.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-write',
      'storage-write',
      'storage-read',
      'storage-read'
    ]);
  });

  test('rejects nonportable workgroups and storage bindings before graph compilation', () => {
    const smallWorkgroupGraph = makeRecordingGraph('raster-contrast-small-workgroup', {
      maxComputeInvocationsPerWorkgroup: 32
    });
    expect(() =>
      new GPURasterContrast(makeContrastProps(smallWorkgroupGraph)).addToGraph(smallWorkgroupGraph)
    ).toThrow(/workgroup limits/);

    const smallBindingGraph = makeRecordingGraph('raster-contrast-small-binding', {
      maxStorageBufferBindingSize: 20
    });
    expect(() =>
      new GPURasterContrast(makeContrastProps(smallBindingGraph)).addToGraph(smallBindingGraph)
    ).toThrow(/storage binding limit/);
  });
});

function makeContrastProps(owner: GraphOwner): GPURasterContrastProps {
  return {
    width: 3,
    height: 2,
    input: makeBand(owner, 'source', 'float32', 6),
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
