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
  GPURasterClosing,
  GPURasterDilation,
  GPURasterErosion,
  GPURasterMorphology,
  GPURasterOpening,
  type GPURasterBinaryMorphologyProps,
  type GPURasterBufferBand,
  type GPURasterGrayscaleMorphologyProps,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/luraster';

type GraphOwner = GraphBufferHandle['graph'];
type RecordingGraph = GPUCommandGraph & {
  passes: GPUCommandGraphComputeNode[];
  transientHandles: GraphBufferHandle[];
};

describe('GPURasterMorphology binary and grayscale contracts', () => {
  test('exposes explicit binary/grayscale modes, square/cross footprints, and stable defaults', () => {
    const owner = {id: 'morphology-defaults'} as GraphOwner;
    const grayscale = new GPURasterMorphology({
      ...makeGrayscaleProps(owner),
      operation: 'dilate'
    });
    const binary = new GPURasterErosion({
      ...makeBinaryProps(owner),
      radius: 2,
      structuringElement: 'cross',
      borderMode: 'constant',
      borderValue: -5,
      noDataPolicy: 'ignore'
    });

    expect(grayscale.id).toBe('gpu-raster-morphology');
    expect(grayscale.mode).toBe('grayscale');
    expect(grayscale.operation).toBe('dilate');
    expect(grayscale.radius).toBe(1);
    expect(grayscale.requiredHalo).toBe(1);
    expect(grayscale.structuringElement).toBe('square');
    expect(grayscale.borderMode).toBe('clamp');
    expect(grayscale.borderValue).toBe(0);
    expect(grayscale.noDataPolicy).toBe('propagate');
    expect(binary.id).toBe('gpu-raster-erosion');
    expect(binary.mode).toBe('binary');
    expect(binary.operation).toBe('erode');
    expect(binary.requiredHalo).toBe(2);
    expect(binary.structuringElement).toBe('cross');
    expect(binary.borderValue).toBe(-5);
    expect(binary.noDataPolicy).toBe('ignore');
    expect(new GPURasterDilation(makeGrayscaleProps(owner)).id).toBe('gpu-raster-dilation');
  });

  test('rejects unstable dimensions, modes, operations, radii, footprints, and policies', () => {
    const owner = {id: 'morphology-validation'} as GraphOwner;
    const props = makeGrayscaleProps(owner);
    for (const dimensions of [
      {width: 0, height: 3},
      {width: 1.5, height: 3},
      {width: 3, height: -1}
    ]) {
      expect(() => new GPURasterDilation({...props, ...dimensions})).toThrow(/positive integers/);
    }
    expect(() => new GPURasterErosion({...props, width: 65536, height: 65536})).toThrow(
      /fit in uint32/
    );
    expect(() => new GPURasterDilation({...props, mode: 'complex' as never})).toThrow(/mode/);
    expect(() => new GPURasterMorphology({...props, operation: 'gradient' as never})).toThrow(
      /operation/
    );
    for (const radius of [-1, 1.5, 9, Number.NaN]) {
      expect(() => new GPURasterOpening({...props, radius})).toThrow(/radius/);
      expect(() => new GPURasterClosing({...props, radius})).toThrow(/radius/);
    }
    expect(() => new GPURasterDilation({...props, structuringElement: 'disk' as never})).toThrow(
      /structuring element/
    );
    expect(() => new GPURasterDilation({...props, borderMode: 'wrap' as never})).toThrow(
      /border mode/
    );
    expect(() => new GPURasterDilation({...props, borderValue: Number.NaN})).toThrow(
      /border value/
    );
    expect(() => new GPURasterDilation({...props, borderValue: 1e300})).toThrow(/float32/);
    expect(() => new GPURasterDilation({...props, noDataPolicy: 'renormalize' as never})).toThrow(
      /nodata policy/
    );
  });

  test('preserves strict binary uint32 formats and rejects nonidentity threshold-mask calibration', () => {
    const owner = {id: 'binary-morphology-validation'} as GraphOwner;
    const binary = makeBinaryProps(owner);
    expect(
      () =>
        new GPURasterDilation({
          ...binary,
          input: makeBand(owner, 'floating-source', 'float32', 9) as never
        })
    ).toThrow(/uint32 input/);
    expect(
      () =>
        new GPURasterDilation({
          ...binary,
          output: makeView(owner, 'floating-output', 'float32', 9) as never
        })
    ).toThrow(/uint32/);
    expect(
      () =>
        new GPURasterOpening({
          ...binary,
          input: {...binary.input, scale: 2}
        })
    ).toThrow(/identity input calibration/);
    expect(
      () =>
        new GPURasterClosing({
          ...binary,
          input: {...binary.input, offset: 1}
        })
    ).toThrow(/identity input calibration/);
    expect(
      new GPURasterDilation({
        ...binary,
        input: {...binary.input, scale: 1, offset: 0, noDataValue: 4294967295}
      }).input.noDataValue
    ).toBe(4294967295);
  });

  test('preserves calibrated native formats and offsets while rejecting foreign/aliased views', () => {
    const owner = {id: 'morphology-resource-ownership'} as GraphOwner;
    const props = makeGrayscaleProps(owner, 'sint32', 4);
    const contributor = new GPURasterDilation({
      ...props,
      input: {
        ...props.input,
        noDataValue: -2147483648,
        scale: 0.5,
        offset: 3,
        validity: makeView(owner, 'input-validity', 'uint32', 9, 4)
      }
    });
    expect(contributor.input.noDataValue).toBe(-2147483648);
    expect(contributor.input.scale).toBe(0.5);
    expect(contributor.input.offset).toBe(3);
    expect(contributor.input.storage.values.byteOffset).toBe(4);
    expect(contributor.output.byteOffset).toBe(4);
    expect(contributor.outputValidity.byteOffset).toBe(4);

    const foreignOwner = {id: 'foreign-morphology'} as GraphOwner;
    expect(
      () =>
        new GPURasterDilation({
          ...props,
          output: makeView(foreignOwner, 'foreign-output', 'float32', 9)
        })
    ).toThrow(/same graph/);
    expect(
      () =>
        new GPURasterErosion({
          ...props,
          outputValidity: makeView(owner, 'short-validity', 'uint32', 8)
        })
    ).toThrow(/one flag per pixel/);
    const floatingProps = makeGrayscaleProps(owner);
    expect(
      () =>
        new GPURasterDilation({
          ...floatingProps,
          output: floatingProps.input.storage.values as GraphDataView<'float32'>
        })
    ).toThrow(/separate buffers/);
  });

  test('declares one ordered primitive pass with explicit source-validity hazards', () => {
    const graph = makeRecordingGraph('morphology-primitive-pass');
    const props = makeBinaryProps(graph);
    new GPURasterDilation({
      ...props,
      id: 'binary-expand',
      input: {...props.input, validity: makeView(graph, 'source-validity', 'uint32', 9)}
    }).addToGraph(graph);

    expect(graph.passes.map(pass => pass.id)).toEqual(['binary-expand']);
    expect(graph.transientHandles).toHaveLength(0);
    expect(graph.passes[0].resources.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-write',
      'storage-write',
      'storage-read'
    ]);
  });
});

