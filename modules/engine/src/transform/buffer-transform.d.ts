import {TransformDrawOptions, TransformModelProps} from './resource-transform';

export default class BufferTransform {
  constructor(gl: WebGLRenderingContext, props?: {});
  setupResources(opts: any): void;
  updateModelProps(props?: {}): TransformModelProps;
  getDrawOptions(opts?: {}): TransformDrawOptions;
  swap(): boolean;
  update(opts?: {}): void;
  getBuffer(varyingName: any): any;
  getData(options?: {varyingName: string}): any;
  delete(): void;
}
