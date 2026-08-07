// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type Framebuffer, Texture} from '@luma.gl/core';
import {SphereGeometry} from '@luma.gl/engine';
import {
  DeferredSceneRenderer,
  RayTracingSceneRenderer,
  type RayTracingSceneRenderOptions,
  SceneRenderer,
  type SceneSurface
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import test from 'test/utils/vitest-tape';

type LightingParityTarget = {
  color: Texture;
  depth?: Texture;
  framebuffer: Framebuffer;
  destroy(): void;
};

type LightingParityRenderer = {
  id: string;
  renderer: SceneRenderer | DeferredSceneRenderer | RayTracingSceneRenderer;
};

test('forward, deferred, and ray tracing honor the same incoming directional-light hemisphere', async testCase => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const width = 35;
  const height = 29;
  const target = makeLightingParityTarget(device, width, height, 'rgba8unorm', true);
  const surface = makeLightingParitySurface();
  const renderers: LightingParityRenderer[] = [
    {id: 'forward', renderer: new SceneRenderer(device)},
    {id: 'deferred', renderer: new DeferredSceneRenderer(device)},
    {id: 'ray-tracing', renderer: new RayTracingSceneRenderer(device)}
  ];

  try {
    for (const {id, renderer} of renderers) {
      const options = makeLightingParityOptions(id, surface, target.framebuffer);
      const frontStatistics = renderer.render(options);
      device.submit();
      const frontPixel = await readLightingParityPixel(target.color, 17, 14);

      if (id === 'ray-tracing') {
        testCase.equal(
          frontStatistics.rayTracing?.internalWidth,
          width,
          'ray tracing derives its odd internal width from the supplied framebuffer'
        );
        testCase.equal(
          frontStatistics.rayTracing?.internalHeight,
          height,
          'ray tracing derives its odd internal height from the supplied framebuffer'
        );
        testCase.ok(
          frontStatistics.rayTracing?.graph?.topology,
          'the first ray-traced frame exposes encoded mesh-topology work'
        );
        testCase.ok(
          frontStatistics.rayTracing?.graph?.acceleration,
          'the first ray-traced frame exposes encoded TLAS construction'
        );
        testCase.ok(
          frontStatistics.rayTracing?.graph?.trace.nodeCount,
          'the first ray-traced frame exposes encoded tracing and presentation work'
        );
      }

      options.lights = [makeIncomingDirectionalLight([0, 0, 1])];
      const backStatistics = renderer.render(options);
      device.submit();
      const backPixel = await readLightingParityPixel(target.color, 17, 14);

      testCase.ok(
        frontPixel[0] > backPixel[0] + 15,
        `${id} illuminates the camera-facing hemisphere only for incoming negative-Z light ` +
          `(${frontPixel[0]} versus ${backPixel[0]})`
      );

      if (id === 'ray-tracing') {
        testCase.equal(
          backStatistics.rayTracing?.graph?.topology,
          undefined,
          'light-only changes do not encode mesh-topology work'
        );
        testCase.equal(
          backStatistics.rayTracing?.graph?.acceleration,
          undefined,
          'light-only changes do not rebuild the TLAS'
        );
        testCase.equal(
          backStatistics.rayTracing?.graph?.refit,
          undefined,
          'light-only changes do not refit the TLAS'
        );
      }

      options.lights = [makeIncomingDirectionalLight([-1, 0, -0.35])];
      renderer.render(options);
      device.submit();
      const rightIlluminatedLeftPixel = await readLightingParityPixel(target.color, 13, 14);
      const rightIlluminatedRightPixel = await readLightingParityPixel(target.color, 21, 14);

      options.lights = [makeIncomingDirectionalLight([1, 0, -0.35])];
      renderer.render(options);
      device.submit();
      const leftIlluminatedLeftPixel = await readLightingParityPixel(target.color, 13, 14);
      const leftIlluminatedRightPixel = await readLightingParityPixel(target.color, 21, 14);

      testCase.ok(
        rightIlluminatedRightPixel[0] > rightIlluminatedLeftPixel[0] + 5,
        `${id} places positive-X illumination on the visible right hemisphere`
      );
      testCase.ok(
        leftIlluminatedLeftPixel[0] > leftIlluminatedRightPixel[0] + 5,
        `${id} mirrors highlights when the incoming light direction is reversed`
      );
    }
  } finally {
    for (const {renderer} of renderers) {
      renderer.destroy();
    }
    target.destroy();
  }

  testCase.end();
});

