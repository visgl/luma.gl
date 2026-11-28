// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import type {
  Binding,
  Device,
  Framebuffer,
  RenderPipeline,
  Sampler,
  Shader,
  ShaderLayout,
  TextureFormat,
  TextureFormatColor,
  TextureFormatDepthStencil
} from '@luma.gl/core';
import {
  encodeSceneCapturePass,
  type SceneCapturePassDefinition
} from '../../passes/scene-capture-pass';
import type {TemporalFrame} from '../passes/screen-space/temporal-frame';
import {DEFAULT_KERNEL_SHARPNESS, DEFAULT_RESPONSIVENESS} from './temporal-math';
import type {TemporalVector2} from './temporal-math';
import {
  temporalUpscaleVertex,
  temporalUpscaleAccumulate,
  temporalUpscaleSharpen
} from './temporal-upscale-shaders';

type TemporalUpscalePassFrame = {
  outputSize: TemporalVector2;
  pipeline: RenderPipeline;
  bindings: Record<string, Binding>;
  clear?: boolean;
};

const temporalUpscaleAccumulationPass = {
  name: 'temporal-upscale-accumulation',
  target: 'history',
  pass: {clearColor: false, clearDepth: false, clearStencil: false},
  getPassProps: ({outputSize}) => ({parameters: {viewport: [0, 0, ...outputSize]}}),
  draw: (renderPass, {pipeline, bindings}) => {
    renderPass.setPipeline(pipeline);
    renderPass.setBindings(bindings);
    renderPass.draw({vertexCount: 3});
  }
} as const satisfies SceneCapturePassDefinition<TemporalUpscalePassFrame, 'history'>;

const temporalUpscaleSharpenPass = {
  name: 'temporal-upscale-sharpen',
  target: 'output',
  pass: {clearDepth: false, clearStencil: false},
  getPassProps: ({outputSize, clear}) => ({
    parameters: {viewport: [0, 0, ...outputSize]},
    clearColor: clear === false ? false : [0, 0, 0, 0]
  }),
  draw: temporalUpscaleAccumulationPass.draw
} as const satisfies SceneCapturePassDefinition<TemporalUpscalePassFrame, 'output'>;

/** Construction settings for the independent two-pass temporal upscaler. */
export type TemporalUpscalerProps = {
  /** Resource label prefix. */
  id?: string;
  /** Low-resolution input dimensions. */
  renderSize: [number, number];
  /** Accumulation and target dimensions. */
  outputSize: [number, number];
  /** Target color format, default rgba8unorm; must be a renderable color format. */
  outputFormat?: TextureFormat;
};

/** Per-frame inputs, all single-sampled, with top-left UVs and standard (not reversed) depth. */
export type TemporalUpscalerRenderOptions = Pick<
  TemporalFrame,
  'currentJitter' | 'resetHistory'
> & {
  /** Jittered render-sized premultiplied RGBA, filterable float/unorm. */
  colorTexture: Texture;
  /** Render-sized device depth, zero near and one far. */
  depthTexture: Texture;
  /**
   * Render-sized rgba16float: xy = unjittered current UV minus previous UV, z = 1 - expected previous
   * device depth, w = validity.
   */
  velocityTexture: Texture;
  /** Output-sized framebuffer, or the current canvas framebuffer. Must not alias inputs/history. */
  target: Framebuffer | null;
  /** Sharpening strength in [0,1]; zero is an exact history copy (default). */
  sharpness?: number;
  /** Accumulation kernel sharpness in [0.5,1], clamped; default 0.85. Larger values narrow the kernel. */
  kernelSharpness?: number;
  /**
   * Forget a history whose luminance is outside the current neighbourhood range, in [0,1],
   * clamped. Only a frame with a sample close to the output pixel forgets. Default 0.5. 0 keeps the
   * plain accumulation. A higher value removes stale features sooner, and it keeps less of the
   * detail that is smaller than a render pixel.
   */
  responsiveness?: number;
  /** Maximum history contribution of a full-weight sample, default 0.95. */
  historyWeightMax?: number;
  /**
   * Keep the fine detail of a history that explains the nearest sample of the current frame,
   * and clip only an inconsistent history. Default true. `false` clips the history of each
   * pixel to the low-resolution neighbourhood (the usual TAA rule), which removes detail
   * smaller than a render pixel.
   */
  sampleValidation?: boolean;
  /** Diagnostic target output; accumulated history remains unchanged. */
  debugView?: 'none' | 'velocity' | 'disocclusion' | 'history-weight';
  /** Clear the final target before drawing, default true. */
  clear?: boolean;
};

