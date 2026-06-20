// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray4} from '@math.gl/types';
import {
  Buffer,
  type CommandEncoder,
  Device,
  type Framebuffer,
  type RenderPass,
  type RenderPipelineParameters,
  Texture,
  type TextureView
} from '@luma.gl/core';
import {ClipSpace, ShaderInputs} from '@luma.gl/engine';
import {aBuffer, type ABufferShaderModuleProps} from './a-buffer';

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

function getABufferCompositeShader(maxFragmentsPerPixel: number): string {
  return /* wgsl */ `\
@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let pixelIndex = aBuffer_getPixelIndex(inputs.Position);
  if (pixelIndex >= arrayLength(&headPointers.heads)) {
    discard;
  }

  var fragmentPointer = atomicLoad(&headPointers.heads[pixelIndex]);
  var capturedFragments: array<ABufferFragment, ${maxFragmentsPerPixel}>;
  var fragmentCount = 0u;

  while (
    fragmentPointer != A_BUFFER_EMPTY_FRAGMENT_POINTER &&
    fragmentCount < ${maxFragmentsPerPixel}u
  ) {
    let fragmentIndex = fragmentPointer - 1u;
    if (fragmentIndex >= arrayLength(&fragments.fragments)) {
      break;
    }
    capturedFragments[fragmentCount] = fragments.fragments[fragmentIndex];
    fragmentPointer = capturedFragments[fragmentCount].next;
    fragmentCount += 1u;
  }

  if (fragmentCount == 0u) {
    discard;
  }

  var sortIndex = 1u;
  while (sortIndex < fragmentCount) {
    let fragmentToInsert = capturedFragments[sortIndex];
    var insertIndex = sortIndex;
    while (insertIndex > 0u && capturedFragments[insertIndex - 1u].depth < fragmentToInsert.depth) {
      capturedFragments[insertIndex] = capturedFragments[insertIndex - 1u];
      insertIndex -= 1u;
    }
    capturedFragments[insertIndex] = fragmentToInsert;
    sortIndex += 1u;
  }

  var compositeColor = vec4<f32>(0.0);
  var compositeIndex = 0u;
  while (compositeIndex < fragmentCount) {
    let fragmentColor = unpack4x8unorm(capturedFragments[compositeIndex].color);
    compositeColor = fragmentColor + compositeColor * (1.0 - fragmentColor.a);
    compositeIndex += 1u;
  }

  return compositeColor;
}
`;
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
  /** Number of capture and composite passes required to render the target. */
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
  /** Target color/depth framebuffer. Defaults to the current canvas framebuffer. */
  framebuffer?: Framebuffer | null;
  /** Base pass clear color. */
  clearColor?: NumberArray4 | false;
  /** Base pass clear depth. */
  clearDepth?: number | false;
  /** Prepare uploads and base-pass pipeline state before the base render pass opens. */
  prepareBase?: (commandEncoder: CommandEncoder) => void;
  /** Draw the base scene that the A-buffer composite overlays. */
  drawBase: (renderPass: RenderPass) => void;
  /** Bind A-buffer resources and prepare capture pipelines before each slice pass opens. */
  prepareTranslucent: (context: ABufferCaptureContext) => void;
  /** Draw translucent models that append fragments into the A-buffer. */
  drawTranslucent: (renderPass: RenderPass) => void;
};

type ResolvedABufferRendererProps = Required<ABufferRendererProps>;

/**
 * Renders exact order-independent transparency with a per-pixel linked-list A-buffer.
 *
 * The renderer first draws the opaque base scene, captures translucent fragments into storage
 * buffers, sorts each pixel's fragments by depth, and composites premultiplied colors over the
 * base color target. Large targets are split into horizontal slices to keep storage bounded.
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

  private readonly shaderInputs: ShaderInputs<{aBuffer: ABufferShaderModuleProps}>;
  private readonly compositeModel: ClipSpace;
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
    this.shaderInputs = new ShaderInputs<{aBuffer: ABufferShaderModuleProps}>({aBuffer});
    this.compositeModel = new ClipSpace(device, {
      id: makeABufferResourceId('a-buffer-composite'),
      source: getABufferCompositeShader(this.props.maxFragmentsPerPixel),
      shaderInputs: this.shaderInputs,
      parameters: {
        blend: true,
        blendColorOperation: 'add',
        blendColorSrcFactor: 'one',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaOperation: 'add',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
  }

  /** Destroys owned models, shader inputs, and storage buffers. */
  destroy(): void {
    this.destroyBuffers();
    this.compositeModel.destroy();
    this.shaderInputs.destroy();
  }

  /**
   * Records the base, translucent capture, and composite passes.
   *
   * `prepareTranslucent` and `drawTranslucent` may run multiple times when the target is sliced.
   */
  render(options: ABufferRenderOptions): void {
    const framebuffer =
      options.framebuffer ?? this.device.getDefaultCanvasContext().getCurrentFramebuffer();
    validateABufferFramebuffer(framebuffer);
    this.resize({width: framebuffer.width, height: framebuffer.height});

    const commandEncoder = this.device.commandEncoder;
    options.prepareBase?.(commandEncoder);
    const basePass = this.device.beginRenderPass({
      id: 'a-buffer-base',
      framebuffer,
      clearColor: options.clearColor,
      clearDepth: options.clearDepth
    });
    try {
      options.drawBase(basePass);
    } finally {
      basePass.end();
    }

    const slicePlan = this.slicePlan!;
    const captureFramebuffer = this.device.createFramebuffer({
      id: 'a-buffer-capture-framebuffer',
      width: framebuffer.width,
      height: framebuffer.height,
      colorAttachments: framebuffer.colorAttachments
    });
    const opaqueDepthTexture = framebuffer.depthStencilAttachment!;
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

        this.shaderInputs.setProps({aBuffer: shaderModuleProps});
        this.compositeModel.predraw(commandEncoder);
        const compositePass = this.device.beginRenderPass({
          id: `a-buffer-composite-${sliceIndex}`,
          framebuffer: captureFramebuffer,
          parameters: {scissorRect: [0, sliceStartY, slicePlan.width, sliceHeight]},
          clearColor: false
        });
        try {
          this.compositeModel.draw(compositePass);
        } finally {
          compositePass.end();
        }
      }
    } finally {
      captureFramebuffer.destroy();
    }
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

function validateABufferFramebuffer(framebuffer: Framebuffer): void {
  if (framebuffer.colorAttachments.length === 0) {
    throw new Error('A-buffer OIT requires a color attachment.');
  }
  if (!framebuffer.depthStencilAttachment) {
    throw new Error('A-buffer OIT requires a depth attachment.');
  }
  if (framebuffer.colorAttachments[0].texture.samples !== 1) {
    throw new Error('A-buffer OIT only supports single-sample color targets in v1.');
  }
  if (framebuffer.depthStencilAttachment.texture.samples !== 1) {
    throw new Error('A-buffer OIT only supports single-sample depth targets in v1.');
  }
  if (!(framebuffer.depthStencilAttachment.texture.props.usage & Texture.SAMPLE)) {
    throw new Error('A-buffer OIT requires a sampleable depth attachment.');
  }
}
