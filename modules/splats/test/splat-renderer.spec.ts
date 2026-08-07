// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device, Texture} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {makeGPUSplatData, SplatRenderer, type SplatSource} from '@luma.gl/splats';
import {getTestDevices} from '@luma.gl/test-utils';

// Keep renderer ownership, sorting, tone mapping, and SH fallback covered on software-only CI.
import './splat-renderer.node.spec';
import './splat-spherical-harmonics.node.spec';

test('SplatRenderer renders Gaussian source batches on WebGPU and WebGL2', async t => {
  const devices = await getTestDevices(['webgpu', 'webgl']);
  t.ok(devices.length > 0, 'at least one browser graphics backend is available');

  for (const device of devices) {
    if (device.type === 'webgl' && isSoftwareBackedDevice(device)) {
      t.comment('Skipping Gaussian splat WebGL2 rendering on a software-backed adapter');
      continue;
    }

    const firstBatch = makeGPUSplatData(device, makeBrowserSplatSource(0.5, 0));
    const secondBatch = makeGPUSplatData(device, makeBrowserSplatSource(0.25, 1));
    const renderer = new SplatRenderer(device, {
      data: firstBatch,
      viewportSize: [1, 1],
      sortMode: 'global',
      alphaCutoff: 0
    });
    renderer.appendData(secondBatch);
    renderer.predraw(device.commandEncoder);
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 0], clearDepth: 1});
    t.ok(renderer.draw(renderPass), `${device.type}: renders preserved Gaussian source batches`);
    renderPass.end();
    device.submit();

    t.equal(renderer.table?.batches.length, 2, `${device.type}: preserves both source batches`);
    t.deepEqual(
      Array.from(renderer.getSortedIndices()),
      [0, 1],
      `${device.type}: retains camera-dependent global source ordering`
    );
    if (device.type === 'webgpu') {
      t.equal(
        renderer.model?.bufferLayout.length,
        0,
        'WebGPU consumes source vectors through storage'
      );
      t.ok(renderer.stats.rendererGpuByteLength > 0, 'WebGPU owns sorted-index storage buffers');
    } else {
      t.equal(
        renderer.model?.bufferLayout.length,
        6,
        'WebGL2 consumes instanced source attributes'
      );
    }

    const sourceBuffer = firstBatch.positions.data[0].buffer;
    renderer.destroy();
    t.notOk(
      sourceBuffer.destroyed,
      `${device.type}: destroying the renderer preserves source data`
    );
    firstBatch.destroy();
    secondBatch.destroy();
  }

  t.end();
});

test('SplatRenderer preserves and tone-maps Float32 Gaussian radiance on WebGPU and WebGL2', async t => {
  const devices = await getTestDevices(['webgpu', 'webgl']);
  t.ok(devices.length > 0, 'at least one browser graphics backend is available');

  for (const device of devices) {
    if (isSoftwareBackedDevice(device)) {
      t.comment(`Skipping Gaussian splat ${device.type} HDR readback on a software-backed adapter`);
      continue;
    }

    const textureSize = 16;
    const colorTexture = device.createTexture({
      width: textureSize,
      height: textureSize,
      format: 'rgba8unorm',
      usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({
      width: textureSize,
      height: textureSize,
      colorAttachments: [colorTexture],
      depthStencilAttachment: 'depth24plus'
    });
    const source = makeBrowserSplatSource(0.5, 0);
    source.colors = new Float32Array([4, 1, 0.25, 1]);
    source.scales.set([0.8, 0.8, 0.05]);
    const prepared = makeGPUSplatData(device, source);
    const renderer = new SplatRenderer(device, {
      data: prepared,
      viewportSize: [textureSize, textureSize],
      alphaCutoff: 0
    });
    const layout = colorTexture.computeMemoryLayout({width: textureSize, height: textureSize});
    const readback = device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });

    const readCenterColor = async (): Promise<Uint8Array> => {
      renderer.predraw(device.commandEncoder);
      const renderPass = device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: 1
      });
      renderer.draw(renderPass);
      renderPass.end();
      device.submit();
      colorTexture.readBuffer({width: textureSize, height: textureSize}, readback);
      const pixels = await readback.readAsync(0, layout.byteLength);
      const centerPixelOffset = 8 * layout.bytesPerRow + 8 * 4;
      return pixels.slice(centerPixelOffset, centerPixelOffset + 4);
    };

    const toneMappedColor = await readCenterColor();
    t.equal(prepared.colors.format, 'float32x4', `${device.type}: retains Float32 source radiance`);
    t.equal(
      renderer.props.toneMapping,
      'reinhard',
      `${device.type}: automatically compresses highlights on an SDR target`
    );
    t.ok(
      toneMappedColor[0] > 180 && toneMappedColor[0] < 235,
      `${device.type}: compresses a 4× HDR red highlight without clipping it`
    );
    t.ok(
      toneMappedColor[1] > 110 && toneMappedColor[1] < 145,
      `${device.type}: retains a distinct 1× linear green channel`
    );

    renderer.setProps({exposure: 0.25});
    const reducedExposureColor = await readCenterColor();
    t.ok(
      reducedExposureColor[0] < toneMappedColor[0] - 45,
      `${device.type}: adjusts Float32 highlight intensity through exposure`
    );

    renderer.setProps({exposure: 1, toneMapping: 'none'});
    const unmappedColor = await readCenterColor();
    t.ok(
      unmappedColor[0] >= 250 && unmappedColor[1] >= 245,
      `${device.type}: explicit unmapped radiance reaches the SDR attachment clamp`
    );
    t.notOk(renderer.model?.pipeline.isErrored, `${device.type}: retains a valid render pipeline`);

    readback.destroy();
    renderer.destroy();
    prepared.destroy();
    framebuffer.destroy();
    colorTexture.destroy();
  }

  t.end();
});

