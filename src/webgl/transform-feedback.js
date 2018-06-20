import GL from '../constants';
import Resource from './resource';
import {isWebGL2, assertWebGL2Context} from '../webgl-utils';
import {log} from '../utils';
import assert from '../utils/assert';

export default class TransformFeedback extends Resource {

  static isSupported(gl) {
    return isWebGL2(gl);
  }

  constructor(gl, opts = {}) {
    assertWebGL2Context(gl);
    super(gl, opts);

    this._bound = false;

    this.initialize(opts);

    Object.seal(this);
  }

  setProps(props) {
    if ('buffers' in props) {
      this.setBuffers(props.buffers);
    }
  }

  initialize(props) {
    this.configuration = props.configuration || (props.program && props.program.getConfiguration());
    this.reset();
    this.setProps(props);
  }

  reset() {
    this._unbindBuffers();
    this.buffers = {};
    this.unused = [];
    return this;
  }

  setBuffers(buffers = {}) {
    const varyingMap = this.configuration ? this.configuration.varyingMap : {};
    for (const bufferName in buffers) {
      const buffer = buffers[bufferName];
      const index = Number.isFinite(Number(bufferName)) ?
        Number(bufferName) : varyingMap[bufferName];
      assert(Number.isFinite(index));
      this.buffers[index] = buffer;
    }
  }

  // TODO: Activation is tightly coupled to the current program. Since we try to encapsulate
  // program.use, should we move these methods (begin/pause/resume/end) to the Program?
  begin(primitiveMode) {
    this._bindBuffers();
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
    this.gl.beginTransformFeedback(primitiveMode);
    return this;
  }

  pause() {
    this.gl.pauseTransformFeedback();
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, null);
    this._unbindBuffers();
    return this;
  }

  resume() {
    this._bindBuffers();
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
    this.gl.resumeTransformFeedback();
    return this;
  }

  end() {
    this.gl.endTransformFeedback();
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, null);
    this._unbindBuffers();
    return this;
  }

  bindBuffer(locationOrName, buffer, size, offset = 0) {
    const location = this._getVaryingIndex(locationOrName);
    if (location < 0) {
      this.unused[locationOrName] = buffer;
      log.warn(() => `${this.id} unused varying buffer ${locationOrName}`)();
      return this;
    }

    this.buffers[location] = buffer;
    const handle = buffer && buffer.handle;

    this.bind(() => {
      if (size === undefined) {
        this.gl.bindBufferBase(GL.TRANSFORM_FEEDBACK_BUFFER, location, handle);
      } else {
        this.gl.bindBufferRange(GL.TRANSFORM_FEEDBACK_BUFFER, location, handle, offset, size);
      }
    });

    return this;
  }

  bind(funcOrHandle = this.handle) {
    if (typeof funcOrHandle !== 'function') {
      this.bindTransformFeedback(funcOrHandle);
      return this;
    }

    let value;

    if (!this._bound) {
      this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
      this._bound = true;

      value = funcOrHandle();

      this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, null);
      this._bound = false;
    } else {
      value = funcOrHandle();
    }

    return value;
  }

  // PRIVATE METHODS

  // See https://github.com/KhronosGroup/WebGL/issues/2346
  // If it was true that having a buffer on an unused TF was a problem
  // it would make the entire concept of transform feedback objects pointless.
  // The whole point of them is like VertexArrayObjects.
  // You set them up with all in outputs at init time and
  // then in one call you can setup all the outputs just before drawing.
  // Since the point of transform feedback is to generate data that will
  // then be used as inputs to attributes it makes zero sense you'd
  // have to unbind them from every unused transform feedback object
  // before you could use them in an attribute. If that was the case
  // there would be no reason to setup transform feedback objects ever.
  // You'd always use the default because you'd always have to bind and
  // unbind all the buffers.
  _bindBuffers() {
    // Can't bind here, supposed to be called on active feedback
    for (const bufferIndex in this.buffers) {
      this.bindBuffer(Number(bufferIndex), this.buffers[bufferIndex]);
    }
  }

  _unbindBuffers() {
    // Can't bind here, supposed to be called on active feedback
    for (const bufferIndex in this.buffers) {
      // this.bindBuffer(Number(bufferIndex), null);
      this.gl.bindBufferBase(GL.TRANSFORM_FEEDBACK_BUFFER, Number(bufferIndex), null);
    }
  }

  // Resolve a varying name or number to a location index
  _getVaryingIndex(locationOrName) {
    if (this.configuration) {
      return this.configuration.getVaryingIndex(locationOrName);
    }
    return -1;
  }

  // RESOURCE METHODS

  _createHandle() {
    return this.gl.createTransformFeedback();
  }

  _deleteHandle() {
    this.gl.deleteTransformFeedback(this.handle);
  }

  // DEPRECATED / REMOVED

  bindBuffers() {
    log.removed('TransformFeedback.bindBuffers', 'TransformFeedback.setBuffers');
  }
}
