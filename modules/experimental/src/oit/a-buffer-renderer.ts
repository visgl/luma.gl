// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Buffer,
  type CommandEncoder,
  Device,
  type RenderPass,
  type RenderPipelineParameters,
  Texture,
  type TextureView
} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {type ABufferShaderModuleProps} from './a-buffer';
import {createABufferResolveShaderPassPipeline} from './a-buffer-resolve-shader-pass-pipeline';

const A_BUFFER_HEAD_POINTER_HEADER_BYTE_LENGTH = 8;
const A_BUFFER_HEAD_POINTER_BYTE_LENGTH = 4;
const A_BUFFER_FRAGMENT_BYTE_LENGTH = 12;
const DEFAULT_AVERAGE_FRAGMENTS_PER_PIXEL = 4;
const DEFAULT_MAX_FRAGMENTS_PER_PIXEL = 12;
let nextABufferResourceId = 0;

function makeABufferResourceId(prefix: string): string {
  nextABufferResourceId += 1;
  return `${prefix}-${nextABufferResourceId}`;
}

export type ABufferRendererProps = {
  /** Average translucent fragments allocated per pixel in each capture slice. Defaults to 4. */
  averageFragmentsPerPixel?: number;
  /** Maximum fragments sorted and composited per pixel. Defaults to 12. */
  maxFragmentsPerPixel?: number;
  /** Maximum size of each A-buffer storage buffer in bytes. Smaller values force more slices. */
  maxBufferByteLength?: number;
};

/** Result returned by {@link getABufferSupport}. */
export type ABufferSupport = {
  /** Whether the device can run {@link ABufferRenderer}. */
  supported: boolean;
  /** Explanation when `supported` is `false`. */
  reason?: string;
};

/** Storage allocation and horizontal slicing selected for an A-buffer target. */
export type ABufferSlicePlan = {
  /** Target width in device pixels. */
  width: number;
  /** Target height in device pixels. */
  height: number;
  /** Maximum number of framebuffer rows captured in one pass. */
  sliceHeight: number;
  /** Number of capture and resolve passes required to render the target. */
  sliceCount: number;
  /** Number of pixels represented by the largest slice. */
  maxSlicePixelCount: number;
  /** Number of fragment records allocated for each slice. */
  fragmentCapacity: number;
  /** Size of the head-pointer storage buffer in bytes. */
  headPointerByteLength: number;
  /** Size of the fragment storage buffer in bytes. */
  fragmentByteLength: number;
};

/** Per-slice resources supplied to `ABufferRenderOptions.prepareTranslucent`. */
export type ABufferCaptureContext = {
  /** Active device command encoder, used to prepare models before the capture pass opens. */
  commandEncoder: CommandEncoder;
  /** Shader-module props that bind the current slice's A-buffer resources. */
  shaderModuleProps: ABufferShaderModuleProps;
  /** Pipeline overrides required for storage-only fragment capture. */
  captureParameters: Readonly<RenderPipelineParameters>;
};

export type ABufferRenderOptions = {
  /** Opaque color to resolve captured translucent fragments over. */
  sourceTexture: Texture;
  /** Sampleable opaque depth generated alongside `sourceTexture`. */
  opaqueDepthTexture: TextureView;
  /** Bind A-buffer resources and prepare capture pipelines before each slice pass opens. */
  prepareTranslucent: (context: ABufferCaptureContext) => void;
  /** Draw translucent models that append fragments into the A-buffer. */
  drawTranslucent: (renderPass: RenderPass) => void;
};

type ResolvedABufferRendererProps = Required<ABufferRendererProps>;

/**
 * Captures exact order-independent transparency and resolves each slice through a ShaderPassPipeline.
 *
 * The renderer captures translucent fragments into storage buffers, sorts each pixel's fragments
 * by depth, and resolves premultiplied colors over the supplied opaque source. Large targets are
 * split into horizontal slices to keep storage bounded.
 *
 * @note The renderer is WebGPU-only and does not submit the device command encoder.
 */
