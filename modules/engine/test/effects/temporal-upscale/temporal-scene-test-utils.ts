// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import type {Device, Framebuffer, RenderPipeline} from '@luma.gl/core';
import {
  TemporalUpscaler,
  getJitterOffset,
  getJitterPhaseCount
} from '../../../src/effects/temporal-upscale';
import {temporalUpscaleVertex} from '../../../src/effects/temporal-upscale/temporal-upscale-shaders';
import type {TemporalUpscalerRenderOptions} from '../../../src/effects/temporal-upscale';

/** Output dimensions shared by the analytic scene and all metrics. */
export const OUTPUT_SIZE: [number, number] = [96, 64];

/** One analytic scene for both jittered input and the 8x8 box-filtered reference. */
const SCENE = /* wgsl */ `
struct Settings {
  sizes: vec4f,
  jitterMotion: vec4f,
  controls: vec4f, // time, rectangle color, rectangle depth, line width in output pixels
  velocity: vec4f, // sign, padding
};
@group(0) @binding(0) var<uniform> settings: Settings;
struct SceneSample { color: vec4f, depth: f32 };
fn scene(uv: vec2f, time: f32) -> SceneSample {
  let world = uv * settings.sizes.zw - settings.jitterMotion.zw * time;
  let position = fract(world / settings.sizes.zw) * settings.sizes.zw;
  // Slanted square-wave stripes expose render-resolution aliasing. A quiet top band
  // isolates the stale line from unrelated reconstruction error.
  let stripe = select(0.3, 0.7, fract((world.x + 0.37 * world.y) / 13.7) < 0.5);
  var luminance = select(stripe, 0.2, position.y < 18.0);
  let rectangle = all(position > vec2f(34.0, 24.0)) && all(position < vec2f(66.0, 52.0));
  // Both surfaces use the same grayscale range. Clipping alone cannot reliably remove
  // the old rectangle: its reversed stripes lie inside the background's 3x3 range.
  if (rectangle && settings.controls.y > 0.5) { luminance = 1.0 - stripe; }
  if (abs(position.x - 17.0) < 0.5 * settings.controls.w && position.y < 16.0) {
    luminance = 0.9;
  }
  let depth = select(0.9, 0.5, rectangle && settings.controls.z > 0.5);
  return SceneSample(vec4f(vec3f(luminance), 1.0), depth);
}
`;

/** Jittered render-size MRT and real device depth. */
const INPUT_FRAGMENT = /* wgsl */ `${SCENE}
struct Output {
  @location(0) color: vec4f,
  @location(1) velocity: vec4f,
  @builtin(frag_depth) depth: f32
};
@fragment fn fragmentMain(@builtin(position) fragment: vec4f) -> Output {
  let uv = (fragment.xy - settings.jitterMotion.xy) / settings.sizes.xy;
  let sample = scene(uv, settings.controls.x);
  // A feature moves by +motion, so current UV minus previous UV is motion divided by outputSize.
  return Output(sample.color,
    vec4f(settings.jitterMotion.zw / settings.sizes.zw * settings.velocity.x,
      1.0 - sample.depth, 1.0), sample.depth);
}
`;

/** Output-resolution reference integrates the identical scene over each pixel footprint. */
const REFERENCE_FRAGMENT = /* wgsl */ `${SCENE}
@fragment fn fragmentMain(@builtin(position) fragment: vec4f) -> @location(0) vec4f {
  var color = vec4f(0.0);
  for (var vertical = 0; vertical < 8; vertical++) {
    for (var horizontal = 0; horizontal < 8; horizontal++) {
      let offset = (vec2f(f32(horizontal), f32(vertical)) + 0.5) / 8.0 - 0.5;
      color += scene((fragment.xy + offset) / settings.sizes.zw, settings.controls.x).color;
    }
  }
  return color / 64.0;
}
`;

