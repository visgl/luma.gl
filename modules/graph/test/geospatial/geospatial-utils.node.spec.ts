// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {describe, expect, it} from 'vitest';
import {
  GraphBufferHandle,
  GraphDataView,
  GraphVectorView,
  type GraphImportedBuffer
} from '@luma.gl/graph/gpu-core';
import type {Device} from '@luma.gl/core';
import {
  addFP64UniformUse,
  addGeospatialPass,
  getClassicFP64Defines,
  getPlatformFP64Arithmetic,
  validateDisjointGeospatialViews
} from '../../src/geospatial/geospatial-utils';

const BUFFER_BYTE_LENGTH = 1024;

describe('validateDisjointGeospatialViews', () => {
  it('rejects logical and aligned binding-range overlap', () => {
    const handle = makeHandle('shared');
    const output = makeView(handle, 0);
    const logicalAlias = makeView(handle, 0);
    const alignedBindingAlias = makeView(handle, Uint32Array.BYTES_PER_ELEMENT);

    expect(() =>
      validateDisjointGeospatialViews(
        'logical-alias',
        [['positions', logicalAlias]],
        [['ids', output]]
      )
    ).toThrow('logical-alias output ids and positions must not overlap');
    expect(() =>
      validateDisjointGeospatialViews(
        'binding-alias',
        [['positions', alignedBindingAlias]],
        [['ids', output]]
      )
    ).toThrow('binding-alias output ids and positions must not overlap');
  });

  it('preserves disjoint aligned ranges and permits read-only aliases', () => {
    const handle = makeHandle('aligned');
    const first = makeView(handle, 0);
    const second = makeView(handle, 256);

    expect(() =>
      validateDisjointGeospatialViews(
        'aligned-ranges',
        [
          ['firstInput', first],
          ['aliasedInput', first]
        ],
        [['result', second]]
      )
    ).not.toThrow();
  });

  it('treats zero-length views as one-row storage bindings', () => {
    const handle = makeHandle('empty');
    const emptyOutput = makeView(handle, 0, 0);
    const input = makeView(handle, Uint32Array.BYTES_PER_ELEMENT);

    expect(() =>
      validateDisjointGeospatialViews(
        'empty-binding',
        [['positions', input]],
        [['ids', emptyOutput]]
      )
    ).toThrow('empty-binding output ids and positions must not overlap');
  });

  it('rejects distinct graph handles with the same core default buffer', () => {
    const coreBuffer = makeCoreBuffer();
    const input = makeView(makeHandle('input', coreBuffer), 256);
    const output = makeView(makeHandle('output', coreBuffer), 0);

    expect(() =>
      validateDisjointGeospatialViews('physical-alias', [['positions', input]], [['ids', output]])
    ).toThrow('physical-alias output ids and positions must not overlap');
  });

  it('unwraps DynamicBuffer defaults before comparing physical identity', () => {
    const coreBuffer = makeCoreBuffer();
    const dynamicBuffer = makeDynamicBuffer(coreBuffer);
    const input = makeView(makeHandle('dynamic-input', dynamicBuffer), 0);
    const output = makeView(makeHandle('core-output', coreBuffer), 256);

    expect(() =>
      validateDisjointGeospatialViews('dynamic-alias', [['positions', input]], [['ids', output]])
    ).toThrow('dynamic-alias output ids and positions must not overlap');
  });

  it('checks vector chunks and every output pair without conflating separate handles', () => {
    const inputHandle = makeHandle('input', makeCoreBuffer());
    const outputHandle = makeHandle('output', makeCoreBuffer());
    const inputVector = makeVector([makeView(inputHandle, 0), makeView(inputHandle, 256)]);
    const aliasingInputVector = makeVector([
      makeView(inputHandle, 0),
      makeView(outputHandle, Uint32Array.BYTES_PER_ELEMENT)
    ]);
    const firstOutput = makeView(outputHandle, 0);
    const secondOutput = makeView(outputHandle, Uint32Array.BYTES_PER_ELEMENT);

    expect(() =>
      validateDisjointGeospatialViews(
        'vector-alias',
        [['positions', aliasingInputVector]],
        [['ids', firstOutput]]
      )
    ).toThrow('vector-alias output ids and positions must not overlap');

    expect(() =>
      validateDisjointGeospatialViews(
        'output-alias',
        [['positions', inputVector]],
        [
          ['ids', firstOutput],
          ['count', secondOutput]
        ]
      )
    ).toThrow('output-alias output count and output ids must not overlap');

    expect(() =>
      validateDisjointGeospatialViews(
        'separate-defaults',
        [['positions', inputVector]],
        [['ids', firstOutput]]
      )
    ).not.toThrow();
  });
});

