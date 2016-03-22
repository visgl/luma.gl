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

  update() {
    const pos = this.position;
    const rot = this.rotation;
    const scale = this.scale;

    this.matrix.id();
    this.matrix.$translate(pos.x, pos.y, pos.z);
    this.matrix.$rotateXYZ(rot.x, rot.y, rot.z);
    this.matrix.$scale(scale.x, scale.y, scale.z);
  }

  getCoordinateUniforms(viewMatrix) {
    assert(viewMatrix instanceof Mat4);
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
      var parent = this.parent;
      this.endPosition.setVec3(this.position.add(parent.endPosition));
      this.endRotation.setVec3(this.rotation.add(parent.endRotation));
      this.endScale.setVec3(this.scale.add(parent.endScale));
    }

    for (var i = 0, ch = this.children, l = ch.length; i < l; ++i) {
      ch[i].transform();
    }
  }
}
