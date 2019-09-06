import {TransformFeedback} from '@luma.gl/webgl';

// swapping of two instances, instead of maintaing two arra
export default class BufferTransformBinding {
  constructor(gl, props = {}) {
    this.gl = gl;

    // shader attribute name to Buffer mapping
    this.sourceBuffers = {};

    // shader varying name to Buffer mapping
    this.feedbackBuffers = {};

    this.transformFeedback = null;

    this.setProps(props);
  }

  setProps(props) {
    const {sourceBuffers, feedbackBuffers} = props;
    this.sourceBuffers = Object.assign(this.sourceBuffers, sourceBuffers);
    this.feedbackBuffers = Object.assign(this.feedbackBuffers, feedbackBuffers);
    if (this.transformFeedback) {
      this.transformFeedback.setBuffers(this.feedbackBuffers);
    }
  }

  // setup TransformFeedback objects to capture the results
  setupTransformFeedback({model}) {
    const {program} = model;
    this.transformFeedback = new TransformFeedback(this.gl, {
      program,
      buffers: this.feedbackBuffers
    });
  }

  // return currently bound buffers
  getBuffers() {
    const {sourceBuffers, feedbackBuffers} = this;
    return {sourceBuffers, feedbackBuffers};
  }
}