/** Owned MRT history resources; attachments are explicitly destroyed by the upscaler. */
type HistoryFrame = {
  /** Premultiplied accumulated color. */
  color: Texture;
  /** One minus device depth and sample count. */
  auxiliary: Texture;
  /** MRT attachment container. */
  framebuffer: Framebuffer;
};

/** Raw-core WebGPU implementation inspired by AMD FSR 2; independently authored, non-neural. */
export class TemporalUpscaler {
  /** Device owning all resources. */
  private readonly device: Device;
  /** Resource label prefix. */
  private readonly id: string;
  /** Current input dimensions. */
  private renderSize: TemporalVector2;
  /** Current output dimensions. */
  private outputSize: TemporalVector2;
  /** Hand-packed four-vec4 uniform block. */
  private readonly uniformBuffer: Buffer;
  /** Clamped bilinear history sampler. */
  private readonly sampler: Sampler;
  /** Owned shader modules. */
  private readonly shaders: Shader[];
  /** Accumulation pipeline with two color attachments. */
  private readonly accumulatePipeline: RenderPipeline;
  /** Final single-target pipelines, one for each attachment state of a target. */
  private readonly sharpenPipelines = new Map<string, RenderPipeline>();
  /** Binding layout of the final pass. */
  private readonly sharpenShaderLayout: ShaderLayout;
  /** Color format of a `null` target. */
  private readonly outputFormat: TextureFormatColor;
  /** Ping-pong history pair. */
  private histories: HistoryFrame[] = [];
  /** Index of the most recently accumulated frame. */
  private historyIndex = 0;
  /** Whether the next frame must start from current color. */
  private needsReset = true;
  /** Whether owned resources have been released. */
  private destroyed = false;

  /** Returns true for WebGPU devices; no WebGL implementation is provided. */
  static isSupported(device: Device): boolean {
    return device.info.type === 'webgpu';
  }

