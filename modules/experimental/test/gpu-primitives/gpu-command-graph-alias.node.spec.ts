// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GraphBufferHandle,
  type GraphDataView,
  type GraphImportedBuffer
} from '@luma.gl/experimental';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';

type GraphAliasFixture = {
  device: NullDevice;
  graph: GPUCommandGraph;
  buffers: Buffer[];
  dynamicBuffers: DynamicBuffer[];
};

describe('GPUCommandGraph physical imported-buffer ownership', () => {
  test('rejects one physical default buffer used by two active logical handles', () => {
    const fixture = createGraphAliasFixture('duplicate-default');
    const sharedBuffer = createGraphAliasBuffer(fixture, 'shared-default');
    const input = importGraphAliasBuffer(fixture, 'input', sharedBuffer);
    const output = importGraphAliasBuffer(fixture, 'output', sharedBuffer);
    const encodeNode = vi.fn();
    addGraphAliasCopyPass(fixture.graph, input, output, encodeNode);
    const compiled = fixture.graph.compile();

    try {
      expect(() => encodeGraphAliasFixture(fixture, compiled)).toThrow(
        /input.*output.*same physical buffer/i
      );
      expect(encodeNode).not.toHaveBeenCalled();
      expect(sharedBuffer.destroyed).toBe(false);
    } finally {
      compiled.destroy();
      destroyGraphAliasFixture(fixture);
    }
  });

  test('allows distinct active logical handles to share a read-only physical buffer', () => {
    const fixture = createGraphAliasFixture('shared-read-only-buffer');
    const sharedBuffer = createGraphAliasBuffer(fixture, 'shared-read-only');
    const firstReader = importGraphAliasBuffer(fixture, 'first-reader', sharedBuffer);
    const secondReader = importGraphAliasBuffer(fixture, 'second-reader', sharedBuffer);
    const encodeNode = vi.fn();
    fixture.graph.addCopyPass({
      id: 'observe-read-only-aliases',
      resources: [
        {buffer: firstReader, usage: 'storage-read'},
        {buffer: secondReader, usage: 'storage-read'}
      ],
      compile: () => ({encode: encodeNode})
    });
    const compiled = fixture.graph.compile();

    try {
      encodeGraphAliasFixture(fixture, compiled);
      expect(encodeNode).toHaveBeenCalledTimes(1);
      expect(sharedBuffer.destroyed).toBe(false);
    } finally {
      compiled.destroy();
      destroyGraphAliasFixture(fixture);
    }
  });

  test.each([
    {
      identifier: 'read-before-write',
      firstUsage: 'storage-read',
      secondUsage: 'storage-write',
      bufferUsage: Buffer.STORAGE
    },
    {
      identifier: 'write-before-read',
      firstUsage: 'storage-write',
      secondUsage: 'storage-read',
      bufferUsage: Buffer.STORAGE
    },
    {
      identifier: 'read-before-read-write',
      firstUsage: 'storage-read',
      secondUsage: 'storage-read-write',
      bufferUsage: Buffer.STORAGE
    },
    {
      identifier: 'read-before-copy-destination',
      firstUsage: 'storage-read',
      secondUsage: 'copy-destination',
      bufferUsage: Buffer.STORAGE | Buffer.COPY_DST
    }
  ] as const)('rejects physically aliased active handles whenever an access mutates ($identifier)', ({
    identifier,
    firstUsage,
    secondUsage,
    bufferUsage
  }) => {
    const fixture = createGraphAliasFixture(identifier);
    const sharedBuffer = createGraphAliasBuffer(fixture, 'shared-mutating-buffer', bufferUsage);
    const first = importGraphAliasBuffer(fixture, 'first', sharedBuffer, bufferUsage);
    const second = importGraphAliasBuffer(fixture, 'second', sharedBuffer, bufferUsage);
    const encodeNode = vi.fn();
    fixture.graph.addCopyPass({
      id: 'observe-mutating-aliases',
      resources: [
        {buffer: first, usage: firstUsage},
        {buffer: second, usage: secondUsage}
      ],
      compile: () => ({encode: encodeNode})
    });
    const compiled = fixture.graph.compile();

    try {
      expect(() => encodeGraphAliasFixture(fixture, compiled)).toThrow(
        /first.*second.*same physical buffer/i
      );
      expect(encodeNode).not.toHaveBeenCalled();
    } finally {
      compiled.destroy();
      destroyGraphAliasFixture(fixture);
    }
  });

  test('rejects an initially read-only aliased handle that a later node writes', () => {
    const fixture = createGraphAliasFixture('later-alias-write');
    const sharedBuffer = createGraphAliasBuffer(fixture, 'shared-eventually-writable');
    const first = importGraphAliasBuffer(fixture, 'first', sharedBuffer);
    const second = importGraphAliasBuffer(fixture, 'second', sharedBuffer);
    const encodeFirstNode = vi.fn();
    const encodeSecondNode = vi.fn();
    fixture.graph.addCopyPass({
      id: 'read-both-aliased-handles',
      resources: [
        {buffer: first, usage: 'storage-read'},
        {buffer: second, usage: 'storage-read'}
      ],
      compile: () => ({encode: encodeFirstNode})
    });
    fixture.graph.addCopyPass({
      id: 'write-first-aliased-handle',
      resources: [{buffer: first, usage: 'storage-write'}],
      compile: () => ({encode: encodeSecondNode})
    });
    const compiled = fixture.graph.compile();

    try {
      expect(() => encodeGraphAliasFixture(fixture, compiled)).toThrow(
        /first.*second.*same physical buffer/i
      );
      expect(encodeFirstNode).not.toHaveBeenCalled();
      expect(encodeSecondNode).not.toHaveBeenCalled();
    } finally {
      compiled.destroy();
      destroyGraphAliasFixture(fixture);
    }
  });

  test('rejects an override alias and still accepts later distinct backing buffers', () => {
    const fixture = createGraphAliasFixture('default-override');
    const inputBuffer = createGraphAliasBuffer(fixture, 'input-default');
    const outputBuffer = createGraphAliasBuffer(fixture, 'output-default');
    const input = importGraphAliasBuffer(fixture, 'input', inputBuffer);
    const output = importGraphAliasBuffer(fixture, 'output', outputBuffer);
    const encodeNode = vi.fn();
    addGraphAliasCopyPass(fixture.graph, input, output, encodeNode);
    const compiled = fixture.graph.compile();

    try {
      expect(() => encodeGraphAliasFixture(fixture, compiled, {output: inputBuffer})).toThrow(
        /input.*output.*same physical buffer/i
      );
      expect(encodeNode).not.toHaveBeenCalled();

      encodeGraphAliasFixture(fixture, compiled, {output: outputBuffer});
      expect(encodeNode).toHaveBeenCalledTimes(1);
      expect(inputBuffer.destroyed).toBe(false);
      expect(outputBuffer.destroyed).toBe(false);
    } finally {
      compiled.destroy();
      destroyGraphAliasFixture(fixture);
    }
  });

  test('rejects one override supplied for two active predeclared imports', () => {
    const fixture = createGraphAliasFixture('override-override');
    const sharedBuffer = createGraphAliasBuffer(fixture, 'shared-override');
    const input = importGraphAliasBuffer(fixture, 'input');
    const output = importGraphAliasBuffer(fixture, 'output');
    const encodeNode = vi.fn();
    addGraphAliasCopyPass(fixture.graph, input, output, encodeNode);
    const compiled = fixture.graph.compile();

    try {
      expect(() =>
        encodeGraphAliasFixture(fixture, compiled, {
          input: sharedBuffer,
          output: sharedBuffer
        })
      ).toThrow(/input.*output.*same physical buffer/i);
      expect(encodeNode).not.toHaveBeenCalled();
    } finally {
      compiled.destroy();
      destroyGraphAliasFixture(fixture);
    }
  });

  test('compares DynamicBuffer defaults by their current core-buffer identity', () => {
    const fixture = createGraphAliasFixture('dynamic-default');
    const sharedBuffer = createGraphAliasBuffer(fixture, 'shared-dynamic-buffer');
    const dynamicBuffer = new DynamicBuffer(fixture.device, {
      id: 'borrowed-dynamic-buffer',
      buffer: sharedBuffer,
      ownsBuffer: false
    });
    fixture.dynamicBuffers.push(dynamicBuffer);
    const input = importGraphAliasBuffer(fixture, 'dynamic-input', dynamicBuffer);
    const output = importGraphAliasBuffer(fixture, 'core-output', sharedBuffer);
    const encodeNode = vi.fn();
    addGraphAliasCopyPass(fixture.graph, input, output, encodeNode);
    const compiled = fixture.graph.compile();

    try {
      expect(() => encodeGraphAliasFixture(fixture, compiled)).toThrow(
        /dynamic-input.*core-output.*same physical buffer/i
      );
      expect(encodeNode).not.toHaveBeenCalled();
    } finally {
      compiled.destroy();
      destroyGraphAliasFixture(fixture);
    }
  });

  test('rejects distinct core Buffer wrappers exposing the same physical handle', () => {
    const fixture = createGraphAliasFixture('borrowed-buffer-wrappers');
    const inputBuffer = createGraphAliasBuffer(fixture, 'input-wrapper');
    const outputBuffer = createGraphAliasBuffer(fixture, 'output-wrapper');
    const sharedPhysicalHandle = {};
    Object.defineProperty(inputBuffer, 'handle', {value: sharedPhysicalHandle, writable: true});
    Object.defineProperty(outputBuffer, 'handle', {value: sharedPhysicalHandle, writable: true});
    const input = importGraphAliasBuffer(fixture, 'input-wrapper', inputBuffer);
    const output = importGraphAliasBuffer(fixture, 'output-wrapper', outputBuffer);
    const encodeNode = vi.fn();
    addGraphAliasCopyPass(fixture.graph, input, output, encodeNode);
    const compiled = fixture.graph.compile();

    try {
      expect(() => encodeGraphAliasFixture(fixture, compiled)).toThrow(
        /input-wrapper.*output-wrapper.*same physical buffer/i
      );
      expect(encodeNode).not.toHaveBeenCalled();
    } finally {
      compiled.destroy();
      destroyGraphAliasFixture(fixture);
    }
  });

  test('rechecks resized DynamicBuffer backing storage on every graph encoding', () => {
    const fixture = createGraphAliasFixture('dynamic-resize');
    const dynamicBuffer = new DynamicBuffer(fixture.device, {
      id: 'resizable-dynamic-buffer',
      byteLength: 16,
      usage: Buffer.STORAGE
    });
    fixture.dynamicBuffers.push(dynamicBuffer);
    const separateBuffer = createGraphAliasBuffer(fixture, 'separate-output');
    const input = importGraphAliasBuffer(fixture, 'dynamic-input', dynamicBuffer);
    const output = importGraphAliasBuffer(fixture, 'output', separateBuffer);
    const encodeNode = vi.fn();
    addGraphAliasCopyPass(fixture.graph, input, output, encodeNode);
    const compiled = fixture.graph.compile();

    try {
      encodeGraphAliasFixture(fixture, compiled);
      expect(encodeNode).toHaveBeenCalledTimes(1);

      dynamicBuffer.resize({byteLength: 32});
      expect(() =>
        encodeGraphAliasFixture(fixture, compiled, {output: dynamicBuffer.buffer})
      ).toThrow(/dynamic-input.*output.*same physical buffer/i);
      expect(encodeNode).toHaveBeenCalledTimes(1);

      encodeGraphAliasFixture(fixture, compiled, {output: separateBuffer});
      expect(encodeNode).toHaveBeenCalledTimes(2);
    } finally {
      compiled.destroy();
      destroyGraphAliasFixture(fixture);
    }
  });

  test('ignores unused alias handles and unused predeclared override bindings', () => {
    const fixture = createGraphAliasFixture('inactive-imports');
    const inputBuffer = createGraphAliasBuffer(fixture, 'active-input-buffer');
    const outputBuffer = createGraphAliasBuffer(fixture, 'active-output-buffer');
    const input = importGraphAliasBuffer(fixture, 'active-input', inputBuffer);
    const output = importGraphAliasBuffer(fixture, 'active-output', outputBuffer);
    importGraphAliasBuffer(fixture, 'unused-default-alias', inputBuffer);
    importGraphAliasBuffer(fixture, 'unused-override-alias');
    const encodeNode = vi.fn();
    addGraphAliasCopyPass(fixture.graph, input, output, encodeNode);
    const compiled = fixture.graph.compile();

    try {
      encodeGraphAliasFixture(fixture, compiled, {'unused-override-alias': inputBuffer});
      expect(encodeNode).toHaveBeenCalledTimes(1);
      expect(inputBuffer.destroyed).toBe(false);
      expect(outputBuffer.destroyed).toBe(false);
    } finally {
      compiled.destroy();
      destroyGraphAliasFixture(fixture);
    }
  });

  test('allows multiple active ranges over one canonical logical buffer handle', () => {
    const fixture = createGraphAliasFixture('shared-logical-handle');
    const sharedBuffer = createGraphAliasBuffer(fixture, 'shared-ranges');
    const handle = importGraphAliasBuffer(fixture, 'shared', sharedBuffer);
    const input = fixture.graph.createDataView(handle, {
      format: 'uint32',
      length: 1,
      byteOffset: 0
    });
    const output = fixture.graph.createDataView(handle, {
      format: 'uint32',
      length: 1,
      byteOffset: Uint32Array.BYTES_PER_ELEMENT
    });
    const encodeNode = vi.fn();
    addGraphAliasCopyPass(fixture.graph, input, output, encodeNode);
    const compiled = fixture.graph.compile();

    try {
      encodeGraphAliasFixture(fixture, compiled);
      expect(encodeNode).toHaveBeenCalledTimes(1);
      expect(sharedBuffer.destroyed).toBe(false);
    } finally {
      compiled.destroy();
      destroyGraphAliasFixture(fixture);
    }
  });

  test('preserves graph-owned transient-buffer lifetime reuse', () => {
    const fixture = createGraphAliasFixture('transient-reuse');
    const first = fixture.graph.createTransientBuffer({
      id: 'first-transient',
      byteLength: 16,
      usage: Buffer.STORAGE
    });
    const second = fixture.graph.createTransientBuffer({
      id: 'second-transient',
      byteLength: 16,
      usage: Buffer.STORAGE
    });
    const encodeFirst = vi.fn();
    const encodeSecond = vi.fn();
    fixture.graph.addCopyPass({
      id: 'write-first-transient',
      resources: [{buffer: first, usage: 'storage-write'}],
      compile: () => ({encode: encodeFirst})
    });
    fixture.graph.addCopyPass({
      id: 'write-second-transient',
      resources: [{buffer: second, usage: 'storage-write'}],
      compile: () => ({encode: encodeSecond})
    });
    const compiled = fixture.graph.compile();

    try {
      expect(compiled.stats.logicalTransientBufferCount).toBe(2);
      expect(compiled.stats.physicalTransientBufferCount).toBe(1);
      encodeGraphAliasFixture(fixture, compiled);
      expect(encodeFirst).toHaveBeenCalledTimes(1);
      expect(encodeSecond).toHaveBeenCalledTimes(1);
    } finally {
      compiled.destroy();
      destroyGraphAliasFixture(fixture);
    }
  });
});

