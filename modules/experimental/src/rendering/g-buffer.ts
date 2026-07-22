// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Device,
  Framebuffer,
  SamplerProps,
  TextureFormatColor,
  TextureFormatDepthStencil
} from '@luma.gl/core';
import {Texture} from '@luma.gl/core';

const DEFAULT_COLOR_SAMPLER = {
  minFilter: 'linear',
  magFilter: 'linear',
  addressModeU: 'clamp-to-edge',
  addressModeV: 'clamp-to-edge'
} as const satisfies SamplerProps;

const DEFAULT_DEPTH_SAMPLER = {
  minFilter: 'nearest',
  magFilter: 'nearest',
  addressModeU: 'clamp-to-edge',
  addressModeV: 'clamp-to-edge'
} as const satisfies SamplerProps;

const RESERVED_ATTACHMENT_NAMES = new Set(['color', 'normalRoughness', 'velocity', 'depth']);
let nextGBufferId = 0;

/** One caller-defined MRT channel appended after the standard G-buffer channels. */
export type GBufferExtraColorAttachment = {
  /** Stable name used with GBuffer.getExtraColorTexture(). */
  name: string;
  /** Renderable color format for the channel. */
  format: TextureFormatColor;
  /** Optional sampler override. Defaults to linear clamp-to-edge sampling. */
  sampler?: SamplerProps;
};

/** Construction props for GBuffer. */
export type GBufferProps = {
  /** Optional debug-resource prefix. */
  id?: string;
  /** Initial target width. */
  width: number;
  /** Initial target height. */
  height: number;
  /** Shaded scene-color format. Defaults to rgba8unorm. */
  colorFormat?: TextureFormatColor;
  /** Encoded view-normal plus roughness format. Defaults to rgba8unorm. */
  normalRoughnessFormat?: TextureFormatColor;
  /** Current-minus-previous UV velocity format. Defaults to rg16float. */
  velocityFormat?: TextureFormatColor;
  /** Depth format used for reconstruction and depth-aware effects. Defaults to depth24plus. */
  depthStencilFormat?: TextureFormatDepthStencil;
  /** Additional caller-owned semantic MRT channels appended after the standard channels. */
  extraColorAttachments?: readonly GBufferExtraColorAttachment[];
};

/** Bindings consumed by luma.gl screen-space shader-pass pipelines. */
export type GBufferShaderPassBindings = {
  depthTexture: Texture;
  normalTexture: Texture;
  velocityTexture: Texture;
};

type ResolvedGBufferProps = Required<Omit<GBufferProps, 'extraColorAttachments' | 'id'>> & {
  id: string;
  extraColorAttachments: readonly GBufferExtraColorAttachment[];
};

type GBufferRenderTargets = {
  framebuffer: Framebuffer;
  colorTexture: Texture;
  normalRoughnessTexture: Texture;
  velocityTexture: Texture;
  depthTexture: Texture;
  extraColorTextures: Map<string, Texture>;
};

/**
 * Owns the standard MRT textures used by deferred and screen-space rendering.
 *
 * The first three color attachments have a fixed shader contract:
 * - location 0: shaded scene color
 * - location 1: encoded view normal in RGB plus roughness in A
 * - location 2: current-minus-previous UV velocity in RG
 *
 * Additional color attachments follow in declaration order. The class only owns targets and
 * semantic bindings; callers remain responsible for drawing geometry and selecting clear values.
 */
export class GBuffer {
  readonly device: Device;
  readonly id: string;
  private readonly props: ResolvedGBufferProps;
  private renderTargets: GBufferRenderTargets;

  constructor(device: Device, props: GBufferProps) {
    if (device.type !== 'webgpu') {
      throw new Error('GBuffer requires a WebGPU device.');
    }

    this.device = device;
    this.id = props.id || makeGBufferId('g-buffer');
    this.props = resolveGBufferProps(this.id, props);
    validateGBufferProps(device, this.props);
    this.renderTargets = createGBufferRenderTargets(device, this.props);
  }

  /** Framebuffer containing standard channels followed by caller-defined extra channels. */
  get framebuffer(): Framebuffer {
    return this.renderTargets.framebuffer;
  }

  /** Shaded scene color written at fragment output location 0. */
  get colorTexture(): Texture {
    return this.renderTargets.colorTexture;
  }

  /** Encoded view normal plus roughness written at fragment output location 1. */
  get normalRoughnessTexture(): Texture {
    return this.renderTargets.normalRoughnessTexture;
  }

  /** Current-minus-previous UV velocity written at fragment output location 2. */
  get velocityTexture(): Texture {
    return this.renderTargets.velocityTexture;
  }

  /** Sampleable scene depth attachment. */
  get depthTexture(): Texture {
    return this.renderTargets.depthTexture;
  }

  /** Current target width. */
  get width(): number {
    return this.renderTargets.framebuffer.width;
  }

  /** Current target height. */
  get height(): number {
    return this.renderTargets.framebuffer.height;
  }

  /** Returns the bindings expected by depth-, normal-, and velocity-aware shader passes. */
  getShaderPassBindings(): GBufferShaderPassBindings {
    return {
      depthTexture: this.depthTexture,
      normalTexture: this.normalRoughnessTexture,
      velocityTexture: this.velocityTexture
    };
  }

  /** Returns one caller-defined extra color texture by its declared name. */
  getExtraColorTexture(name: string): Texture {
    const texture = this.renderTargets.extraColorTextures.get(name);
    if (!texture) {
      throw new Error('GBuffer has no extra color attachment named "' + name + '".');
    }
    return texture;
  }

