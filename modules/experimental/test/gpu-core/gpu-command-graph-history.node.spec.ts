// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Texture, type Device} from '@luma.gl/core';
import {GPUCommandGraph, GPUTextureHistory, type GraphTextureHandle} from '@luma.gl/experimental';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';

const TEXTURE_USAGE = Texture.SAMPLE | Texture.STORAGE | Texture.COPY_DST | Texture.RENDER;

describe('GPUTextureHistory ownership and rotation', () => {
  test('owns exactly two matching physical textures and rotates their logical roles', () => {
    const device = createHistoryDevice('history-ownership');
    const createTexture = vi.spyOn(device, 'createTexture');
    const submit = vi.spyOn(device, 'submit');
    const history = new GPUTextureHistory(device, {
      id: 'temporal-color',
      format: 'rgba8unorm',
      width: 8,
      height: 4,
      usage: TEXTURE_USAGE
    });

    try {
      const firstTexture = history.previousTexture;
      const secondTexture = history.currentTexture;
      expect(createTexture).toHaveBeenCalledTimes(2);
      expect(firstTexture).not.toBe(secondTexture);
      expect(firstTexture.id).toBe('temporal-color-previous');
      expect(secondTexture.id).toBe('temporal-color-current');
      expect(firstTexture.width).toBe(8);
      expect(secondTexture.height).toBe(4);
      expect(firstTexture.format).toBe(secondTexture.format);
      expect(firstTexture.props.usage).toBe(secondTexture.props.usage);
      expect(history.getBindings('history', 'output')).toEqual({
        history: firstTexture,
        output: secondTexture
      });

      history.advance();
      expect(history.previousTexture).toBe(secondTexture);
      expect(history.currentTexture).toBe(firstTexture);
      expect(history.getBindings('history', 'output')).toEqual({
        history: secondTexture,
        output: firstTexture
      });

      history.advance();
      expect(history.previousTexture).toBe(firstTexture);
      history.advance();
      history.reset();
      expect(history.previousTexture).toBe(firstTexture);
      expect(history.currentTexture).toBe(secondTexture);
      expect(submit).not.toHaveBeenCalled();

      history.destroy();
      expect(firstTexture.destroyed).toBe(true);
      expect(secondTexture.destroyed).toBe(true);
      history.destroy();
      expect(() => history.advance()).toThrow(/destroyed/i);
      expect(() => history.reset()).toThrow(/destroyed/i);
      expect(() => history.getBindings('history', 'output')).toThrow(/destroyed/i);
    } finally {
      history.destroy();
      device.destroy();
    }
  });

  test('rejects duplicate previous/current binding identifiers', () => {
    const device = createHistoryDevice('history-identifiers');
    const history = createHistory(device);

    try {
      expect(() => history.getBindings('history', 'history')).toThrow(/identifiers must differ/i);
    } finally {
      history.destroy();
      device.destroy();
    }
  });

  test('destroys the first allocation if creating the second texture fails', () => {
    const device = createHistoryDevice('history-partial-allocation');
    const originalCreateTexture = device.createTexture.bind(device);
    let firstTexture: Texture | undefined;
    vi.spyOn(device, 'createTexture')
      .mockImplementationOnce(props => {
        firstTexture = originalCreateTexture(props);
        return firstTexture;
      })
      .mockImplementationOnce(() => {
        throw new Error('second history allocation failed');
      });

    try {
      expect(() => createHistory(device)).toThrow('second history allocation failed');
      expect(firstTexture?.destroyed).toBe(true);
    } finally {
      device.destroy();
    }
  });

  test('rebinds both roles repeatedly without recompiling or submitting the graph', () => {
    const device = createHistoryDevice('history-role-rebinding');
    const history = createHistory(device);
    const graph = new GPUCommandGraph(device, {id: 'history-role-rebinding'});
    const previous = importHistoryTexture(graph, 'previous', history.previousTexture);
    const current = importHistoryTexture(graph, 'current', history.currentTexture);
    const observedTextures: [Texture, Texture][] = [];
    const submit = vi.spyOn(device, 'submit');
    graph.addCopyPass({
      id: 'observe-history-roles',
      resources: [
        {texture: previous, usage: 'sampled'},
        {texture: current, usage: 'storage-write'}
      ],
      compile: () => ({
        encode: ({getTexture}) => {
          observedTextures.push([getTexture(previous), getTexture(current)]);
        }
      })
    });
    const compiled = graph.compile();
    const firstTexture = history.previousTexture;
    const secondTexture = history.currentTexture;

    try {
      for (let frameIndex = 0; frameIndex < 3; frameIndex++) {
        const commandEncoder = device.createCommandEncoder({id: `history-frame-${frameIndex}`});
        try {
          compiled.encode(commandEncoder, {
            parameters: undefined,
            textures: history.getBindings('previous', 'current')
          });
          history.advance();
        } finally {
          commandEncoder.destroy();
        }
      }

      expect(observedTextures).toEqual([
        [firstTexture, secondTexture],
        [secondTexture, firstTexture],
        [firstTexture, secondTexture]
      ]);
      expect(submit).not.toHaveBeenCalled();
      compiled.destroy();
      expect(firstTexture.destroyed).toBe(false);
      expect(secondTexture.destroyed).toBe(false);
    } finally {
      compiled.destroy();
      history.destroy();
      device.destroy();
    }
  });

  test('does not advance texture roles when graph encoding fails', () => {
    const device = createHistoryDevice('history-failed-encoding');
    const history = createHistory(device);
    const graph = new GPUCommandGraph(device, {id: 'history-failed-encoding'});
    const previous = importHistoryTexture(graph, 'previous', history.previousTexture);
    const current = importHistoryTexture(graph, 'current', history.currentTexture);
    graph.addCopyPass({
      id: 'reject-history-encoding',
      resources: [
        {texture: previous, usage: 'sampled'},
        {texture: current, usage: 'storage-write'}
      ],
      compile: () => ({
        encode: () => {
          throw new Error('history graph encoding failed');
        }
      })
    });
    const compiled = graph.compile();
    const commandEncoder = device.createCommandEncoder({id: 'rejected-history-encoding'});
    const previousTexture = history.previousTexture;
    const currentTexture = history.currentTexture;

    try {
      expect(() =>
        compiled.encode(commandEncoder, {
          parameters: undefined,
          textures: history.getBindings('previous', 'current')
        })
      ).toThrow('history graph encoding failed');
      expect(history.previousTexture).toBe(previousTexture);
      expect(history.currentTexture).toBe(currentTexture);
    } finally {
      commandEncoder.destroy();
      compiled.destroy();
      history.destroy();
      device.destroy();
    }
  });
});

