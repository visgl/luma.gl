// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import type {RenderPassProps} from '@luma.gl/core';
import type {PickInfo} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  type GraphBufferHandle,
  type GraphRenderPassAttachments,
  type GraphTextureView
} from './gpu-command-graph';

/** WebGPU-aligned byte capacity required by the single-pixel picking readback buffer. */
export const INDEX_PICKING_READBACK_BYTE_LENGTH = 256;
const INDEX_PICKING_INVALID_INDEX = -1;

/** Properties for one fixed-size graph-native index-picking target. */
export type GPUIndexPickingTargetProps = {
  /** Prefix for logical texture, buffer, and node IDs. */
  id?: string;
  /** Target width in device pixels. */
  width: number;
  /** Target height in device pixels. */
  height: number;
  /** Optional caller-owned default. Per-encoding graph buffer overrides remain supported. */
  readbackBuffer?: Buffer;
};

/** Properties for the target's optional single-pixel readback copy node. */
export type GPUIndexPickingReadbackProps<Parameters> = {
  /** Copy node ID. Defaults to the target ID plus `-readback`. */
  id?: string;
  /** Render node that must complete before the texture-to-buffer copy. */
  after: string;
  /** Returns a WebGPU device-pixel coordinate for this encoding. */
  getPixel: (parameters: Parameters) => readonly [number, number];
};

/**
 * Fixed-size graph texture target for WebGPU integer object picking.
 *
 * The helper owns only logical graph declarations. Applications retain ownership of rendering,
 * command submission, staging buffers, readback timing, decoded state, and highlighting.
 */
export class GPUIndexPickingTarget<Parameters = void> {
  /** Prefix for logical texture, buffer, and node IDs. */
  readonly id: string;
  /** Target width in device pixels. */
  readonly width: number;
  /** Target height in device pixels. */
  readonly height: number;
  /** Normalized color attachment available to the application render node. */
  readonly colorAttachment: GraphTextureView<'rgba8unorm'>;
  /** Signed object/batch index attachment copied during readback. */
  readonly indexAttachment: GraphTextureView<'rg32sint'>;
  /** Depth attachment shared by the picking render node. */
  readonly depthStencilAttachment: GraphTextureView<'depth24plus'>;
  /** Complete attachment set for `GPUCommandGraph.addRenderPass`. */
  readonly attachments: GraphRenderPassAttachments;
  /** Clear values matching the color, index, and depth attachments. */
  readonly renderPassProps: Pick<RenderPassProps, 'clearColors' | 'clearDepth'>;
  /** Borrowed logical handle for the caller-owned readback buffer. */
  readonly readback: GraphBufferHandle;

  private readonly graph: GPUCommandGraph<Parameters>;
  private readbackPassAdded = false;

