import type {ColorTextureFormat, DepthStencilTextureFormat} from '../types/texture-formats';
// import type {ColorAttachment, DepthStencilAttachment} from '../types/types';
import type Device from '../device';
import Resource, {ResourceProps, DEFAULT_RESOURCE_PROPS} from './resource';
import Texture from './texture';

export type FramebufferProps = ResourceProps & {
  width?: number;
  height?: number;
  colorAttachments?: (Texture | ColorTextureFormat)[];
  depthStencilAttachment?: Texture | DepthStencilTextureFormat | null;
};

const DEFAULT_FRAMEBUFFER_PROPS: Required<FramebufferProps> = {
  ...DEFAULT_RESOURCE_PROPS,
  width: 1,
  height: 1,
  colorAttachments: [], // ['rgba8unorm-unsized'],
  depthStencilAttachment: null // 'depth24plus-stencil8'
};

/**
 * Create new textures with correct size for all attachments.
 * @note resize() destroys existing textures (if size has changed).
 */
export default abstract class Framebuffer extends Resource<FramebufferProps> {
  override get [Symbol.toStringTag](): string { return 'Framebuffer'; }

  /** Width of all attachments in this framebuffer */
  width: number;
  /** Height of all attachments in this framebuffer */
  height: number;
  abstract colorAttachments: Texture[];
  abstract depthStencilAttachment: Texture | null;

  constructor(device: Device, props: FramebufferProps = {}) {
    super(device, props, DEFAULT_FRAMEBUFFER_PROPS)
    this.width = this.props.width;
    this.height = this.props.height;
  }

  /**
   * Resizes all attachments
   * @note resize() destroys existing textures (if size has changed).
   */
  resize(size?: {width: number, height: number}): void {
    const updateSize = !size || (size.height !== this.height || size.width !== this.width);
    if (size) {
      this.width = size?.width;
      this.height = size?.height;
    }
    if (updateSize) {
      this._resizeAttachments(this.width, this.height);
    }
  }

  /** Implementation of resize */
  protected abstract _resizeAttachments(width: number, height: number): void;
}