test('forward, deferred, and ray tracing add multiple independently colored ambient lights', async testCase => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const target = makeLightingParityTarget(device, 35, 29, 'rgba8unorm', true);
  const surface = makeLightingParitySurface();
  const renderers: LightingParityRenderer[] = [
    {id: 'forward', renderer: new SceneRenderer(device)},
    {id: 'deferred', renderer: new DeferredSceneRenderer(device)},
    {id: 'ray-tracing', renderer: new RayTracingSceneRenderer(device)}
  ];
  const redAmbientLight = {
    type: 'ambient' as const,
    color: [1, 0, 0] as [number, number, number],
    intensity: 0.45
  };
  const greenAmbientLight = {
    type: 'ambient' as const,
    color: [0, 1, 0] as [number, number, number],
    intensity: 0.65
  };

  try {
    for (const {id, renderer} of renderers) {
      const options = makeLightingParityOptions(
        `${id}-multiple-ambient`,
        surface,
        target.framebuffer
      );
      options.lights = [redAmbientLight, greenAmbientLight];

      renderer.render(options);
      device.submit();
      const pixel = await readLightingParityPixel(target.color, 17, 14);

      testCase.ok(pixel[0] > 10, `${id} retains the first independently colored ambient light`);
      testCase.ok(pixel[1] > 10, `${id} adds the second independently colored ambient light`);
      testCase.ok(pixel[2] < 5, `${id} does not introduce unlit blue ambient radiance`);
      testCase.equal(options.lights[0], redAmbientLight, `${id} preserves the first source light`);
      testCase.equal(
        options.lights[1],
        greenAmbientLight,
        `${id} preserves the second source light`
      );
    }
  } finally {
    for (const {renderer} of renderers) {
      renderer.destroy();
    }
    target.destroy();
  }

  testCase.end();
});