/** Deterministic scene controls; depth can retain the rectangle independently of color. */
type SceneOptions = {
  /** Frame number used for camera translation. */
  time?: number;
  /** Scene displacement in output pixels per frame. */
  motion?: [number, number];
  /** Negate only xy velocity to detect reprojection-sign regressions. */
  velocitySign?: number;
  /** Whether the rectangle remains in color. */
  rectangle?: boolean;
  /** Whether the rectangle remains in depth and expected previous depth. */
  rectangleDepth?: boolean;
  /** Width of the thin line in output pixels; 0 removes it. Default 2 (one render pixel). */
  lineWidth?: number;
};

/** Per-frame public tuning knobs accepted by the fixture. */
type TuningOptions = Pick<
  TemporalUpscalerRenderOptions,
  'kernelSharpness' | 'responsiveness' | 'reset' | 'debugView'
>;

/** Tiny offscreen fixture with explicit ownership, including cleanup after partial setup. */
export function createTemporalScene(device: Device, renderSize: [number, number] = [48, 32]) {
  const resources: {destroy(): void}[] = [];
  /** Registers each resource as soon as creation succeeds. */
  function own<Resource extends {destroy(): void}>(resource: Resource): Resource {
    resources.push(resource);
    return resource;
  }
  /** Releases attachments separately from their borrowing framebuffers. */
  function destroy(): void {
    for (const resource of resources.reverse()) resource.destroy();
    resources.length = 0;
  }
  try {
    /** Creates sampled, renderable and readable color attachments. */
    function createColor(size: [number, number], format: 'rgba8unorm' | 'rgba16float') {
      return own(
        device.createTexture({
          width: size[0],
          height: size[1],
          format,
          usage: Texture.TEXTURE | Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
        })
      );
    }
    const colorTexture = createColor(renderSize, 'rgba8unorm');
    const velocityTexture = createColor(renderSize, 'rgba16float');
    const depthTexture = own(
      device.createTexture({
        width: renderSize[0],
        height: renderSize[1],
        format: 'depth32float',
        usage: Texture.TEXTURE | Texture.RENDER_ATTACHMENT
      })
    );
    const outputTexture = createColor(OUTPUT_SIZE, 'rgba8unorm');
    const referenceTexture = createColor(OUTPUT_SIZE, 'rgba8unorm');
    const inputTarget = own(
      device.createFramebuffer({
        width: renderSize[0],
        height: renderSize[1],
        colorAttachments: [colorTexture, velocityTexture],
        depthStencilAttachment: depthTexture
      })
    );
    const outputTarget = own(
      device.createFramebuffer({
        width: OUTPUT_SIZE[0],
        height: OUTPUT_SIZE[1],
        colorAttachments: [outputTexture]
      })
    );
    const referenceTarget = own(
      device.createFramebuffer({
        width: OUTPUT_SIZE[0],
        height: OUTPUT_SIZE[1],
        colorAttachments: [referenceTexture]
      })
    );
    const settings = own(
      device.createBuffer({byteLength: 64, usage: Buffer.UNIFORM | Buffer.COPY_DST})
    );
    const vertexShader = own(device.createShader({stage: 'vertex', source: temporalUpscaleVertex}));
    /** Creates a raw-core pipeline for the input or reference pass. */
    function createPipeline(reference: boolean): RenderPipeline {
      const fragmentShader = own(
        device.createShader({
          stage: 'fragment',
          source: reference ? REFERENCE_FRAGMENT : INPUT_FRAGMENT
        })
      );
      return own(
        device.createRenderPipeline({
          vs: vertexShader,
          fs: fragmentShader,
          topology: 'triangle-list',
          shaderLayout: {
            attributes: [],
            bindings: [
              {name: 'settings', type: 'uniform', group: 0, location: 0, minBindingSize: 64}
            ]
          },
          colorAttachmentFormats: reference ? ['rgba8unorm'] : ['rgba8unorm', 'rgba16float'],
          ...(reference
            ? {}
            : {
                depthStencilAttachmentFormat: 'depth32float' as const,
                parameters: {depthWriteEnabled: true, depthCompare: 'always' as const}
              })
        })
      );
    }
    const inputPipeline = createPipeline(false);
    const referencePipeline = createPipeline(true);
    const upscaler = own(new TemporalUpscaler(device, {renderSize, outputSize: OUTPUT_SIZE}));
    /** Encodes a complete fullscreen pass. */
    function draw(pipeline: RenderPipeline, framebuffer: Framebuffer): void {
      const pass = device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: framebuffer === inputTarget ? 1 : false,
        clearStencil: false
      });
      try {
        pass.setPipeline(pipeline);
        pass.setBindings({settings});
        pass.draw({vertexCount: 3});
      } finally {
        pass.end();
      }
    }
    return {
      destroy,
      /** Renders input, reference and temporal output, submitting before any uniform rewrite. */
      render(frame: number, sceneOptions: SceneOptions = {}, tuning: TuningOptions = {}): void {
        const jitter = getJitterOffset(frame, getJitterPhaseCount(renderSize[0], OUTPUT_SIZE[0]));
        settings.write(
          new Float32Array([
            ...renderSize,
            ...OUTPUT_SIZE,
            ...jitter,
            ...(sceneOptions.motion ?? [0, 0]),
            sceneOptions.time ?? frame,
            Number(sceneOptions.rectangle ?? true),
            Number(sceneOptions.rectangleDepth ?? sceneOptions.rectangle ?? true),
            sceneOptions.lineWidth ?? 2,
            sceneOptions.velocitySign ?? 1,
            0,
            0,
            0
          ])
        );
        draw(inputPipeline, inputTarget);
        draw(referencePipeline, referenceTarget);
        upscaler.render({
          colorTexture,
          depthTexture,
          velocityTexture,
          currentJitter: [jitter[0] / renderSize[0], jitter[1] / renderSize[1]],
          target: outputTarget,
          sharpness: 0,
          // The tests state the responsiveness; the library default is not 0.
          responsiveness: 0,
          ...tuning
        });
        device.submit();
      },
      /** Reads the unsharpened resolved output (or diagnostic output). */
      readOutput: () => readPixels(device, outputTexture),
      /** Reads the box-filtered ground truth. */
      readReference: () => readPixels(device, referenceTexture),
      /** Reads the raw jittered input, used by the native-size TAA comparison. */
      readInput: () => readPixels(device, colorTexture)
    };
  } catch (error) {
    destroy();
    throw error;
  }
}