export class ABufferRenderer {
  /** Pipeline overrides that callers must merge after their normal translucent parameters. */
  static readonly captureParameters = Object.freeze({
    colorMask: 0,
    depthWriteEnabled: false,
    depthCompare: undefined,
    depthFormat: undefined,
    depthBias: undefined,
    depthBiasSlopeScale: undefined,
    depthBiasClamp: undefined,
    stencilReadMask: undefined,
    stencilWriteMask: undefined,
    stencilCompare: undefined,
    stencilPassOperation: undefined,
    stencilFailOperation: undefined,
    stencilDepthFailOperation: undefined
  } satisfies RenderPipelineParameters);

  readonly device: Device;
  readonly props: ResolvedABufferRendererProps;

  private readonly resolveRenderer: ShaderPassRenderer;
  private slicePlan: ABufferSlicePlan | null = null;
  private headPointerInitBuffer: Buffer | null = null;
  private headPointers: Buffer | null = null;
  private fragments: Buffer | null = null;

  /** Creates an A-buffer renderer and validates the device's required capabilities. */
  constructor(device: Device, props: ABufferRendererProps = {}) {
    const support = getABufferSupport(device);
    if (!support.supported) {
      throw new Error(support.reason);
    }

    this.device = device;
    this.props = resolveABufferRendererProps(props);
    this.resolveRenderer = new ShaderPassRenderer(device, {
      shaderPasses: [
        createABufferResolveShaderPassPipeline({
          maxFragmentsPerPixel: this.props.maxFragmentsPerPixel
        })
      ]
    });
  }

  /** Destroys the resolve pipeline and owned storage buffers. */
  destroy(): void {
    this.destroyBuffers();
    this.resolveRenderer.destroy();
  }

  /**
   * Captures translucent slices and resolves each over the previous color result.
   *
   * `prepareTranslucent` and `drawTranslucent` may run multiple times when the target is sliced.
   */
  render(options: ABufferRenderOptions): Texture {
    validateABufferRenderOptions(options);
    const {sourceTexture, opaqueDepthTexture} = options;
    this.resize({width: sourceTexture.width, height: sourceTexture.height});
    const commandEncoder = this.device.commandEncoder;
    const slicePlan = this.slicePlan!;
    const captureFramebuffer = this.device.createFramebuffer({
      id: 'a-buffer-capture-framebuffer',
      width: sourceTexture.width,
      height: sourceTexture.height,
      colorAttachments: [sourceTexture]
    });
    let resolvedTexture = sourceTexture;
    try {
      for (let sliceIndex = 0; sliceIndex < slicePlan.sliceCount; sliceIndex++) {
        const sliceStartY = sliceIndex * slicePlan.sliceHeight;
        const sliceHeight = Math.min(slicePlan.sliceHeight, slicePlan.height - sliceStartY);
        const shaderModuleProps = this.getShaderModuleProps(sliceStartY, opaqueDepthTexture);

        commandEncoder.copyBufferToBuffer({
          sourceBuffer: this.headPointerInitBuffer!,
          destinationBuffer: this.headPointers!,
          size: this.headPointers!.byteLength
        });

        options.prepareTranslucent({
          commandEncoder,
          shaderModuleProps,
          captureParameters: ABufferRenderer.captureParameters
        });
        const capturePass = this.device.beginRenderPass({
          id: `a-buffer-capture-${sliceIndex}`,
          framebuffer: captureFramebuffer,
          parameters: {scissorRect: [0, sliceStartY, slicePlan.width, sliceHeight]},
          clearColor: false
        });
        try {
          options.drawTranslucent(capturePass);
        } finally {
          capturePass.end();
        }

        resolvedTexture = this.resolveRenderer.renderToTexture({
          sourceTexture: resolvedTexture,
          bindings: {
            headPointers: this.headPointers!,
            fragments: this.fragments!
          },
          uniforms: {
            aBufferResolve: {
              framebufferSize: [slicePlan.width, slicePlan.height],
              sliceStartY,
              sliceHeight
            }
          }
        })!;
      }
    } finally {
      captureFramebuffer.destroy();
    }
    return resolvedTexture;
  }