test('ray tracing renders linear HDR into caller-owned depthless offscreen targets', async testCase => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const renderer = new RayTracingSceneRenderer(device);
  const surface = makeLightingParitySurface();
  const highDynamicRangeTarget = makeLightingParityTarget(device, 19, 17, 'rgba16float', false);
  const replacementHighDynamicRangeTarget = makeLightingParityTarget(
    device,
    19,
    17,
    'rgba16float',
    false
  );
  const standardTarget = makeLightingParityTarget(device, 23, 15, 'rgba8unorm', false);
  const supportsHardwareSRGB = device.getTextureFormatCapabilities('rgba8unorm-srgb').render;
  const hardwareSRGBTarget = supportsHardwareSRGB
    ? makeLightingParityTarget(device, 23, 15, 'rgba8unorm-srgb', false)
    : undefined;

  try {
    const options = makeLightingParityOptions(
      'ray-tracing-depthless-hdr',
      surface,
      highDynamicRangeTarget.framebuffer
    );
    options.lights = [makeIncomingDirectionalLight([0, 0, -1], 12)];
    delete options.toneMapMode;
    delete options.outputColorSpace;

    const highDynamicRangeStatistics = renderer.render(options);
    device.submit();
    const highDynamicRangePixel = await readLightingParityFloat16Pixel(
      highDynamicRangeTarget.color,
      9,
      8
    );

    testCase.equal(
      highDynamicRangeStatistics.rayTracing?.internalWidth,
      19,
      'a depthless HDR framebuffer controls the odd internal width'
    );
    testCase.equal(
      highDynamicRangeStatistics.rayTracing?.internalHeight,
      17,
      'a depthless HDR framebuffer controls the odd internal height'
    );
    testCase.ok(
      highDynamicRangePixel[0] > 1,
      `linear rgba16float presentation preserves unclamped radiance (${highDynamicRangePixel[0]})`
    );
    testCase.deepEqual(
      getLightingParityPresentation(renderer, options.id),
      {colorFormat: 'rgba16float', toneMapMode: 0, outputEncoding: 0},
      'floating-point attachments default to untonemapped linear presentation'
    );

    const originalTraceGraph = getLightingParityTraceGraph(renderer, options.id);
    options.framebuffer = replacementHighDynamicRangeTarget.framebuffer;
    renderer.render(options);
    device.submit();
    const replacementPixel = await readLightingParityFloat16Pixel(
      replacementHighDynamicRangeTarget.color,
      9,
      8
    );

    testCase.equal(
      getLightingParityTraceGraph(renderer, options.id),
      originalTraceGraph,
      'a compatible caller-owned framebuffer swap reuses the compiled trace graph'
    );
    testCase.ok(
      replacementPixel[0] > 1,
      'a compatible retained graph binds the replacement HDR target without losing radiance'
    );

    options.toneMapMode = 1;
    renderer.render(options);
    device.submit();
    const toneMappedGraph = getLightingParityTraceGraph(renderer, options.id);
    const toneMappedPixel = await readLightingParityFloat16Pixel(
      replacementHighDynamicRangeTarget.color,
      9,
      8
    );

    testCase.notEqual(
      toneMappedGraph,
      originalTraceGraph,
      'an explicit tone-map override recompiles the presentation graph'
    );
    testCase.ok(
      toneMappedPixel[0] > 0 && toneMappedPixel[0] < 1,
      `Reinhard presentation maps HDR radiance into the unit interval (${toneMappedPixel[0]})`
    );

    options.outputColorSpace = 'srgb';
    renderer.render(options);
    device.submit();
    const encodedGraph = getLightingParityTraceGraph(renderer, options.id);
    const encodedPixel = await readLightingParityFloat16Pixel(
      replacementHighDynamicRangeTarget.color,
      9,
      8
    );

    testCase.notEqual(
      encodedGraph,
      toneMappedGraph,
      'an explicit output-color-space override recompiles the presentation graph'
    );
    testCase.ok(
      encodedPixel[0] > toneMappedPixel[0],
      'explicit sRGB presentation applies the canonical transfer function after tone mapping'
    );

    delete options.toneMapMode;
    delete options.outputColorSpace;
    options.framebuffer = standardTarget.framebuffer;
    const standardStatistics = renderer.render(options);
    device.submit();
    const standardPixel = await readLightingParityPixel(standardTarget.color, 11, 7);

    testCase.equal(
      standardStatistics.rayTracing?.internalWidth,
      23,
      'changing the caller-owned framebuffer updates internal width'
    );
    testCase.equal(
      standardStatistics.rayTracing?.internalHeight,
      15,
      'changing the caller-owned framebuffer updates internal height'
    );
    testCase.ok(
      standardPixel[0] > 200,
      'changing the target format rebuilds presentation for the bounded normalized attachment'
    );
    testCase.deepEqual(
      getLightingParityPresentation(renderer, options.id),
      {colorFormat: 'rgba8unorm', toneMapMode: 2, outputEncoding: 1},
      'normalized linear attachments default to Khronos Neutral plus one exact sRGB transfer'
    );

    if (hardwareSRGBTarget) {
      options.framebuffer = hardwareSRGBTarget.framebuffer;
      renderer.render(options);
      device.submit();
      const hardwareSRGBPixel = await readLightingParityPixel(hardwareSRGBTarget.color, 11, 7);

      testCase.deepEqual(
        getLightingParityPresentation(renderer, options.id),
        {colorFormat: 'rgba8unorm-srgb', toneMapMode: 2, outputEncoding: 0},
        'hardware-sRGB attachments avoid a second shader-side transfer function'
      );
      testCase.ok(
        Math.abs(hardwareSRGBPixel[0] - standardPixel[0]) <= 3,
        'hardware-sRGB and explicitly encoded linear attachments produce matching physical pixels'
      );
    }
  } finally {
    renderer.destroy();
    highDynamicRangeTarget.destroy();
    replacementHighDynamicRangeTarget.destroy();
    standardTarget.destroy();
    hardwareSRGBTarget?.destroy();
  }

  testCase.end();
});

