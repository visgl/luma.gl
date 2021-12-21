// luma.gl, MIT license
import type {TextureFormat, CanvasContextProps} from '@luma.gl/api';
import {CanvasContext} from '@luma.gl/api';

/** 
 * Holds a WebGL Canvas Context which will handle drawing buffer resizing etc 
 * @todo This class is WIP, intended to replace the old gltools-based context size tracking
 */
export default class WebGLCanvasContext extends CanvasContext {
  // readonly gl: WebGLRenderingContext;
  presentationSize: [number, number];

  constructor(device: WebGLRenderingContext, props: CanvasContextProps) {
    // This creates the context
    super(props);
    // TODO - We will need to break out WebGL context creating code from WebGLDevice
    // this.gl = this.canvas.getContext('webgl');
    this.presentationSize = [-1, -1];
    this.update();
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
