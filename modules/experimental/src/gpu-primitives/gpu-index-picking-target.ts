// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture, type Binding, type RenderPassProps} from '@luma.gl/core';
import type {PickInfo} from '@luma.gl/engine';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  type GraphBufferHandle,
  type GraphDataView,
  type GraphRenderPassAttachments,
  type GraphTextureView
} from './gpu-command-graph';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';

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

/** Properties for one capacity-bounded rectangular picking reduction. */
export type GPUIndexPickingRegionProps = {
  /** Compute node ID. Defaults to the target ID plus `-region`. */
  id?: string;
  /** Render node that must complete before the index texture is inspected. */
  after: string;
  /** Packed `[x, y, width, height]` device-pixel rectangle, updated on the GPU or CPU. */
  region: GraphDataView<'uint32'>;
  /**
   * Packed result words: total count, overflow flag, then object/batch index pairs.
   * The pair capacity is `floor((result.length - 2) / 2)`.
   */
  result: GraphDataView<'uint32'>;
};

/** Decoded capacity-bounded result from {@link GPUIndexPickingTarget.addRegionPass}. */
export type GPUIndexPickingRegionResult = {
  /** Stored picks. Duplicate covered pixels are intentionally preserved. */
  picks: PickInfo[];
  /** Total number of non-background pixels, including values beyond result capacity. */
  count: number;
  /** Whether `count` exceeded the number of stored pairs. */
  overflow: boolean;
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
  private readonly graph: GPUCommandGraph<Parameters>;
  private readbackHandle: GraphBufferHandle | null = null;
  private readbackPassAdded = false;
  private regionPassAdded = false;

  /**
   * Declares fixed-size transient attachments. A supplied readback buffer is imported immediately;
   * otherwise the logical readback import is created only by `addReadbackPass()`.
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
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.SAMPLE
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
    if (props.readbackBuffer) {
      this.readbackHandle = this.createReadbackHandle(props.readbackBuffer);
    }
  }

  /** Borrowed logical handle for the caller-owned single-pixel readback buffer. */
  get readback(): GraphBufferHandle {
    if (!this.readbackHandle) {
      throw new Error('GPU index picking readback pass has not been added');
    }
    return this.readbackHandle;
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
    this.readbackHandle ??= this.createReadbackHandle();
    const readback = this.readbackHandle;
    this.graph.addCopyPass({
      id: props.id ?? `${this.id}-readback`,
      dependsOn: [props.after],
      resources: [
        {texture: this.indexAttachment, usage: 'copy-source'},
        {buffer: readback, usage: 'copy-destination'}
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
            destinationBuffer: getBuffer(readback),
            byteOffset: 0,
            bytesPerRow: INDEX_PICKING_READBACK_BYTE_LENGTH,
            rowsPerImage: 1
          });
        }
      })
    });
  }

  /**
   * Adds one rectangular GPU reduction after the picking render node.
   *
   * Every non-background pixel appends its stable object/batch pair. Duplicate pixels are
   * preserved and atomic append order is unspecified. The total count continues past capacity and
   * sets the overflow word, allowing callers to resize or deliberately accept truncation.
   */
  addRegionPass(props: GPUIndexPickingRegionProps): void {
    if (this.regionPassAdded) {
      throw new Error(`${this.id} region pass has already been added`);
    }
    validatePackedUint32View(props.region, 'GPU index picking region');
    validatePackedUint32View(props.result, 'GPU index picking region result');
    if (props.region.length < 4) {
      throw new Error('GPU index picking region requires four uint32 values');
    }
    if (props.result.length < 4) {
      throw new Error('GPU index picking region result requires a header and at least one pair');
    }
    if (props.region.buffer === props.result.buffer) {
      throw new Error('GPU index picking region and result require separate buffers');
    }
    this.regionPassAdded = true;
    const id = props.id ?? `${this.id}-region`;
    const clearId = `${id}-clear`;
    const resultOffset = getViewElementOffset(props.result);
    const regionOffset = getViewElementOffset(props.region);
    const capacity = Math.floor((props.result.length - 2) / 2);

    this.graph.addComputePass({
      id: clearId,
      resources: [{buffer: props.result, usage: 'storage-write'}],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: clearId,
          source: `const RESULT_OFFSET: u32 = ${resultOffset}u;
@group(0) @binding(0) var<storage, read_write> result: array<atomic<u32>>;
@compute @workgroup_size(1) fn main() {
  atomicStore(&result[RESULT_OFFSET], 0u);
  atomicStore(&result[RESULT_OFFSET + 1u], 0u);
}`,
          shaderLayout: {
            bindings: [{name: 'result', type: 'storage', group: 0, location: 0}]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({result: getViewBinding(props.result, getBuffer)});
            computation.dispatch(computePass, 1);
          },
          destroy: () => computation.destroy()
        };
      }
    });

    this.graph.addComputePass({
      id,
      dependsOn: [props.after, clearId],
      resources: [
        {texture: this.indexAttachment, usage: 'sampled'},
        {buffer: props.region, usage: 'storage-read'},
        {buffer: props.result, usage: 'storage-read-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id,
          source: `const REGION_OFFSET: u32 = ${regionOffset}u;
const RESULT_OFFSET: u32 = ${resultOffset}u;
const RESULT_CAPACITY: u32 = ${capacity}u;
const TARGET_SIZE: vec2<u32> = vec2<u32>(${this.width}u, ${this.height}u);
@group(0) @binding(0) var indices: texture_2d<i32>;
@group(0) @binding(1) var<storage, read> region: array<u32>;
@group(0) @binding(2) var<storage, read_write> result: array<atomic<u32>>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let extent = vec2<u32>(region[REGION_OFFSET + 2u], region[REGION_OFFSET + 3u]);
  if (any(globalId.xy >= extent)) { return; }
  let origin = vec2<u32>(region[REGION_OFFSET], region[REGION_OFFSET + 1u]);
  if (any(origin >= TARGET_SIZE)) { return; }
  let pixel = origin + globalId.xy;
  if (any(pixel >= TARGET_SIZE)) { return; }
  let pick = textureLoad(indices, vec2<i32>(pixel), 0).xy;
  if (pick.x == ${INDEX_PICKING_INVALID_INDEX}) { return; }
  let outputIndex = atomicAdd(&result[RESULT_OFFSET], 1u);
  if (outputIndex < RESULT_CAPACITY) {
    let pairOffset = RESULT_OFFSET + 2u + outputIndex * 2u;
    atomicStore(&result[pairOffset], bitcast<u32>(pick.x));
    atomicStore(&result[pairOffset + 1u], bitcast<u32>(pick.y));
  } else {
    atomicStore(&result[RESULT_OFFSET + 1u], 1u);
  }
}`,
          shaderLayout: {
            bindings: [
              {name: 'indices', type: 'texture', group: 0, location: 0, sampleType: 'sint'},
              {name: 'region', type: 'storage', group: 0, location: 1},
              {name: 'result', type: 'storage', group: 0, location: 2}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer, getTextureView}) => {
            const bindings: Record<string, Binding> = {
              indices: getTextureView(this.indexAttachment),
              region: getViewBinding(props.region, getBuffer),
              result: getViewBinding(props.result, getBuffer)
            };
            computation.setBindings(bindings);
            computation.dispatch(
              computePass,
              Math.ceil(this.width / 8),
              Math.ceil(this.height / 8)
            );
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private createReadbackHandle(readbackBuffer?: Buffer): GraphBufferHandle {
    return this.graph.importBuffer(
      {
        id: `${this.id}-readback`,
        byteLength: INDEX_PICKING_READBACK_BYTE_LENGTH,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      },
      readbackBuffer
    );
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

/** Decodes a packed region result while preserving its GPU-produced pair order. */
export function decodeGPUIndexPickRegion(
  data: ArrayBuffer | ArrayBufferView
): GPUIndexPickingRegionResult {
  const byteOffset = ArrayBuffer.isView(data) ? data.byteOffset : 0;
  const byteLength = ArrayBuffer.isView(data) ? data.byteLength : data.byteLength;
  const buffer = ArrayBuffer.isView(data) ? data.buffer : data;
  if (byteLength < Uint32Array.BYTES_PER_ELEMENT * 4) {
    throw new Error('GPU index picking region result requires at least sixteen bytes');
  }
  const view = new DataView(buffer, byteOffset, byteLength);
  const count = view.getUint32(0, true);
  const overflow = view.getUint32(Uint32Array.BYTES_PER_ELEMENT, true) !== 0;
  const storedCount = Math.min(
    count,
    Math.floor((byteLength / Uint32Array.BYTES_PER_ELEMENT - 2) / 2)
  );
  const picks: PickInfo[] = [];
  for (let index = 0; index < storedCount; index++) {
    const pairByteOffset = (2 + index * 2) * Uint32Array.BYTES_PER_ELEMENT;
    const batchIndex = view.getInt32(pairByteOffset + Int32Array.BYTES_PER_ELEMENT, true);
    picks.push({
      objectIndex: view.getInt32(pairByteOffset, true),
      batchIndex: batchIndex === INDEX_PICKING_INVALID_INDEX ? null : batchIndex
    });
  }
  return {picks, count, overflow};
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