  /** Allocates pipelines and output-sized history; inputs and target remain caller-owned. */
  constructor(device: Device, props: TemporalUpscalerProps) {
    if (!TemporalUpscaler.isSupported(device)) throw new Error('WebGPU required');
    this.device = device;
    this.id = props.id ?? 'temporal-upscaler';
    this.renderSize = [...props.renderSize];
    this.outputSize = [...props.outputSize];
    this.uniformBuffer = device.createBuffer({
      id: `${this.id}-settings`,
      byteLength: 64,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.sampler = device.createSampler({
      minFilter: 'linear',
      magFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge'
    });
    this.shaders = [
      device.createShader({
        id: `${this.id}-vertex`,
        stage: 'vertex',
        source: temporalUpscaleVertex
      }),
      device.createShader({
        id: `${this.id}-accumulate`,
        stage: 'fragment',
        source: temporalUpscaleAccumulate
      }),
      device.createShader({
        id: `${this.id}-sharpen`,
        stage: 'fragment',
        source: temporalUpscaleSharpen
      })
    ];
    const bindings: ShaderLayout['bindings'] = [
      {name: 'settings', type: 'uniform', group: 0, location: 0, minBindingSize: 64},
      {name: 'colorTexture', type: 'texture', group: 0, location: 1, sampleType: 'float'},
      {name: 'depthTexture', type: 'texture', group: 0, location: 2, sampleType: 'depth'},
      {name: 'velocityTexture', type: 'texture', group: 0, location: 3, sampleType: 'float'},
      {name: 'historyColor', type: 'texture', group: 0, location: 4, sampleType: 'float'},
      {name: 'historyAux', type: 'texture', group: 0, location: 5, sampleType: 'float'},
      {name: 'linearSampler', type: 'sampler', group: 0, location: 6, samplerType: 'filtering'}
    ];
    this.accumulatePipeline = device.createRenderPipeline({
      id: `${this.id}-accumulate`,
      vs: this.shaders[0],
      fs: this.shaders[1],
      topology: 'triangle-list',
      shaderLayout: {attributes: [], bindings},
      colorAttachmentFormats: ['rgba16float', 'rg16float']
    });
    this.sharpenShaderLayout = {
      attributes: [],
      bindings: [
        ...bindings,
        {name: 'resolvedColor', type: 'texture', group: 0, location: 7, sampleType: 'float'}
      ]
    };
    // The public API accepts TextureFormat; the target contract requires a color format.
    this.outputFormat = (props.outputFormat ?? 'rgba8unorm') as TextureFormatColor;
    this.setSize(props.renderSize, props.outputSize);
  }

  /** Recreates both histories and resets accumulation, even when dimensions are unchanged. Submit pending work first. */
  setSize(renderSize: TemporalVector2, outputSize: TemporalVector2): void {
    this.destroyHistories();
    this.renderSize = [...renderSize];
    this.outputSize = [...outputSize];
    this.histories = [0, 1].map(index => {
      const common = {
        width: outputSize[0],
        height: outputSize[1],
        usage: Texture.TEXTURE | Texture.RENDER_ATTACHMENT
      };
      const color = this.device.createTexture({
        ...common,
        id: `${this.id}-color-${index}`,
        format: 'rgba16float'
      });
      const auxiliary = this.device.createTexture({
        ...common,
        id: `${this.id}-auxiliary-${index}`,
        format: 'rg16float'
      });
      const framebuffer = this.device.createFramebuffer({
        id: `${this.id}-history-${index}`,
        width: outputSize[0],
        height: outputSize[1],
        colorAttachments: [color, auxiliary]
      });
      return {color, auxiliary, framebuffer};
    });
    this.historyIndex = 0;
    this.resetHistory();
  }

  /**
   * Encodes accumulation then sharpening. The caller must submit before the next render,
   * resize or destruction (uniform writes use the device queue). No submission occurs here.
   * Each pass ends before a sampled texture becomes an attachment in a later frame;
   * separate WebGPU render-pass usage scopes need no intermediate submission.
   */
  render(options: TemporalUpscalerRenderOptions): void {
    const previous = this.histories[this.historyIndex];
    const nextIndex = 1 - this.historyIndex;
    const next = this.histories[nextIndex];
    const debugMode = {none: 0, velocity: 1, disocclusion: 2, 'history-weight': 3}[
      options.debugView ?? 'none'
    ];
    this.uniformBuffer.write(
      new Float32Array([
        ...this.renderSize,
        ...this.outputSize,
        options.currentJitter[0] * this.renderSize[0],
        options.currentJitter[1] * this.renderSize[1],
        Number(this.needsReset || Boolean(options.resetHistory)),
        options.sharpness ?? 0,
        options.historyWeightMax ?? 0.95,
        debugMode,
        Number(options.sampleValidation ?? true),
        options.kernelSharpness ?? DEFAULT_KERNEL_SHARPNESS,
        options.responsiveness ?? DEFAULT_RESPONSIVENESS,
        0,
        0,
        0
      ])
    );
    const bindings = {
      settings: this.uniformBuffer,
      colorTexture: options.colorTexture,
      depthTexture: options.depthTexture,
      velocityTexture: options.velocityTexture,
      historyColor: previous.color,
      historyAux: previous.auxiliary,
      linearSampler: this.sampler
    };
    const commandEncoder = this.device.commandEncoder;
    encodeSceneCapturePass(temporalUpscaleAccumulationPass, {
      commandEncoder,
      framebuffers: {history: next.framebuffer},
      frame: {pipeline: this.accumulatePipeline, outputSize: this.outputSize, bindings}
    });
    // A color-only view of the target avoids coupling this pipeline to a caller's
    // depth format or additional MRT attachments. These borrowed views remain caller-owned.
    const target =
      options.target ??
      this.device.getDefaultCanvasContext().getCurrentFramebuffer({depthStencilFormat: false});
    const colorTarget =
      target.depthStencilAttachment || target.colorAttachments.length > 1
        ? this.device.createFramebuffer({
            width: this.outputSize[0],
            height: this.outputSize[1],
            colorAttachments: [target.colorAttachments[0]]
          })
        : target;
    try {
      encodeSceneCapturePass(temporalUpscaleSharpenPass, {
        commandEncoder,
        framebuffers: {output: colorTarget},
        frame: {
          pipeline: this.getSharpenPipeline(colorTarget),
          outputSize: this.outputSize,
          bindings: {...bindings, resolvedColor: next.color},
          clear: options.clear
        }
      });
    } finally {
      if (colorTarget !== target) colorTarget.destroy();
    }
    this.historyIndex = nextIndex;
    this.needsReset = false;
  }

  /** Discards history on the next render, without GPU work or clearing textures. */
  resetHistory(): void {
    this.needsReset = true;
  }

  /** Latest unsharpened output-sized rgba16float history; borrowed, never destroy it externally. */
  get historyTexture(): Texture {
    return this.histories[this.historyIndex].color;
  }

  /** Releases all owned GPU resources; call after submitting pending rendering. Idempotent. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.destroyHistories();
    this.accumulatePipeline.destroy();
    for (const pipeline of this.sharpenPipelines.values()) pipeline.destroy();
    this.sharpenPipelines.clear();
    for (const shader of this.shaders) shader.destroy();
    this.sampler.destroy();
    this.uniformBuffer.destroy();
  }

  /**
   * Gets the final pipeline for the attachment state of a target. A WebGPU pipeline must name
   * the color format and the depth-stencil format of the render pass. A canvas framebuffer has
   * a depth-stencil attachment, and an offscreen target usually has none.
   */
  private getSharpenPipeline(target: Framebuffer | null): RenderPipeline {
    const colorAttachment = target?.colorAttachments[0];
    const colorFormat = (colorAttachment?.props.format ??
      colorAttachment?.texture.props.format ??
      this.outputFormat) as TextureFormatColor;
    const depthFormat = target
      ? target.depthStencilAttachment?.texture.props.format
      : this.device.preferredDepthFormat;
    const key = `${colorFormat}/${depthFormat ?? 'none'}`;
    let pipeline = this.sharpenPipelines.get(key);
    if (!pipeline) {
      pipeline = this.device.createRenderPipeline({
        id: `${this.id}-sharpen-${key}`,
        vs: this.shaders[0],
        fs: this.shaders[2],
        topology: 'triangle-list',
        shaderLayout: this.sharpenShaderLayout,
        colorAttachmentFormats: [colorFormat],
        ...(depthFormat
          ? {
              depthStencilAttachmentFormat: depthFormat as TextureFormatDepthStencil,
              parameters: {depthWriteEnabled: false, depthCompare: 'always'}
            }
          : {})
      });
      this.sharpenPipelines.set(key, pipeline);
    }
    return pipeline;
  }

  /** Releases framebuffers and their explicitly owned attachments. */
  private destroyHistories(): void {
    for (const history of this.histories) {
      history.framebuffer.destroy();
      history.color.destroy();
      history.auxiliary.destroy();
    }
    this.histories = [];
  }
}