function makeHandle(id: string, defaultBuffer?: GraphImportedBuffer): GraphBufferHandle {
  return new GraphBufferHandle(
    {id: 'geospatial-utils-test'},
    {id, byteLength: BUFFER_BYTE_LENGTH, usage: 0},
    false,
    defaultBuffer
  );
}

function makeView(
  buffer: GraphBufferHandle,
  byteOffset: number,
  length: number = 1
): GraphDataView<'uint32'> {
  return new GraphDataView(buffer, {
    format: 'uint32',
    length,
    byteOffset,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    rowByteLength: Uint32Array.BYTES_PER_ELEMENT
  });
}

function makeVector(data: readonly GraphDataView<'uint32'>[]): GraphVectorView<'uint32'> {
  return new GraphVectorView({
    id: 'test-vector',
    name: 'test-vector',
    format: 'uint32',
    length: data.reduce((length, view) => length + view.length, 0),
    valueLength: data.reduce((length, view) => length + view.length, 0),
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    rowByteLength: Uint32Array.BYTES_PER_ELEMENT,
    data
  });
}

function makeCoreBuffer(): Buffer {
  return {} as Buffer;
}

function makeDynamicBuffer(buffer: Buffer): DynamicBuffer {
  const dynamicBuffer = Object.create(DynamicBuffer.prototype) as DynamicBuffer;
  Object.defineProperty(dynamicBuffer, '_buffer', {value: buffer});
  return dynamicBuffer;
}

describe('addGeospatialPass', () => {
  const addPass = (
    fp64Profile: 'full' | 'predicate-f32' | 'predicate-raw' | undefined,
    fp64Arithmetic: 'integer' | 'classic' | 'platform' | undefined
  ): number => {
    let passes = 0;
    const graph = {addComputePass: () => passes++} as unknown as Parameters<
      typeof addGeospatialPass
    >[0];
    addGeospatialPass(graph, {
      id: 'pass',
      source: '',
      resources: [],
      bindings: {},
      dispatchLayout: {x: 1, y: 1, z: 1},
      precise: true,
      fp64Profile,
      fp64Arithmetic
    });
    return passes;
  };

  it('rejects classic and platform arithmetic with the predicate profiles', () => {
    for (const fp64Profile of ['predicate-f32', 'predicate-raw'] as const) {
      for (const fp64Arithmetic of ['classic', 'platform'] as const) {
        expect(() => addPass(fp64Profile, fp64Arithmetic), fp64Profile).toThrow(
          `geospatial fp64Profile '${fp64Profile}' requires fp64Arithmetic 'integer', not '${fp64Arithmetic}'`
        );
      }
    }
  });

  it('accepts integer arithmetic with every profile and any arithmetic with the full profile', () => {
    for (const fp64Profile of ['predicate-f32', 'predicate-raw'] as const) {
      for (const fp64Arithmetic of ['integer', undefined] as const) {
        expect(addPass(fp64Profile, fp64Arithmetic), fp64Profile).toBe(1);
      }
    }
    for (const fp64Profile of ['full', undefined] as const) {
      for (const fp64Arithmetic of ['integer', 'classic', 'platform', undefined] as const) {
        expect(addPass(fp64Profile, fp64Arithmetic), fp64Arithmetic).toBe(1);
      }
    }
  });
});

