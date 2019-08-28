import {isWebGL2, Buffer} from '@luma.gl/webgl';
import {isObjectEmpty, assert} from '../../utils';
import BufferTransformBinding from './buffer-transform-binding';

export default class BufferTransform {
  constructor(gl, props = {}) {
    this.gl = gl;
    this.currentIndex = 0;
    this.feedbackMap = null;
    this.varyings = null; // varyings array
    this.bindings = [];

    this.resources = {}; // resources to be deleted

    this.initialize(props);
    Object.seal(this);
  }

  setupResources(opts) {
    for (const binding of this.bindings) {
      binding.setupTransformFeedback(opts);
    }
  }

  getModelProps(props = {}) {
    const {varyings} = this;
    return Object.assign({}, props, {varyings});
  }

  getDrawOptions(opts = {}) {
    const binding = this.bindings[this.currentIndex];
    const {sourceBuffers, transformFeedback} = binding;
    const attributes = Object.assign({}, sourceBuffers, opts.attributes);

    return {attributes, transformFeedback};
  }

  swap() {
    if (this.feedbackMap) {
      this.currentIndex = (this.currentIndex + 1) % 2;
      return true;
    }
    return false;
  }

  // update source and/or feedbackBuffers
  update(opts = {}) {
    const {sourceBuffers = null} = opts;
    if (sourceBuffers || opts.feedbackBuffers) {
      const feedbackBuffers = this.getFeedbackBuffers(opts);
      this.updateBindings({sourceBuffers, feedbackBuffers});
    }
  }

  // returns current feedbackBuffer of given name
  getBuffer(varyingName = null) {
    const {feedbackBuffers} = this.bindings[this.currentIndex];
    const bufferOrParams = varyingName ? feedbackBuffers[varyingName] : null;
    if (!bufferOrParams) {
      return null;
    }
    return bufferOrParams instanceof Buffer ? bufferOrParams : bufferOrParams.buffer;
  }

  getData({varyingName = null} = {}) {
    const buffer = this.getBuffer(varyingName);
    if (buffer) {
      return buffer.getData();
    }
    return null;
  }

  // Delete owned resources.
  delete() {
    for (const name in this.resources) {
      this.resources[name].delete();
    }
  }

  // Private

  initialize(props = {}) {
    const {sourceBuffers, feedbackMap} = props;
    this.feedbackMap = feedbackMap;
    const feedbackBuffers = this.getFeedbackBuffers(props);
    if (!isObjectEmpty(props.feedbackBuffers)) {
      // if writting to buffers make sure it is WebGL2
      assert(isWebGL2(this.gl));
    }
    this.varyings = props.varyings || Object.keys(feedbackBuffers);
    this.updateBindings({sourceBuffers, feedbackBuffers});
    // TODO: setup this.varyings
  }

  // auto create feedback buffers if requested
  getFeedbackBuffers(props) {
    const {sourceBuffers} = props;
    const feedbackBuffers = {};
    if (this.feedbackMap) {
      // feedbackMap is defined as sourceBuffer as key and feedbackBuffer name as object
      for (const sourceName in this.feedbackMap) {
        const feedbackName = this.feedbackMap[sourceName];
        feedbackBuffers[feedbackName] = sourceName;
      }
    }
    Object.assign(feedbackBuffers, props.feedbackBuffers);
    for (const bufferName in feedbackBuffers) {
      const bufferOrRef = feedbackBuffers[bufferName];
      if (typeof bufferOrRef === 'string' && sourceBuffers[bufferOrRef]) {
        // Create new buffer with same layout and settings as source buffer
        const sourceBuffer = sourceBuffers[bufferOrRef];
        const {byteLength, usage, accessor} = sourceBuffer;
        feedbackBuffers[bufferName] = this.createNewBuffer(bufferName, {
          byteLength,
          usage,
          accessor
        });
      }
    }

    return feedbackBuffers;
  }

  updateBindings(opts) {
    this.bindings[this.currentIndex] = this.updateBinding(this.bindings[this.currentIndex], opts);
    if (this.feedbackMap) {
      const {sourceBuffers, feedbackBuffers} = this.swapBuffers(
        this.bindings[this.currentIndex].getBuffers()
      );
      const nextIndex = this.getNextIndex();
      this.bindings[nextIndex] = this.updateBinding(this.bindings[nextIndex], {
        sourceBuffers,
        feedbackBuffers
      });
    }
  }

  updateBinding(binding, opts) {
    if (!binding) {
      return new BufferTransformBinding(this.gl, opts);
    }
    binding.setProps(opts);
    return binding;
  }

  swapBuffers(opts) {
    if (!this.feedbackMap) {
      return null;
    }
    const sourceBuffers = Object.assign({}, opts.sourceBuffers);
    const feedbackBuffers = Object.assign({}, opts.feedbackBuffers);
    for (const srcName in this.feedbackMap) {
      const dstName = this.feedbackMap[srcName];
      sourceBuffers[srcName] = opts.feedbackBuffers[dstName];
      feedbackBuffers[dstName] = opts.sourceBuffers[srcName];

      // make sure the new destination buffer is a Buffer object
      assert(feedbackBuffers[dstName] instanceof Buffer);
    }
    return {sourceBuffers, feedbackBuffers};
  }

  // Create a buffer and add to list of buffers to be deleted.
  createNewBuffer(name, opts) {
    const buffer = new Buffer(this.gl, opts);
    if (this.resources[name]) {
      this.resources[name].delete();
    }
    this.resources[name] = buffer;
    return buffer;
  }

  getNextIndex() {
    return (this.currentIndex + 1) % 2;
  }
}
