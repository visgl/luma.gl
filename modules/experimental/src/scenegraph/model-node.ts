import {Model, ModelProps} from '@luma.gl/engine';
import ScenegraphNode, {ScenegraphNodeProps} from './scenegraph-node';

export type ModelNodeProps = ScenegraphNodeProps & ModelProps & {
  managedResources?: any[];
}

export default class ModelNode extends ScenegraphNode {
  readonly model: Model;

  AfterRender = null;
  managedResources: any[];

  // override callbacks to make sure we call them with this
  onBeforeRender = null;
  onAfterRender = null;

  constructor(gl: Model | WebGLRenderingContext, props: ModelNodeProps = {}) {
    super(props);

    // Create new Model or used supplied Model
    if (gl instanceof Model) {
      this.model = gl;
      this._setModelNodeProps(props);
    } else {
      this.model = new Model(gl, props);
    }

    this.managedResources = props.managedResources || [];
  }

  setProps(props: ModelNodeProps) {
    super.setProps(props);
    this._setModelNodeProps(props);
    return this;
  }

  destroy() {
    if (this.model) {
      this.model.delete();
      // @ts-expect-error
      this.model = null;
    }

    this.managedResources.forEach((resource) => resource.delete());
    this.managedResources = [];
  }

  // Expose model methods
  draw(...args) {
    // Return value indicates if something was actually drawn
    return this.model.draw(...args);
  }

  setUniforms(...args) {
    this.model.setUniforms(...args);
    return this;
  }

  setAttributes(...args) {
    this.model.setAttributes(...args);
    return this;
  }

  updateModuleSettings(...args) {
    this.model.updateModuleSettings(...args);
    return this;
  }

  // PRIVATE

  _setModelNodeProps(props) {
    this.model.setProps(props);
  }
}
