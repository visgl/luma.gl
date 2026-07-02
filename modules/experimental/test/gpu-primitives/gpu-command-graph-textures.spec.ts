// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, Texture, type Device} from '@luma.gl/core';
import {Computation, Model} from '@luma.gl/engine';
import {
  decodeGPUIndexPickInfo,
  GPUCommandGraph,
  GPUIndexPickingTarget,
  INDEX_PICKING_READBACK_BYTE_LENGTH
} from '@luma.gl/experimental';
import {getNullTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';

test('GPUCommandGraph validates texture descriptors, views, and imports', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const graph = new GPUCommandGraph(device, {id: 'texture-validation'});
  t.throws(
    () =>
      graph.createTransientTexture({
        id: 'invalid-size',
        format: 'rgba8unorm',
        width: 0,
        height: 4,
        usage: Texture.RENDER
      }),
    /positive safe integer/,
    'zero texture extent is rejected'
  );
  const mipTexture = graph.createTransientTexture({
    id: 'mips',
    format: 'rgba8unorm',
    width: 8,
    height: 8,
    mipLevels: 4,
    usage: Texture.SAMPLE | Texture.STORAGE
  });
  const mipTwo = graph.createTextureView(mipTexture, {
    baseMipLevel: 2,
    mipLevelCount: 1
  });
  t.equal(mipTwo.width, 2, 'view width reflects base mip');
  t.equal(mipTwo.height, 2, 'view height reflects base mip');
  t.throws(
    () => graph.createTextureView(mipTexture, {baseMipLevel: 4, mipLevelCount: 1}),
    /exceeds.*mip levels/,
    'view outside mip range is rejected'
  );
  t.throws(
    () =>
      graph.addComputePass({
        id: 'wrong-usage',
        resources: [{texture: mipTwo, usage: 'render-attachment'}],
        compile: () => ({encode: () => {}})
      }),
    /does not declare usage/,
    'node texture role must be declared by the descriptor'
  );

  const importedTexture = device.createTexture({
    id: 'imported-texture',
    width: 4,
    height: 4,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE
  });
  const importGraph = new GPUCommandGraph(device, {id: 'texture-import'});
  const imported = importGraph.importTexture(
    {
      id: 'imported',
      width: 4,
      height: 4,
      format: 'rgba8unorm',
      usage: Texture.SAMPLE
    },
    importedTexture
  );
  const importedView = importGraph.createTextureView(imported);
  const resolvedViews: unknown[] = [];
  importGraph.addComputePass({
    id: 'observe',
    resources: [{texture: importedView, usage: 'sampled'}],
    compile: () => ({
      encode: ({getTextureView}) => void resolvedViews.push(getTextureView(importedView))
    })
  });
  const compiled = importGraph.compile();
  compiled.encode(device.createCommandEncoder({id: 'texture-import-first'}), {
    parameters: undefined
  });
  compiled.encode(device.createCommandEncoder({id: 'texture-import-second'}), {
    parameters: undefined
  });
  t.equal(resolvedViews[0], resolvedViews[1], 'concrete texture view is cached across encodes');
  const replacement = device.createTexture({
    id: 'replacement-texture',
    width: 4,
    height: 4,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE
  });
  compiled.encode(device.createCommandEncoder({id: 'texture-import-replacement'}), {
    parameters: undefined,
    textures: {imported: replacement}
  });
  t.notEqual(resolvedViews[1], resolvedViews[2], 'replacement texture resolves a distinct view');
  const wrongSize = device.createTexture({
    id: 'wrong-size-texture',
    width: 8,
    height: 4,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE
  });
  t.throws(
    () =>
      compiled.encode(device.createCommandEncoder({id: 'texture-import-invalid'}), {
        parameters: undefined,
        textures: {imported: wrongSize}
      }),
    /incompatible width/,
    'fixed-size import rejects resized replacement'
  );
  compiled.destroy();
  t.notOk(importedTexture.destroyed, 'compiled graph leaves imported texture alive');
  importedTexture.destroy();
  replacement.destroy();
  wrongSize.destroy();
  t.end();
});

