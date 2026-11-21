// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  Buffer,
  Texture,
  luma,
  type ClipDepthMode,
  type CompareFunction,
  type Device
} from '@luma.gl/core';
import {getTestDevices} from '@luma.gl/core/test-utils';

import {GL} from '@luma.gl/core/webgl-constants';
import {setGLParameters} from '@luma.gl/core/webgl/context/parameters/unified-parameter-api';

const DEVICE_TYPES = ['webgl', 'webgpu'] as const;
const EMPTY_SHADER_LAYOUT = {attributes: [], bindings: []};

/** Near plane distance in world units. */
const NEAR = 0.1;
/** Far plane distance of the standard (finite) projection. */
const FAR = 1e7;
/** Eye distance of the near quad (drawn red). */
const NEAR_QUAD_DISTANCE = 1e6;
/** Distance from the near quad to the far quad (drawn green): 1e6 and 1.0001e6. */
const QUAD_SEPARATION = 100;
/**
 * Standard depth near 1e6 units has one float32 step per ~6e5 units, so a single pair can
 * straddle a step and resolve by chance. Ten pairs, 1e4 units apart, show the z-fighting.
 */
const PAIR_OFFSETS = [0, 1e4, 2e4, 3e4, 4e4, 5e4, 6e4, 7e4, 8e4, 9e4];

const RED = [255, 0, 0, 255];

/** How a pass maps eye distance to depth. */
type DepthSetup = {
  /** Clip-space z for a point at eye distance `distance` (clip w is the distance). */
  getClipZ: (distance: number) => number;
  depthCompare: CompareFunction;
  clearDepth: number;
  clipDepthMode?: ClipDepthMode;
};

/** Standard depth for the backend's native clip range: near maps to 0 (or -1), far to 1. */
function getStandardDepthSetup(device: Device): DepthSetup {
  const getClipZ =
    device.type === 'webgpu'
      ? // Matrix4 perspective with a zero-to-one depth range
        (distance: number) => (FAR * distance) / (FAR - NEAR) - (FAR * NEAR) / (FAR - NEAR)
      : // Matrix4.perspective() (negative-one-to-one depth range)
        (distance: number) =>
          ((FAR + NEAR) * distance) / (FAR - NEAR) - (2 * FAR * NEAR) / (FAR - NEAR);
  return {getClipZ, depthCompare: 'less', clearDepth: 1};
}

/** Reverse-Z with an infinite far plane: clip z is the near distance, so depth is near / distance. */
function getReverseDepthSetup(clipDepthMode?: ClipDepthMode): DepthSetup {
  return {getClipZ: () => NEAR, depthCompare: 'greater', clearDepth: 0, clipDepthMode};
}

/** Formats a number as a float32 literal that both GLSL and WGSL accept. */
function formatFloat(value: number): string {
  const text = String(Math.fround(value));
  return /[.e]/.test(text) ? text : `${text}.0`;
}

/**
 * Builds a shader that draws two full-viewport quads in one draw call, in the given order.
 * The vertex positions are clip coordinates computed on the CPU, as a vertex shader would.
 */
function getShaderSource(device: Device, setup: DepthSetup, distances: number[]): string {
  const positions = distances.flatMap(distance => {
    const z = formatFloat(setup.getClipZ(distance));
    const w = formatFloat(distance);
    const corners = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [-1, 1],
      [1, -1],
      [1, 1]
    ];
    return corners.map(([x, y]) => [formatFloat(x * distance), formatFloat(y * distance), z, w]);
  });
  const firstIsNear = distances[0] < distances[1];
  const firstColor = firstIsNear ? '1.0, 0.0, 0.0, 1.0' : '0.0, 1.0, 0.0, 1.0';
  const secondColor = firstIsNear ? '0.0, 1.0, 0.0, 1.0' : '1.0, 0.0, 0.0, 1.0';

  if (device.info.shadingLanguage === 'wgsl') {
    return `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
};
@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  var positions = array<vec4<f32>, 12>(
    ${positions.map(position => `vec4<f32>(${position.join(', ')})`).join(',\n    ')}
  );
  var output: VertexOutput;
  output.position = positions[vertexIndex];
  output.color = select(vec4<f32>(${secondColor}), vec4<f32>(${firstColor}), vertexIndex < 6u);
  return output;
}
@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  return input.color;
}
`;
  }

  return `#version 300 es
const vec4 positions[12] = vec4[12](
  ${positions.map(position => `vec4(${position.join(', ')})`).join(',\n  ')}
);
out vec4 color;
void main() {
  gl_Position = positions[gl_VertexID];
  color = gl_VertexID < 6 ? vec4(${firstColor}) : vec4(${secondColor});
}
`;
}