test('SplatRenderer evaluates higher-order directional radiance on WebGPU and WebGL2', async t => {
  const devices = await getTestDevices(['webgpu', 'webgl']);
  t.ok(devices.length > 0, 'at least one browser graphics backend is available');

  for (const device of devices) {
    if (isSoftwareBackedDevice(device)) {
      t.comment(
        `Skipping Gaussian splat ${device.type} directional readback on a software adapter`
      );
      continue;
    }

    const textureSize = 16;
    const colorTexture = device.createTexture({
      width: textureSize,
      height: textureSize,
      format: 'rgba8unorm',
      usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({
      width: textureSize,
      height: textureSize,
      colorAttachments: [colorTexture],
      depthStencilAttachment: 'depth24plus'
    });
    const source = makeBrowserSplatSource(0.5, 0);
    source.colors = new Float32Array([0.5, 0.5, 0.25, 1]);
    source.scales.set([0.8, 0.8, 0.05]);
    source.sphericalHarmonics = new Float32Array(9);
    source.sphericalHarmonics[2 * 3] = 0.75;
    source.sphericalHarmonicsDegree = 1;
    const prepared = makeGPUSplatData(device, source);
    const renderer = new SplatRenderer(device, {
      data: prepared,
      viewportSize: [textureSize, textureSize],
      alphaCutoff: 0,
      toneMapping: 'none'
    });
    const layout = colorTexture.computeMemoryLayout({width: textureSize, height: textureSize});
    const readback = device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    const centerColors: Uint8Array[] = [];

    for (const cameraPosition of [
      [-1, 0, 0.5],
      [1, 0, 0.5]
    ] as const) {
      renderer.setProps({cameraPosition});
      renderer.predraw(device.commandEncoder);
      const renderPass = device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: 1
      });
      t.ok(renderer.draw(renderPass), `${device.type}: renders higher-order directional radiance`);
      renderPass.end();
      device.submit();
      colorTexture.readBuffer({width: textureSize, height: textureSize}, readback);
      const pixels = await readback.readAsync(0, layout.byteLength);
      const centerPixelOffset = 8 * layout.bytesPerRow + 8 * 4;
      centerColors.push(pixels.slice(centerPixelOffset, centerPixelOffset + 4));
    }

    t.ok(
      centerColors[1][0] > centerColors[0][0] + 120,
      `${device.type}: reverses the first-order red basis when the camera crosses the Gaussian`
    );
    t.ok(
      Math.abs(centerColors[1][1] - centerColors[0][1]) < 5,
      `${device.type}: leaves unrelated DC color channels unchanged`
    );
    t.deepEqual(
      Array.from(source.colors),
      [0.5, 0.5, 0.25, 1],
      `${device.type}: preserves caller-owned DC color coefficients`
    );

    readback.destroy();
    renderer.destroy();
    prepared.destroy();
    framebuffer.destroy();
    colorTexture.destroy();
  }

  t.end();
});

