import Object3D from './object-3d';
import {uid} from '../utils';
import assert from 'assert';

export default class Group extends Object3D {
  constructor({children = [], ...opts}) {
    children.every(child => assert(child instanceof Object3D));
    super(opts);
    this.children = children;
  }

  add(...children) {
    for (const child of children) {
      // Generate unique id for child
      child.id = child.id || uid();
      this.children.push(child);
      // Create and load Buffers
      this.defineBuffers(child);
    }
    return this;
  }

  remove(child) {
    const children = this.children;
    const indexOf = children.indexOf(child);
    if (indexOf > -1) {
      children.splice(indexOf, 1);
    }
    return this;
  }

  removeAll() {
    this.children = [];
    return this;
  }

  * traverse({viewMatrix}) {
    for (const child of this.children) {
      const {matrix} = child;
      const worldMatrix = viewMatrix.mulMat4(matrix);
      if (child instanceof Group) {
        yield* child.traverse({matrix, worldMatrix});
      } else {
        if (child.program) {
          child.program.use();
          child.program.setUniforms({worldMatrix});
        }
        yield child;
      }
    }
  }

  * traverseReverse({viewMatrix}) {
    for (let i = this.children.length - 1; i >= 0; --i) {
      const child = this.children[i];
      const {matrix} = child;
      const worldMatrix = viewMatrix.mulMat4(matrix);
      if (child instanceof Group) {
        yield* child.traverseReverse({matrix, worldMatrix});
      } else {
        if (child.program) {
          child.program.use();
          child.program.setUniforms({worldMatrix});
        }
        yield child;
      }
    }
  }
}
