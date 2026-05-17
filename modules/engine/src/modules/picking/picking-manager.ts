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
const TOOLTIP_OFFSET_PIXELS = 14;
const TOOLTIP_MARGIN_PIXELS = 8;

/** Information about picked object */
export type PickInfo = {
  batchIndex: number | null;
  objectIndex: number | null;
};

/** Text shown by `PickingManager` beside the latest picked cursor position. */
export type PickingTooltip = string | null;

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
  /**
   * Returns tooltip text for the latest pick result.
   * Returning `null` hides the tooltip.
   */
  getTooltip?: (info: PickInfo) => PickingTooltip;
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
  /** Last cursor position that triggered a picking render/readback. */
  protected lastMousePosition: [number, number] | null = null;
  /** Tooltip element created lazily when `getTooltip` returns visible content. */
  protected tooltipElement: HTMLDivElement | null = null;

  static defaultProps: Required<PickingManagerProps> = {
    shaderInputs: undefined!,
    onObjectPicked: () => {},
    getTooltip: () => null,
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
    this.tooltipElement?.remove();
    this.tooltipElement = null;
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
    this.lastMousePosition = null;
    this.setPickingProps({highlightedBatchIndex: null, highlightedObjectIndex: null});
    this.hideTooltip();
  }

  /** Return whether callers need to render a fresh picking pass for this cursor position. */
  shouldPick(
    mousePosition: [number, number] | null | undefined
  ): mousePosition is [number, number] {
    if (!mousePosition) {
      if (this.lastMousePosition) {
        this.clearPickState();
      }
      return false;
    }

    const [mouseX, mouseY] = mousePosition;
    if (
      this.lastMousePosition &&
      this.lastMousePosition[0] === mouseX &&
      this.lastMousePosition[1] === mouseY
    ) {
      return false;
    }

    this.lastMousePosition = [mouseX, mouseY];
    return true;
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

    this.updateTooltip(pickInfo, mousePosition);
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

  protected updateTooltip(pickInfo: PickInfo, mousePosition: [number, number]): void {
    const tooltipText = this.props.getTooltip(pickInfo);
    if (!tooltipText) {
      this.hideTooltip();
      return;
    }

    const tooltipElement = this.getOrCreateTooltipElement();
    if (!tooltipElement) {
      return;
    }

    tooltipElement.textContent = tooltipText;
    tooltipElement.style.display = 'block';
    this.positionTooltip(tooltipElement, mousePosition);
  }

  protected hideTooltip(): void {
    if (this.tooltipElement) {
      this.tooltipElement.style.display = 'none';
    }
  }

  protected getOrCreateTooltipElement(): HTMLDivElement | null {
    if (this.tooltipElement) {
      return this.tooltipElement;
    }
    if (
      typeof document === 'undefined' ||
      typeof window === 'undefined' ||
      typeof HTMLCanvasElement === 'undefined'
    ) {
      return null;
    }

    const canvas = this.device.getDefaultCanvasContext().canvas;
    if (!(canvas instanceof HTMLCanvasElement) || !canvas.parentElement) {
      return null;
    }

    const tooltipElement = document.createElement('div');
    tooltipElement.style.position = 'absolute';
    tooltipElement.style.zIndex = '12';
    tooltipElement.style.display = 'none';
    tooltipElement.style.maxWidth = '220px';
    tooltipElement.style.padding = '8px 10px';
    tooltipElement.style.borderRadius = '6px';
    tooltipElement.style.background = 'rgba(15, 23, 42, 0.92)';
    tooltipElement.style.color = '#f8fafc';
    tooltipElement.style.font = '600 13px/1.35 system-ui, sans-serif';
    tooltipElement.style.pointerEvents = 'none';
    tooltipElement.style.whiteSpace = 'nowrap';
    tooltipElement.style.boxShadow = '0 10px 24px rgba(15, 23, 42, 0.22)';

    const tooltipParent = canvas.parentElement;
    if (window.getComputedStyle(tooltipParent).position === 'static') {
      tooltipParent.style.position = 'relative';
    }
    tooltipParent.appendChild(tooltipElement);
    this.tooltipElement = tooltipElement;
    return tooltipElement;
  }

  protected positionTooltip(tooltipElement: HTMLDivElement, mousePosition: [number, number]): void {
    if (typeof HTMLCanvasElement === 'undefined') {
      return;
    }

    const canvas = this.device.getDefaultCanvasContext().canvas;
    if (!(canvas instanceof HTMLCanvasElement)) {
      return;
    }

    const maxLeft = Math.max(
      TOOLTIP_MARGIN_PIXELS,
      canvas.clientWidth - tooltipElement.offsetWidth - TOOLTIP_MARGIN_PIXELS
    );
    const maxTop = Math.max(
      TOOLTIP_MARGIN_PIXELS,
      canvas.clientHeight - tooltipElement.offsetHeight - TOOLTIP_MARGIN_PIXELS
    );
    const left = Math.min(mousePosition[0] + TOOLTIP_OFFSET_PIXELS, maxLeft);
    const top = Math.min(mousePosition[1] + TOOLTIP_OFFSET_PIXELS, maxTop);
    tooltipElement.style.left = `${Math.max(TOOLTIP_MARGIN_PIXELS, left)}px`;
    tooltipElement.style.top = `${Math.max(TOOLTIP_MARGIN_PIXELS, top)}px`;
  }
}

export {COLOR_PICKING_MAX_BATCH_INDEX, COLOR_PICKING_MAX_OBJECT_INDEX};
