import Resource, {ResourceProps} from './resource';

export type TransformFeedbackProps = ResourceProps & {
  [key: string]: any;
};
export default class TransformFeedback extends Resource {
  static isSupported(gl: WebGLRenderingContext): boolean;

  constructor(gl: WebGLRenderingContext, props?: TransformFeedbackProps);
  initialize(props?: TransformFeedbackProps): this;
  setProps(props: TransformFeedbackProps): void;
  setBuffers(buffers?: {}): this;
  setBuffer(locationOrName: any, bufferOrParams: any): this;
  begin(primitiveMode?: any): this;
  end(): this;
}
