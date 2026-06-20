// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {Test} from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, Device, Texture} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {clipShaderPlugin, ShaderAssembler} from '@luma.gl/shadertools';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';

const WIDTH = 4;
const HEIGHT = 4;

test('clipShaderPlugin#WebGL2 clips instances and geometry without rebuilding', async t => {
  const device = await getWebGLTestDevice();
  const shaderAssembler = new ShaderAssembler();
  shaderAssembler.addShaderHook(
    'vs:CLIP_POSITION(inout vec4 position, vec2 instanceCoordinates, vec2 geometryCoordinates)'
  );
  shaderAssembler.addShaderHook('fs:CLIP_COLOR(inout vec4 color)');

  const model = new Model(device, {
    id: 'clip-shader-plugin-webgl-test',
    topology: 'triangle-list',
    vertexCount: 3,
    vs: /* glsl */ `#version 300 es
vec2 getPosition(int index) {
  vec2 positions[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  return positions[index];
}

void main() {
  vec2 coordinates = getPosition(gl_VertexID);
  gl_Position = vec4(coordinates, 0.0, 1.0);
  CLIP_POSITION(gl_Position, vec2(0.5), coordinates);
}`,
    fs: /* glsl */ `#version 300 es
precision highp float;
out vec4 fragmentColor;

void main() {
  fragmentColor = vec4(1.0, 0.0, 0.0, 1.0);
  CLIP_COLOR(fragmentColor);
}`,
    shaderAssembler,
    plugins: [clipShaderPlugin]
  });

  await testClipModes(t, device, model, 'WebGL2');
  model.destroy();
  t.end();
});

test('clipShaderPlugin#WebGPU clips instances and geometry without rebuilding', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const shaderAssembler = new ShaderAssembler();
  shaderAssembler.addShaderHook(
    'vs:CLIP_POSITION(position: ptr<function, vec4<f32>>, instanceCoordinates: vec2<f32>, geometryCoordinates: vec2<f32>)'
  );
  shaderAssembler.addShaderHook('fs:CLIP_COLOR(color: ptr<function, vec4<f32>>)');

  const model = new Model(device, {
    id: 'clip-shader-plugin-webgpu-test',
    topology: 'triangle-list',
    vertexCount: 3,
    source: /* wgsl */ `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
};

fn getPosition(index: u32) -> vec2<f32> {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  return positions[index];
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  let coordinates = getPosition(vertexIndex);
  var output: VertexOutput;
  output.position = vec4<f32>(coordinates, 0.0, 1.0);
  CLIP_POSITION(&output.position, vec2<f32>(0.5), coordinates);
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  var color = vec4<f32>(1.0, 0.0, 0.0, 1.0);
  CLIP_COLOR(&color);
  return color;
}
`,
    shaderAssembler,
    plugins: [clipShaderPlugin]
  });

  await testClipModes(t, device, model, 'WebGPU');
  model.destroy();
  t.end();
});

async function testClipModes(
  t: Test,
  device: Device,
  model: Model,
  backend: string
): Promise<void> {
  model.shaderInputs.setProps({
    clip: {enabled: true, mode: 'instance', bounds: [0, 0, 1, 1]}
  });
  const retainedPixels = await renderAndRead(device, model);
  t.equal(
    countRedPixels(retainedPixels),
    WIDTH * HEIGHT,
    `${backend} retains the complete instance`
  );
  const pipeline = model.pipeline;

  model.shaderInputs.setProps({
    clip: {enabled: true, mode: 'instance', bounds: [0, 0, 0.25, 0.25]}
  });
  const rejectedPixels = await renderAndRead(device, model);
  t.equal(countRedPixels(rejectedPixels), 0, `${backend} rejects the complete instance`);

  model.shaderInputs.setProps({
    clip: {enabled: true, mode: 'geometry', bounds: [0, 0, 1, 1]}
  });
  const clippedPixels = await renderAndRead(device, model);
  t.equal(countRedPixels(clippedPixels), 4, `${backend} clips individual fragments`);
  t.equal(model.pipeline, pipeline, `${backend} uniform updates preserve the pipeline`);
}

async function renderAndRead(device: Device, model: Model): Promise<Uint8Array> {
  const texture = device.createTexture({
    width: WIDTH,
    height: HEIGHT,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: WIDTH,
    height: HEIGHT,
    colorAttachments: [texture]
  });
  const renderPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
  model.draw(renderPass);
  renderPass.end();
  device.submit();

  const layout = texture.computeMemoryLayout({width: WIDTH, height: HEIGHT});
  const readBuffer = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  texture.readBuffer({width: WIDTH, height: HEIGHT}, readBuffer);
  const data = await readBuffer.readAsync(0, layout.byteLength);
  const pixels = new Uint8Array(WIDTH * HEIGHT * 4);
  for (let row = 0; row < HEIGHT; row++) {
    const sourceOffset = row * layout.bytesPerRow;
    pixels.set(
      new Uint8Array(data.buffer, data.byteOffset + sourceOffset, WIDTH * 4),
      row * WIDTH * 4
    );
  }

  readBuffer.destroy();
  renderPass.destroy();
  framebuffer.destroy();
  texture.destroy();
  return pixels;
}

function countRedPixels(pixels: Uint8Array): number {
  let count = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index] > 127 && pixels[index + 3] > 127) count++;
  }
  return count;
}