test('GPUCommandGraph tracks texture subresources and reuses compatible transients', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const disjointGraph = new GPUCommandGraph(device, {id: 'disjoint-subresources'});
  const disjointTexture = disjointGraph.createTransientTexture({
    id: 'mipped',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    mipLevels: 2,
    usage: Texture.STORAGE
  });
  const mipZero = disjointGraph.createTextureView(disjointTexture, {
    baseMipLevel: 0,
    mipLevelCount: 1
  });
  const mipOne = disjointGraph.createTextureView(disjointTexture, {
    baseMipLevel: 1,
    mipLevelCount: 1
  });
  disjointGraph.addComputePass({
    id: 'read-mip-one',
    dependsOn: ['write-mip-zero'],
    resources: [{texture: mipOne, usage: 'storage-read'}],
    compile: () => ({encode: () => {}})
  });
  disjointGraph.addComputePass({
    id: 'write-mip-zero',
    resources: [{texture: mipZero, usage: 'storage-write'}],
    compile: () => ({encode: () => {}})
  });
  const disjointCompiled = disjointGraph.compile();
  t.deepEqual(
    disjointCompiled.stats.nodeOrder,
    ['write-mip-zero', 'read-mip-one'],
    'disjoint subresources do not create a reverse hazard cycle'
  );
  disjointCompiled.destroy();

  const overlapGraph = new GPUCommandGraph(device, {id: 'overlap-subresources'});
  const overlapTexture = overlapGraph.createTransientTexture({
    id: 'mipped',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    mipLevels: 2,
    usage: Texture.STORAGE
  });
  const overlapMip = overlapGraph.createTextureView(overlapTexture, {
    baseMipLevel: 0,
    mipLevelCount: 1
  });
  overlapGraph.addComputePass({
    id: 'read',
    dependsOn: ['write'],
    resources: [{texture: overlapMip, usage: 'storage-read'}],
    compile: () => ({encode: () => {}})
  });
  overlapGraph.addComputePass({
    id: 'write',
    resources: [{texture: overlapMip, usage: 'storage-write'}],
    compile: () => ({encode: () => {}})
  });
  t.throws(() => overlapGraph.compile(), /dependency cycle/, 'overlapping view hazard is detected');

  const reuseGraph = new GPUCommandGraph(device, {id: 'texture-reuse'});
  const first = reuseGraph.createTransientTexture({
    id: 'first',
    format: 'rgba8unorm',
    width: 8,
    height: 8,
    usage: Texture.STORAGE | Texture.SAMPLE
  });
  const second = reuseGraph.createTransientTexture({
    id: 'second',
    format: 'rgba8unorm',
    width: 8,
    height: 8,
    usage: Texture.STORAGE | Texture.SAMPLE
  });
  reuseGraph.addComputePass({
    id: 'write-first',
    resources: [{texture: first, usage: 'storage-write'}],
    compile: () => ({encode: () => {}})
  });
  reuseGraph.addComputePass({
    id: 'read-first',
    resources: [{texture: first, usage: 'sampled'}],
    compile: () => ({encode: () => {}})
  });
  reuseGraph.addComputePass({
    id: 'write-second',
    dependsOn: ['read-first'],
    resources: [{texture: second, usage: 'storage-write'}],
    compile: () => ({encode: () => {}})
  });
  reuseGraph.addComputePass({
    id: 'read-second',
    resources: [{texture: second, usage: 'sampled'}],
    compile: () => ({encode: () => {}})
  });
  const reused = reuseGraph.compile();
  t.equal(reused.stats.logicalTransientTextureCount, 2, 'two logical textures are tracked');
  t.equal(reused.stats.physicalTransientTextureCount, 1, 'compatible lifetimes share texture');
  t.ok(reused.stats.reusedTransientTextureBytes > 0, 'texture reuse reports saved bytes');
  reused.destroy();
  t.end();
});