const GLSL_FRAGMENT_SOURCE = `#version 300 es
precision highp float;
in vec4 color;
out vec4 fragmentColor;
void main() {
  fragmentColor = color;
}
`;

/** Draws the two quads in the given order and returns the RGBA8 color of the single pixel. */
async function drawQuads(device: Device, setup: DepthSetup, distances: number[]) {
  const source = getShaderSource(device, setup, distances);
  const vertexShader =
    device.info.shadingLanguage === 'wgsl'
      ? device.createShader({source})
      : device.createShader({stage: 'vertex', source});
  const fragmentShader =
    device.info.shadingLanguage === 'wgsl'
      ? vertexShader
      : device.createShader({stage: 'fragment', source: GLSL_FRAGMENT_SOURCE});
  await Promise.all([vertexShader.asyncCompilationStatus, fragmentShader.asyncCompilationStatus]);

  const renderPipeline = device.createRenderPipeline({
    vs: vertexShader,
    fs: fragmentShader,
    shaderLayout: EMPTY_SHADER_LAYOUT,
    colorAttachmentFormats: ['rgba8unorm'],
    parameters: {
      depthFormat: 'depth32float',
      depthWriteEnabled: true,
      depthCompare: setup.depthCompare
    }
  });
  const colorTexture = device.createTexture({
    width: 1,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const depthTexture = device.createTexture({
    width: 1,
    height: 1,
    format: 'depth32float',
    usage: Texture.RENDER
  });
  const framebuffer = device.createFramebuffer({
    colorAttachments: [colorTexture],
    depthStencilAttachment: depthTexture
  });
  const readBuffer = device.createBuffer({
    byteLength: colorTexture.computeMemoryLayout({width: 1, height: 1}).byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });

  try {
    const renderPass = device.beginRenderPass({
      framebuffer,
      clearColor: [0, 0, 0, 1],
      clearDepth: setup.clearDepth,
      clipDepthMode: setup.clipDepthMode
    });
    renderPass.setPipeline(renderPipeline);
    renderPass.draw({vertexCount: 12});
    renderPass.end();
    device.submit();

    colorTexture.readBuffer({width: 1, height: 1}, readBuffer);
    const data = await readBuffer.readAsync();
    return Array.from(data.slice(0, 4));
  } finally {
    readBuffer.destroy();
    framebuffer.destroy();
    depthTexture.destroy();
    colorTexture.destroy();
    renderPipeline.destroy();
    vertexShader.destroy();
    if (fragmentShader !== vertexShader) {
      fragmentShader.destroy();
    }
  }
}

/** Returns true when the near quad shows for both draw orders of the pair at `offset`. */
async function resolvesPair(device: Device, setup: DepthSetup, offset: number): Promise<boolean> {
  const nearDistance = NEAR_QUAD_DISTANCE + offset;
  const farDistance = nearDistance + QUAD_SEPARATION;
  const farFirst = await drawQuads(device, setup, [farDistance, nearDistance]);
  const nearFirst = await drawQuads(device, setup, [nearDistance, farDistance]);
  return farFirst.join() === RED.join() && nearFirst.join() === RED.join();
}

/** Counts the quad pairs that the depth setup resolves. */
async function countResolvedPairs(device: Device, setup: DepthSetup): Promise<number> {
  let resolvedCount = 0;
  for (const offset of PAIR_OFFSETS) {
    if (await resolvesPair(device, setup, offset)) {
      resolvedCount++;
    }
  }
  return resolvedCount;
}

it('Reverse-Z resolves quads 100 units apart at 1e6 units, where standard depth z-fights', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    // Standard depth: the quads of a pair usually get the same float32 depth.
    expect(
      await countResolvedPairs(device, getStandardDepthSetup(device)),
      `${device.type}: standard depth resolves at most half of the pairs`
    ).toBeLessThanOrEqual(PAIR_OFFSETS.length / 2);

    if (device.type === 'webgl') {
      // Reverse-Z without clip control: depth is 0.5 + 0.5 * near / distance and loses the precision.
      expect(
        await countResolvedPairs(device, getReverseDepthSetup()),
        'webgl: reverse-Z with the default clip range also z-fights'
      ).toBeLessThanOrEqual(PAIR_OFFSETS.length / 2);

      if (!device.features.has('clip-control-webgl')) {
        // Some drivers do not expose EXT_clip_control.
        expect(
          () => device.beginRenderPass({clipDepthMode: 'zero-to-one'}),
          'webgl: zero-to-one throws without EXT_clip_control'
        ).toThrow();
        continue;
      }
    }

    expect(
      await countResolvedPairs(device, getReverseDepthSetup('zero-to-one')),
      `${device.type}: reverse-Z resolves every pair, including 1e6 and 1.0001e6`
    ).toBe(PAIR_OFFSETS.length);
  }
});

