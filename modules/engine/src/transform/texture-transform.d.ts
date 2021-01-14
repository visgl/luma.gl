import {TransformDrawOptions, TransformModelProps} from './resource-transform';

export default class TextureTransform {
  constructor(gl: WebGLRenderingContext, props?: {});

  updateModelProps(props?: {}): TransformModelProps;

  getDrawOptions(opts?: {}): TransformDrawOptions;

  swap(): boolean;
  update(opts?: {}): void;
  getTargetTexture(): any;
  getData(opts: {packed?: boolean}): any;
  getFramebuffer(): any;
  delete(): void;
}