function createGraphAliasFixture(identifier: string): GraphAliasFixture {
  const device = new NullDevice({id: `${identifier}-device`});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  return {
    device,
    graph: new GPUCommandGraph(device, {id: identifier}),
    buffers: [],
    dynamicBuffers: []
  };
}

function createGraphAliasBuffer(
  fixture: GraphAliasFixture,
  identifier: string,
  usage = Buffer.STORAGE
): Buffer {
  const buffer = fixture.device.createBuffer({
    id: identifier,
    byteLength: 16,
    usage
  });
  fixture.buffers.push(buffer);
  return buffer;
}

function importGraphAliasBuffer(
  fixture: GraphAliasFixture,
  identifier: string,
  defaultBuffer?: GraphImportedBuffer,
  usage = Buffer.STORAGE
): GraphBufferHandle {
  return fixture.graph.importBuffer({id: identifier, byteLength: 16, usage}, defaultBuffer);
}

function addGraphAliasCopyPass(
  graph: GPUCommandGraph,
  input: GraphBufferHandle | GraphDataView,
  output: GraphBufferHandle | GraphDataView,
  encode: () => void
): void {
  graph.addCopyPass({
    id: 'observe-physical-buffers',
    resources: [
      {buffer: input, usage: 'storage-read'},
      {buffer: output, usage: 'storage-write'}
    ],
    compile: () => ({encode})
  });
}

function encodeGraphAliasFixture(
  fixture: GraphAliasFixture,
  graph: CompiledGPUCommandGraph,
  buffers: Record<string, GraphImportedBuffer> = {}
): void {
  const encoder = fixture.device.createCommandEncoder({id: `${fixture.graph.id}-encoder`});
  try {
    graph.encode(encoder, {parameters: undefined, buffers});
  } finally {
    encoder.destroy();
  }
}

function destroyGraphAliasFixture(fixture: GraphAliasFixture): void {
  for (const dynamicBuffer of fixture.dynamicBuffers) dynamicBuffer.destroy();
  for (const buffer of fixture.buffers) buffer.destroy();
  fixture.device.destroy();
}
