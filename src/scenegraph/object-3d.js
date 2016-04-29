import {Vec3, Mat4} from '../math';
import assert from 'assert';
import {uid} from '../utils';

export default class Object3D {

  constructor({id, display = true}) {
    // model position, rotation, scale and all in all matrix
    this.position = new Vec3();
    this.rotation = new Vec3();
    this.scale = new Vec3(1, 1, 1);
    this.matrix = new Mat4();

    // whether to display the object at all
    this.id = id || uid();
    this.display = true;
    this.userData = {};
  }

  setPosition(position, y, z) {
    if (!(position instanceof Vec3)) {
      position = new Vec3(position, y, z);
    }
    this.position = position;
    return this;
  }

  setRotation(rotation, y, z) {
    if (!(rotation instanceof Vec3)) {
      rotation = new Vec3(rotation, y, z);
    }
    this.rotation = rotation;
    return this;
  }

  setScale(scale, y, z) {
    if (!(scale instanceof Vec3)) {
      scale = new Vec3(scale, y, z);
    }
    this.scale = scale;
    return this;
  }

  setMatrixComponents({position, rotation, scale}) {
    if (position) {
      assert(position instanceof Vec3, 'position must be Vec3');
      this.position = position;
    }
    if (rotation) {
      assert(rotation instanceof Vec3, 'rotation must be Vec3');
      this.rotation = rotation;
    }
    if (scale) {
      assert(scale instanceof Vec3, 'scale must be Vec3');
      this.scale = scale;
    }
    this.updateMatrix();
    return this;
  }

  updateMatrix() {
    const pos = this.position;
    const rot = this.rotation;
    const scale = this.scale;

    this.matrix.id();
    this.matrix.$translate(pos.x, pos.y, pos.z);
    this.matrix.$rotateXYZ(rot.x, rot.y, rot.z);
    this.matrix.$scale(scale.x, scale.y, scale.z);
    return this;
  }

  getCoordinateUniforms(viewMatrix) {
    // TODO - solve multiple class problem
    // assert(viewMatrix instanceof Mat4);
    assert(viewMatrix);
    const {matrix} = this;
    const worldMatrix = viewMatrix.mulMat4(matrix);
    const worldInverse = worldMatrix.invert();
    const worldInverseTranspose = worldInverse.transpose();

    return {
      objectMatrix: matrix,
      worldMatrix: worldMatrix,
      worldInverseMatrix: worldInverse,
      worldInverseTransposeMatrix: worldInverseTranspose
    };
  }

  // TODO - copied code, not yet vetted
  transform() {

    if (!this.parent) {
      this.endPosition.setVec3(this.position);
      this.endRotation.setVec3(this.rotation);
      this.endScale.setVec3(this.scale);
    } else {
      const parent = this.parent;
      this.endPosition.setVec3(this.position.add(parent.endPosition));
      this.endRotation.setVec3(this.rotation.add(parent.endRotation));
      this.endScale.setVec3(this.scale.add(parent.endScale));
    }

    const ch = this.children;
    for (let i = 0; i < ch.length; ++i) {
      ch[i].transform();
    }

    return this;
  }
}