describe('getPlatformFP64Arithmetic', () => {
  const device = (info: Partial<Device['info']>) =>
    ({
      info: {type: 'webgpu', gpu: 'nvidia', gpuType: 'discrete', gpuBackend: 'unknown', ...info}
    }) as unknown as Device;
  const withNavigator = (navigator: unknown, run: () => void) => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', {value: navigator, configurable: true});
    try {
      run();
    } finally {
      if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor);
      else delete (globalThis as {navigator?: unknown}).navigator;
    }
  };

  const macintosh = {platform: 'MacIntel', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)'};
  const windows = {platform: 'Win32', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'};

  it('uses classic double-single on known D3D12 and Vulkan backends', () => {
    // A reported backend takes precedence over the host operating system.
    withNavigator(macintosh, () => {
      for (const gpuBackend of ['d3d12', 'd3d11', 'vulkan'] as const) {
        expect(getPlatformFP64Arithmetic(device({gpuBackend})), gpuBackend).toBe('classic');
      }
    });
  });

  it('keeps integer arithmetic on Metal whatever the vendor', () => {
    withNavigator(windows, () => {
      for (const gpu of ['apple', 'intel', 'amd', 'nvidia', 'unknown'] as const) {
        expect(getPlatformFP64Arithmetic(device({gpu, gpuBackend: 'metal'})), gpu).toBe('integer');
      }
    });
  });

  it('keeps integer arithmetic for Apple GPUs, software adapters and WebGL', () => {
    withNavigator(windows, () => {
      expect(getPlatformFP64Arithmetic(device({gpu: 'apple', gpuBackend: 'unknown'}))).toBe(
        'integer'
      );
      expect(getPlatformFP64Arithmetic(device({gpu: 'software'}))).toBe('integer');
      expect(getPlatformFP64Arithmetic(device({gpuType: 'cpu'}))).toBe('integer');
      expect(getPlatformFP64Arithmetic(device({fallback: true}))).toBe('integer');
      expect(getPlatformFP64Arithmetic(device({type: 'webgl', gpuBackend: 'd3d11'}))).toBe(
        'integer'
      );
    });
  });

  it('decides an unreported backend from the host operating system', () => {
    const linux = {platform: 'Linux x86_64', userAgent: 'Mozilla/5.0 (X11; Linux x86_64)'};
    withNavigator(macintosh, () => {
      for (const gpu of ['intel', 'amd', 'unknown'] as const) {
        expect(getPlatformFP64Arithmetic(device({gpu})), gpu).toBe('integer');
      }
    });
    withNavigator(windows, () => expect(getPlatformFP64Arithmetic(device({}))).toBe('classic'));
    withNavigator(linux, () => expect(getPlatformFP64Arithmetic(device({}))).toBe('classic'));
    withNavigator({platform: '', userAgent: ''}, () =>
      expect(getPlatformFP64Arithmetic(device({}))).toBe('integer')
    );
    withNavigator(undefined, () => expect(getPlatformFP64Arithmetic(device({}))).toBe('integer'));
  });
});

describe('getClassicFP64Defines', () => {
  it('applies the per-vendor fp64 workarounds of the GLSL platform defines', () => {
    expect(getClassicFP64Defines('nvidia')).toEqual({
      LUMA_FP64_INTEGER_ARITHMETIC: false,
      LUMA_FP64_CODE_ELIMINATION_WORKAROUND: true
    });
    expect(getClassicFP64Defines('amd')).toEqual({LUMA_FP64_INTEGER_ARITHMETIC: false});
    expect(getClassicFP64Defines('intel')).toEqual({
      LUMA_FP64_INTEGER_ARITHMETIC: false,
      LUMA_FP64_CODE_ELIMINATION_WORKAROUND: true,
      LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND: true
    });
    expect(getClassicFP64Defines('unknown')).toEqual({
      LUMA_FP64_INTEGER_ARITHMETIC: false,
      LUMA_FP64_CODE_ELIMINATION_WORKAROUND: true
    });
  });
});

describe('addFP64UniformUse', () => {
  const use = '_ = fp64arithmetic.ONE;';

  it('adds a static use at the start of the compute entry point body', () => {
    const source = `fn helper(a: f32) -> f32 { return a; }
@compute @workgroup_size(64)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_id) localId: vec3u) {
  let x = helper(1.0);
}`;
    const result = addFP64UniformUse(source);
    expect(result.indexOf(use)).toBeGreaterThan(result.indexOf('localId: vec3u) {'));
    expect(result.indexOf(use)).toBeLessThan(result.indexOf('let x = helper'));
    expect(result.replace(`\n  ${use}`, '')).toBe(source);
  });

  it('ignores entry points and braces inside comments', () => {
    const source = `// @compute @workgroup_size(1) fn commented() { }
/* @compute fn alsoCommented() { } */
@compute @workgroup_size(1) fn main(/* { */ @builtin(global_invocation_id) id: vec3u) {
  // }
  let x = 1u;
}`;
    const result = addFP64UniformUse(source);
    const bodyStart = source.indexOf('vec3u) {') + 'vec3u) {'.length;
    expect(result.slice(bodyStart).trimStart().startsWith(use)).toBe(true);
  });

  it('rejects sources without exactly one compute entry point', () => {
    expect(() => addFP64UniformUse('fn helper() {}')).toThrow('expected one compute entry point');
    expect(() =>
      addFP64UniformUse(
        '@compute @workgroup_size(1) fn a() {}\n@compute @workgroup_size(1) fn b() {}'
      )
    ).toThrow('expected one compute entry point');
  });
});