test('SplatRenderer WebGL preserves HDR directional radiance from byte-backed source colors', async t => {
  const [device] = await getTestDevices(['webgl']);
  if (!device || isSoftwareBackedDevice(device)) {
    t.comment('Skipping byte-backed spherical-harmonic WebGL readback without hardware support');
    t.end();
    return;
  }

  const textureSize = 16;
  const colorTexture = device.createTexture({
    width: textureSize,
    height: textureSize,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: textureSize,
    height: textureSize,
    colorAttachments: [colorTexture],
    depthStencilAttachment: 'depth24plus'
  });
  const source = makeBrowserSplatSource(0.5, 0);
  source.colors = new Uint8Array([128, 64, 32, 255]);
  source.scales.set([0.8, 0.8, 0.05]);
  source.sphericalHarmonics = new Float32Array(9);
  source.sphericalHarmonics[2 * 3] = -4;
  source.sphericalHarmonics[2 * 3 + 1] = 2;
  source.sphericalHarmonicsDegree = 1;
  const prepared = makeGPUSplatData(device, source);
  const renderer = new SplatRenderer(device, {
    data: prepared,
    cameraPosition: [-1, 0, 0.5],
    sphericalHarmonicsDegree: 1,
    viewportSize: [textureSize, textureSize],
    exposure: 0.25,
    toneMapping: 'none',
    alphaCutoff: 0
  });
  renderer.predraw(device.commandEncoder);
  const renderPass = device.beginRenderPass({
    framebuffer,
    clearColor: [0, 0, 0, 0],
    clearDepth: 1
  });
  t.ok(renderer.draw(renderPass), 'renders unclamped spherical-harmonic WebGL radiance');
  renderPass.end();
  device.submit();

  const layout = colorTexture.computeMemoryLayout({width: textureSize, height: textureSize});
  const readback = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  colorTexture.readBuffer({width: textureSize, height: textureSize}, readback);
  const pixels = await readback.readAsync(0, layout.byteLength);
  const centerPixelOffset = 8 * layout.bytesPerRow + 8 * 4;
  t.ok(
    pixels[centerPixelOffset] > 120,
    'applies exposure after preserving a directional red highlight above one'
  );
  t.ok(
    pixels[centerPixelOffset + 1] < 10,
    'preserves negative directional green radiance until display output'
  );
  t.equal(
    renderer.model?.bufferLayout.find(bufferLayout => bufferLayout.name === 'colors')?.format,
    'float32x4',
    'uses floating-point attributes for evaluated byte-backed spherical harmonics'
  );
  t.deepEqual(Array.from(source.colors), [128, 64, 32, 255], 'preserves original source bytes');

  readback.destroy();
  renderer.destroy();
  prepared.destroy();
  framebuffer.destroy();
  colorTexture.destroy();
  t.end();
});