  /**
   * Reallocates all owned attachments when size changes.
   * @returns true when attachments were recreated.
   */
  resize(size: {width: number; height: number}): boolean {
    validateGBufferSize(size.width, size.height);
    if (size.width === this.width && size.height === this.height) {
      return false;
    }

    const previousRenderTargets = this.renderTargets;
    this.renderTargets = createGBufferRenderTargets(this.device, {
      ...this.props,
      width: size.width,
      height: size.height
    });
    destroyGBufferRenderTargets(previousRenderTargets);
    return true;
  }

  /** Destroys the framebuffer and every owned attachment texture. */
  destroy(): void {
    destroyGBufferRenderTargets(this.renderTargets);
  }
}

function resolveGBufferProps(id: string, props: GBufferProps): ResolvedGBufferProps {
  return {
    id,
    width: props.width,
    height: props.height,
    colorFormat: props.colorFormat || 'rgba8unorm',
    normalRoughnessFormat: props.normalRoughnessFormat || 'rgba8unorm',
    velocityFormat: props.velocityFormat || 'rg16float',
    depthStencilFormat: props.depthStencilFormat || 'depth24plus',
    extraColorAttachments: props.extraColorAttachments || []
  };
}

function validateGBufferProps(device: Device, props: ResolvedGBufferProps): void {
  validateGBufferSize(props.width, props.height);
  const colorAttachmentCount = 3 + props.extraColorAttachments.length;
  if (colorAttachmentCount > device.limits.maxColorAttachments) {
    throw new Error(
      'GBuffer requires ' +
        colorAttachmentCount +
        ' color attachments, but the device supports ' +
        device.limits.maxColorAttachments +
        '.'
    );
  }

  validateRenderableFormat(device, props.colorFormat, 'color');
  validateRenderableFormat(device, props.normalRoughnessFormat, 'normalRoughness');
  validateRenderableFormat(device, props.velocityFormat, 'velocity');
  validateCreatableFormat(device, props.depthStencilFormat, 'depth');

  const names = new Set<string>();
  for (const attachment of props.extraColorAttachments) {
    if (!attachment.name) {
      throw new Error('GBuffer extra color attachment name is required.');
    }
    if (RESERVED_ATTACHMENT_NAMES.has(attachment.name)) {
      throw new Error('GBuffer extra color attachment name "' + attachment.name + '" is reserved.');
    }
    if (names.has(attachment.name)) {
      throw new Error(
        'GBuffer extra color attachment name "' + attachment.name + '" is duplicated.'
      );
    }
    names.add(attachment.name);
    validateRenderableFormat(device, attachment.format, attachment.name);
  }
}

function validateGBufferSize(width: number, height: number): void {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
    throw new Error('GBuffer size must use positive safe integer dimensions.');
  }
}

function validateRenderableFormat(
  device: Device,
  format: TextureFormatColor | TextureFormatDepthStencil,
  attachmentName: string
): void {
  if (!device.getTextureFormatCapabilities(format).render) {
    throw new Error(
      'GBuffer attachment "' + attachmentName + '" requires renderable format ' + format + '.'
    );
  }
}

function validateCreatableFormat(
  device: Device,
  format: TextureFormatColor | TextureFormatDepthStencil,
  attachmentName: string
): void {
  if (!device.getTextureFormatCapabilities(format).create) {
    throw new Error(
      'GBuffer attachment "' + attachmentName + '" requires supported format ' + format + '.'
    );
  }
}

function createGBufferRenderTargets(
  device: Device,
  props: ResolvedGBufferProps
): GBufferRenderTargets {
  const colorTexture = createGBufferColorTexture(device, props, 'color', props.colorFormat);
  const normalRoughnessTexture = createGBufferColorTexture(
    device,
    props,
    'normal-roughness',
    props.normalRoughnessFormat
  );
  const velocityTexture = createGBufferColorTexture(
    device,
    props,
    'velocity',
    props.velocityFormat
  );
  const extraColorTextures = new Map(
    props.extraColorAttachments.map(attachment => [
      attachment.name,
      createGBufferColorTexture(
        device,
        props,
        attachment.name,
        attachment.format,
        attachment.sampler
      )
    ])
  );
  const depthTexture = device.createTexture({
    id: props.id + '-depth',
    format: props.depthStencilFormat,
    width: props.width,
    height: props.height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST,
    sampler: DEFAULT_DEPTH_SAMPLER
  });
  const framebuffer = device.createFramebuffer({
    id: props.id + '-framebuffer',
    width: props.width,
    height: props.height,
    colorAttachments: [
      colorTexture,
      normalRoughnessTexture,
      velocityTexture,
      ...extraColorTextures.values()
    ],
    depthStencilAttachment: depthTexture
  });

  return {
    framebuffer,
    colorTexture,
    normalRoughnessTexture,
    velocityTexture,
    depthTexture,
    extraColorTextures
  };
}

function createGBufferColorTexture(
  device: Device,
  props: ResolvedGBufferProps,
  name: string,
  format: TextureFormatColor,
  sampler: SamplerProps = DEFAULT_COLOR_SAMPLER
): Texture {
  return device.createTexture({
    id: props.id + '-' + name,
    format,
    width: props.width,
    height: props.height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST,
    sampler
  });
}

function destroyGBufferRenderTargets(renderTargets: GBufferRenderTargets): void {
  renderTargets.framebuffer.destroy();
  renderTargets.colorTexture.destroy();
  renderTargets.normalRoughnessTexture.destroy();
  renderTargets.velocityTexture.destroy();
  renderTargets.depthTexture.destroy();
  for (const texture of renderTargets.extraColorTextures.values()) {
    texture.destroy();
  }
}

function makeGBufferId(prefix: string): string {
  nextGBufferId += 1;
  return prefix + '-' + nextGBufferId;
}
