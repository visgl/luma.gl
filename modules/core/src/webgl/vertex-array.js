// VertexArray class

import GL from '../constants';
import Accessor from './accessor';
import Buffer from './buffer';
import VertexArrayObject from './vertex-array-object';
import {log, assert} from '../utils';
import {stubRemovedMethods} from '../utils';

const ERR_ATTRIBUTE_TYPE =
  'VertexArray: attributes must be Buffers or constants (i.e. typed array)';

export default class VertexArray {
  constructor(gl, opts = {}) {
    // Use program's id if program is supplied but no id is supplied
    const id = opts.id || (opts.program && opts.program.id);
    // super(gl, Object.assign({}, opts, {id}));

    this.id = id;
    this.gl = gl;
    this.configuration = null;

    // Extracted information
    this.elements = null;
    this.values = null;
    this.accessors = null;
    this.unused = null;
    this.drawParams = null;
    this.buffer = null; // For attribute 0 on desktops, and created when unbinding buffers

    this.vertexArrayObject = VertexArrayObject.isSupported(gl)
      ? new VertexArrayObject(gl)
      : VertexArrayObject.getDefaultArray(gl);

    // Issue errors when using removed methods
    stubRemovedMethods(this, 'VertexArray', 'v6.0', [
      'setBuffers',
      'setGeneric',
      'clearBindings',
      'setLocations',
      'setGenericValues',
      'setDivisor',
      'enable',
      'disable'
    ]);

    this.initialize(opts);
    Object.seal(this);
  }

  delete() {
    if (this.buffer) {
      this.buffer.delete();
    }
  }

  initialize(props = {}) {
    this.reset();
    this.configuration = null;
    this.bindOnUse = false;
    return this.setProps(props);
  }

  // Resets all attributes (to default valued constants)
  reset() {
    // this.vertexArrayObject.reset();

    this.elements = null;
    const {MAX_ATTRIBUTES} = this.vertexArrayObject;
    this.values = new Array(MAX_ATTRIBUTES).fill(null);
    this.accessors = new Array(MAX_ATTRIBUTES).fill(null);
    this.unused = {};

    // Auto detects draw params
    this.drawParams = null;

    return this;
  }

  setProps(props) {
    if ('program' in props) {
      this.configuration = props.program && props.program.configuration;
    }
    if ('configuration' in props) {
      this.configuration = props.configuration;
    }
    if ('attributes' in props) {
      this.setAttributes(props.attributes);
    }
    if ('elements' in props) {
      this.setElementBuffer(props.elements);
    }
    if ('bindOnUse' in props) {
      props = props.bindOnUse;
    }
    return this;
  }

  // Automatically called if buffers changed through VertexArray API
  clearDrawParams() {
    this.drawParams = null;
  }

  getDrawParams(appParameters) {
    // Auto deduced draw parameters
    this.drawParams = this.drawParams || this._updateDrawParams();

    // Override with any application supplied draw parameters
    return Object.assign({}, this.drawParams, appParameters);
  }

  // Set (bind) an array or map of vertex array buffers, either in numbered or named locations.
  // For names that are not present in `location`, the supplied buffers will be ignored.
  // if a single buffer of type GL.ELEMENT_ARRAY_BUFFER is present, it will be set as elements
  //   Signatures:
  //     {attributeName: buffer}
  //     {attributeName: [buffer, accessor]}
  //     {attributeName: (typed) array} => constant
  setAttributes(attributes) {
    this.vertexArrayObject.bind(() => {
      for (const locationOrName in attributes) {
        const value = attributes[locationOrName];
        if (value instanceof Buffer) {
          //  Signature: attributeName: buffer
          this.setBuffer(locationOrName, value);
        } else if (Array.isArray(value) && value.length && value[0] instanceof Buffer) {
          // Signature: attributeName: [buffer, accessor]
          const buffer = value[0];
          const accessor = value[1];
          this.setBuffer(locationOrName, buffer, accessor);
        } else if (ArrayBuffer.isView(value) || Array.isArray(value)) {
          //  Signature: attributeName: (short) (typed) array => constant
          this.setConstant(locationOrName, value);
        } else {
          throw new Error(ERR_ATTRIBUTE_TYPE);
        }
      }

      // Make sure we don't leave any bindings
      this.gl.bindBuffer(GL.ARRAY_BUFFER, null);
    });

    return this;
  }

