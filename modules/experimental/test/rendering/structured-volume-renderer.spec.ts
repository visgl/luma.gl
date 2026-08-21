// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, Texture, type Device} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Matrix4, radians} from '@math.gl/core';
import {
  StructuredVolumeRenderer,
  type StructuredVolumeVectorSource
} from '../../src/rendering/structured-volume-renderer';

const OUTPUT_SIZE = 32;
const DIMENSIONS = [4, 4, 4] as const;

test('StructuredVolumeRenderer keeps buffer and texture sampling visually equivalent', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }
  const values = new Float32Array(DIMENSIONS[0] * DIMENSIONS[1] * DIMENSIONS[2]);
  for (let z = 0; z < DIMENSIONS[2]; z++) {
    for (let y = 0; y < DIMENSIONS[1]; y++) {
      for (let x = 0; x < DIMENSIONS[0]; x++) {
        values[(z * DIMENSIONS[1] + y) * DIMENSIONS[0] + x] = (x + y + z) / 9;
      }
    }
  }
  const buffer = device.createBuffer({data: values, usage: Buffer.STORAGE});
  const texture = device.createTexture({
    dimension: '3d',
    width: DIMENSIONS[0],
    height: DIMENSIONS[1],
    depth: DIMENSIONS[2],
    format: 'r32float',
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  texture.writeData(values, {
    width: DIMENSIONS[0],
    height: DIMENSIONS[1],
    depthOrArrayLayers: DIMENSIONS[2]
  });

  const bufferRenderer = new StructuredVolumeRenderer(device, {
    id: 'structured-volume-buffer-test',
    dimensions: DIMENSIONS,
    scalar: {type: 'buffer', format: 'float32', buffer}
  });
  const textureRenderer = new StructuredVolumeRenderer(device, {
    id: 'structured-volume-texture-test',
    dimensions: DIMENSIONS,
    scalar: {type: 'texture', format: 'float32', texture}
  });
  try {
    const bufferPixels = await renderScalarVolume(device, bufferRenderer);
    const texturePixels = await renderScalarVolume(device, textureRenderer);
    const centerOffset = getPixelOffset(device, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    const bufferCenter = Array.from(bufferPixels.slice(centerOffset, centerOffset + 4));
    const textureCenter = Array.from(texturePixels.slice(centerOffset, centerOffset + 4));

    testContext.ok(bufferCenter[3] > 0, 'buffer volume produces non-transparent center pixels');
    testContext.deepEqual(
      textureCenter,
      bufferCenter,
      'manual texture trilinear sampling matches buffers'
    );
  } finally {
    bufferRenderer.destroy();
    textureRenderer.destroy();
    buffer.destroy();
    texture.destroy();
  }
  testContext.end();
});

test('StructuredVolumeRenderer glyph output responds to vector orientation', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }
  const xBuffer = makeVectorBuffer(device, [1, 0, 0]);
  const yBuffer = makeVectorBuffer(device, [0, 1, 0]);
  const renderer = new StructuredVolumeRenderer(device, {
    id: 'structured-volume-glyph-test',
    dimensions: DIMENSIONS,
    vector: vectorSource(xBuffer)
  });
  try {
    const xPixels = await renderVectorGlyphs(device, renderer);
    renderer.setSources({vector: vectorSource(yBuffer)});
    const yPixels = await renderVectorGlyphs(device, renderer);
    const xEnergy = xPixels.reduce((sum, value) => sum + value, 0);
    const yEnergy = yPixels.reduce((sum, value) => sum + value, 0);

    testContext.ok(xEnergy > 0 && yEnergy > 0, 'both orientations render visible glyphs');
    testContext.notDeepEqual(
      Array.from(yPixels),
      Array.from(xPixels),
      'orientation changes glyph projection'
    );
  } finally {
    renderer.destroy();
    xBuffer.destroy();
    yBuffer.destroy();
  }
  testContext.end();
});

async function renderScalarVolume(
  device: Device,
  renderer: StructuredVolumeRenderer
): Promise<Uint8Array> {
  return renderVolume(device, renderer, {
    mode: 'scalar',
    scalarStyle: {transferFunction: 'sequential', densityScale: 0.5}
  });
}

async function renderVectorGlyphs(
  device: Device,
  renderer: StructuredVolumeRenderer
): Promise<Uint8Array> {
  return renderVolume(device, renderer, {
    mode: 'vector',
    vectorStyle: {densityScale: 0},
    glyphs: {
      enabled: true,
      gridDimensions: [3, 3, 3],
      lengthRange: [0.3, 0.3],
      shaftRadius: 0.03,
      headRadius: 0.08
    }
  });
}

async function renderVolume(
  device: Device,
  renderer: StructuredVolumeRenderer,
  style: Pick<
    Parameters<StructuredVolumeRenderer['prepare']>[1],
    'mode' | 'scalarStyle' | 'vectorStyle' | 'glyphs'
  >
): Promise<Uint8Array> {
  const output = device.createTexture({
    width: OUTPUT_SIZE,
    height: OUTPUT_SIZE,
    format: 'rgba8unorm',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: OUTPUT_SIZE,
    height: OUTPUT_SIZE,
    colorAttachments: [output]
  });
  const projection = new Matrix4().perspective({
    fovy: radians(48),
    aspect: 1,
    near: 0.1,
    far: 20
  });
  const eye = [2.2, 1.4, 3] as const;
  const view = new Matrix4().lookAt({eye, center: [0, 0, 0], up: [0, 1, 0]});
  const inverseViewProjectionMatrix = new Matrix4(projection).multiplyRight(view).invert();
  renderer.prepare(device.commandEncoder, {
    inverseViewProjectionMatrix,
    cameraPosition: eye,
    viewport: [0, 0, OUTPUT_SIZE, OUTPUT_SIZE],
    sampleCount: 96,
    jitter: false,
    showBounds: false,
    ...style
  });
  const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
  renderer.draw(pass);
  pass.end();
  device.submit();

  const layout = output.computeMemoryLayout({width: OUTPUT_SIZE, height: OUTPUT_SIZE});
  const readback = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    output.readBuffer({width: OUTPUT_SIZE, height: OUTPUT_SIZE}, readback);
    device.submit();
    return await readback.readAsync(0, layout.byteLength);
  } finally {
    readback.destroy();
    framebuffer.destroy();
    output.destroy();
  }
}

function getPixelOffset(device: Device, x: number, y: number): number {
  const texture = device.createTexture({
    width: OUTPUT_SIZE,
    height: OUTPUT_SIZE,
    format: 'rgba8unorm',
    usage: Texture.COPY_SRC
  });
  try {
    const layout = texture.computeMemoryLayout({width: OUTPUT_SIZE, height: OUTPUT_SIZE});
    return y * layout.bytesPerRow + x * layout.bytesPerPixel;
  } finally {
    texture.destroy();
  }
}

function makeVectorBuffer(device: Device, vector: readonly [number, number, number]): Buffer {
  const values = new Float32Array(DIMENSIONS[0] * DIMENSIONS[1] * DIMENSIONS[2] * 4);
  for (let index = 0; index < values.length; index += 4) values.set(vector, index);
  return device.createBuffer({data: values, usage: Buffer.STORAGE});
}

function vectorSource(buffer: Buffer): StructuredVolumeVectorSource {
  return {type: 'buffer', format: 'float32x4', buffer};
}