test('GPUCommandGraph composes storage texture output with sampled rendering', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const graph = new GPUCommandGraph(device, {id: 'storage-sampled'});
  const storageTexture = graph.createTransientTexture({
    id: 'storage',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.STORAGE | Texture.SAMPLE
  });
  const outputTexture = device.createTexture({
    id: 'sampled-output',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const outputHandle = graph.importTexture(
    {
      id: 'output',
      format: 'rgba8unorm',
      width: 4,
      height: 4,
      usage: outputTexture.props.usage
    },
    outputTexture
  );
  const storageView = graph.createTextureView(storageTexture);
  const outputView = graph.createTextureView(outputHandle);
  graph.addComputePass({
    id: 'write-storage',
    resources: [{texture: storageView, usage: 'storage-write'}],
    compile: ({device: compileDevice}) => {
      const computation = new Computation(compileDevice, {
        id: 'write-storage-computation',
        source: `@group(0) @binding(0) var image: texture_storage_2d<rgba8unorm, write>;
@compute @workgroup_size(1) fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  textureStore(image, vec2<i32>(id.xy), vec4<f32>(1.0, 0.25, 0.0, 1.0));
}`,
        shaderLayout: {
          bindings: [
            {
              name: 'image',
              type: 'storage',
              group: 0,
              location: 0,
              access: 'write-only',
              format: 'rgba8unorm'
            }
          ]
        }
      });
      return {
        encode: ({computePass, getTextureView}) => {
          computation.setBindings({image: getTextureView(storageView)});
          computation.dispatch(computePass, 4, 4, 1);
        },
        destroy: () => computation.destroy()
      };
    }
  });
  graph.addRenderPass({
    id: 'sample-storage',
    attachments: {colorAttachments: [outputView]},
    resources: [{texture: storageView, usage: 'sampled'}],
    compile: ({device: compileDevice}) => {
      const model = new Model(compileDevice, {
        id: 'sample-storage-model',
        source: `@group(0) @binding(0) var image: texture_2d<f32>;
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
  let positions = array<vec2<f32>, 3>(vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  return vec4(positions[index], 0.0, 1.0);
}
@fragment fn fragmentMain(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
  return textureLoad(image, vec2<i32>(position.xy), 0);
}`,
        vertexCount: 3,
        colorAttachmentFormats: ['rgba8unorm'],
        shaderLayout: {
          attributes: [],
          bindings: [
            {
              name: 'image',
              type: 'texture',
              group: 0,
              location: 0,
              sampleType: 'float'
            }
          ]
        }
      });
      return {
        encode: ({renderPass, getTextureView}) => {
          model.setBindings({image: getTextureView(storageView)});
          model.draw(renderPass);
        },
        destroy: () => model.destroy()
      };
    }
  });
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'storage-sampled'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const pixels = await readPixels(outputTexture, 4, 4);
  t.ok(pixels[0] > 240 && pixels[1] > 50, 'sampled render observes storage texture writes');
  compiled.destroy();
  t.notOk(outputTexture.destroyed, 'imported output texture remains caller-owned');
  outputTexture.destroy();
  t.end();
});

test('GPUIndexPickingTarget renders stable integer IDs and copies dynamic pixels', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const defaultReadback = makePickingReadbackBuffer(device, 'picking-readback-default');
  const graph = new GPUCommandGraph<{pixel: readonly [number, number]}>(device, {
    id: 'index-picking'
  });
  const target = new GPUIndexPickingTarget(graph, {
    id: 'pick',
    width: 4,
    height: 4,
    readbackBuffer: defaultReadback
  });
  graph.addRenderPass({
    id: 'pick-render',
    attachments: target.attachments,
    compile: ({device: compileDevice}) => {
      const model = new Model(compileDevice, {
        id: 'index-picking-model',
        source: `struct FragmentOutputs {
  @location(0) color: vec4<f32>,
  @location(1) indices: vec2<i32>,
};
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
  let positions = array<vec2<f32>, 3>(vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  return vec4(positions[index], 0.0, 1.0);
}
@fragment fn fragmentMain(@builtin(position) position: vec4<f32>) -> FragmentOutputs {
  if (position.y >= 3.0) { discard; }
  var output: FragmentOutputs;
  output.color = vec4(0.0);
  output.indices = vec2<i32>(select(7, 9, position.x >= 2.0), 3);
  return output;
}`,
        vertexCount: 3,
        colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
        depthStencilAttachmentFormat: 'depth24plus'
      });
      return {
        getRenderPassProps: () => target.renderPassProps,
        encode: ({renderPass}) => model.draw(renderPass),
        destroy: () => model.destroy()
      };
    }
  });
  target.addReadbackPass({after: 'pick-render', getPixel: parameters => parameters.pixel});
  const compiled = graph.compile();
  await encodePick(device, compiled, [0, 0]);
  t.deepEqual(
    decodeGPUIndexPickInfo(await defaultReadback.readAsync(0, 8)),
    {objectIndex: 7, batchIndex: 3},
    'left pixel returns first stable ID'
  );
  const replacementReadback = makePickingReadbackBuffer(device, 'picking-readback-replacement');
  await encodePick(device, compiled, [3, 0], replacementReadback, target.readback.id);
  t.deepEqual(
    decodeGPUIndexPickInfo(await replacementReadback.readAsync(0, 8)),
    {objectIndex: 9, batchIndex: 3},
    'per-encoding staging override returns second stable ID'
  );
  const backgroundReadback = makePickingReadbackBuffer(device, 'picking-readback-background');
  await encodePick(device, compiled, [1, 3], backgroundReadback, target.readback.id);
  t.deepEqual(
    decodeGPUIndexPickInfo(await backgroundReadback.readAsync(0, 8)),
    {objectIndex: null, batchIndex: null},
    'cleared background decodes to no pick'
  );
  t.throws(
    () =>
      compiled.encode(device.createCommandEncoder({id: 'picking-out-of-range'}), {
        parameters: {pixel: [4, 0]}
      }),
    /outside 4x4 target/,
    'out-of-range dynamic pixel is rejected'
  );
  compiled.destroy();
  t.notOk(defaultReadback.destroyed, 'compiled graph preserves caller-owned staging buffer');
  defaultReadback.destroy();
  replacementReadback.destroy();
  backgroundReadback.destroy();
  t.end();
});