  // Set (bind) an elements buffer, for indexed rendering.
  // Must be a Buffer bound to GL.ELEMENT_ARRAY_BUFFER. Constants not supported
  setElementBuffer(elementBuffer = null, accessor = {}) {
    this.elements = elementBuffer; // Save value for debugging
    this.clearDrawParams();

    // Update vertexArray immediately if we have our own array
    if (!this.vertexArrayObject.isDefaultArray) {
      this.vertexArrayObject.setElementBuffer(elementBuffer, accessor);
    }
    return this;
  }

  // Set a location in vertex attributes array to a buffer
  setBuffer(locationOrName, buffer, appAccessor = {}) {
    // Check target
    if (buffer.target === GL.ELEMENT_ARRAY_BUFFER) {
      return this.setElementBuffer(buffer);
    }

    const {location, accessor} = this._resolveLocationAndAccessor(
      locationOrName,
      buffer,
      buffer.accessor,
      appAccessor
    );

    if (location >= 0) {
      this.values[location] = buffer;
      this.accessors[location] = accessor;
      this.clearDrawParams();

      // Update vertexArray immediately if we have our own array
      if (!this.vertexArrayObject.isDefaultArray) {
        this.vertexArrayObject.setBuffer(location, buffer, accessor);
      }
    }

    return this;
  }

  // Set attribute to constant value (small typed array corresponding to one vertex' worth of data)
  setConstant(locationOrName, arrayValue, appAccessor = {}) {
    const {location, accessor} = this._resolveLocationAndAccessor(
      locationOrName,
      arrayValue,
      appAccessor
    );

    if (location >= 0) {
      arrayValue = this.vertexArrayObject._normalizeConstantArrayValue(arrayValue, accessor);

      this.values[location] = arrayValue;
      this.accessors[location] = accessor;
      this.clearDrawParams();

      // Update vertexArray immediately if we have our own array
      // NOTE: We set the actual constant value later on bind. We can't set the value now since
      // constants are global and affect all other VertexArrays that have disabled attributes
      // in the same location.
      // We do disable the attribute which makes it use the global constant value at that location
      if (!this.vertexArrayObject.isDefaultArray) {
        this.vertexArrayObject.enable(location, false);
      }
    }

    return this;
  }

  // Workaround for Chrome TransformFeedback binding issue
  // If required, unbind temporarily to avoid conflicting with TransformFeedback
  unbindBuffers() {
    this.vertexArrayObject.bind(() => {
      if (this.elements) {
        this.setElementBuffer(null);
      }

      // Chrome does not like buffers that are bound to several binding points,
      // so we need to offer and unbind facility
      // WebGL offers disabling, but no clear way to set a VertexArray buffer to `null`
      // So we just bind all the attributes to the dummy "attribute zero" buffer
      this.buffer = this.buffer || new Buffer(this.gl, {size: 4});

      for (let location = 0; location < this.vertexArrayObject.MAX_ATTRIBUTES; location++) {
        if (this.values[location] instanceof Buffer) {
          this.gl.disableVertexAttribArray(location);
          this.gl.bindBuffer(GL.ARRAY_BUFFER, this.buffer.handle);
          this.gl.vertexAttribPointer(location, 1, GL.FLOAT, false, 0, 0);
        }
      }
    });
    return this;
  }

  // Workaround for Chrome TransformFeedback binding issue
  // If required, rebind rebind after temporary unbind
  bindBuffers() {
    this.vertexArrayObject.bind(() => {
      if (this.elements) {
        this.setElementBuffer(this.elements);
      }

      for (let location = 0; location < this.vertexArrayObject.MAX_ATTRIBUTES; location++) {
        const buffer = this.values[location];
        if (buffer instanceof Buffer) {
          this.setBuffer(location, buffer);
        }
      }
    });
    return this;
  }

  // Bind for use
  // When a vertex array is about to be used, we must:
  // - Set constant attributes (since these are stored on the context and reset on bind)
  // - Check if we need to initialize the buffer
  bindForDraw(vertexCount, instanceCount, func) {
    let value;

    this.vertexArrayObject.bind(() => {
      // Make sure that any constant attributes are updated (stored on the context, not the VAO)
      // Also handles attribute 0
      this._setConstantAttributes(vertexCount, instanceCount);

      if (!this.vertexArrayObject.hasVertexArrays) {
        this.bindBuffers();
      }

      value = func();

      if (!this.vertexArrayObject.hasVertexArrays) {
        this.unbindBuffers();
      }
    });

    return value;
  }

  // PRIVATE

