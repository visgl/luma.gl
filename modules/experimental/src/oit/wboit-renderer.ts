// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  type CommandEncoder,
  Device,
  type Framebuffer,
  type RenderPass,
  type RenderPipelineParameters,
  Texture
} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {type WBOITPass, type WBOITShaderModuleProps} from './wboit';
import {
  createWBOITResolveShaderPassPipeline,
  type WBOITResolveBindings
} from './wboit-resolve-shader-pass-pipeline';

const WBOIT_COLOR_FORMAT = 'rgba16float';
let nextWBOITResourceId = 0;

/** Result returned by {@link getWBOITSupport}. */
export type WBOITSupport = {
  /** Whether the device supports weighted blended OIT. */
  supported: boolean;
  /** Explanation when `supported` is false. */
  reason?: string;
};

/** Per-pass resources supplied to `WBOITCaptureOptions.prepareTranslucent`. */
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

/** Geometry callbacks used by {@link WBOITRenderer.capture}. */
export type WBOITCaptureOptions = {
  /** Width and height of the opaque source texture that will be resolved. */
  size: {width: number; height: number};
  /** Prepare opaque depth models before the internal depth pass opens. */
  prepareOpaqueDepth?: (commandEncoder: CommandEncoder) => void;
  /** Draw opaque geometry into the internal depth target. */
  drawOpaqueDepth: (renderPass: RenderPass) => void;
  /** Bind WBOIT props and prepare translucent pipelines before each capture pass. */
  prepareTranslucent: (context: WBOITCaptureContext) => void;
  /** Draw translucent models. Called once for accumulation and once for revealage. */
  drawTranslucent: (renderPass: RenderPass) => void;
};

/** Capture textures returned by {@link WBOITRenderer.capture}. */
export type WBOITCapture = {
  bindings: Required<WBOITResolveBindings>;
};

/** Inputs used by {@link WBOITRenderer.render}. */
export type WBOITRenderOptions = Omit<WBOITCaptureOptions, 'size'> & {
  /** Opaque color to resolve the captured transparency over. */
  sourceTexture: Texture;
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
 * Captures approximate weighted-blended transparency and resolves it through a ShaderPassPipeline.
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
  private readonly resolveRenderer: ShaderPassRenderer;

  /** Creates a renderer and validates floating-point render-target blending support. */
  constructor(device: Device) {
    const support = getWBOITSupport(device);
    if (!support.supported) {
      throw new Error(support.reason);
    }

    this.device = device;
    this.renderTargets = createWBOITRenderTargets(device, 1, 1);
    this.resolveRenderer = new ShaderPassRenderer(device, {
      shaderPasses: [createWBOITResolveShaderPassPipeline()]
    });
  }

  /** Destroys the resolve pipeline and all owned capture targets. */
  destroy(): void {
    this.resolveRenderer.destroy();
    destroyWBOITRenderTargets(this.renderTargets);
  }

  /** Records opaque depth plus accumulation and revealage capture passes. */
  capture(options: WBOITCaptureOptions): WBOITCapture {
    this.resize(options.size);
    options.prepareOpaqueDepth?.(this.device.commandEncoder);
    const opaqueDepthPass = this.device.beginRenderPass({
      id: makeWBOITResourceId('wboit-opaque-depth'),
      framebuffer: this.renderTargets.accumulationFramebuffer,
      parameters: {colorMask: 0},
      clearColor: [0, 0, 0, 0],
      clearDepth: 1
    });
    try {
      options.drawOpaqueDepth(opaqueDepthPass);
    } finally {
      opaqueDepthPass.end();
    }

    this.renderCapturePass(options, 'accumulation');
    this.renderCapturePass(options, 'revealage');

    return {
      bindings: {
        accumulationTexture: this.renderTargets.accumulationTexture,
        revealageTexture: this.renderTargets.revealageTexture
      }
    };
  }

  /** Captures translucent geometry and resolves it over `sourceTexture`. */
  render(options: WBOITRenderOptions): Texture {
    validateWBOITSourceTexture(options.sourceTexture);
    const capture = this.capture({
      ...options,
      size: {width: options.sourceTexture.width, height: options.sourceTexture.height}
    });
    return this.resolveRenderer.renderToTexture({
      sourceTexture: options.sourceTexture,
      bindings: capture.bindings
    })!;
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
    this.resolveRenderer.resize([size.width, size.height]);
    destroyWBOITRenderTargets(previousRenderTargets);
  }

  private renderCapturePass(options: WBOITCaptureOptions, pass: WBOITPass): void {
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

function validateWBOITSourceTexture(sourceTexture: Texture): void {
  if (!(sourceTexture.props.usage & Texture.SAMPLE)) {
    throw new Error('WBOIT sourceTexture must be sampleable.');
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
