import type {ColorTextureFormat, DepthStencilTextureFormat} from '../types/formats';
// import type {ColorAttachment, DepthStencilAttachment} from '../types/types';
import type Device from '../device';
import Resource, {ResourceProps, DEFAULT_RESOURCE_PROPS} from './resource';
import Texture from './texture';

export type FramebufferProps = ResourceProps & {
  width?: number;
  height?: number;
  colorAttachments?: (Texture | ColorTextureFormat)[];
  depthStencilAttachment?: Texture | DepthStencilTextureFormat;
};

const DEFAULT_FRAMEBUFFER_PROPS: Required<FramebufferProps> = {
  ...DEFAULT_RESOURCE_PROPS,
  width: 1,
  height: 1,
  // colorAttachments: [],
  colorAttachments: ['rgba-unorm-webgl1'],
  depthStencilAttachment: 'depth24plus-stencil8'
};

/**
 * Create new textures with correct size for all attachments.
 * @note resize() destroys existing textures (if size has changed).
 */
 export default abstract class Framebuffer extends Resource<FramebufferProps> {
  get [Symbol.toStringTag](): string { return 'Framebuffer'; }

  /** Width of all attachments in this framebuffer */
  width: number;
  /** Height of all attachments in this framebuffer */
  height: number;

  constructor(device: Device, props: FramebufferProps = {}) {
    super(device, props, DEFAULT_FRAMEBUFFER_PROPS)
    this.width = this.props.width;
    this.height = this.props.height;
  }

  /**
   * Resizes all attachments
   * @note resize() destroys existing textures (if size has changed).
   */
  resize(width: number, height: number): void;
  /** @deprecated backwards compatibility*/
  resize(options?: {width: number, height: number}): void;

  resize(widthOrOptions: number | {width: number, height: number}, height: number = 0): void {
    let width;
    if (typeof widthOrOptions === 'number') {
      width = widthOrOptions;
    } else {
      width = widthOrOptions.width;
      height = widthOrOptions.height;
    }
    if (height !== this.height || width !== this.width) {
      this.width = width;
      this.height = height;
      this._resizeAttachments(width, height);
    }
  }

  /** Implementation of resize */
  protected abstract _resizeAttachments(width: number, height: number): void;
}