test('ray tracing without temporal accumulation renders deterministic one-sample pixels', async testCase => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const renderer = new RayTracingSceneRenderer(device);
  const target = makeLightingParityTarget(device, 35, 29, 'rgba8unorm', false);
  const options = makeLightingParityOptions(
    'ray-tracing-static-single-sample',
    makeLightingParitySurface(),
    target.framebuffer
  );
  options.temporalReprojection = false;
  options.progressive = false;
  options.samplesPerPixel = 1;
  const sampleCoordinates: readonly [number, number][] = [
    [11, 14],
    [12, 14],
    [17, 14],
    [22, 14],
    [23, 14],
    [17, 8],
    [17, 20]
  ];

  try {
    const initialStatistics = renderer.render(options);
    device.submit();
    const referencePixels = await Promise.all(
      sampleCoordinates.map(([horizontal, vertical]) =>
        readLightingParityPixel(target.color, horizontal, vertical)
      )
    );

    testCase.ok(
      referencePixels.some(pixel => pixel[0] > 25),
      'the deterministic reference includes a visibly lit center sample'
    );
    testCase.ok(
      initialStatistics.rayTracing?.graph?.acceleration,
      'the initial deterministic frame builds its scene acceleration'
    );

    for (let frameIndex = 1; frameIndex <= 4; frameIndex++) {
      const frameStatistics = renderer.render(options);
      device.submit();
      const currentPixels = await Promise.all(
        sampleCoordinates.map(([horizontal, vertical]) =>
          readLightingParityPixel(target.color, horizontal, vertical)
        )
      );

      testCase.deepEqual(
        currentPixels.map(pixel => Array.from(pixel)),
        referencePixels.map(pixel => Array.from(pixel)),
        `frame ${frameIndex} preserves exact center and silhouette bytes with temporal AA disabled`
      );
      testCase.equal(
        frameStatistics.rayTracing?.accumulatedSamples,
        1,
        `frame ${frameIndex} reports exactly one unaccumulated sample`
      );
      testCase.equal(
        frameStatistics.rayTracing?.graph?.nodeCount,
        frameStatistics.rayTracing?.graph?.trace.nodeCount,
        `frame ${frameIndex} records only the steady-state tracing stage`
      );
      testCase.equal(
        frameStatistics.rayTracing?.graph?.acceleration,
        undefined,
        `frame ${frameIndex} does not rebuild an unchanged scene`
      );
    }
  } finally {
    renderer.destroy();
    target.destroy();
  }

  testCase.end();
});

function getLightingParityTraceGraph(
  renderer: RayTracingSceneRenderer,
  identifier: string
): object {
  const frames: Map<string, {traceGraph: object}> = Reflect.get(renderer, 'frames');
  const frame = frames.get(identifier);
  if (!frame) {
    throw new Error('Expected the ray-tracing presentation graph to be retained.');
  }
  return frame.traceGraph;
}

function getLightingParityPresentation(
  renderer: RayTracingSceneRenderer,
  identifier: string
): {colorFormat: string; toneMapMode: number; outputEncoding: number} {
  const frames: Map<
    string,
    {presentation: {colorFormat: string; toneMapMode: number; outputEncoding: number}}
  > = Reflect.get(renderer, 'frames');
  const frame = frames.get(identifier);
  if (!frame) {
    throw new Error('Expected the ray-tracing presentation options to be retained.');
  }
  const {colorFormat, toneMapMode, outputEncoding} = frame.presentation;
  return {colorFormat, toneMapMode, outputEncoding};
}

function makeLightingParitySurface(): SceneSurface {
  return {
    id: 'shared-lighting-parity-sphere',
    geometry: new SphereGeometry({radius: 0.9, nlat: 6, nlong: 8}),
    material: {
      id: 'shared-lighting-parity-material',
      uniforms: {
        baseColorFactor: [0.9, 0.45, 0.2, 1],
        metallicRoughnessValues: [0, 0.8]
      }
    },
    transforms: [new Matrix4()]
  };
}

