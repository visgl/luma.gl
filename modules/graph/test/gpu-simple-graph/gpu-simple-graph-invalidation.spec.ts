// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {GPUDataEvaluator, GPUEvaluationScope} from '@luma.gl/gpgpu';
import {GPUData, type GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPURenderOperation} from '@luma.gl/graph/gpu-core';
import {
  GPUSimpleGraph,
  GPUSimpleGraphValue,
  simpleGraphOperations
} from '@luma.gl/graph/gpu-simple-graph';

for (const [backend, getDevice] of [
  ['webgl', getWebGLTestDevice],
  ['webgpu', getWebGPUTestDevice]
] as const) {
  it(`invalidates only changed channels and preserves borrowed output targets on ${backend}`, async ({
    skip
  }) => {
    const device = await getDevice();
    if (!device) return skip();
    const data = new Float32Array([1, 2, 3]);
    const graph = new GPUSimpleGraph(device);
    const input = graph.addValue('input', GPUSimpleGraphValue.upload(data));
    graph.addValue('changed', simpleGraphOperations.multiply(input, 2));
    graph.addValue(
      'unchanged',
      simpleGraphOperations.add(GPUSimpleGraphValue.upload(new Float32Array([10, 20, 30])), 1)
    );
    const target = device.createBuffer({
      byteLength: 32,
      usage: Buffer.VERTEX | Buffer.COPY_DST | Buffer.COPY_SRC
    });
    const compiled = graph.compile({
      outputs: ['changed', 'unchanged'],
      outputTargets: {changed: {buffer: target, byteOffset: 4, byteStride: 8}}
    });
    try {
      const initial = await compiled.run();
      const read = async () => readOutput(compiled.outputs.changed.gpuVector);
      expect(await read()).toEqual([2, 4, 6]);
      data[0] = 8;
      expect((await compiled.run()).changed).toBe(initial.changed);
      expect(() => compiled.invalidate(['input', 'missing'])).toThrow();
      expect((await compiled.run()).changed).toBe(initial.changed);
      compiled.invalidate(['input']);
      const updated = backend === 'webgl' ? compiled.runSync() : await compiled.run();
      expect(updated.unchanged).toBe(initial.unchanged);
      expect(updated.changed.data[0].buffer).toBe(target);
      expect(await read()).toEqual([16, 4, 6]);
      data[1] = 9;
      compiled.invalidate(['input']);
      if (backend === 'webgpu') {
        const scope = new GPUEvaluationScope(device);
        await compiled.run({scope});
        expect(() => compiled.invalidate(['input'])).toThrow();
        scope.cancel();
      }
      await compiled.run();
      expect(await read()).toEqual([16, 18, 6]);
      expect(compiled.outputs.changed.gpuVector.data[0].buffer).toBe(target);
    } finally {
      compiled.destroy();
      expect(target.destroyed).toBe(false);
      target.destroy();
    }
  });

  it(`refreshes collected vectors without invalidating unchanged chunks on ${backend}`, async ({
    skip
  }) => {
    const device = await getDevice();
    if (!device) return skip();
    const data = new Float32Array([1, 2]);
    const graph = new GPUSimpleGraph(device);
    const first = graph.addValue('first', GPUSimpleGraphValue.upload(data));
    const second = GPUSimpleGraphValue.upload(new Float32Array([3]));
    graph.addValue('result', [
      simpleGraphOperations.multiply(first, 2),
      simpleGraphOperations.multiply(second, 2)
    ]);
    const compiled = graph.compile();
    try {
      const initial = (await compiled.run()).result;
      data[0] = 7;
      compiled.invalidate(['first']);
      const updated = (await compiled.run()).result;
      expect(updated.data.map(chunk => chunk.length)).toEqual([2, 1]);
      expect(updated.data[1]).toBe(initial.data[1]);
      expect(await readOutput(compiled.outputs.result.gpuVector)).toEqual([14, 4, 6]);
    } finally {
      compiled.destroy();
    }
  });

  it(`invalidates borrowed GPU input readbacks without losing the source on ${backend}`, async ({
    skip
  }) => {
    const device = await getDevice();
    if (!device) return skip();
    const buffer = device.createBuffer({
      data: new Float32Array([2, 3]),
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    const graph = new GPUSimpleGraph(device);
    const input = graph.addValue(
      'input',
      GPUSimpleGraphValue.fromGPUData(new GPUData({buffer, format: 'float32', length: 2}))
    );
    graph.addValue('output', simpleGraphOperations.multiply(input, 3));
    const compiled = graph.compile({outputs: ['input', 'output']});
    try {
      await compiled.run();
      expect(await readOutput(compiled.outputs.input.gpuVector)).toEqual([2, 3]);
      buffer.write(new Float32Array([4, 5]));
      compiled.invalidate(['input']);
      await compiled.run();
      expect(compiled.outputs.input.gpuVector.data[0].buffer).toBe(buffer);
      expect(await readOutput(compiled.outputs.input.gpuVector)).toEqual([4, 5]);
      expect(await readOutput(compiled.outputs.output.gpuVector)).toEqual([12, 15]);
    } finally {
      compiled.destroy();
      buffer.destroy();
    }
  });

  it(`rebinds render buffers/textures and skips unchanged channels on ${backend}`, async ({
    skip
  }) => {
    const device = await getDevice();
    if (!device) return skip();
    const original = device.createTexture({
      format: 'rgba8unorm',
      width: 2,
      height: 2,
      usage: Texture.RENDER
    });
    const replacement = device.createTexture({
      format: 'rgba8unorm',
      width: 2,
      height: 2,
      usage: Texture.RENDER
    });
    const originalBuffer = device.createBuffer({byteLength: 16, usage: Buffer.VERTEX});
    const replacementBuffer = device.createBuffer({byteLength: 16, usage: Buffer.VERTEX});
    const wrongTexture = device.createTexture({
      format: 'rgba8unorm',
      width: 4,
      height: 4,
      usage: Texture.RENDER
    });
    const encode = vi.fn();
    const compile = vi.fn();
    const graph = new GPUSimpleGraph<{dirty: boolean}>(device);
    graph.add(
      new GPURenderOperation<{dirty: boolean}>({
        id: 'channel',
        createNodes: resources => {
          const texture = resources.importTexture(
            {id: 'target', format: 'rgba8unorm', width: 2, height: 2, usage: Texture.RENDER},
            original
          );
          const buffer = resources.importBuffer(
            {id: 'vertices', byteLength: 16, usage: Buffer.VERTEX},
            originalBuffer
          );
          return [
            {
              type: 'render',
              id: 'channel-pass',
              condition: {
                id: 'channel-dirty',
                source: 'cpu',
                evaluate: parameters => parameters.dirty
              },
              resources: [{buffer, usage: 'vertex'}],
              attachments: {colorAttachments: [resources.createTextureView(texture)]},
              compile: () => {
                compile();
                return {
                  encode: context => encode(context.getTexture(texture), context.getBuffer(buffer))
                };
              }
            }
          ];
        }
      })
    );
    const compiled = graph.compile();
    try {
      await compiled.run({parameters: {dirty: true}});
      expect(encode).toHaveBeenLastCalledWith(original, originalBuffer);
      await compiled.run({parameters: {dirty: false}});
      expect(encode).toHaveBeenCalledTimes(1);
      const options = {
        parameters: {dirty: true},
        textures: {target: replacement},
        buffers: {vertices: replacementBuffer}
      };
      if (backend === 'webgl') compiled.runSync(options);
      else await compiled.run(options);
      expect(encode).toHaveBeenLastCalledWith(replacement, replacementBuffer);
      expect(compile).toHaveBeenCalledTimes(1);
      await expect(
        compiled.run({parameters: {dirty: true}, textures: {target: wrongTexture}})
      ).rejects.toThrow(/width/);
      expect(encode).toHaveBeenCalledTimes(2);
    } finally {
      compiled.destroy();
      expect(original.destroyed).toBe(false);
      expect(replacement.destroyed).toBe(false);
      original.destroy();
      replacement.destroy();
      wrongTexture.destroy();
      originalBuffer.destroy();
      replacementBuffer.destroy();
    }
  });
}

it('rejects invalidation of legacy borrowed evaluators atomically', async ({skip}) => {
  const device = await getWebGLTestDevice();
  if (!device) return skip();
  const graph = new GPUSimpleGraph(device);
  const input = GPUDataEvaluator.fromArray(new Float32Array([1, 2]), {});
  graph.addEvaluator('borrowed', input);
  const compiled = graph.compile();
  try {
    const initial = await compiled.run();
    expect(() => compiled.invalidate(['borrowed'])).toThrow();
    expect((await compiled.run()).borrowed).toBe(initial.borrowed);
  } finally {
    compiled.destroy();
    input.destroy();
  }
});

async function readOutput(vector: GPUVector): Promise<number[]> {
  const values: number[] = [];
  for (const chunk of vector.data) {
    const reader = GPUDataEvaluator.fromGPUData(chunk);
    try {
      values.push(...(await reader.readValue()));
    } finally {
      reader.destroy();
    }
  }
  return values;
}
