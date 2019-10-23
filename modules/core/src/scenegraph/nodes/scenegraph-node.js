import {assert, uid} from '../../utils';
import {mat4_create, mat4_multiply, mat4_translate, mat4_scale} from './math-utils';

export default class ScenegraphNode {
  constructor(props = {}) {
    const {id} = props;

    this.id = id || uid(this.constructor.name);

    this.display = true; // whether to display the object at all
    this.position = [0, 0, 0];
    this.rotation = [0, 0, 0];
    this.scale = [1, 1, 1];
    this.matrix = mat4_create();
    this.userData = {};

    this.props = {};
    this._setScenegraphNodeProps(props);
  }

  delete() {}

  setProps(props) {
    this._setScenegraphNodeProps(props);
    return this;
  }

  toString() {
    return `{type: ScenegraphNode, id: ${this.id})}`;
  }

  setPosition(position) {
    assert(position.length === 3, 'setPosition requires vector argument');
    this.position = position;
    return this;
  }

  setRotation(rotation) {
    assert(rotation.length === 3, 'setRotation requires vector argument');
    this.rotation = rotation;
    return this;
  }

  setScale(scale) {
    assert(scale.length === 3, 'setScale requires vector argument');
    this.scale = scale;
    return this;
  }

  setMatrix(matrix) {
    this.matrix = matrix;
  }

  setMatrixComponents({position, rotation, scale, update = true}) {
    if (position) {
      this.setPosition(position);
    }
    if (rotation) {
      this.setRotation(rotation);
    }
    if (scale) {
      this.setScale(scale);
    }
    if (update) {
      this.updateMatrix();
    }
    return this;
  }

  updateMatrix() {
    const pos = this.position;
    // const rot = this.rotation;
    const scale = this.scale;

    this.matrix = mat4_create();
    mat4_translate(this.matrix, this.matrix, pos);
    // TODO - this should be a quaternion. unify with glTF code in addons...
    // this.matrix.rotateXYZ(rot);
    mat4_scale(this.matrix, this.matrix, scale);
    return this;
  }

  update({position, rotation, scale} = {}) {
    if (position) {
      this.setPosition(position);
    }
    if (rotation) {
      this.setRotation(rotation);
    }
    if (scale) {
      this.setScale(scale);
    }
    this.updateMatrix();
    return this;
  }

  getCoordinateUniforms(viewMatrix, modelMatrix) {
    // TODO - solve multiple class problem
    // assert(viewMatrix instanceof Matrix4);
    assert(viewMatrix);
    modelMatrix = modelMatrix || this.matrix;

    const worldMatrix = mat4_multiply(mat4_create(), viewMatrix, modelMatrix);

    return {
      viewMatrix,
      modelMatrix,
      objectMatrix: modelMatrix,
      worldMatrix
    };
  }

  _setScenegraphNodeProps(props) {
    if ('display' in props) {
      this.display = props.display;
    }

    if ('position' in props) {
      this.setPosition(props.position);
    }
    if ('rotation' in props) {
      this.setRotation(props.rotation);
    }
    if ('scale' in props) {
      this.setScale(props.scale);
    }

    // Matrix overwrites other props
    if ('matrix' in props) {
      this.setMatrix(props.matrix);
    }

    Object.assign(this.props, props);
  }
}
