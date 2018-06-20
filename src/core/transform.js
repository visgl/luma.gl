import GL from '../constants';
import Model from './model';
import Buffer from '../webgl/buffer';
import TransformFeedback from '../webgl/transform-feedback';
import {isWebGL2, assertWebGL2Context} from '../webgl-utils';
import assert from '../utils/assert';
import {log} from '../utils';

const PASS_THROUGH_FS = `\
void main()
{
}
`;

export default class Transform {

  static isSupported(gl) {
    // For now WebGL2 only
    return isWebGL2(gl);
  }

  constructor(gl, opts = {}) {
    assertWebGL2Context(gl);

    this.gl = gl;
    this.model = null;
    this._swapBuffers = false;
    this.currentIndex = 0;
    this.sourceBuffers = new Array(2);
    this.feedbackBuffers = new Array(2);
    this.transformFeedbacks = new Array(2);
    this._buffersToDelete = [];

    this._initialize(opts);
    Object.seal(this);
  }

  // Delete owned resources.
  delete() {
    for (const buffer of this._buffersToDelete) {
      buffer.delete();
    }
    this.model.delete();
  }

  get elementCount() {
    return this.model.getVertexCount();
  }

  // Return Buffer object for given varying name.
  getBuffer(varyingName = null) {
    const {feedbackBuffers, currentIndex} = this;
    assert(varyingName && feedbackBuffers[currentIndex][varyingName]);
    return feedbackBuffers[currentIndex][varyingName];
  }

  // Run one transformfeedback loop.
  run({uniforms = {}} = {}) {
    const {model, transformFeedbacks, sourceBuffers, currentIndex} = this;
    model.setAttributes(sourceBuffers[currentIndex]);
    model.draw({
      transformFeedback: transformFeedbacks[currentIndex],
      parameters: {[GL.RASTERIZER_DISCARD]: true},
      uniforms
    });
  }

  // Swap source and destination buffers.
  swapBuffers() {
    assert(this._swapBuffers);
    this.currentIndex = (this.currentIndex + 1) % 2;
  }

  // Update some or all buffer bindings.
  update({
    sourceBuffers = null,
    feedbackBuffers = null,
    elementCount = this.elementCount
  }) {
    if (!sourceBuffers && !feedbackBuffers) {
      log.warn('Transform : no buffers updated')();
      return this;
    }

    this.model.setVertexCount(elementCount);

    const {currentIndex, varyingMap, _swapBuffers, transformFeedbacks} = this;
    for (const bufferName in feedbackBuffers) {
      assert(feedbackBuffers[bufferName] instanceof Buffer);
    }
    Object.assign(this.sourceBuffers[currentIndex], sourceBuffers);
    Object.assign(this.feedbackBuffers[currentIndex], feedbackBuffers);
    transformFeedbacks[currentIndex].bindBuffers(
      this.feedbackBuffers[currentIndex], {varyingMap});

    if (_swapBuffers) {
      const nextIndex = (currentIndex + 1) % 2;

      for (const sourceBufferName in this.sourceDestinationMap) {
        const feedbackBufferName = this.sourceDestinationMap[sourceBufferName];
        this.sourceBuffers[nextIndex][sourceBufferName] =
          this.feedbackBuffers[currentIndex][feedbackBufferName];
        this.feedbackBuffers[nextIndex][feedbackBufferName] =
          this.sourceBuffers[currentIndex][sourceBufferName];
        // make sure the new destination buffer is a Buffer object
        assert(this.feedbackBuffers[nextIndex][feedbackBufferName] instanceof Buffer);
      }

      transformFeedbacks[nextIndex].bindBuffers(this.feedbackBuffers[nextIndex], {varyingMap});
    }
    return this;
  }

  // Private

  _initialize({
    // Program parameters
    vs,
    varyings,
    drawMode = GL.POINTS,
    elementCount,

    // buffers
    sourceBuffers,
    feedbackBuffers = null,
    sourceDestinationMap = null,

    destinationBuffers
  }) {
    if (destinationBuffers) {
      log.removed('destinationBuffers', 'feedbackBuffers');
    }
    assert(sourceBuffers && vs && Array.isArray(varyings) && elementCount >= 0);

    // If feedbackBuffers are not provided, sourceDestinationMap must be provided
    // to create destinaitonBuffers with layout of corresponding source buffer.
    assert(feedbackBuffers || sourceDestinationMap);

    if (sourceDestinationMap) {
      this.sourceDestinationMap = sourceDestinationMap;
      this._swapBuffers = true;
    }

    let index = 0;
    this.varyings = [];
    this.varyingMap = {};
    for (const varying of varyings) {
      this.varyings[index] = varying;
      this.varyingMap[varying] = index;
      index++;
    }

    this._bindBuffers({sourceBuffers, feedbackBuffers});
    this._buildModel({vs, drawMode, elementCount});
  }

  // build source and destination buffers
  _bindBuffers({sourceBuffers = null, feedbackBuffers = null}) {
    const {_swapBuffers} = this;
    for (const bufferName in feedbackBuffers) {
      assert(feedbackBuffers[bufferName] instanceof Buffer);
    }
    this.sourceBuffers[0] = Object.assign({}, sourceBuffers);
    this.feedbackBuffers[0] = Object.assign({}, feedbackBuffers);

    if (_swapBuffers) {
      this.sourceBuffers[1] = {};
      this.feedbackBuffers[1] = {};

      for (const sourceBufferName in this.sourceDestinationMap) {
        const feedbackBufferName = this.sourceDestinationMap[sourceBufferName];
        if (!this.feedbackBuffers[0][feedbackBufferName]) {
          // Create new buffer with same layout and settings as source buffer
          const sourceBuffer = this.sourceBuffers[0][sourceBufferName];
          const {bytes, type, usage, layout} = sourceBuffer;
          this.feedbackBuffers[0][feedbackBufferName] =
            new Buffer(this.gl, {bytes, type, usage, layout});
          this._buffersToDelete.push(this.feedbackBuffers[0][feedbackBufferName]);
        }

        this.sourceBuffers[1][sourceBufferName] = this.feedbackBuffers[0][feedbackBufferName];
        this.feedbackBuffers[1][feedbackBufferName] = this.sourceBuffers[0][sourceBufferName];
        // make sure the new destination buffer is a Buffer object
        assert(this.feedbackBuffers[1][feedbackBufferName] instanceof Buffer);
      }
    }
  }

  // build Model and TransformFeedback objects
  _buildModel({vs, drawMode, elementCount}) {
    // Append matching version string to the fragment shader to ensure compilation succeeds
    // TODO - is this still needed now that we have shader transpilatio?
    let fs = PASS_THROUGH_FS;
    if (vs.indexOf('#version ') === 0) {
      const vsLines = vs.split('\n');
      fs = `${vsLines[0]}\n${PASS_THROUGH_FS}`;
    }

    const {varyings} = this;
    this.model = new Model(this.gl, {vs, fs, varyings, drawMode, vertexCount: elementCount});

    this.transformFeedbacks[0] = new TransformFeedback(this.gl, {
      buffers: this.feedbackBuffers[0],
      varyingMap: this.varyingMap
    });

    if (this._swapBuffers) {
      this.transformFeedbacks[1] = new TransformFeedback(this.gl, {
        buffers: this.feedbackBuffers[1],
        varyingMap: this.varyingMap
      });
    }
  }
}