  /** Reallocates storage buffers when the target dimensions or slice plan changes. */
  resize(size: {width: number; height: number}): void {
    const nextSlicePlan = getABufferSlicePlan({
      width: size.width,
      height: size.height,
      averageFragmentsPerPixel: this.props.averageFragmentsPerPixel,
      maxStorageBufferBindingSize: Math.min(
        this.device.limits.maxStorageBufferBindingSize,
        this.props.maxBufferByteLength
      ),
      maxBufferSize: Math.min(this.device.limits.maxBufferSize, this.props.maxBufferByteLength)
    });

    if (
      this.slicePlan &&
      this.slicePlan.width === nextSlicePlan.width &&
      this.slicePlan.height === nextSlicePlan.height &&
      this.slicePlan.sliceHeight === nextSlicePlan.sliceHeight
    ) {
      return;
    }

    this.destroyBuffers();
    this.slicePlan = nextSlicePlan;
    this.resolveRenderer.resize([size.width, size.height]);

    const headPointerInitData = new Uint32Array(nextSlicePlan.headPointerByteLength / 4);

    this.headPointerInitBuffer = this.device.createBuffer({
      id: makeABufferResourceId('a-buffer-head-pointer-init'),
      usage: Buffer.COPY_SRC,
      data: headPointerInitData
    });
    this.headPointers = this.device.createBuffer({
      id: makeABufferResourceId('a-buffer-head-pointers'),
      usage: Buffer.STORAGE | Buffer.COPY_DST,
      byteLength: nextSlicePlan.headPointerByteLength
    });
    this.fragments = this.device.createBuffer({
      id: makeABufferResourceId('a-buffer-fragments'),
      usage: Buffer.STORAGE,
      byteLength: nextSlicePlan.fragmentByteLength
    });
  }

  private getShaderModuleProps(
    sliceStartY: number,
    opaqueDepthTexture: TextureView
  ): ABufferShaderModuleProps {
    const slicePlan = this.slicePlan!;
    return {
      isActive: true,
      framebufferSize: [slicePlan.width, slicePlan.height],
      sliceStartY,
      headPointers: this.headPointers!,
      fragments: this.fragments!,
      opaqueDepthTexture
    };
  }

  private destroyBuffers(): void {
    this.headPointerInitBuffer?.destroy();
    this.headPointers?.destroy();
    this.fragments?.destroy();
    this.headPointerInitBuffer = null;
    this.headPointers = null;
    this.fragments = null;
  }
}

/** Returns whether a device exposes the WebGPU storage-buffer capabilities required by A-buffer capture. */
export function getABufferSupport(device: Device): ABufferSupport {
  if (device.type !== 'webgpu') {
    return {supported: false, reason: 'A-buffer OIT requires a WebGPU device.'};
  }
  if (device.limits.maxStorageBuffersInFragmentStage < 2) {
    return {
      supported: false,
      reason: 'A-buffer OIT requires at least two fragment-stage storage buffers.'
    };
  }

  return {supported: true};
}

/**
 * Calculates a bounded-memory horizontal slice plan for an A-buffer target.
 *
 * @throws If the configured storage limits cannot hold one target scanline.
 */