/** Reads rgba8unorm into normalized floats, removing WebGPU row padding. */
async function readPixels(device: Device, texture: Texture): Promise<Float32Array> {
  const {width, height} = texture;
  const layout = texture.computeMemoryLayout({width, height});
  const buffer = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width, height}, buffer);
    const bytes = await buffer.readAsync();
    const source = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const result = new Float32Array(width * height * 4);
    for (let vertical = 0; vertical < height; vertical++) {
      for (let component = 0; component < width * 4; component++) {
        result[vertical * width * 4 + component] =
          source[vertical * layout.bytesPerRow + component] / 255;
      }
    }
    return result;
  } finally {
    buffer.destroy();
  }
}

/** RGB PSNR in dB, with unit peak; alpha is excluded rather than inflating the score. */
export function psnr(actual: Float32Array, reference: Float32Array): number {
  let squaredError = 0;
  for (let index = 0; index < actual.length; index++) {
    if (index % 4 !== 3) squaredError += (actual[index] - reference[index]) ** 2;
  }
  return -10 * Math.log10(Math.max(squaredError / ((actual.length * 3) / 4), 1e-20));
}

/** RGB absolute errors in a half-open output-pixel rectangle, with a useful maximum for stale lines. */
export function measureRegion(
  actual: Float32Array,
  reference: Float32Array,
  region: [number, number, number, number]
): {mean: number; maximum: number} {
  let total = 0;
  let maximum = 0;
  let count = 0;
  for (let vertical = region[1]; vertical < region[3]; vertical++) {
    for (let horizontal = region[0]; horizontal < region[2]; horizontal++) {
      for (let channel = 0; channel < 3; channel++) {
        const index = (vertical * OUTPUT_SIZE[0] + horizontal) * 4 + channel;
        const error = Math.abs(actual[index] - reference[index]);
        total += error;
        maximum = Math.max(maximum, error);
        count++;
      }
    }
  }
  return {mean: total / count, maximum};
}
