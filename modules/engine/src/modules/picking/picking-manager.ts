// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Device, Framebuffer, Texture} from '@luma.gl/core';
import {ShaderInputs} from '../../shader-inputs';
import {pickingUniforms, INVALID_INDEX} from './picking-uniforms';

const INDEX_PICKING_ATTACHMENT_INDEX = 1;
const INDEX_PICKING_CLEAR_COLOR = new Int32Array([INVALID_INDEX, INVALID_INDEX, 0, 0]);
const COLOR_PICKING_MAX_OBJECT_INDEX = 16777214;
const COLOR_PICKING_MAX_BATCH_INDEX = 254;

/** Information about picked object */
export type PickInfo = {
  batchIndex: number | null;
  objectIndex: number | null;
};

export type PickingMode = 'auto' | 'index' | 'color';
export type ResolvedPickingMode = Exclude<PickingMode, 'auto'>;
/** @deprecated Use `PickingMode`. */
export type PickingBackend = PickingMode;
/** @deprecated Use `ResolvedPickingMode`. */
export type ResolvedPickingBackend = ResolvedPickingMode;

export type PickingManagerProps = {
  /** Shader inputs from models to pick */
  shaderInputs?: ShaderInputs<{picking: typeof pickingUniforms.props}>;
  /** Callback */
  onObjectPicked?: (info: PickInfo) => void;
  /** Select a picking mode. Defaults to `color`. Use `auto` to prefer `index` when supported. */
  mode?: PickingMode;
  /** @deprecated Use `mode`. */
  backend?: PickingBackend;
};

export function resolvePickingMode(
  deviceType: Device['type'],
  mode: PickingMode = 'color',
  indexPickingSupported: boolean = deviceType === 'webgpu'
): ResolvedPickingMode {
  if (mode === 'auto') {
    return indexPickingSupported ? 'index' : 'color';
  }

  if (mode === 'index' && !indexPickingSupported) {
    throw new Error(
      `Picking mode "${mode}" requires WebGPU or a WebGL device that supports renderable rg32sint textures.`
    );
  }

  return mode;
}

export function supportsIndexPicking(device: Device): boolean {
  return (
    device.type === 'webgpu' ||
    (device.type === 'webgl' && device.isTextureFormatRenderable('rg32sint'))
  );
}

/** @deprecated Use `resolvePickingMode`. */
export const resolvePickingBackend = resolvePickingMode;

export function decodeIndexPickInfo(pixelData: Int32Array): PickInfo {
  return {
    objectIndex: pixelData[0] === INVALID_INDEX ? null : pixelData[0],
    batchIndex: pixelData[1] === INVALID_INDEX ? null : pixelData[1]
  };
}

export function decodeColorPickInfo(pixelData: Uint8Array): PickInfo {
  const encodedObjectIndex = pixelData[0] + pixelData[1] * 256 + pixelData[2] * 65536;
  if (encodedObjectIndex === 0) {
    return {objectIndex: null, batchIndex: null};
  }

  const batchIndex = pixelData[3] > 0 ? pixelData[3] - 1 : 0;
  return {
    objectIndex: encodedObjectIndex - 1,
    batchIndex
  };
}

/**
 * Helper class for using object picking with backend-specific readback.
 * @todo Support multiple models
 * @todo Switching picking module
 */
export class PickingManager {
  device: Device;
  props: Required<PickingManagerProps>;
  mode: ResolvedPickingMode;
  /** Info from latest pick operation */
  pickInfo: PickInfo = {batchIndex: null, objectIndex: null};
  /** Framebuffer used for picking */
  framebuffer: Framebuffer | null = null;

  static defaultProps: Required<PickingManagerProps> = {
    shaderInputs: undefined!,
    onObjectPicked: () => {},
    mode: 'color',
    backend: 'color'
  };

  constructor(device: Device, props: PickingManagerProps) {
    this.device = device;
    this.props = {...PickingManager.defaultProps, ...props};
    const requestedMode = props.mode ?? props.backend ?? PickingManager.defaultProps.mode;
    this.props.mode = requestedMode;
    this.props.backend = requestedMode;
    this.mode = resolvePickingMode(
      this.device.type,
      requestedMode,
      supportsIndexPicking(this.device)
    );
  }

  destroy() {
    this.framebuffer?.destroy();
  }

  // TODO - Ask for a cached framebuffer? a Framebuffer factory?
  getFramebuffer() {
    if (!this.framebuffer) {
      this.framebuffer =
        this.mode === 'index' ? this.createIndexFramebuffer() : this.createColorFramebuffer();
    }
    return this.framebuffer;
  }

  /** Clear highlighted / picked object */
  clearPickState() {
    this.setPickingProps({highlightedBatchIndex: null, highlightedObjectIndex: null});
  }

  /** Prepare for rendering picking colors */
  beginRenderPass() {
    const framebuffer = this.getFramebuffer();
    framebuffer.resize(this.device.getDefaultCanvasContext().getDevicePixelSize());

    this.setPickingProps({isActive: true});

    return this.mode === 'index'
      ? this.device.beginRenderPass({
          framebuffer,
          clearColors: [new Float32Array([0, 0, 0, 0]), INDEX_PICKING_CLEAR_COLOR],
          clearDepth: 1
        })
      : this.device.beginRenderPass({
          framebuffer,
          clearColor: [0, 0, 0, 0],
          clearDepth: 1
        });
  }