  /**
   * Declares fixed-size transient attachments and one imported readback buffer in `graph`.
   *
   * @throws If width or height is not a positive safe integer.
   */
  constructor(graph: GPUCommandGraph<Parameters>, props: GPUIndexPickingTargetProps) {
    validatePickingTargetSize(props.width, props.height);
    this.graph = graph;
    this.id = props.id ?? 'gpu-index-picking';
    this.width = props.width;
    this.height = props.height;

    const colorTexture = graph.createTransientTexture({
      id: `${this.id}-color`,
      format: 'rgba8unorm',
      width: this.width,
      height: this.height,
      usage: Texture.RENDER
    });
    const indexTexture = graph.createTransientTexture({
      id: `${this.id}-indices`,
      format: 'rg32sint',
      width: this.width,
      height: this.height,
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const depthStencilTexture = graph.createTransientTexture({
      id: `${this.id}-depth`,
      format: 'depth24plus',
      width: this.width,
      height: this.height,
      usage: Texture.RENDER
    });

    this.colorAttachment = graph.createTextureView(colorTexture);
    this.indexAttachment = graph.createTextureView(indexTexture);
    this.depthStencilAttachment = graph.createTextureView(depthStencilTexture);
    this.attachments = {
      colorAttachments: [this.colorAttachment, this.indexAttachment],
      depthStencilAttachment: this.depthStencilAttachment
    };
    this.renderPassProps = {
      clearColors: [
        new Float32Array([0, 0, 0, 0]),
        new Int32Array([INDEX_PICKING_INVALID_INDEX, INDEX_PICKING_INVALID_INDEX, 0, 0])
      ],
      clearDepth: 1
    };
    this.readback = graph.importBuffer(
      {
        id: `${this.id}-readback`,
        byteLength: INDEX_PICKING_READBACK_BYTE_LENGTH,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      },
      props.readbackBuffer
    );
  }

  /**
   * Adds one explicit single-pixel texture-to-buffer copy after the picking render node.
   *
   * The pixel callback runs for each encoding, allowing pointer coordinates to arrive through graph
   * parameters. At most one readback pass may be added per target.
   */
  addReadbackPass(props: GPUIndexPickingReadbackProps<Parameters>): void {
    if (this.readbackPassAdded) {
      throw new Error(`${this.id} readback pass has already been added`);
    }
    this.readbackPassAdded = true;
    this.graph.addCopyPass({
      id: props.id ?? `${this.id}-readback`,
      dependsOn: [props.after],
      resources: [
        {texture: this.indexAttachment, usage: 'copy-source'},
        {buffer: this.readback, usage: 'copy-destination'}
      ],
      compile: () => ({
        encode: ({commandEncoder, parameters, getBuffer, getTexture}) => {
          const [x, y] = props.getPixel(parameters);
          validatePickingPixel(x, y, this.width, this.height);
          commandEncoder.copyTextureToBuffer({
            sourceTexture: getTexture(this.indexAttachment),
            mipLevel: this.indexAttachment.baseMipLevel,
            origin: [x, y, this.indexAttachment.baseArrayLayer],
            width: 1,
            height: 1,
            depthOrArrayLayers: 1,
            destinationBuffer: getBuffer(this.readback),
            byteOffset: 0,
            bytesPerRow: INDEX_PICKING_READBACK_BYTE_LENGTH,
            rowsPerImage: 1
          });
        }
      })
    });
  }
}

/**
 * Decodes the first `rg32sint` texel copied into a picking readback buffer.
 *
 * The clear sentinel `[-1, -1]` maps to null object and batch indices.
 */
export function decodeGPUIndexPickInfo(data: ArrayBuffer | ArrayBufferView): PickInfo {
  const byteOffset = ArrayBuffer.isView(data) ? data.byteOffset : 0;
  const byteLength = ArrayBuffer.isView(data) ? data.byteLength : data.byteLength;
  const buffer = ArrayBuffer.isView(data) ? data.buffer : data;
  if (byteLength < Int32Array.BYTES_PER_ELEMENT * 2) {
    throw new Error('GPU index picking readback requires at least eight bytes');
  }
  const view = new DataView(buffer, byteOffset, byteLength);
  const objectIndex = view.getInt32(0, true);
  const batchIndex = view.getInt32(Int32Array.BYTES_PER_ELEMENT, true);
  return {
    objectIndex: objectIndex === INDEX_PICKING_INVALID_INDEX ? null : objectIndex,
    batchIndex: batchIndex === INDEX_PICKING_INVALID_INDEX ? null : batchIndex
  };
}

/** Validates the fixed attachment extent. */
function validatePickingTargetSize(width: number, height: number): void {
  if (!Number.isSafeInteger(width) || width <= 0 || !Number.isSafeInteger(height) || height <= 0) {
    throw new Error('GPUIndexPickingTarget requires positive integer width and height');
  }
}

/** Validates an encode-time device-pixel coordinate against the attachment extent. */
function validatePickingPixel(x: number, y: number, width: number, height: number): void {
  if (
    !Number.isSafeInteger(x) ||
    !Number.isSafeInteger(y) ||
    x < 0 ||
    y < 0 ||
    x >= width ||
    y >= height
  ) {
    throw new Error(
      `GPUIndexPickingTarget pixel [${x}, ${y}] is outside ${width}x${height} target`
    );
  }
}
