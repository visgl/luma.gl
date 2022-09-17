import Model from '../lib/model';

export type TransformProps = {
  vs?: string;
  elementCount?: number;
  sourceBuffers?: object;
  feedbackBuffers?: object;
  varyings?: string[];
  feedbackMap?: object;
  modules?: object[]; // TODO use ShaderModule type
  _sourceTextures?: any;
  _targetTexture?: any;
  _targetTextureVarying?: string;
  _swapTexture?: string;
  _fs?: string;
  inject?: any;
  drawMode?: number;
};

export default class Transform {
  readonly model: Model;

  static isSupported(gl: WebGLRenderingContext): any;
  constructor(gl: WebGLRenderingContext, props?: TransformProps);
  delete(): void;
  run(opts?: {}): void;
  swap(): void;
  getBuffer(varyingName?: any): any;
  // TODO - mix of options for buffers and textures
  getData(opts?: {packed?: boolean; varyingName?: string}): any;
  getFramebuffer(): any;
  update(opts?: TransformProps): void;
}
