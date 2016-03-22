import Object3D from './object-3d';
import {uid} from '../utils';
import assert from 'assert';

export default class Group extends Object3D {
  constructor({children = [], ...opts}) {
    children.every(child => assert(child instanceof Object3D));
    super(...opts);
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
  }

  remove(child) {
    const children = this.children;
    const indexOf = children.indexOf(child);
    if (indexOf > -1) {
      children.splice(indexOf, 1);
    }
  }

  removeAll() {
    this.children = [];
  }

  traverse({matrix, visitor}) {
    for (const child of this.children) {
      if (child instanceof Group) {
        child.traverse({matrix, visitor});
      }
    }
  }
}