it('WebGL clipDepthMode applies EXT_clip_control during the pass and restores it at end()', async () => {
  const [device] = await getTestDevices(['webgl']);
  if (!device?.features.has('clip-control-webgl')) {
    return;
  }
  const {gl} = device as unknown as {gl: WebGL2RenderingContext};
  const extension = gl.getExtension('EXT_clip_control')!;
  const readNativeParameter = (parameter: number) => {
    // Read the driver state, not the state tracker cache.
    const tracker = (gl as any).lumaState;
    tracker.enable = false;
    try {
      return gl.getParameter(parameter);
    } finally {
      tracker.enable = true;
    }
  };

  setGLParameters(gl, {[GL.CLIP_ORIGIN_EXT]: GL.UPPER_LEFT_EXT});
  try {
    const renderPass = device.beginRenderPass({clipDepthMode: 'zero-to-one'});
    try {
      expect(readNativeParameter(extension.CLIP_DEPTH_MODE_EXT)).toBe(extension.ZERO_TO_ONE_EXT);
      expect(readNativeParameter(extension.CLIP_ORIGIN_EXT)).toBe(extension.UPPER_LEFT_EXT);
    } finally {
      renderPass.end();
    }
    expect(readNativeParameter(extension.CLIP_DEPTH_MODE_EXT)).toBe(
      extension.NEGATIVE_ONE_TO_ONE_EXT
    );
    expect(readNativeParameter(extension.CLIP_ORIGIN_EXT)).toBe(extension.UPPER_LEFT_EXT);
  } finally {
    setGLParameters(gl, {[GL.CLIP_ORIGIN_EXT]: GL.LOWER_LEFT_EXT});
  }
});

it('WebGL clipDepthMode zero-to-one throws when clip-control-webgl is not available', async () => {
  const device = await luma.createDevice({
    type: 'webgl',
    createCanvasContext: {width: 1, height: 1},
    _disabledFeatures: {'clip-control-webgl': true}
  });
  try {
    expect(device.features.has('clip-control-webgl')).toBe(false);
    const active = device.statsManager.getStats('GPU Resource Counts').get('Resources Active');
    const count = active.count;
    expect(() => device.beginRenderPass({clipDepthMode: 'zero-to-one'})).toThrow(
      'clip-control-webgl'
    );
    expect(active.count).toBe(count);
    // The default range needs no extension.
    expect(() =>
      device.beginRenderPass({clipDepthMode: 'negative-one-to-one'}).end()
    ).not.toThrow();
  } finally {
    device.destroy();
  }
});

it('WebGPU clipDepthMode accepts zero-to-one and rejects negative-one-to-one', async () => {
  const [device] = await getTestDevices(['webgpu']);
  if (!device) {
    return;
  }
  expect(() => device.beginRenderPass({clipDepthMode: 'zero-to-one'}).end()).not.toThrow();
  device.submit();
  const active = device.statsManager.getStats('GPU Resource Counts').get('Resources Active');
  const count = active.count;
  expect(() => device.beginRenderPass({clipDepthMode: 'negative-one-to-one'})).toThrow(
    'clipDepthMode'
  );
  expect(active.count).toBe(count);
});
