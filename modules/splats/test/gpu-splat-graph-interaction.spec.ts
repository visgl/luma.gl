// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture, type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {
  GPUSplatGraphRenderer,
  makeGPUSplatData,
  type SplatPickingInfo,
  type SplatSource
} from '@luma.gl/splats';
import {getTestDevices} from '@luma.gl/test-utils';
import {GPUSplatGraphMixedRenderer, GPUSplatGraphPicker} from '../src/gpu-splat-graph-interaction';

it('GPUSplatGraphPicker reads original streamed identities from one real WebGPU indirect draw', async () => {
  const devices = await getTestDevices(['webgpu']);
  expect(Boolean(devices.length > 0), 'a browser WebGPU graphics device is available').toBe(true);

  for (const device of devices) {
    if (isSoftwareBackedGraphInteractionDevice(device)) {
      void 0;
      continue;
    }

    const firstBatch = makeGPUSplatData(
      device,
      makeBrowserGraphInteractionSource({
        depths: [0.8, 0.05],
        opacities: [1, 0],
        semanticIds: [4, 99],
        sourceBatchIndex: 500,
        rowIndexBase: 100
      })
    );
    const renderer = new GPUSplatGraphRenderer(device, {
      data: firstBatch,
      expectedSplatCount: 3,
      expectedBatchCount: 2,
      viewportSize: [1, 1],
      alphaCutoff: 0.01
    });
    const notifications: SplatPickingInfo[] = [];
    const picker = new GPUSplatGraphPicker(renderer, {onPick: info => notifications.push(info)});

    expect(
      await picker.pick([0, 0]),
      'reads the first projected Gaussian while excluding a nearer GPU-culled transparent source'
    ).toEqual({batchIndex: 500, rowIndex: 100, batchRowIndex: 0, semanticId: 4});
    expect(
      Boolean(picker.model?.pipeline.isErrored),
      'compiles the projected-record integer GPU pipeline'
    ).toBe(false);
    const initialGraph = renderer.compiledGraph;
    const initialPickingModel = picker.model;
    const initialProjectedRecords = renderer.projectedRecordBuffer;
    const initialSortedIndices = renderer.sortedIndexBuffer;

    const secondBatch = makeGPUSplatData(
      device,
      makeBrowserGraphInteractionSource({
        depths: [0.2],
        opacities: [1],
        semanticIds: [8],
        sourceBatchIndex: 65_535,
        rowIndexBase: 2_000_000_000
      })
    );
    renderer.appendData(secondBatch);
    expect(
      await picker.pick([0, 0], {force: true}),
      'restores a near streamed batch, original class, and high signed-32-bit global source row'
    ).toEqual({batchIndex: 65_535, rowIndex: 2_000_000_000, batchRowIndex: 0, semanticId: 8});
    expect(renderer.compiledGraph, 'reuses the original progressive command graph').toBe(
      initialGraph
    );
    expect(picker.model, 'reuses the original projected-record picking model').toBe(
      initialPickingModel
    );
    expect(
      renderer.projectedRecordBuffer,
      'never rebuilds or reuploads already projected Gaussian source allocations'
    ).toBe(initialProjectedRecords);
    expect(renderer.sortedIndexBuffer, 'borrows the existing globally sorted GPU permutation').toBe(
      initialSortedIndices
    );

    renderer.setProps({semanticFilter: {include: [4]}});
    expect(
      await picker.pick([0, 0], {force: true}),
      'excludes nearer rejected classes through graph-native semantic visibility'
    ).toEqual({batchIndex: 500, rowIndex: 100, batchRowIndex: 0, semanticId: 4});
    renderer.setProps({semanticFilter: {include: [8]}});
    expect(
      await picker.pick([0, 0], {force: true}),
      'updates semantic graph picking without rebuilding projected or sorted source buffers'
    ).toEqual({batchIndex: 65_535, rowIndex: 2_000_000_000, batchRowIndex: 0, semanticId: 8});
    expect(renderer.compiledGraph, 'reuses the compiled graph for semantic updates').toBe(
      initialGraph
    );
    renderer.setProps({semanticFilter: undefined});

    secondBatch.updateRows(0, {opacities: new Float32Array([0])});
    expect(
      await picker.pick([0, 0], {force: true}),
      'honors graph-native source revisions and GPU visibility without CPU row projection'
    ).toEqual({batchIndex: 500, rowIndex: 100, batchRowIndex: 0, semanticId: 4});

    const thirdBatch = makeGPUSplatData(
      device,
      makeBrowserGraphInteractionSource({
        depths: [0.1],
        opacities: [1],
        semanticIds: [12],
        sourceBatchIndex: 1_000_001,
        rowIndexBase: 1_900_000_000
      })
    );
    renderer.appendData(thirdBatch);
    expect(
      await picker.pick([0, 0], {force: true}),
      'rebinds graph-owned picking resources safely after progressive source capacity grows'
    ).toEqual({batchIndex: 1_000_001, rowIndex: 1_900_000_000, batchRowIndex: 0, semanticId: 12});
    expect(
      picker.model,
      'replaces its borrowed picking model when graph-projected allocations are rebuilt'
    ).not.toBe(initialPickingModel);
    expect(
      Boolean(initialProjectedRecords?.destroyed),
      'the graph owns and releases superseded projections'
    ).toBe(true);

    renderer.setProps({data: firstBatch});
    expect(
      await picker.pick([0, 0], {force: true}),
      'rebuilds source-offset identity after residency replaces the complete graph frontier'
    ).toEqual({batchIndex: 500, rowIndex: 100, batchRowIndex: 0, semanticId: 4});
    expect(
      Boolean(secondBatch.destroyed),
      'frontier replacement never destroys a borrowed source batch'
    ).toBe(false);
    expect(
      Boolean(thirdBatch.destroyed),
      'frontier replacement preserves independently owned pages'
    ).toBe(false);
    expect(
      notifications.length,
      'publishes each changed original source identity exactly once'
    ).toBe(7);

    const sourcePositionBuffer = secondBatch.positions.data[0].buffer;
    picker.destroy();
    expect(Boolean(renderer.destroyed), 'does not destroy its borrowing graph renderer').toBe(
      false
    );
    expect(
      Boolean(sourcePositionBuffer.destroyed),
      'preserves caller-owned original GPU source buffers'
    ).toBe(false);
    renderer.destroy();
    firstBatch.destroy();
    secondBatch.destroy();
    thirdBatch.destroy();
  }

  void 0;
});

