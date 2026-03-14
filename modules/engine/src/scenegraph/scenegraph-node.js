// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Vector3, Matrix4 } from '@math.gl/core';
import { uid } from '../utils/uid';
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
export class ScenegraphNode {
    id;
    matrix = new Matrix4();
    display = true;
    position = new Vector3();
    rotation = new Vector3();
    scale = new Vector3(1, 1, 1);
    userData = {};
    props = {};
    constructor(props = {}) {
        const { id } = props;
        this.id = id || uid(this.constructor.name);
        this._setScenegraphNodeProps(props);
    }
    getBounds() {
        return null;
    }
    destroy() { }
    /** @deprecated use .destroy() */
    delete() {
        this.destroy();
    }
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
        assert(rotation.length === 3 || rotation.length === 4, 'setRotation requires vector argument');
        this.rotation = rotation;
        return this;
    }
    setScale(scale) {
        assert(scale.length === 3, 'setScale requires vector argument');
        this.scale = scale;
        return this;
    }
    setMatrix(matrix, copyMatrix = true) {
        if (copyMatrix) {
            this.matrix.copy(matrix);
        }
        else {
            this.matrix = matrix;
        }
    }
    setMatrixComponents(components) {
        const { position, rotation, scale, update = true } = components;
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
        this.matrix.identity();
        this.matrix.translate(this.position);
        if (this.rotation.length === 4) {
            const rotationMatrix = new Matrix4().fromQuaternion(this.rotation);
            this.matrix.multiplyRight(rotationMatrix);
        }
        else {
            this.matrix.rotateXYZ(this.rotation);
        }
        this.matrix.scale(this.scale);
        return this;
    }
    update({ position, rotation, scale } = {}) {
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
        // assert(viewMatrix);
        modelMatrix = modelMatrix || this.matrix;
        const worldMatrix = new Matrix4(viewMatrix).multiplyRight(modelMatrix);
        const worldInverse = worldMatrix.invert();
        const worldInverseTranspose = worldInverse.transpose();
        return {
            viewMatrix,
            modelMatrix,
            objectMatrix: modelMatrix,
            worldMatrix,
            worldInverseMatrix: worldInverse,
            worldInverseTransposeMatrix: worldInverseTranspose
        };
    }
    // TODO - copied code, not yet vetted
    /*
    transform() {
      if (!this.parent) {
        this.endPosition.set(this.position);
        this.endRotation.set(this.rotation);
        this.endScale.set(this.scale);
      } else {
        const parent = this.parent;
        this.endPosition.set(this.position.add(parent.endPosition));
        this.endRotation.set(this.rotation.add(parent.endRotation));
        this.endScale.set(this.scale.add(parent.endScale));
      }
  
      const ch = this.children;
      for (let i = 0; i < ch.length; ++i) {
        ch[i].transform();
      }
  
      return this;
    }
    */
    _setScenegraphNodeProps(props) {
        // if ('display' in props) {
        //   this.display = props.display;
        // }
        if (props?.position) {
            this.setPosition(props.position);
        }
        if (props?.rotation) {
            this.setRotation(props.rotation);
        }
        if (props?.scale) {
            this.setScale(props.scale);
        }
        this.updateMatrix();
        // Matrix overwrites other props
        if (props?.matrix) {
            this.setMatrix(props.matrix);
        }
        Object.assign(this.props, props);
    }
}