test('SplatRenderer WebGL composites unsorted rows across interleaved source batches', async t => {
  const [device] = await getTestDevices(['webgl']);
  if (!device || isSoftwareBackedDevice(device)) {
    t.comment('Skipping globally sorted Gaussian WebGL readback without hardware support');
    t.end();
    return;
  }

  const textureSize = 16;
  const colorTexture = device.createTexture({
    width: textureSize,
    height: textureSize,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: textureSize,
    height: textureSize,
    colorAttachments: [colorTexture],
    depthStencilAttachment: 'depth24plus'
  });
  const firstSource: SplatSource = {
    positions: new Float32Array([0, 0, 0.2, 0, 0, 0.8]),
    scales: new Float32Array([0.8, 0.8, 0.05, 0.8, 0.8, 0.05]),
    rotations: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0]),
    colors: new Uint8Array([255, 0, 0, 255, 0, 0, 255, 255]),
    opacities: new Float32Array([0.6, 0.6]),
    sourceBatchIndex: 0,
    rowIndexBase: 0
  };
  const secondSource = makeBrowserSplatSource(0.5, 2);
  secondSource.colors = new Uint8Array([0, 255, 0, 255]);
  secondSource.scales.set([0.8, 0.8, 0.05]);
  secondSource.opacities[0] = 0.6;
  const firstBatch = makeGPUSplatData(device, firstSource);
  const secondBatch = makeGPUSplatData(device, secondSource);
  const renderer = new SplatRenderer(device, {
    data: [firstBatch, secondBatch],
    viewportSize: [textureSize, textureSize],
    sortMode: 'global',
    alphaCutoff: 0
  });
  renderer.predraw(device.commandEncoder);
  const renderPass = device.beginRenderPass({
    framebuffer,
    clearColor: [0, 0, 0, 0],
    clearDepth: 1
  });
  t.ok(renderer.draw(renderPass), 'draws all three globally ordered source rows');
  renderPass.end();
  device.submit();

  const layout = colorTexture.computeMemoryLayout({width: textureSize, height: textureSize});
  const readback = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  colorTexture.readBuffer({width: textureSize, height: textureSize}, readback);
  const pixels = await readback.readAsync(0, layout.byteLength);
  const centerPixelOffset = 8 * layout.bytesPerRow + 8 * 4;
  const red = pixels[centerPixelOffset];
  const green = pixels[centerPixelOffset + 1];
  const blue = pixels[centerPixelOffset + 2];
  t.deepEqual(Array.from(renderer.getSortedIndices()), [1, 2, 0], 'retains exact global row order');
  t.ok(red > green + 25, 'blends the nearest red row after the middle green source batch');
  t.ok(green > blue + 10, 'blends the middle green source batch after the furthest blue row');
  t.deepEqual(Array.from(firstSource.colors), [255, 0, 0, 255, 0, 0, 255, 255], 'preserves source');

  readback.destroy();
  renderer.destroy();
  firstBatch.destroy();
  secondBatch.destroy();
  framebuffer.destroy();
  colorTexture.destroy();
  t.end();
});

test('SplatRenderer composites mixed mesh scenes against a shared WebGPU or WebGL depth buffer', async t => {
  const devices = await getTestDevices(['webgpu', 'webgl']);
  t.ok(devices.length > 0, 'at least one browser graphics backend is available');

  for (const device of devices) {
    if (isSoftwareBackedDevice(device)) {
      t.comment(
        `Skipping Gaussian splat ${device.type} mixed-depth readback on a software adapter`
      );
      continue;
    }

    const textureSize = 16;
    const colorTexture = device.createTexture({
      width: textureSize,
      height: textureSize,
      format: 'rgba8unorm',
      usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({
      width: textureSize,
      height: textureSize,
      colorAttachments: [colorTexture],
      depthStencilAttachment: 'depth24plus'
    });
    const source = makeBrowserSplatSource(0.5, 0);
    source.colors = new Uint8Array([255, 0, 0, 255]);
    source.scales.set([0.8, 0.8, 0.05]);
    const prepared = makeGPUSplatData(device, source);
    const renderer = new SplatRenderer(device, {
      data: prepared,
      viewportSize: [textureSize, textureSize],
      alphaCutoff: 0
    });
    const nearerMesh = makeOpaqueBrowserMesh(device, 0.25);
    const fartherMesh = makeOpaqueBrowserMesh(device, 0.75);
    const layout = colorTexture.computeMemoryLayout({width: textureSize, height: textureSize});
    const readback = device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    const centerColors: Uint8Array[] = [];

    for (const mesh of [nearerMesh, fartherMesh]) {
      mesh.predraw(device.commandEncoder);
      renderer.predraw(device.commandEncoder);
      const renderPass = device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: 1
      });
      t.ok(
        renderer.drawMixed(renderPass, {opaqueMeshes: [mesh]}),
        `${device.type}: composites opaque mesh and Gaussian draws into the shared pass`
      );
      renderPass.end();
      device.submit();
      colorTexture.readBuffer({width: textureSize, height: textureSize}, readback);
      const pixels = await readback.readAsync(0, layout.byteLength);
      const centerPixelOffset = 8 * layout.bytesPerRow + 8 * 4;
      centerColors.push(pixels.slice(centerPixelOffset, centerPixelOffset + 4));
    }

    t.ok(
      centerColors[0][2] > 220 && centerColors[0][0] < 15,
      `${device.type}: nearer opaque mesh depth fully occludes the red Gaussian`
    );
    t.ok(
      centerColors[1][0] > 180 && centerColors[1][2] < 80,
      `${device.type}: nearer Gaussian remains visible over the farther opaque mesh`
    );

    readback.destroy();
    renderer.destroy();
    prepared.destroy();
    nearerMesh.destroy();
    fartherMesh.destroy();
    framebuffer.destroy();
    colorTexture.destroy();
  }

  t.end();
});

