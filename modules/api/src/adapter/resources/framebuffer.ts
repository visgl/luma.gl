import type {TextureFormat, DepthStencilTextureFormat} from '../types/formats';
import Texture from './texture';

/** @todo  */
type ColorAttachment = {
  texture: Texture;  // required GPUTextureView view;
  resolveTarget?: Texture; // GPUTextureView resolveTarget;
  loadValue: 'load' | number[]; // GPUColor
  storeOp: 'store' | 'discard';
}

/** @todo  */
type DepthStencilAttachment = {
  depthStencilTexture: Texture;  // required GPUTextureView view;

  depthLoadValue: 'load' | number; // required (GPULoadOp or float) depthLoadValue;
  depthStoreOp: 'store' | 'discard'; // required GPUStoreOp depthStoreOp;
  depthReadOnly?: boolean; // boolean depthReadOnly = false;

  stencilLoadValue: 'load' | number; // required (GPULoadOp or GPUStencilValue) stencilLoadValue;
  stencilStoreOp: 'store' | 'discard'; // required GPUStoreOp stencilStoreOp;
  stencilReadOnly?: boolean; // boolean stencilReadOnly = false;
}

export type FramebufferProps = { // ResourceProps & {
  width: number;
  height: number;
  colorAttachments?: ColorAttachment[];
  depthStencilAttachment?: DepthStencilAttachment | DepthStencilTextureFormat | boolean;
};

/**
 * Create new textures with correct size for all attachments. 
 * @note resize() destroys existing textures (if size has changed). 
 */
 export default abstract class Framebuffer {
  /** Width of all attachments in this framebuffer */
  width: number;
  /** Height of all attachments in this framebuffer */
  height: number;

  constructor(props: FramebufferProps) {
    this.width = props.width;
    this.height = props.height;
  }

  resize(width: number, height: number): void {
    if (height !== this.height || width !== this.width) {
      this.width = width;
      this.height = height;
      this._resize(width, height);
    }
  }

  protected abstract _resize(width: number, height: number): void;
}
