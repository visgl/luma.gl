// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray4} from '@math.gl/types';
import {
  type CommandEncoder,
  Device,
  type Framebuffer,
  type RenderPass,
  type RenderPipelineParameters,
  Texture
} from '@luma.gl/core';
import {ClipSpace} from '@luma.gl/engine';
import {type WBOITPass, type WBOITShaderModuleProps} from './wboit';

const WBOIT_COLOR_FORMAT = 'rgba16float';
let nextWBOITResourceId = 0;

const WBOIT_COMPOSITE_WGSL = /* wgsl */ `\
@group(0) @binding(auto) var accumulationTexture: texture_2d<f32>;
@group(0) @binding(auto) var accumulationTextureSampler: sampler;
@group(0) @binding(auto) var revealageTexture: texture_2d<f32>;
@group(0) @binding(auto) var revealageTextureSampler: sampler;

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
#if FLIP_WBOIT_TEXTURE_Y
  let textureCoordinates = vec2<f32>(inputs.uv.x, 1.0 - inputs.uv.y);
#else
  let textureCoordinates = inputs.uv;
#endif
  let accumulation = textureSample(
    accumulationTexture,
    accumulationTextureSampler,
    textureCoordinates
  );
  let revealage = textureSample(
    revealageTexture,
    revealageTextureSampler,
    textureCoordinates
  ).r;
  let alpha = 1.0 - revealage;
  let weightedColor = accumulation.rgb / max(accumulation.a, 1e-5);
  return vec4<f32>(weightedColor * alpha, alpha);
}
`;

const WBOIT_COMPOSITE_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

uniform sampler2D accumulationTexture;
uniform sampler2D revealageTexture;

in vec2 uv;
out vec4 fragColor;