test('SplatRenderer WebGPU pipeline writes visible Gaussian color into an offscreen target', async t => {
  const [device] = await getTestDevices(['webgpu']);
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  if (isSoftwareBackedDevice(device)) {
    t.comment('Skipping Gaussian splat WebGPU pixel readback on a software-backed adapter');
    t.end();
    return;
  }

  const colorTexture = device.createTexture({
    width: 16,
    height: 16,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 16,
    height: 16,
    colorAttachments: [colorTexture],
    depthStencilAttachment: 'depth24plus'
  });
  const prepared = makeGPUSplatData(device, makeBrowserSplatSource(0.5, 0));
  const renderer = new SplatRenderer(device, {
    data: prepared,
    viewportSize: [16, 16],
    alphaCutoff: 0
  });
  renderer.predraw(device.commandEncoder);
  const renderPass = device.beginRenderPass({
    framebuffer,
    clearColor: [0, 0, 0, 0],
    clearDepth: 1
  });
  t.ok(renderer.draw(renderPass), 'records a WebGPU Gaussian splat draw');
  renderPass.end();
  device.submit();

  const layout = colorTexture.computeMemoryLayout({width: 16, height: 16});
  const readback = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  colorTexture.readBuffer({width: 16, height: 16}, readback);
  const pixels = await readback.readAsync(0, layout.byteLength);
  t.ok(
    pixels.some((component, componentIndex) => componentIndex % 4 !== 3 && component > 0),
    'writes non-black Gaussian color after shader compilation and GPU submission'
  );
  t.notOk(renderer.model?.pipeline.isErrored, 'retains a successfully compiled render pipeline');

  readback.destroy();
  renderer.destroy();
  prepared.destroy();
  framebuffer.destroy();
  colorTexture.destroy();
  t.end();
});

test('SplatRenderer WebGPU keeps dense cross-batch transparency stable as the camera moves', async t => {
  const [device] = await getTestDevices(['webgpu']);
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  if (isSoftwareBackedDevice(device)) {
    t.comment('Skipping Gaussian splat WebGPU pixel readback on a software-backed adapter');
    t.end();
    return;
  }

  const textureSize = 16;
  const colorTexture = device.createTexture({
    width: textureSize,
    height: textureSize,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: textureSize,
    height: textureSize,
    colorAttachments: [colorTexture],
    depthStencilAttachment: 'depth24plus'
  });
  const firstBatch = makeGPUSplatData(device, makeOverlappingBrowserSplatSource(0));
  const secondBatch = makeGPUSplatData(device, makeOverlappingBrowserSplatSource(1));
  const renderer = new SplatRenderer(device, {
    data: [firstBatch, secondBatch],
    viewportSize: [textureSize, textureSize],
    sortMode: 'global',
    alphaCutoff: 0
  });
  const layout = colorTexture.computeMemoryLayout({
    width: textureSize,
    height: textureSize
  });
  const readback = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });

  const centerColors: Uint8Array[] = [];
  const furthestBatchIndices: number[] = [];
  for (const cameraShear of [-0.0001, 0.0001]) {
    renderer.setProps({
      modelViewProjectionMatrix: [1, 0, cameraShear, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    });
    renderer.predraw(device.commandEncoder);
    furthestBatchIndices.push(renderer.sortedReferences[0].batchIndex);
    const renderPass = device.beginRenderPass({
      framebuffer,
      clearColor: [0, 0, 0, 0],
      clearDepth: 1
    });
    t.ok(renderer.draw(renderPass), 'renders densely interleaved Gaussian source batches');
    renderPass.end();
    device.submit();

    colorTexture.readBuffer({width: textureSize, height: textureSize}, readback);
    const pixels = await readback.readAsync(0, layout.byteLength);
    const centerPixelOffset = 8 * layout.bytesPerRow + 8 * 4;
    centerColors.push(pixels.slice(centerPixelOffset, centerPixelOffset + 4));
  }

  t.deepEqual(furthestBatchIndices, [1, 0], 'small camera changes swap the furthest source batch');
  t.equal(renderer.stats.drawCallCount, 64, 'bounds globally ordered depth-slab draw calls');
  t.ok(
    centerColors.every(color => color[0] > 40 && color[1] > 40),
    'composites overlapping red and green Gaussian source batches'
  );
  t.ok(
    Math.abs(centerColors[0][0] - centerColors[1][0]) <= 8 &&
      Math.abs(centerColors[0][1] - centerColors[1][1]) <= 8,
    'keeps dense transparent overlap stable when one distant row swaps source batches'
  );

  readback.destroy();
  renderer.destroy();
  firstBatch.destroy();
  secondBatch.destroy();
  framebuffer.destroy();
  colorTexture.destroy();
  t.end();
});

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}