  // Resolve locations and accessors
  _resolveLocationAndAccessor(locationOrName, value, valueAccessor, appAccessor) {
    const location = this._getAttributeIndex(locationOrName);
    if (!Number.isFinite(location) || location < 0) {
      this.unused[locationOrName] = value;
      log.once(3, () => `unused value ${locationOrName} in ${this.id}`)();
      return this;
    }

    const accessInfo = this._getAttributeInfo(locationOrName);

    // Resolve the partial accessors into a final accessor
    const accessor = Accessor.resolve(accessInfo.accessor, valueAccessor, appAccessor);

    const {size, type} = accessor;
    assert(Number.isFinite(size) && Number.isFinite(type));

    return {location, accessor};
  }

  _getAttributeInfo(attributeName) {
    return this.configuration && this.configuration.getAttributeInfo(attributeName);
  }

  _getAttributeIndex(locationOrName) {
    if (this.configuration) {
      return this.configuration.getAttributeLocation(locationOrName);
    }
    const location = Number(locationOrName);
    if (Number.isFinite(location)) {
      return location;
    }
    return -1;
  }

  // Updates all constant attribute values (constants are used when vertex attributes are disabled).
  // This needs to be done repeatedly since in contrast to buffer bindings,
  // constants are stored on the WebGL context, not the VAO
  _setConstantAttributes(vertexCount, instanceCount) {
    // TODO - use accessor to determine what length to use
    const elementCount = Math.max(vertexCount | 0, instanceCount | 0);
    let constant = this.values[0];
    if (ArrayBuffer.isView(constant)) {
      this._setConstantAttributeZero(constant, elementCount);
    }

    for (let location = 1; location < this.vertexArrayObject.MAX_ATTRIBUTES; location++) {
      constant = this.values[location];
      if (ArrayBuffer.isView(constant)) {
        this._setConstantAttribute(location, constant);
      }
    }
  }

  _setConstantAttributeZero(constant, elementCount) {
    if (VertexArrayObject.isSupported(this.gl, {constantAttributeZero: true})) {
      this._setConstantAttribute(0, constant);
      return;
    }

    // Get a dummy buffer populated with repeated constants
    const buffer = this.vertexArrayObject.getConstantBuffer(elementCount, constant);

    // Set the buffer on location 0
    this.vertexArrayObject.setBuffer(0, buffer, this.accessors[0]);
  }

  _setConstantAttribute(location, constant) {
    VertexArrayObject.setConstant(this.gl, location, constant);

    // If we are using the global VertexArrayObject, we need to disable the attribute now
    if (this.vertexArrayObject.isDefault) {
      this.vertexArrayObject.enable(location, false);
    }
  }

  // Walks the buffers and updates draw parameters
  _updateDrawParams() {
    const drawParams = {
      isIndexed: false,
      isInstanced: false,
      indexCount: Infinity,
      vertexCount: Infinity,
      instanceCount: Infinity
    };

    for (let location = 0; location < this.vertexArrayObject.MAX_ATTRIBUTES; location++) {
      this._updateDrawParamsForLocation(drawParams, location);
    }

    if (this.elements) {
      // indexing is autodetected - buffer with target GL.ELEMENT_ARRAY_BUFFER
      // index type is saved for drawElement calls
      drawParams.elementCount = this.elements.getElementCount(this.elements.accessor);
      drawParams.isIndexed = true;
      drawParams.indexType = this.elements.accessor.type;
    }

    // Post-calculation checks
    if (drawParams.indexCount === Infinity) {
      drawParams.indexCount = 0;
    }
    if (drawParams.vertexCount === Infinity) {
      drawParams.vertexCount = 0;
    }
    if (drawParams.instanceCount === Infinity) {
      drawParams.instanceCount = 0;
    }

    return drawParams;
  }

  _updateDrawParamsForLocation(drawParams, location) {
    const value = this.values[location];
    const accessor = this.accessors[location];

    if (!value) {
      return;
    }

    // Check if instanced (whether buffer or constant)
    const {divisor} = accessor;
    const isInstanced = divisor > 0;
    drawParams.isInstanced = drawParams.isInstanced || isInstanced;

    if (value instanceof Buffer) {
      const buffer = value;

      if (isInstanced) {
        // instance attribute
        const instanceCount = buffer.getVertexCount(accessor);
        drawParams.instanceCount = Math.min(drawParams.instanceCount, instanceCount);
      } else {
        // normal attribute
        const vertexCount = buffer.getVertexCount(accessor);
        drawParams.vertexCount = Math.min(drawParams.vertexCount, vertexCount);
      }
    }
  }

  // DEPRECATED

  setElements(elementBuffer = null, accessor = {}) {
    log.deprecated('setElements', 'setElementBuffer');
    return this.setElementBuffer(elementBuffer, accessor);
  }
}