export function getABufferSlicePlan(options: {
  width: number;
  height: number;
  averageFragmentsPerPixel: number;
  maxStorageBufferBindingSize: number;
  maxBufferSize: number;
}): ABufferSlicePlan {
  const {width, height, averageFragmentsPerPixel, maxStorageBufferBindingSize, maxBufferSize} =
    options;

  if (width <= 0 || height <= 0) {
    throw new Error('A-buffer target size must be positive.');
  }

  const maxBufferByteLength = Math.min(maxStorageBufferBindingSize, maxBufferSize);
  const maxSlicePixelsFromHeadPointers = Math.floor(
    (maxBufferByteLength - A_BUFFER_HEAD_POINTER_HEADER_BYTE_LENGTH) /
      A_BUFFER_HEAD_POINTER_BYTE_LENGTH
  );
  const maxSlicePixelsFromFragments = Math.floor(
    maxBufferByteLength / (averageFragmentsPerPixel * A_BUFFER_FRAGMENT_BYTE_LENGTH)
  );
  const maxSlicePixelCount = Math.min(maxSlicePixelsFromHeadPointers, maxSlicePixelsFromFragments);

  if (maxSlicePixelCount < width) {
    throw new Error(
      'A-buffer storage limits cannot fit one scanline at the configured fragment density.'
    );
  }

  const sliceHeight = Math.max(1, Math.floor(maxSlicePixelCount / width));
  const boundedSliceHeight = Math.min(sliceHeight, height);
  const boundedSlicePixelCount = width * boundedSliceHeight;

  return {
    width,
    height,
    sliceHeight: boundedSliceHeight,
    sliceCount: Math.ceil(height / boundedSliceHeight),
    maxSlicePixelCount: boundedSlicePixelCount,
    fragmentCapacity: boundedSlicePixelCount * averageFragmentsPerPixel,
    headPointerByteLength:
      A_BUFFER_HEAD_POINTER_HEADER_BYTE_LENGTH +
      boundedSlicePixelCount * A_BUFFER_HEAD_POINTER_BYTE_LENGTH,
    fragmentByteLength:
      boundedSlicePixelCount * averageFragmentsPerPixel * A_BUFFER_FRAGMENT_BYTE_LENGTH
  };
}

function resolveABufferRendererProps(props: ABufferRendererProps): ResolvedABufferRendererProps {
  const averageFragmentsPerPixel = Math.floor(
    props.averageFragmentsPerPixel ?? DEFAULT_AVERAGE_FRAGMENTS_PER_PIXEL
  );
  const maxFragmentsPerPixel = Math.floor(
    props.maxFragmentsPerPixel ?? DEFAULT_MAX_FRAGMENTS_PER_PIXEL
  );
  const maxBufferByteLength = Math.floor(props.maxBufferByteLength ?? Number.MAX_SAFE_INTEGER);

  if (averageFragmentsPerPixel < 1) {
    throw new Error('averageFragmentsPerPixel must be at least 1.');
  }
  if (maxFragmentsPerPixel < averageFragmentsPerPixel) {
    throw new Error('maxFragmentsPerPixel must be at least averageFragmentsPerPixel.');
  }
  if (maxBufferByteLength < 1) {
    throw new Error('maxBufferByteLength must be at least 1.');
  }

  return {averageFragmentsPerPixel, maxFragmentsPerPixel, maxBufferByteLength};
}

function validateABufferRenderOptions(options: ABufferRenderOptions): void {
  const {sourceTexture, opaqueDepthTexture} = options;
  if (sourceTexture.samples !== 1 || opaqueDepthTexture.texture.samples !== 1) {
    throw new Error('A-buffer OIT only supports single-sample source textures.');
  }
  if (!(sourceTexture.props.usage & Texture.SAMPLE)) {
    throw new Error('A-buffer sourceTexture must be sampleable.');
  }
  if (!(sourceTexture.props.usage & Texture.RENDER)) {
    throw new Error('A-buffer sourceTexture must be renderable.');
  }
  if (!(opaqueDepthTexture.texture.props.usage & Texture.SAMPLE)) {
    throw new Error('A-buffer opaqueDepthTexture must be sampleable.');
  }
  if (
    sourceTexture.width !== opaqueDepthTexture.texture.width ||
    sourceTexture.height !== opaqueDepthTexture.texture.height
  ) {
    throw new Error('A-buffer source and opaque depth dimensions must match.');
  }
}