it('GPUSplatGraphMixedRenderer depth-tests real projected splats between opaque and transparent meshes', async () => {
  const devices = await getTestDevices(['webgpu']);
  expect(Boolean(devices.length > 0), 'a browser WebGPU graphics device is available').toBe(true);

  for (const device of devices) {
    if (isSoftwareBackedGraphInteractionDevice(device)) {
      void 0;
      continue;
    }

    const textureSize = 4;
    const source = makeBrowserGraphInteractionSource({
      depths: [0.5],
      opacities: [1],
      semanticIds: [7],
      sourceBatchIndex: 2,
      rowIndexBase: 50
    });
    source.colors.set([255, 0, 0, 255]);
    const sourceBatch = makeGPUSplatData(device, source);
    const graphRenderer = new GPUSplatGraphRenderer(device, {
      data: sourceBatch,
      expectedSplatCount: 1,
      expectedBatchCount: 1,
      viewportSize: [textureSize, textureSize],
      alphaCutoff: 0
    });
    const mixedRenderer = new GPUSplatGraphMixedRenderer(graphRenderer, {
      colorAttachmentFormat: 'rgba8unorm',
      depthStencilAttachmentFormat: 'depth24plus'
    });
    const colorTexture = device.createTexture({
      format: 'rgba8unorm',
      width: textureSize,
      height: textureSize,
      usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({
      width: textureSize,
      height: textureSize,
      colorAttachments: [colorTexture],
      depthStencilAttachment: 'depth24plus'
    });
    const opaqueMesh = new Model(device, {
      id: 'graph-mixed-opaque-mesh',
      source: getGraphInteractionMeshShader(0.1, 'vec4<f32>(0.0, 1.0, 0.0, 1.0)'),
      colorAttachmentFormats: ['rgba8unorm'],
      depthStencilAttachmentFormat: 'depth24plus',
      vertexCount: 3,
      parameters: {depthWriteEnabled: true, depthCompare: 'less-equal'}
    });
    const transparentMesh = new Model(device, {
      id: 'graph-mixed-transparent-mesh',
      source: getGraphInteractionMeshShader(0.05, 'vec4<f32>(0.0, 0.0, 1.0, 0.5)'),
      colorAttachmentFormats: ['rgba8unorm'],
      depthStencilAttachmentFormat: 'depth24plus',
      vertexCount: 3,
      parameters: {
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
    const pixelLayout = colorTexture.computeMemoryLayout({width: textureSize, height: textureSize});
    const readback = device.createBuffer({
      byteLength: pixelLayout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    const drawOrder: string[] = [];

    expect(
      Boolean(mixedRenderer.predraw(device.commandEncoder)),
      'projects and globally sorts the Gaussian before opening the shared mesh render pass'
    ).toBe(true);
    opaqueMesh.predraw(device.commandEncoder);
    transparentMesh.predraw(device.commandEncoder);
    const mixedPass = device.beginRenderPass({
      framebuffer,
      clearColor: [0, 0, 0, 0],
      clearDepth: 1
    });
    expect(
      Boolean(
        mixedRenderer.draw(mixedPass, {
          opaqueMeshes: [
            {
              draw(renderPass) {
                drawOrder.push('opaque');
                return opaqueMesh.draw(renderPass);
              }
            }
          ],
          transparentMeshes: [
            {
              draw(renderPass) {
                drawOrder.push('transparent');
                return transparentMesh.draw(renderPass);
              }
            }
          ]
        })
      ),
      'records opaque mesh, graph-visible Gaussian indirect draw, and transparent mesh'
    ).toBe(true);
    mixedPass.end();
    device.submit();
    colorTexture.readBuffer({width: textureSize, height: textureSize}, readback);
    const mixedPixels = await readback.readAsync(0, pixelLayout.byteLength);
    const centerPixelOffset = 2 * pixelLayout.bytesPerRow + 2 * 4;
    const occludedPixel = mixedPixels.slice(centerPixelOffset, centerPixelOffset + 4);

    expect(drawOrder, 'keeps caller meshes around the splat draw').toEqual([
      'opaque',
      'transparent'
    ]);
    expect(
      Boolean(occludedPixel[0] < 10 && occludedPixel[1] > 90 && occludedPixel[2] > 90),
      'opaque shared depth rejects the farther red splat while the nearer blue overlay blends'
    ).toBe(true);

    expect(
      Boolean(mixedRenderer.predraw(device.commandEncoder)),
      'reuses the projected graph and scene model'
    ).toBe(true);
    const unoccludedPass = device.beginRenderPass({
      framebuffer,
      clearColor: [0, 0, 0, 0],
      clearDepth: 1
    });
    expect(
      Boolean(mixedRenderer.draw(unoccludedPass)),
      'records the same globally sorted Gaussian indirect draw'
    ).toBe(true);
    unoccludedPass.end();
    device.submit();
    colorTexture.readBuffer({width: textureSize, height: textureSize}, readback);
    const unoccludedPixels = await readback.readAsync(0, pixelLayout.byteLength);
    const unoccludedPixel = unoccludedPixels.slice(centerPixelOffset, centerPixelOffset + 4);
    expect(
      Boolean(unoccludedPixel[0] > occludedPixel[0] + 100),
      'the unchanged graph-projected red Gaussian becomes visible when opaque depth is absent'
    ).toBe(true);
    expect(
      Boolean(mixedRenderer.model?.pipeline.isErrored),
      'compiles the shared-depth GPU scene pipeline'
    ).toBe(false);

    const sourcePositionBuffer = sourceBatch.positions.data[0].buffer;
    mixedRenderer.destroy();
    opaqueMesh.destroy();
    transparentMesh.destroy();
    readback.destroy();
    framebuffer.destroy();
    colorTexture.destroy();
    expect(
      Boolean(graphRenderer.destroyed),
      'scene composition never owns the borrowing graph renderer'
    ).toBe(false);
    expect(
      Boolean(sourcePositionBuffer.destroyed),
      'scene composition never owns prepared Gaussian data'
    ).toBe(false);
    graphRenderer.destroy();
    sourceBatch.destroy();
  }

  void 0;
});

function makeBrowserGraphInteractionSource({
  depths,
  opacities,
  semanticIds,
  sourceBatchIndex,
  rowIndexBase
}: {
  depths: readonly number[];
  opacities: readonly number[];
  semanticIds: readonly number[];
  sourceBatchIndex: number;
  rowIndexBase: number;
}): SplatSource {
  const positions = new Float32Array(depths.length * 3);
  const scales = new Float32Array(depths.length * 3);
  const rotations = new Float32Array(depths.length * 4);
  const colors = new Uint8Array(depths.length * 4);
  for (const [rowIndex, depth] of depths.entries()) {
    positions[rowIndex * 3 + 2] = depth;
    scales.set([1, 1, 0.1], rowIndex * 3);
    rotations[rowIndex * 4] = 1;
    colors.set([255, 128, 64, 255], rowIndex * 4);
  }
  return {
    positions,
    scales,
    rotations,
    colors,
    opacities: new Float32Array(opacities),
    semanticIds: new Uint32Array(semanticIds),
    sourceBatchIndex,
    rowIndexBase
  };
}

function isSoftwareBackedGraphInteractionDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}

function getGraphInteractionMeshShader(depth: number, color: string): string {
  return /* wgsl */ `\
@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  let corners = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  return vec4<f32>(corners[vertexIndex], ${depth}, 1.0);
}

@fragment
fn fragmentMain() -> @location(0) vec4<f32> {
  return ${color};
}
`;
}