function makePickingReadbackBuffer(device: Device, id: string): Buffer {
  return device.createBuffer({
    id,
    byteLength: INDEX_PICKING_READBACK_BYTE_LENGTH,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
}

async function encodePick(
  device: Device,
  compiled: ReturnType<GPUCommandGraph<{pixel: readonly [number, number]}>['compile']>,
  pixel: readonly [number, number],
  readbackBuffer?: Buffer,
  readbackId?: string
): Promise<void> {
  const commandEncoder = device.createCommandEncoder({id: `pick-${pixel[0]}-${pixel[1]}`});
  compiled.encode(commandEncoder, {
    parameters: {pixel},
    ...(readbackBuffer && readbackId ? {buffers: {[readbackId]: readbackBuffer}} : {})
  });
  device.submit(commandEncoder.finish());
}

async function readPixels(texture: Texture, width: number, height: number): Promise<Uint8Array> {
  const layout = texture.computeMemoryLayout({width, height});
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width, height}, buffer);
    const paddedPixels = await buffer.readAsync(0, layout.byteLength);
    const pixels = new Uint8Array(width * height * 4);
    for (let row = 0; row < height; row++) {
      pixels.set(
        new Uint8Array(
          paddedPixels.buffer,
          paddedPixels.byteOffset + row * layout.bytesPerRow,
          width * 4
        ),
        row * width * 4
      );
    }
    return pixels;
  } finally {
    buffer.destroy();
  }
}

test('GPUCommandGraph rejects texture imports from another device', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const nullDevice = await getNullTestDevice();
  const wrongDeviceTexture = nullDevice.createTexture({
    width: 4,
    height: 4,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE
  });
  const graph = new GPUCommandGraph(device);
  t.throws(
    () =>
      graph.importTexture(
        {
          id: 'wrong-device',
          width: 4,
          height: 4,
          format: 'rgba8unorm',
          usage: Texture.SAMPLE
        },
        wrongDeviceTexture
      ),
    /another device/,
    'wrong-device texture import is rejected'
  );
  wrongDeviceTexture.destroy();
  t.end();
});