  async updatePickInfo(mousePosition: [number, number]): Promise<PickInfo | null> {
    const framebuffer = this.getFramebuffer();
    const pickPosition = this.getPickPosition(mousePosition);
    const pickInfo = await this.readPickInfo(framebuffer, pickPosition);
    if (!pickInfo) {
      return null;
    }

    if (this.hasPickInfoChanged(pickInfo)) {
      this.pickInfo = pickInfo;
      this.props.onObjectPicked(pickInfo);
    }

    this.setPickingProps({
      isActive: false,
      highlightedBatchIndex: pickInfo.batchIndex,
      highlightedObjectIndex: pickInfo.objectIndex
    });

    return this.pickInfo;
  }

  /**
   * Get pick position in device pixel range
   * use the center pixel location in device pixel range
   */
  getPickPosition(mousePosition: [number, number]): [number, number] {
    const yInvert = this.device.type !== 'webgpu';
    const devicePixels = this.device
      .getDefaultCanvasContext()
      .cssToDevicePixels(mousePosition, yInvert);
    const pickX = devicePixels.x + Math.floor(devicePixels.width / 2);
    const pickY = devicePixels.y + Math.floor(devicePixels.height / 2);
    return [pickX, pickY];
  }

  protected createIndexFramebuffer(): Framebuffer {
    const colorTexture = this.device.createTexture({
      format: 'rgba8unorm',
      width: 1,
      height: 1,
      usage: Texture.RENDER_ATTACHMENT
    });
    const pickingTexture = this.device.createTexture({
      format: 'rg32sint',
      width: 1,
      height: 1,
      usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
    });

    return this.device.createFramebuffer({
      colorAttachments: [colorTexture, pickingTexture],
      depthStencilAttachment: 'depth24plus'
    });
  }

  protected createColorFramebuffer(): Framebuffer {
    const pickingTexture = this.device.createTexture({
      format: 'rgba8unorm',
      width: 1,
      height: 1,
      usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
    });

    return this.device.createFramebuffer({
      colorAttachments: [pickingTexture],
      depthStencilAttachment: 'depth24plus'
    });
  }

  protected setPickingProps(props: Partial<typeof pickingUniforms.props>): void {
    this.props.shaderInputs?.setProps({picking: props});
  }

  protected async readPickInfo(
    framebuffer: Framebuffer,
    pickPosition: [number, number]
  ): Promise<PickInfo | null> {
    return this.mode === 'index'
      ? this.readIndexPickInfo(framebuffer, pickPosition)
      : this.readColorPickInfo(framebuffer, pickPosition);
  }

  protected async readIndexPickInfo(
    framebuffer: Framebuffer,
    [pickX, pickY]: [number, number]
  ): Promise<PickInfo | null> {
    if (this.device.type === 'webgpu') {
      const pickTexture = framebuffer.colorAttachments[INDEX_PICKING_ATTACHMENT_INDEX]?.texture;
      if (!pickTexture) {
        return null;
      }

      const layout = pickTexture.computeMemoryLayout({width: 1, height: 1});
      const readBuffer = this.device.createBuffer({
        byteLength: layout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      try {
        pickTexture.readBuffer(
          {
            x: pickX,
            y: pickY,
            width: 1,
            height: 1
          },
          readBuffer
        );
        const pickDataView = await readBuffer.readAsync(0, layout.byteLength);
        return decodeIndexPickInfo(new Int32Array(pickDataView.buffer, pickDataView.byteOffset, 2));
      } finally {
        readBuffer.destroy();
      }
    }

    const pixelData = this.device.readPixelsToArrayWebGL(framebuffer, {
      sourceX: pickX,
      sourceY: pickY,
      sourceWidth: 1,
      sourceHeight: 1,
      sourceAttachment: INDEX_PICKING_ATTACHMENT_INDEX
    });

    return pixelData
      ? decodeIndexPickInfo(new Int32Array(pixelData.buffer, pixelData.byteOffset, 2))
      : null;
  }

  protected async readColorPickInfo(
    framebuffer: Framebuffer,
    [pickX, pickY]: [number, number]
  ): Promise<PickInfo | null> {
    if (this.device.type === 'webgpu') {
      const pickTexture = framebuffer.colorAttachments[0]?.texture;
      if (!pickTexture) {
        return null;
      }

      const layout = pickTexture.computeMemoryLayout({width: 1, height: 1});
      const readBuffer = this.device.createBuffer({
        byteLength: layout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      try {
        pickTexture.readBuffer(
          {
            x: pickX,
            y: pickY,
            width: 1,
            height: 1
          },
          readBuffer
        );
        const pickDataView = await readBuffer.readAsync(0, layout.byteLength);
        return decodeColorPickInfo(new Uint8Array(pickDataView.buffer, pickDataView.byteOffset, 4));
      } finally {
        readBuffer.destroy();
      }
    }

    const pixelData = this.device.readPixelsToArrayWebGL(framebuffer, {
      sourceX: pickX,
      sourceY: pickY,
      sourceWidth: 1,
      sourceHeight: 1,
      sourceAttachment: 0
    });

    return pixelData
      ? decodeColorPickInfo(new Uint8Array(pixelData.buffer, pixelData.byteOffset, 4))
      : null;
  }

  protected hasPickInfoChanged(pickInfo: PickInfo): boolean {
    return (
      pickInfo.objectIndex !== this.pickInfo.objectIndex ||
      pickInfo.batchIndex !== this.pickInfo.batchIndex
    );
  }
}

export {COLOR_PICKING_MAX_BATCH_INDEX, COLOR_PICKING_MAX_OBJECT_INDEX};
