import GL from '../../webgl/gl-constants';
import Buffer from '../../webgl/buffer';
import TransformFeedback from '../../webgl/transform-feedback';
import Model from '../model';
import {isWebGL2, assertWebGL2Context} from '../../webgl/context';
import assert from 'assert';
import {log} from '../../utils';

const PASS_THROUGH_FS = `\
void main()
{
}`;

export default class Transform {

  static isSupported(gl) {
    // For now WebGL2 only
    return isWebGL2(gl);
  }

  constructor(gl, opts = {}) {
    assertWebGL2Context(gl);

    this.gl = gl;
    this.model = null;
    this._buffersSwapable = false;
    this.currentIndex = 0;
    this.sourceBuffers = new Array(2);
    this.destinationBuffers = new Array(2);
    this.transformFeedbacks = new Array(2);
    this._buffersToDelete = [];
    this.elementCount = 0;

    this.initialize(opts);
    Object.seal(this);
  }

  initialize({
    sourceBuffers = null,
    destinationBuffers = null,
    vs = null,
    sourceDestinationMap = null,
    varyings = null,
    drawMode = GL.POINTS,
    elementCount = null
  }) {
    assert(sourceBuffers && vs && varyings && elementCount);

    // If destinationBuffers are not provided, sourceDestinationMap must be provided
    // to create destinaitonBuffers with layout of corresponding source buffer.
    assert(destinationBuffers || sourceDestinationMap);

    if (sourceDestinationMap) {
      this.sourceDestinationMap = sourceDestinationMap;
      this._buffersSwapable = true;
    }

    let index = 0;
    this.varyings = [];
    this.varyingMap = {};
    for (const varying of varyings) {
      this.varyings[index] = varying;
      this.varyingMap[varying] = index;
      index++;
    }

    this._bindBuffers({sourceBuffers, destinationBuffers});
    this._buildModel({vs, drawMode, elementCount});
  }

  // Update some or all buffer bindings.
  updateBuffers({
    sourceBuffers = null,
    destinationBuffers = null
  }) {
    if (!sourceBuffers && !destinationBuffers) {
      log.warn('Transform : no buffers to updated');
    }
    const {currentIndex, varyingMap, _buffersSwapable, transformFeedbacks} = this;

    for (const bufferName in sourceBuffers) {
      assert(sourceBuffers[bufferName] instanceof Buffer);
      this.sourceBuffers[currentIndex][bufferName] = sourceBuffers[bufferName];
    }
    for (const bufferName in destinationBuffers) {
      assert(destinationBuffers[bufferName] instanceof Buffer);
      this.destinationBuffers[currentIndex][bufferName] = destinationBuffers[bufferName];
    }
    transformFeedbacks[currentIndex].bindBuffers(
      this.destinationBuffers[currentIndex], {varyingMap}
    );

    if (_buffersSwapable) {
      const nextIndex = (currentIndex + 1) % 2;

      for (const sourceBufferName in this.sourceDestinationMap) {
        const destinationBufferName = this.sourceDestinationMap[sourceBufferName];
        this.sourceBuffers[nextIndex][sourceBufferName] =
          this.destinationBuffers[currentIndex][destinationBufferName];
        this.destinationBuffers[nextIndex][destinationBufferName] =
          this.sourceBuffers[currentIndex][sourceBufferName];
      }
      transformFeedbacks[nextIndex].bindBuffers(
        this.destinationBuffers[nextIndex], {varyingMap}
      );
    }

  }
  // Delete owned resources.
  delete() {
    for (const buffer of this._buffersToDelete) {
      buffer.delete();
    }
    this.model.delete();
  }

  // Run one transformfeedback loop.
  run({uniforms = {}} = {}) {
    this.model.setAttributes(this.sourceBuffers[this.currentIndex]);
    this.model.draw({
      transformFeedback: this.transformFeedbacks[this.currentIndex],
      uniforms,
      parameters: {
        [GL.RASTERIZER_DISCARD]: true
      }
    });
  }

  // Swap source and destination buffers.
  swapBuffers() {
    assert(this._buffersSwapable);
    this.currentIndex = (this.currentIndex + 1) % 2;
  }

  // Return Buffer object for given varying name.
  getBuffer(varyingName = null) {
    assert(varyingName && this.destinationBuffers[this.currentIndex][varyingName]);
    return this.destinationBuffers[this.currentIndex][varyingName];
  }

  // Private
  // build source and destination buffers
  _bindBuffers({
    sourceBuffers = null,
    destinationBuffers = null,
    clear = false
  }) {
    const {_buffersSwapable} = this;
    this.sourceBuffers[0] = {};
    for (const bufferName in sourceBuffers) {
      assert(sourceBuffers[bufferName] instanceof Buffer);
      this.sourceBuffers[0][bufferName] = sourceBuffers[bufferName];
    }
    this.destinationBuffers[0] = {};
    for (const bufferName in destinationBuffers) {
      assert(destinationBuffers[bufferName] instanceof Buffer);
      this.destinationBuffers[0][bufferName] = destinationBuffers[bufferName];
    }

    if (_buffersSwapable) {
      this.sourceBuffers[1] = {};
      this.destinationBuffers[1] = {};

      for (const sourceBufferName in this.sourceDestinationMap) {
        const destinationBufferName = this.sourceDestinationMap[sourceBufferName];
        if (!this.destinationBuffers[0][destinationBufferName]) {
          // Create new buffer with same layout and settings as source buffer
          const sourceBuffer = this.sourceBuffers[0][sourceBufferName];
          const {bytes, type, usage, layout} = sourceBuffer;
          this.destinationBuffers[0][destinationBufferName] =
            new Buffer(this.gl, {bytes, type, usage, layout});
          this._buffersToDelete.push(this.destinationBuffers[0][destinationBufferName]);
        }

        this.sourceBuffers[1][sourceBufferName] =
          this.destinationBuffers[0][destinationBufferName];
        this.destinationBuffers[1][destinationBufferName] =
          this.sourceBuffers[0][sourceBufferName];
      }
    }

    return this;
  }

  // build Model and TransformFeedback objects
  _buildModel({
    vs, drawMode, elementCount
  }) {
    const {varyings, varyingMap, _buffersSwapable} = this;

    // Append matching version string to FS.
    let fs = PASS_THROUGH_FS;
    const vsLines = vs.split('\n');
    if (vsLines[0].indexOf('#version ') === 0) {
      fs = `\
${vsLines[0]}
${PASS_THROUGH_FS}
`;
    }

    this.model = new Model(this.gl, {
      vs,
      fs,
      varyings,
      drawMode,
      vertexCount: elementCount
    });
    this.transformFeedbacks[0] = new TransformFeedback(this.gl, {
      buffers: this.destinationBuffers[0],
      varyingMap
    });
    if (_buffersSwapable) {
      this.transformFeedbacks[1] = new TransformFeedback(this.gl, {
        buffers: this.destinationBuffers[1],
        varyingMap: this.varyingMap
      });
    }
  }
}
