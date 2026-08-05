// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Texture, type Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {decodeGPUIndexPickInfo, INDEX_PICKING_READBACK_BYTE_LENGTH} from '@luma.gl/experimental';
import type {GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import LuGraphExplorerAnimationLoopTemplate from '../../../../examples/experimental/lugraph-explorer/app';
import {makeGraphExplorerDataset} from '../../../../examples/experimental/lugraph-explorer/graph-data';

type ExplorerGraphBindings = {
  frameColorId: string;
  frameDepthId: string;
  pickingReadbackId: string;
  frameWidth: number;
  frameHeight: number;
};

test('luGraph explorer constructs actual GPU models and computes source-aligned graph analytics', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const submitSpy = vi.spyOn(device, 'submit');
  let explorer: LuGraphExplorerAnimationLoopTemplate | undefined;
  try {
    explorer = new LuGraphExplorerAnimationLoopTemplate({device} as AnimationProps);
    tapeTest.equal(submitSpy.mock.calls.length, 0, 'construction never submits hidden GPU work');
    submitSpy.mockRestore();

    const dataset = makeGraphExplorerDataset();
    tapeTest.equal(
      explorer.graph.vertexCount,
      dataset.vertexCount,
      'source vertex identities stay stable'
    );
    tapeTest.deepEqual(
      explorer.graph.sourceVertices.data.map(chunk => chunk.length),
      dataset.sourceChunks.map(chunk => chunk.length),
      'source edge vectors retain original nonempty, empty, and nonempty batches'
    );
    tapeTest.deepEqual(
      explorer.edgeModels.map(model => model.chunkIndex),
      [0, 2],
      'each nonempty original edge batch has its own directly bound edge model'
    );
    tapeTest.ok(
      explorer.nodeModel.pipeline,
      'actual WebGPU node shader and vertex pipeline compile'
    );
    tapeTest.ok(
      explorer.pickingModel.pipeline,
      'actual integer picking shader and pipeline compile'
    );
    tapeTest.equal(
      explorer.layout.positions.data[0].buffer.usage & (Buffer.STORAGE | Buffer.VERTEX),
      Buffer.STORAGE | Buffer.VERTEX,
      'progressive layout coordinates are the same physical render vertex allocation'
    );

    executeAnalysis(device, explorer);
    const [degrees, componentLabels, importance, forwardCount, reverseCount, invalid, overflow] =
      await Promise.all([
        readUint32Vector(explorer.degree.output),
        readUint32Vector(explorer.components.output),
        readFloat32Vector(explorer.pageRank.output),
        readUint32Vector(explorer.topology.forward.count),
        readUint32Vector(explorer.topology.reverse!.count),
        readUint32Vector(explorer.topology.invalidEdgeCount),
        readUint32Vector(explorer.topology.forward.overflow)
      ]);

    tapeTest.equal(
      forwardCount[0],
      explorer.graph.edgeCount,
      'GPU builds every original directed edge'
    );
    tapeTest.equal(reverseCount[0], explorer.graph.edgeCount, 'GPU builds full reverse adjacency');
    tapeTest.equal(invalid[0], 0, 'deterministic dataset contains no invalid source identifiers');
    tapeTest.equal(overflow[0], 0, 'caller-owned graph adjacency has adequate explicit capacity');
    tapeTest.equal(
      degrees.reduce((sum, degree) => sum + degree, 0),
      explorer.graph.edgeCount,
      'GPU degree outputs exactly account for all original source edges'
    );
    tapeTest.equal(degrees[dataset.vertexCount - 1], 0, 'final isolated vertex has degree zero');
    tapeTest.equal(
      componentLabels[0],
      0,
      'first community retains minimum stable source identifier'
    );
    tapeTest.equal(
      componentLabels[32],
      0,
      'one actual bridge joins the first two weak communities'
    );
    tapeTest.equal(componentLabels[64], 64, 'third disconnected community keeps its own component');
    tapeTest.equal(
      componentLabels[96],
      96,
      'fourth disconnected community keeps its own component'
    );
    tapeTest.equal(
      componentLabels[dataset.vertexCount - 1],
      dataset.vertexCount - 1,
      'isolated node retains its own stable component identifier'
    );
    tapeTest.ok(
      importance.every(score => Number.isFinite(score) && score > 0),
      'real dangling-aware PageRank supplies positive node sizing values'
    );
    tapeTest.ok(
      Math.abs(importance.reduce((sum, score) => sum + score, 0) - 1) < 5e-5,
      'GPU node importance remains correctly normalized'
    );
  } finally {
    submitSpy.mockRestore();
    explorer?.onFinalize();
  }

  tapeTest.end();
});

