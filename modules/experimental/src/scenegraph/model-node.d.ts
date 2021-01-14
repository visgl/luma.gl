import {Model} from '@luma.gl/engine';
import ScenegraphNode from './scenegraph-node';

export default class ModelNode extends ScenegraphNode {
  readonly model: Model;

  constructor(model: Model | WebGLRenderingContext, props?: {});
  setProps(props: any): this;
  delete(): void;
  draw(...args: any[]): any;
  setUniforms(...args: any[]): this;
  setAttributes(...args: any[]): this;
  updateModuleSettings(...args: any[]): this;
  _setModelNodeProps(props: any): void;
}