describe('GPURasterOpening and GPURasterClosing graph composition', () => {
  test('orders opening/closing passes and allocates graph-owned type-matching scratch', () => {
    const grayscaleGraph = makeRecordingGraph('opening-graph');
    const opening = new GPURasterOpening({
      ...makeGrayscaleProps(grayscaleGraph),
      id: 'open',
      radius: 2,
      structuringElement: 'cross',
      noDataPolicy: 'ignore'
    });
    opening.addToGraph(grayscaleGraph);
    expect(opening.requiredHalo).toBe(4);
    expect(grayscaleGraph.passes.map(pass => pass.id)).toEqual(['open-erode', 'open-dilate']);
    expect(grayscaleGraph.transientHandles.map(handle => handle.id).sort()).toEqual([
      'open-intermediate-validity',
      'open-intermediate-values'
    ]);
    expect(grayscaleGraph.transientHandles.every(handle => handle.transient)).toBe(true);
    expect(grayscaleGraph.passes[1].resources.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-write',
      'storage-write',
      'storage-read'
    ]);

    const binaryGraph = makeRecordingGraph('closing-graph');
    const closing = new GPURasterClosing({...makeBinaryProps(binaryGraph), id: 'close', radius: 3});
    closing.addToGraph(binaryGraph);
    expect(closing.requiredHalo).toBe(6);
    expect(binaryGraph.passes.map(pass => pass.id)).toEqual(['close-dilate', 'close-erode']);
    expect(binaryGraph.transientHandles.map(handle => handle.byteLength)).toEqual([36, 36]);
    const intermediateView = binaryGraph.passes[0].resources[1];
    expect('buffer' in intermediateView && intermediateView.buffer.format).toBe('uint32');
  });

  test('snapshots validated grayscale settings and borrowed input metadata before callers mutate props', () => {
    const graph = makeRecordingGraph('stable-grayscale-opening');
    const originalValidity = makeView(graph, 'stable-input-validity', 'uint32', 9);
    const props: GPURasterGrayscaleMorphologyProps = {
      ...makeGrayscaleProps(graph, 'sint32'),
      id: 'stable-opening',
      radius: 2,
      structuringElement: 'cross',
      borderMode: 'constant',
      borderValue: -5,
      noDataPolicy: 'ignore'
    };
    props.input = {
      ...props.input,
      scale: 0.5,
      offset: 3,
      noDataValue: -2147483648,
      validity: originalValidity
    };
    const originalInput = props.input;
    const originalSource = originalInput.storage.values;
    const originalOutput = props.output;
    const originalOutputValidity = props.outputValidity;
    const opening = new GPURasterOpening(props);

    originalInput.id = 'mutated-original-input';
    originalInput.scale = 9;
    originalInput.offset = 12;
    originalInput.noDataValue = -3;
    originalInput.validity = makeView(graph, 'mutated-validity', 'uint32', 9);
    originalInput.storage.values = makeView(graph, 'mutated-source', 'sint32', 9);
    Object.assign(props, {
      id: 'mutated-opening',
      width: 1,
      height: 1,
      radius: 8,
      mode: 'binary',
      structuringElement: 'square',
      borderMode: 'nodata',
      borderValue: 42,
      noDataPolicy: 'propagate',
      input: makeBand(graph, 'replacement-input', 'uint32', 9),
      output: makeView(graph, 'replacement-output', 'uint32', 9),
      outputValidity: makeView(graph, 'replacement-output-validity', 'uint32', 9)
    });

    expect(opening.id).toBe('stable-opening');
    expect(opening.width).toBe(3);
    expect(opening.height).toBe(3);
    expect(opening.mode).toBe('grayscale');
    expect(opening.radius).toBe(2);
    expect(opening.requiredHalo).toBe(4);
    expect(opening.structuringElement).toBe('cross');
    expect(opening.borderMode).toBe('constant');
    expect(opening.borderValue).toBe(-5);
    expect(opening.noDataPolicy).toBe('ignore');
    expect(opening.input).not.toBe(originalInput);
    expect(opening.input.storage).not.toBe(originalInput.storage);
    expect(opening.input.id).toBe('grayscale-input');
    expect(opening.input.format).toBe('sint32');
    expect(opening.input.scale).toBe(0.5);
    expect(opening.input.offset).toBe(3);
    expect(opening.input.noDataValue).toBe(-2147483648);
    expect(opening.input.validity).toBe(originalValidity);
    expect(opening.input.storage.values).toBe(originalSource);
    expect(opening.output).toBe(originalOutput);
    expect(opening.outputValidity).toBe(originalOutputValidity);

    opening.addToGraph(graph);
    expect(graph.passes.map(pass => pass.id)).toEqual([
      'stable-opening-erode',
      'stable-opening-dilate'
    ]);
    expect(graph.passes[0].resources[0]).toEqual({
      buffer: originalSource,
      usage: 'storage-read'
    });
    expect(graph.passes[0].resources[3]).toEqual({
      buffer: originalValidity,
      usage: 'storage-read'
    });
    expect(graph.passes[1].resources[1]).toEqual({
      buffer: originalOutput,
      usage: 'storage-write'
    });
    expect(graph.passes[1].resources[2]).toEqual({
      buffer: originalOutputValidity,
      usage: 'storage-write'
    });
    const intermediateValues = graph.passes[0].resources[1];
    expect('buffer' in intermediateValues && intermediateValues.buffer.format).toBe('float32');
  });

  test('snapshots binary discrimination and zero-radius identity before caller mutation', () => {
    const graph = makeRecordingGraph('stable-binary-closing');
    const props: GPURasterBinaryMorphologyProps = {
      ...makeBinaryProps(graph),
      id: 'stable-closing',
      radius: 0,
      borderMode: 'constant',
      borderValue: 7
    };
    const originalInput = props.input;
    const originalSource = originalInput.storage.values;
    const originalOutput = props.output;
    const originalOutputValidity = props.outputValidity;
    const closing = new GPURasterClosing(props);

    originalInput.storage.values = makeView(graph, 'mutated-binary-source', 'uint32', 9);
    Object.assign(props, {
      id: 'mutated-closing',
      radius: 8,
      mode: 'grayscale',
      borderMode: 'nodata',
      borderValue: 0,
      input: makeBand(graph, 'replacement-grayscale-input', 'float32', 9),
      output: makeView(graph, 'replacement-grayscale-output', 'float32', 9),
      outputValidity: makeView(graph, 'replacement-grayscale-validity', 'uint32', 9)
    });

    expect(closing.id).toBe('stable-closing');
    expect(closing.mode).toBe('binary');
    expect(closing.radius).toBe(0);
    expect(closing.requiredHalo).toBe(0);
    expect(closing.borderMode).toBe('constant');
    expect(closing.borderValue).toBe(7);
    expect(closing.input.format).toBe('uint32');
    expect(closing.input.storage.values).toBe(originalSource);
    expect(closing.output).toBe(originalOutput);
    expect(closing.outputValidity).toBe(originalOutputValidity);

    closing.addToGraph(graph);
    expect(graph.passes.map(pass => pass.id)).toEqual(['stable-closing']);
    expect(graph.transientHandles).toHaveLength(0);
    expect(graph.passes[0].resources[0]).toEqual({
      buffer: originalSource,
      usage: 'storage-read'
    });
    expect(graph.passes[0].resources[1]).toEqual({
      buffer: originalOutput,
      usage: 'storage-write'
    });
  });

  test('contributes a single scratch-free identity pass for radius-zero opening and closing', () => {
    const openingGraph = makeRecordingGraph('zero-opening');
    new GPURasterOpening({
      ...makeGrayscaleProps(openingGraph),
      id: 'identity-open',
      radius: 0
    }).addToGraph(openingGraph);
    expect(openingGraph.passes.map(pass => pass.id)).toEqual(['identity-open']);
    expect(openingGraph.transientHandles).toHaveLength(0);

    const closingGraph = makeRecordingGraph('zero-closing');
    new GPURasterClosing({
      ...makeBinaryProps(closingGraph),
      id: 'identity-close',
      radius: 0
    }).addToGraph(closingGraph);
    expect(closingGraph.passes.map(pass => pass.id)).toEqual(['identity-close']);
    expect(closingGraph.transientHandles).toHaveLength(0);
  });

  test('rejects foreign graphs and undersized bindings/workgroups before allocating scratch', () => {
    const owner = makeRecordingGraph('morphology-owner');
    const foreign = makeRecordingGraph('morphology-foreign');
    expect(() => new GPURasterOpening(makeGrayscaleProps(owner)).addToGraph(foreign)).toThrow(
      /target graph/
    );
    expect(foreign.transientHandles).toHaveLength(0);

    const fewBindings = makeRecordingGraph('morphology-few-bindings', {
      maxStorageBuffersPerShaderStage: 3
    });
    expect(() =>
      new GPURasterClosing(makeBinaryProps(fewBindings)).addToGraph(fewBindings)
    ).toThrow(/binding count/);
    expect(fewBindings.transientHandles).toHaveLength(0);

    const littleStorage = makeRecordingGraph('morphology-small-local-storage', {
      maxComputeWorkgroupStorageSize: 64
    });
    expect(() =>
      new GPURasterDilation(makeGrayscaleProps(littleStorage)).addToGraph(littleStorage)
    ).toThrow(/workgroup storage/);

    const smallBinding = makeRecordingGraph('morphology-small-buffer-binding', {
      maxStorageBufferBindingSize: 32
    });
    expect(() =>
      new GPURasterOpening(makeGrayscaleProps(smallBinding)).addToGraph(smallBinding)
    ).toThrow(/storage binding limit/);
    expect(smallBinding.transientHandles).toHaveLength(0);

    const smallWorkgroup = makeRecordingGraph('morphology-small-workgroup', {
      maxComputeInvocationsPerWorkgroup: 32
    });
    expect(() =>
      new GPURasterErosion(makeBinaryProps(smallWorkgroup)).addToGraph(smallWorkgroup)
    ).toThrow(/workgroup limits/);
  });
});

function makeBinaryProps(owner: GraphOwner, byteOffset = 0): GPURasterBinaryMorphologyProps {
  return {
    mode: 'binary',
    width: 3,
    height: 3,
    radius: 1,
    input: makeBand(owner, 'binary-input', 'uint32', 9, byteOffset),
    output: makeView(owner, 'binary-output', 'uint32', 9, byteOffset),
    outputValidity: makeView(owner, 'binary-output-validity', 'uint32', 9, byteOffset)
  };
}

function makeGrayscaleProps(
  owner: GraphOwner,
  format: GPURasterScalarFormat = 'float32',
  byteOffset = 0
): GPURasterGrayscaleMorphologyProps {
  return {
    width: 3,
    height: 3,
    radius: 1,
    input: makeBand(owner, 'grayscale-input', format, 9, byteOffset),
    output: makeView(owner, 'grayscale-output', 'float32', 9, byteOffset),
    outputValidity: makeView(owner, 'grayscale-output-validity', 'uint32', 9, byteOffset)
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
  length: number,
  byteOffset = 0
): GPURasterBufferBand<Format> {
  return {
    id,
    format,
    storage: {kind: 'buffer', values: makeView(owner, id, format, length, byteOffset)}
  } as GPURasterBufferBand<Format>;
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