test('luGraph explorer renders original GPU chunks, highlights neighborhoods, pins, and picks stable nodes', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  let explorer: LuGraphExplorerAnimationLoopTemplate | undefined;
  let color: Texture | undefined;
  let depth: Texture | undefined;
  let pickingReadback: Buffer | undefined;
  const devicePixelSizeSpy = vi
    .spyOn(device.getDefaultCanvasContext(), 'getDevicePixelSize')
    .mockReturnValue([320, 240]);
  try {
    explorer = new LuGraphExplorerAnimationLoopTemplate({device} as AnimationProps);
    const bindings = explorer as unknown as ExplorerGraphBindings;
    tapeTest.deepEqual(
      [bindings.frameWidth, bindings.frameHeight],
      [320, 240],
      'GPU picking uses real centered device pixels rather than assuming a one-pixel test canvas'
    );
    color = device.createTexture({
      id: 'lugraph-explorer-test-color',
      format: device.preferredColorFormat,
      width: bindings.frameWidth,
      height: bindings.frameHeight,
      usage: Texture.RENDER
    });
    depth = device.createTexture({
      id: 'lugraph-explorer-test-depth',
      format: 'depth24plus',
      width: bindings.frameWidth,
      height: bindings.frameHeight,
      usage: Texture.RENDER
    });
    pickingReadback = device.createBuffer({
      id: 'lugraph-explorer-test-picking-readback',
      byteLength: INDEX_PICKING_READBACK_BYTE_LENGTH,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });

    // Preserve one centered instance so its true rendered circle covers the current canvas center.
    (explorer.layout.positions.data[0].buffer as Buffer).write(Float32Array.from([0, 0]));
    (explorer.layout.pinned!.data[0].buffer as Buffer).write(Uint32Array.from([1]));

    const encoder = device.createCommandEncoder({id: 'lugraph-explorer-real-frame'});
    explorer.analysisGraph.encode(encoder, {parameters: undefined});
    explorer.frameGraph.encode(encoder, {
      parameters: {width: bindings.frameWidth, height: bindings.frameHeight},
      frameTextures: {
        [bindings.frameColorId]: {texture: color, frameId: 0},
        [bindings.frameDepthId]: {texture: depth, frameId: 0}
      }
    });
    explorer.pickingGraph.encode(encoder, {
      parameters: {
        pixel: [Math.floor(bindings.frameWidth / 2), Math.floor(bindings.frameHeight / 2)]
      },
      buffers: {[bindings.pickingReadbackId]: pickingReadback}
    });
    device.submit(encoder.finish());

    const [distances, mask, pin, bytes] = await Promise.all([
      readUint32Vector(explorer.search.distances),
      readUint32Vector(explorer.search.mask!),
      readUint32Vector(explorer.layout.pinned!),
      pickingReadback.readAsync(0, 8)
    ]);
    const pick = decodeGPUIndexPickInfo(bytes);

    tapeTest.equal(distances[0], 0, 'selected root is highlighted at GPU hop distance zero');
    tapeTest.ok(
      distances.some(distance => distance === 1 || distance === 2),
      'GPU traversal publishes a bounded multi-hop neighborhood'
    );
    tapeTest.equal(mask[0], 1, 'node shader receives the source-aligned GPU selection mask');
    tapeTest.equal(
      mask[explorer.graph.vertexCount - 1],
      0,
      'disconnected isolated nodes remain outside the highlighted component'
    );
    tapeTest.equal(pin[0], 1, 'dragged node remains pinned through force integration');
    tapeTest.equal(
      pick.objectIndex,
      0,
      'integer GPU picking recovers the original stable vertex ID'
    );
  } finally {
    devicePixelSizeSpy.mockRestore();
    pickingReadback?.destroy();
    depth?.destroy();
    color?.destroy();
    explorer?.onFinalize();
  }

  tapeTest.end();
});

function executeAnalysis(device: Device, explorer: LuGraphExplorerAnimationLoopTemplate): void {
  const encoder = device.createCommandEncoder({id: 'lugraph-explorer-analysis-test'});
  explorer.analysisGraph.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
}

async function readUint32Vector(vector: GPUVector<'uint32'>): Promise<number[]> {
  if (vector.length === 0) return [];
  const chunk = vector.data[0];
  const bytes = await (chunk.buffer as Buffer).readAsync(chunk.byteOffset, vector.length * 4);
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, vector.length));
}

async function readFloat32Vector(vector: GPUVector<'float32'>): Promise<number[]> {
  if (vector.length === 0) return [];
  const chunk = vector.data[0];
  const bytes = await (chunk.buffer as Buffer).readAsync(chunk.byteOffset, vector.length * 4);
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, vector.length));
}
