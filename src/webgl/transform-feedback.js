import GL from '../constants';
import Resource from './resource';
import {isWebGL2, assertWebGL2Context} from '../webgl-utils';
import {log} from '../utils';

export default class TransformFeedback extends Resource {

  static isSupported(gl) {
    return isWebGL2(gl);
  }

  /**
   * @class
   * @param {WebGL2RenderingContext} gl - context
   * @param {Object} opts - options
   */
  constructor(gl, opts = {}) {
    assertWebGL2Context(gl);
    super(gl, opts);

    this.configuration = null;
    this.buffers = {};
    this.unused = {};
    this._bound = false;

    Object.seal(this);

    this.initialize(opts);
  }

  initialize(props) {
    this.configuration = props.configuration || (props.program && props.program.getConfiguration());
    this.reset();
    this.setProps(props);
  }

  setProps(props) {
    if ('buffers' in props) {
      this.setBuffers(props.buffers);
    }
  }

  reset() {
    this.buffers = {};
    this.unused = [];

    // Unbind any currently bound buffers
    this.bind(() => {
      for (const bufferIndex in this.buffers) {
        this.gl.bindBufferBase(GL.TRANSFORM_FEEDBACK_BUFFER, Number(bufferIndex), null);
      }
    });
    return this;
  }

  setBuffers(buffers = {}) {
    this.bind(() => {
      for (const bufferName in buffers) {
        this.setBuffer(bufferName, buffers[bufferName]);
      }
    });
    return this;
  }

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

  setBuffer(locationOrName, buffer, size, offset = 0) {
    const location = this._getVaryingIndex(locationOrName);
    if (location < 0) {
      this.unused[locationOrName] = buffer;
      log.warn(() => `${this.id} unused varying buffer ${locationOrName}`)();
      return this;
    }

    this.buffers[location] = buffer;

    // Can't bind the buffer now
    // const handle = buffer && buffer.handle;
    // this.bind(() => {
    //   if (!handle || size === undefined) {
    //     this.gl.bindBufferBase(GL.TRANSFORM_FEEDBACK_BUFFER, location, handle);
    //   } else {
    //     this.gl.bindBufferRange(GL.TRANSFORM_FEEDBACK_BUFFER, location, handle, offset, size);
    //   }
    // });

    return this;
  }

  // TODO: Activation is tightly coupled to the current program. Since we try to encapsulate
  // program.use, should we move these methods (begin/pause/resume/end) to the Program?
  begin(primitiveMode) {
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
    // Need to avoid chrome bug where buffer that is already bound to a different target
    // cannot be bound to 'TRANSFORM_FEEDBACK_BUFFER' target.
    this._bindBuffers();
    this.gl.beginTransformFeedback(primitiveMode);
    return this;
  }

  pause() {
    this.gl.pauseTransformFeedback();
    this._unbindBuffers();
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, null);
    return this;
  }

  resume() {
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
    this._bindBuffers();
    this.gl.resumeTransformFeedback();
    return this;
  }

  end() {
    this.gl.endTransformFeedback();
    // Need to avoid chrome bug where buffer that is already bound to a different target
    // cannot be bound to 'TRANSFORM_FEEDBACK_BUFFER' target.
    this._unbindBuffers();
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, null);
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

  _getVaryingInfo(locationOrName) {
    return this.configuration && this.configuration.getVaryingInfo(locationOrName);
  }

  _getVaryingIndex(locationOrName) {
    if (this.configuration) {
      return this.configuration.getVaryingInfo(locationOrName).location;
    }
    const location = Number(locationOrName);
    if (Number.isFinite(location)) {
      return location;
    }
    return -1;
  }

  _bindBuffers() {
    for (const bufferIndex in this.buffers) {
      this._bindBuffer(bufferIndex, this.buffers[bufferIndex]);
    }
  }

  _unbindBuffers() {
    for (const bufferIndex in this.buffers) {
      this._bindBuffer(bufferIndex, null);
    }
  }

  _bindBuffer(index, buffer, offset = 0, size) {
    const handle = buffer && buffer.handle;
    if (!handle || size === undefined) {
      this.gl.bindBufferBase(GL.TRANSFORM_FEEDBACK_BUFFER, index, handle);
    } else {
      this.gl.bindBufferRange(GL.TRANSFORM_FEEDBACK_BUFFER, index, handle, offset, size);
    }
    return this;
  }

  // RESOURCE METHODS

  _createHandle() {
    return this.gl.createTransformFeedback();
  }

  _deleteHandle() {
    this.gl.deleteTransformFeedback(this.handle);
  }
}