void main(void) {
#if FLIP_WBOIT_TEXTURE_Y
  vec2 textureCoordinates = vec2(uv.x, 1.0 - uv.y);
#else
  vec2 textureCoordinates = uv;
#endif
  vec4 accumulation = texture(accumulationTexture, textureCoordinates);
  float revealage = texture(revealageTexture, textureCoordinates).r;
  float alpha = 1.0 - revealage;
  vec3 weightedColor = accumulation.rgb / max(accumulation.a, 1e-5);
  fragColor = vec4(weightedColor * alpha, alpha);
}
`;

const WBOIT_COMPOSITE_PARAMETERS = {
  depthWriteEnabled: false,
  blend: true,
  blendColorOperation: 'add',
  blendColorSrcFactor: 'one',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaOperation: 'add',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const satisfies RenderPipelineParameters;

/** Result returned by {@link getWBOITSupport}. */
export type WBOITSupport = {
  /** Whether the device supports weighted blended OIT. */
  supported: boolean;
  /** Explanation when `supported` is false. */
  reason?: string;
};

/** Per-pass resources supplied to `WBOITRenderOptions.prepareTranslucent`. */
export type WBOITCaptureContext = {
  /** Active command encoder, used to prepare models before the capture pass opens. */
  commandEncoder: CommandEncoder;
  /** Accumulation or revealage pass being prepared. */
  pass: WBOITPass;
  /** Shader-module props that select the active capture pass. */
  shaderModuleProps: WBOITShaderModuleProps;
  /** Pipeline overrides required by the active capture pass. */
  captureParameters: Readonly<RenderPipelineParameters>;
};

/** Callbacks and target configuration used by {@link WBOITRenderer.render}. */
export type WBOITRenderOptions = {
  /** Target color/depth framebuffer. Defaults to the current canvas framebuffer. */
  framebuffer?: Framebuffer | null;
  /** Base pass clear color. */
  clearColor?: NumberArray4 | false;
  /** Base pass clear depth. */
  clearDepth?: number | false;
  /** Prepare uploads and opaque models before render passes open. */
  prepareBase?: (commandEncoder: CommandEncoder) => void;
  /** Draw the opaque base scene into the target framebuffer. */
  drawBase: (renderPass: RenderPass) => void;
  /** Draw opaque depth into the internal WBOIT target. Defaults to `drawBase`. */
  drawOpaqueDepth?: (renderPass: RenderPass) => void;
  /** Bind WBOIT props and prepare translucent pipelines before each capture pass. */
  prepareTranslucent: (context: WBOITCaptureContext) => void;
  /** Draw translucent models. Called once for accumulation and once for revealage. */
  drawTranslucent: (renderPass: RenderPass) => void;
};

type WBOITRenderTargets = {
  accumulationTexture: Texture;
  accumulationFramebuffer: Framebuffer;
  revealageTexture: Texture;
  revealageFramebuffer: Framebuffer;
  depthTexture: Texture;
  width: number;
  height: number;
};

/**
 * Renders approximate order-independent transparency with weighted color and revealage buffers.
 *
 * The renderer supports WebGPU and WebGL2 devices with blendable `rgba16float` render targets.
 * It does not submit the device command encoder.
 */
export class WBOITRenderer {
  /** Pipeline overrides for weighted color accumulation. */
  static readonly accumulationParameters = Object.freeze({
    depthWriteEnabled: false,
    depthCompare: 'less-equal',
    blend: true,
    blendColorOperation: 'add',
    blendColorSrcFactor: 'one',
    blendColorDstFactor: 'one',
    blendAlphaOperation: 'add',
    blendAlphaSrcFactor: 'one',
    blendAlphaDstFactor: 'one'
  } satisfies RenderPipelineParameters);

  /** Pipeline overrides for multiplicative revealage accumulation. */
  static readonly revealageParameters = Object.freeze({
    depthWriteEnabled: false,
    depthCompare: 'less-equal',
    blend: true,
    blendColorOperation: 'add',
    blendColorSrcFactor: 'zero',
    blendColorDstFactor: 'one-minus-src',
    blendAlphaOperation: 'add',
    blendAlphaSrcFactor: 'zero',
    blendAlphaDstFactor: 'one-minus-src-alpha'
  } satisfies RenderPipelineParameters);

  readonly device: Device;
  private renderTargets: WBOITRenderTargets;
  private readonly compositeModel: ClipSpace;

  /** Creates a renderer and validates floating-point render-target blending support. */
  constructor(device: Device) {
    const support = getWBOITSupport(device);
    if (!support.supported) {
      throw new Error(support.reason);
    }

    this.device = device;
    this.renderTargets = createWBOITRenderTargets(device, 1, 1);
    this.compositeModel = new ClipSpace(device, {
      id: makeWBOITResourceId('wboit-composite'),
      source: WBOIT_COMPOSITE_WGSL,
      fs: WBOIT_COMPOSITE_GLSL,
      bindings: {
        accumulationTexture: this.renderTargets.accumulationTexture,
        revealageTexture: this.renderTargets.revealageTexture
      },
      defines: {FLIP_WBOIT_TEXTURE_Y: device.type === 'webgpu' ? 1 : 0},
      parameters: WBOIT_COMPOSITE_PARAMETERS
    });
  }

  /** Destroys the composite model and all owned render targets. */
  destroy(): void {
    this.compositeModel.destroy();
    destroyWBOITRenderTargets(this.renderTargets);
  }

  /** Records opaque, accumulation, revealage, and composite passes. */
  render(options: WBOITRenderOptions): void {
    const framebuffer =
      options.framebuffer ?? this.device.getDefaultCanvasContext().getCurrentFramebuffer();
    this.resize({width: framebuffer.width, height: framebuffer.height});

    const commandEncoder = this.device.commandEncoder;
    options.prepareBase?.(commandEncoder);
    this.compositeModel.predraw(commandEncoder);

    const basePass = this.device.beginRenderPass({
      id: makeWBOITResourceId('wboit-base'),
      framebuffer,
      clearColor: options.clearColor,
      clearDepth: options.clearDepth
    });
    try {
      options.drawBase(basePass);
    } finally {
      basePass.end();
    }

    const opaqueDepthPass = this.device.beginRenderPass({
      id: makeWBOITResourceId('wboit-opaque-depth'),
      framebuffer: this.renderTargets.accumulationFramebuffer,
      parameters: {colorMask: 0},
      clearColor: [0, 0, 0, 0],
      clearDepth: 1
    });
    try {
      (options.drawOpaqueDepth ?? options.drawBase)(opaqueDepthPass);
    } finally {
      opaqueDepthPass.end();
    }

    this.renderCapturePass(options, 'accumulation');
    this.renderCapturePass(options, 'revealage');

    const compositePass = this.device.beginRenderPass({
      id: makeWBOITResourceId('wboit-composite'),
      framebuffer,
      clearColor: false,
      clearDepth: false,
      depthReadOnly: true
    });
    try {
      this.compositeModel.draw(compositePass);
    } finally {
      compositePass.end();
    }
  }

  /** Reallocates internal render targets when output dimensions change. */
  resize(size: {width: number; height: number}): void {
    if (size.width <= 0 || size.height <= 0) {
      throw new Error('WBOIT target size must be positive.');
    }
    if (this.renderTargets.width === size.width && this.renderTargets.height === size.height) {
      return;
    }

    const previousRenderTargets = this.renderTargets;
    this.renderTargets = createWBOITRenderTargets(this.device, size.width, size.height);
    this.compositeModel.setBindings({
      accumulationTexture: this.renderTargets.accumulationTexture,
      revealageTexture: this.renderTargets.revealageTexture
    });
    destroyWBOITRenderTargets(previousRenderTargets);
  }

  private renderCapturePass(options: WBOITRenderOptions, pass: WBOITPass): void {
    const captureParameters =
      pass === 'accumulation'
        ? WBOITRenderer.accumulationParameters
        : WBOITRenderer.revealageParameters;
    options.prepareTranslucent({
      commandEncoder: this.device.commandEncoder,
      pass,
      shaderModuleProps: {pass},
      captureParameters
    });

    const renderPass = this.device.beginRenderPass({
      id: makeWBOITResourceId(`wboit-${pass}`),
      framebuffer:
        pass === 'accumulation'
          ? this.renderTargets.accumulationFramebuffer
          : this.renderTargets.revealageFramebuffer,
      clearColor: pass === 'accumulation' ? [0, 0, 0, 0] : [1, 1, 1, 1],
      clearDepth: false,
      depthReadOnly: true
    });
    try {
      options.drawTranslucent(renderPass);
    } finally {
      renderPass.end();
    }
  }
}

/** Returns whether a device supports weighted blended OIT render targets and blending. */
export function getWBOITSupport(device: Device): WBOITSupport {
  if (device.type !== 'webgpu' && device.type !== 'webgl') {
    return {supported: false, reason: 'WBOIT requires a WebGPU or WebGL2 device.'};
  }

  const capabilities = device.getTextureFormatCapabilities(WBOIT_COLOR_FORMAT);
  if (!capabilities.render) {
    return {supported: false, reason: 'WBOIT requires renderable rgba16float textures.'};
  }
  if (!capabilities.blend) {
    return {supported: false, reason: 'WBOIT requires blendable rgba16float textures.'};
  }
  return {supported: true};
}

function createWBOITRenderTargets(
  device: Device,
  width: number,
  height: number
): WBOITRenderTargets {
  const accumulationTexture = createWBOITRenderTexture(device, 'wboit-accumulation', width, height);
  const revealageTexture = createWBOITRenderTexture(device, 'wboit-revealage', width, height);
  const depthTexture = device.createTexture({
    id: makeWBOITResourceId('wboit-depth'),
    width,
    height,
    format: 'depth24plus',
    usage: Texture.RENDER
  });

  return {
    accumulationTexture,
    accumulationFramebuffer: device.createFramebuffer({
      id: makeWBOITResourceId('wboit-accumulation-framebuffer'),
      width,
      height,
      colorAttachments: [accumulationTexture],
      depthStencilAttachment: depthTexture
    }),
    revealageTexture,
    revealageFramebuffer: device.createFramebuffer({
      id: makeWBOITResourceId('wboit-revealage-framebuffer'),
      width,
      height,
      colorAttachments: [revealageTexture],
      depthStencilAttachment: depthTexture
    }),
    depthTexture,
    width,
    height
  };
}

function createWBOITRenderTexture(
  device: Device,
  prefix: string,
  width: number,
  height: number
): Texture {
  return device.createTexture({
    id: makeWBOITResourceId(prefix),
    width,
    height,
    format: WBOIT_COLOR_FORMAT,
    usage: Texture.SAMPLE | Texture.RENDER,
    sampler: {magFilter: 'nearest', minFilter: 'nearest'}
  });
}

function destroyWBOITRenderTargets(renderTargets: WBOITRenderTargets): void {
  renderTargets.accumulationFramebuffer.destroy();
  renderTargets.revealageFramebuffer.destroy();
  renderTargets.accumulationTexture.destroy();
  renderTargets.revealageTexture.destroy();
  renderTargets.depthTexture.destroy();
}

function makeWBOITResourceId(prefix: string): string {
  nextWBOITResourceId += 1;
  return `${prefix}-${nextWBOITResourceId}`;
}