function makeBrowserSplatSource(depth: number, rowIndex: number): SplatSource {
  return {
    positions: new Float32Array([0, 0, depth]),
    scales: new Float32Array([0.2, 0.1, 0.05]),
    rotations: new Float32Array([1, 0, 0, 0]),
    colors: new Uint8Array([255, 64, 32, 255]),
    opacities: new Float32Array([1]),
    sourceBatchIndex: rowIndex,
    rowIndexBase: rowIndex
  };
}

function makeOpaqueBrowserMesh(device: Device, depth: number): Model {
  const source = /* wgsl */ `\
@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4<f32> {
  let positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  return vec4<f32>(positions[vertexIndex], ${depth}, 1.0);
}

@fragment
fn fragmentMain() -> @location(0) vec4<f32> {
  return vec4<f32>(0.0, 0.0, 1.0, 1.0);
}
`;
  const vertexShader = /* glsl */ `\
#version 300 es
void main() {
  vec2 position = gl_VertexID == 0
    ? vec2(-1.0, -1.0)
    : gl_VertexID == 1 ? vec2(3.0, -1.0) : vec2(-1.0, 3.0);
  gl_Position = vec4(position, ${depth}, 1.0);
}
`;
  const fragmentShader = /* glsl */ `\
#version 300 es
precision highp float;
out vec4 fragmentColor;
void main() {
  fragmentColor = vec4(0.0, 0.0, 1.0, 1.0);
}
`;
  return new Model(device, {
    id: `splat-opaque-mesh-${depth}`,
    source,
    vs: vertexShader,
    fs: fragmentShader,
    shaderLayout: {attributes: [], bindings: []},
    vertexCount: 3,
    topology: 'triangle-list',
    parameters: {depthCompare: 'less-equal', depthWriteEnabled: true}
  });
}

function makeOverlappingBrowserSplatSource(batchIndex: number): SplatSource {
  const rowCount = 70;
  const positions = new Float32Array(rowCount * 3);
  const scales = new Float32Array(rowCount * 3);
  const rotations = new Float32Array(rowCount * 4);
  const colors = new Uint8Array(rowCount * 4);
  const opacities = new Float32Array(rowCount);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    positions[rowIndex * 3 + 2] = ((rowIndex * 2 + batchIndex) / (rowCount * 2)) * 0.9;
    scales.set([0.8, 0.8, 0.01], rowIndex * 3);
    rotations[rowIndex * 4] = 1;
    colors.set(batchIndex === 0 ? [255, 0, 0, 255] : [0, 255, 0, 255], rowIndex * 4);
    opacities[rowIndex] = 0.08;
  }

  positions[(rowCount - 1) * 3] = batchIndex === 0 ? 0.01 : -0.01;
  positions[(rowCount - 1) * 3 + 2] = 0.95;

  return {
    positions,
    scales,
    rotations,
    colors,
    opacities,
    sourceBatchIndex: batchIndex,
    rowIndexBase: batchIndex * rowCount
  };
}