describe('GPUCommandGraph physical imported-texture ownership', () => {
  test.each([
    {firstUsage: 'sampled', secondUsage: 'storage-write'},
    {firstUsage: 'storage-write', secondUsage: 'sampled'},
    {firstUsage: 'storage-read', secondUsage: 'storage-read-write'},
    {firstUsage: 'sampled', secondUsage: 'copy-destination'},
    {firstUsage: 'sampled', secondUsage: 'render-attachment'}
  ] as const)('rejects aliased active textures when $firstUsage meets $secondUsage', ({
    firstUsage,
    secondUsage
  }) => {
    const device = createHistoryDevice('writable-texture-alias');
    const texture = createHistoryTexture(device, 'shared-texture');
    const graph = new GPUCommandGraph(device, {id: 'writable-texture-alias'});
    const previous = importHistoryTexture(graph, 'previous', texture);
    const current = importHistoryTexture(graph, 'current', texture);
    const encode = vi.fn();
    graph.addCopyPass({
      id: 'reject-writable-texture-alias',
      resources: [
        {texture: previous, usage: firstUsage},
        {texture: current, usage: secondUsage}
      ],
      compile: () => ({encode})
    });
    const compiled = graph.compile();
    const commandEncoder = device.createCommandEncoder({id: 'rejected-texture-alias'});

    try {
      expect(() => compiled.encode(commandEncoder, {parameters: undefined})).toThrow(
        /previous.*current.*same physical texture/i
      );
      expect(encode).not.toHaveBeenCalled();
      expect(texture.destroyed).toBe(false);
    } finally {
      commandEncoder.destroy();
      compiled.destroy();
      texture.destroy();
      device.destroy();
    }
  });

  test('permits two active read-only handles to share one physical texture', () => {
    const device = createHistoryDevice('readonly-texture-alias');
    const texture = createHistoryTexture(device, 'shared-readonly-texture');
    const graph = new GPUCommandGraph(device, {id: 'readonly-texture-alias'});
    const first = importHistoryTexture(graph, 'first-reader', texture);
    const second = importHistoryTexture(graph, 'second-reader', texture);
    const encode = vi.fn();
    graph.addCopyPass({
      id: 'read-shared-texture',
      resources: [
        {texture: first, usage: 'sampled'},
        {texture: second, usage: 'storage-read'}
      ],
      compile: () => ({encode})
    });
    const compiled = graph.compile();
    const commandEncoder = device.createCommandEncoder({id: 'accepted-texture-alias'});

    try {
      compiled.encode(commandEncoder, {parameters: undefined});
      expect(encode).toHaveBeenCalledTimes(1);
      expect(texture.destroyed).toBe(false);
    } finally {
      commandEncoder.destroy();
      compiled.destroy();
      texture.destroy();
      device.destroy();
    }
  });

  test('rejects an aliased override but accepts a later compatible retry', () => {
    const device = createHistoryDevice('texture-alias-override');
    const firstTexture = createHistoryTexture(device, 'first-texture');
    const secondTexture = createHistoryTexture(device, 'second-texture');
    const graph = new GPUCommandGraph(device, {id: 'texture-alias-override'});
    const first = importHistoryTexture(graph, 'first', firstTexture);
    const second = importHistoryTexture(graph, 'second', secondTexture);
    const encode = vi.fn();
    graph.addCopyPass({
      id: 'observe-texture-override',
      resources: [
        {texture: first, usage: 'sampled'},
        {texture: second, usage: 'storage-write'}
      ],
      compile: () => ({encode})
    });
    const compiled = graph.compile();
    const rejectedEncoder = device.createCommandEncoder({id: 'rejected-override'});
    const validEncoder = device.createCommandEncoder({id: 'accepted-override'});

    try {
      expect(() =>
        compiled.encode(rejectedEncoder, {
          parameters: undefined,
          textures: {second: firstTexture}
        })
      ).toThrow(/first.*second.*same physical texture/i);
      expect(encode).not.toHaveBeenCalled();

      compiled.encode(validEncoder, {
        parameters: undefined,
        textures: {second: secondTexture}
      });
      expect(encode).toHaveBeenCalledTimes(1);
    } finally {
      rejectedEncoder.destroy();
      validEncoder.destroy();
      compiled.destroy();
      firstTexture.destroy();
      secondTexture.destroy();
      device.destroy();
    }
  });

  test('rejects writable frame-texture aliases without consuming their frame identifier', () => {
    const device = createHistoryDevice('frame-texture-alias');
    const persistentTexture = createHistoryTexture(device, 'persistent-texture');
    const frameTexture = createHistoryTexture(device, 'frame-texture');
    const graph = new GPUCommandGraph(device, {id: 'frame-texture-alias'});
    const previous = importHistoryTexture(graph, 'previous', persistentTexture);
    const current = graph.importFrameTexture({
      id: 'frame',
      format: 'rgba8unorm',
      width: 4,
      height: 4,
      usage: TEXTURE_USAGE
    });
    const encode = vi.fn();
    graph.addCopyPass({
      id: 'observe-frame-texture',
      resources: [
        {texture: previous, usage: 'sampled'},
        {texture: current, usage: 'storage-write'}
      ],
      compile: () => ({encode})
    });
    const compiled = graph.compile();
    const rejectedEncoder = device.createCommandEncoder({id: 'rejected-frame-texture'});
    const validEncoder = device.createCommandEncoder({id: 'accepted-frame-texture'});

    try {
      expect(() =>
        compiled.encode(rejectedEncoder, {
          parameters: undefined,
          frameTextures: {frame: {texture: persistentTexture, frameId: 0}}
        })
      ).toThrow(/previous.*frame.*same physical texture/i);
      expect(encode).not.toHaveBeenCalled();

      compiled.encode(validEncoder, {
        parameters: undefined,
        frameTextures: {frame: {texture: frameTexture, frameId: 0}}
      });
      expect(encode).toHaveBeenCalledTimes(1);
    } finally {
      rejectedEncoder.destroy();
      validEncoder.destroy();
      compiled.destroy();
      persistentTexture.destroy();
      frameTexture.destroy();
      device.destroy();
    }
  });

  test('ignores duplicate imports that no graph node uses', () => {
    const device = createHistoryDevice('inactive-texture-alias');
    const texture = createHistoryTexture(device, 'inactive-shared-texture');
    const graph = new GPUCommandGraph(device, {id: 'inactive-texture-alias'});
    const active = importHistoryTexture(graph, 'active', texture);
    importHistoryTexture(graph, 'inactive', texture);
    const encode = vi.fn();
    graph.addCopyPass({
      id: 'write-active-texture',
      resources: [{texture: active, usage: 'storage-write'}],
      compile: () => ({encode})
    });
    const compiled = graph.compile();
    const commandEncoder = device.createCommandEncoder({id: 'inactive-alias-encoding'});

    try {
      compiled.encode(commandEncoder, {parameters: undefined});
      expect(encode).toHaveBeenCalledTimes(1);
    } finally {
      commandEncoder.destroy();
      compiled.destroy();
      texture.destroy();
      device.destroy();
    }
  });
});

function createHistoryDevice(identifier: string): NullDevice {
  const device = new NullDevice({id: `${identifier}-device`});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  return device;
}

function createHistory(device: Device): GPUTextureHistory<'rgba8unorm'> {
  return new GPUTextureHistory(device, {
    id: 'history',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: TEXTURE_USAGE
  });
}

function createHistoryTexture(device: Device, identifier: string): Texture {
  return device.createTexture({
    id: identifier,
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: TEXTURE_USAGE
  });
}

function importHistoryTexture(
  graph: GPUCommandGraph,
  identifier: string,
  texture: Texture
): GraphTextureHandle<'rgba8unorm'> {
  return graph.importTexture(
    {
      id: identifier,
      format: 'rgba8unorm',
      width: 4,
      height: 4,
      usage: TEXTURE_USAGE
    },
    texture
  );
}
