// luma.gl, MIT license
import type {TextureFormat, CanvasContextProps} from '@luma.gl/api';
import {CanvasContext} from '@luma.gl/api';
import WebGLDevice from './webgl-device';
import WEBGLFramebuffer from './resources/webgl-framebuffer';

/** 
 * Holds a WebGL Canvas Context which will handle drawing buffer resizing etc 
 * @todo This class is WIP, intended to replace the old gltools-based context size tracking
 */
export default class WebGLCanvasContext extends CanvasContext {
  device: WebGLDevice;
  presentationSize: [number, number];
  private _framebuffer: WEBGLFramebuffer;

  constructor(device: WebGLDevice, props: CanvasContextProps) {
    super(getWebGLCanvasContextProps(device, props));
    this.device = device;
    this.presentationSize = [-1, -1];

    // TODO - We could move WebGL context creating code from WebGLDevice...
    // this.gl = this.canvas.getContext('webgl');

    this._framebuffer = new WEBGLFramebuffer(this.device, {handle: null});
    this.update();
  }

  getCurrentFramebuffer(): WEBGLFramebuffer {
    this.update();
    return this._framebuffer;
  }

  /** Resizes and updates render targets if necessary */
  update() {
    const size = this.getPixelSize();
    const sizeChanged = size[0] !== this.presentationSize[0] || size[1] !== this.presentationSize[1];
    if (sizeChanged) {
      this.presentationSize = size;
    }
  }
}

function getWebGLCanvasContextProps(device: WebGLDevice, props: CanvasContextProps): CanvasContextProps {
  if (props.canvas !== device.gl.canvas) {
    throw new Error('WebGL canvas must be device canvas');
  }
  return props;
}