function makeLightingParityOptions(
  identifier: string,
  surface: SceneSurface,
  framebuffer: Framebuffer
): RayTracingSceneRenderOptions {
  return {
    id: `lighting-parity-${identifier}`,
    surfaces: [surface],
    framebuffer,
    camera: {
      viewMatrix: new Matrix4().lookAt({eye: [0, 0, 4], center: [0, 0, 0], up: [0, 1, 0]}),
      projectionMatrix: new Matrix4().perspective({
        fovy: Math.PI / 3,
        aspect: framebuffer.width / framebuffer.height,
        near: 0.1,
        far: 100
      }),
      position: [0, 0, 4]
    },
    lights: [makeIncomingDirectionalLight([0, 0, -1])],
    background: [0, 0, 0, 1],
    exposure: 1,
    toneMapMode: 0,
    outputColorSpace: 'linear',
    resolutionScale: 1,
    minimumResolutionScale: 1,
    adaptiveResolution: false,
    progressive: false,
    shadows: false,
    samplesPerPixel: 1,
    width: 3,
    height: 5
  };
}

function makeIncomingDirectionalLight(direction: [number, number, number], intensity = 3) {
  return {type: 'directional' as const, direction, color: [1, 1, 1] as const, intensity};
}

function makeLightingParityTarget(
  device: Device,
  width: number,
  height: number,
  format: 'rgba8unorm' | 'rgba8unorm-srgb' | 'rgba16float',
  includeDepth: boolean
): LightingParityTarget {
  const color = device.createTexture({
    id: `lighting-parity-${format}-${width}-${height}-color`,
    width,
    height,
    format,
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const depth = includeDepth
    ? device.createTexture({
        id: `lighting-parity-${format}-${width}-${height}-depth`,
        width,
        height,
        format: 'depth24plus',
        usage: Texture.RENDER
      })
    : undefined;
  const framebuffer = device.createFramebuffer({
    id: `lighting-parity-${format}-${width}-${height}-framebuffer`,
    width,
    height,
    colorAttachments: [color],
    ...(depth ? {depthStencilAttachment: depth} : {})
  });

  return {
    color,
    ...(depth ? {depth} : {}),
    framebuffer,
    destroy() {
      framebuffer.destroy();
      color.destroy();
      depth?.destroy();
    }
  };
}

async function readLightingParityPixel(
  texture: Texture,
  horizontal: number,
  vertical: number
): Promise<Uint8Array> {
  const bytes = await readLightingParityBytes(texture, horizontal, vertical);
  return bytes.slice(0, 4);
}

async function readLightingParityFloat16Pixel(
  texture: Texture,
  horizontal: number,
  vertical: number
): Promise<number[]> {
  const bytes = await readLightingParityBytes(texture, horizontal, vertical);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return [0, 1, 2, 3].map(channel =>
    decodeLightingParityFloat16(view.getUint16(channel * 2, true))
  );
}

async function readLightingParityBytes(
  texture: Texture,
  horizontal: number,
  vertical: number
): Promise<Uint8Array> {
  const layout = texture.computeMemoryLayout({width: 1, height: 1});
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });

  try {
    texture.readBuffer({x: horizontal, y: vertical, width: 1, height: 1}, buffer);
    const bytes = await buffer.readAsync(0, layout.byteLength);
    return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength).slice();
  } finally {
    buffer.destroy();
  }
}

function decodeLightingParityFloat16(value: number): number {
  const sign = (value & 0x8000) === 0 ? 1 : -1;
  const exponent = (value >> 10) & 0x1f;
  const fraction = value & 0x03ff;
  if (exponent === 0) {
    return sign * 2 ** -14 * (fraction / 1024);
  }
  if (exponent === 31) {
    return fraction ? Number.NaN : sign * Number.POSITIVE_INFINITY;
  }
  return sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
}
