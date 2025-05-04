// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Vector3, Matrix4, NumericArray} from '@math.gl/core';
import {uid} from '../utils/uid';

function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/** Properties for creating a new Scenegraph */
export type ScenegraphNodeProps = {
  id?: string;
  /** whether to display the object at all */
  display?: boolean;
  matrix?: NumericArray;
  position?: NumericArray;
  rotation?: NumericArray;
  scale?: NumericArray;
  update?: boolean;
};

export class ScenegraphNode {
  readonly id: string;
  matrix: Matrix4 = new Matrix4();

  display = true;
  position = new Vector3();
  rotation = new Vector3();
  scale = new Vector3(1, 1, 1);
  userData: Record<string, unknown> = {};

  props: ScenegraphNodeProps = {};

  constructor(props: ScenegraphNodeProps = {}) {
    const {id} = props;

    this.id = id || uid(this.constructor.name);

    this._setScenegraphNodeProps(props);
  }

  getBounds(): [number[], number[]] | null {
    return null;
  }

  destroy(): void {}

  /** @deprecated use .destroy() */
  delete(): void {
    this.destroy();
  }
  setProps(props: ScenegraphNodeProps): this {
    this._setScenegraphNodeProps(props);
    return this;
  }

  toString(): string {
    return `{type: ScenegraphNode, id: ${this.id})}`;
  }

  setPosition(position: any): this {
    assert(position.length === 3, 'setPosition requires vector argument');
    this.position = position;
    return this;
  }

  setRotation(rotation: any): this {
    assert(rotation.length === 3 || rotation.length === 4, 'setRotation requires vector argument');
    this.rotation = rotation;
    return this;
  }

  setScale(scale: any): this {
    assert(scale.length === 3, 'setScale requires vector argument');
    this.scale = scale;
    return this;
  }

  setMatrix(matrix: any, copyMatrix: boolean = true): void {
    if (copyMatrix) {
      this.matrix.copy(matrix);
    } else {
      this.matrix = matrix;
    }
  }

  setMatrixComponents(components: {
    position?: any;
    rotation?: any;
    scale?: any;
    update?: boolean;
  }): this {
    const {position, rotation, scale, update = true} = components;
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

  updateMatrix(): this {
    this.matrix.identity();
    this.matrix.translate(this.position);
    if (this.rotation.length === 4) {
      const rotationMatrix = new Matrix4().fromQuaternion(this.rotation);
      this.matrix.multiplyRight(rotationMatrix);
    } else {
      this.matrix.rotateXYZ(this.rotation);
    }
    this.matrix.scale(this.scale);

    return this;
  }

  update({position, rotation, scale}: {position?: any; rotation?: any; scale?: any} = {}): this {
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

  getCoordinateUniforms(
    viewMatrix: any,
    modelMatrix?: any
  ): {
    viewMatrix: any;
    modelMatrix: any;
    objectMatrix: any;
    worldMatrix: any;
    worldInverseMatrix: any;
    worldInverseTransposeMatrix: any;
  } {
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

  _setScenegraphNodeProps(props: ScenegraphNodeProps): void {
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
