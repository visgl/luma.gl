// import assert from '../utils/assert';

export default class Mesh {
  constructor(opts = {}) {
    opts = Array.isArray(opts) ? {primitives: opts} : opts;
    const {primitives = []} = opts;
    // primitives.every(primitive => assert(primitive instanceof Model));
    // super(opts);
    this.primitives = primitives;
  }

  add(...primitives) {
    for (const primitive of primitives) {
      if (Array.isArray(primitive)) {
        this.add(...primitive);
      } else {
        // assert(primitive instanceof Model);
        this.primitives.push(primitive);
      }
    }
    return this;
  }

  remove(primitive) {
    const indexOf = this.primitives.indexOf(primitive);
    if (indexOf > -1) {
      this.primitives.splice(indexOf, 1);
    }
    return this;
  }

  removeAll() {
    this.primitives = [];
    return this;
  }
}
