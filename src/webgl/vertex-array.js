// WebGL2 VertexArrayObject class (polyfilled/extended in WebGL1)
import GL from '../constants';
import Resource from './resource';
import Accessor from './accessor';
import Buffer from './buffer';
import {isWebGL2} from '../webgl-utils';
import {getCompositeGLType} from '../webgl-utils/attribute-utils';
import {log, formatValue, assert} from '../utils';

/* eslint-disable camelcase */
const OES_vertex_array_object = 'OES_vertex_array_object';

const GL_ELEMENT_ARRAY_BUFFER = 0x8893;

const ERR_WEBGL1 = 'import "luma.gl/webgl1" to make luma.gl run in minimal WebGL1 environments';
const ERR_ELEMENTS = 'elements must be GL.ELEMENT_ARRAY_BUFFER';
const ERR_ATTRIBUTE_TYPE = 'VertexArray: attributes must be Buffer or typed array constant';

export default class VertexArray extends Resource {

  // Now always supported via client side polyfill
  static isSupported(gl) {
    return isWebGL2(gl) || gl.getExtension(OES_vertex_array_object);
  }

  // Returns the global (null) vertex array object. Exists even when no extension available
  static getDefaultArray(gl) {
    gl.luma = gl.luma || {};
    if (!gl.luma.defaultVertexArray) {
      gl.luma.defaultVertexArray = new VertexArray(gl, {handle: null});
    }
    return gl.luma.defaultVertexArray;
  }

  static getMaxAttributes(gl) {
    VertexArray.MAX_VERTEX_ATTRIBS = VertexArray.MAX_VERTEX_ATTRIBS ||
      gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    return VertexArray.MAX_VERTEX_ATTRIBS;
  }

  // Create a VertexArray
  constructor(gl, opts = {}) {
    if (opts.handle && !VertexArray.isSupported(gl)) {
      throw new Error(ERR_WEBGL1);
    }

    // Use program's id if program but no id is supplied
    const id = opts.id || opts.program && opts.program.id;
    super(gl, Object.assign({}, opts, {id}));

    this.configuration = null;

    // Extracted information
    this.elements = null;
    this.values = null;
    this.infos = null;
    this.accessors = null;
    this.unused = null;
    this.drawParams = null;

    // State
    this._bound = false;

    this.stubRemovedMethods('VertexArray', 'v6.0', [
      'setBuffers',
      'setGeneric',
      'clearBindings',
      'setLocations',
      'setGenericValues',
      'setDivisor',
      'enable',
      'disable'
    ]);

    this._initialize(opts);
    Object.seal(this);
  }

  get MAX_ATTRIBUTES() {
    return VertexArray.getMaxAttributes(this.gl);
  }

  getLocation(location) {
    return this.configuration ? this.configuration.getLocation(location) : location;
  }

  _initialize(props = {}) {
    this.reset(false);

    this.configuration = null;
    this.bindOnUse = false;

    // Unbind any currently bound buffers
    // if (!isObjectEmpty(this.buffers)) {
    //   this.bind(() => this._unbindBuffers());
    // }

    return this.setProps(props);
  }

  setProps(props) {
    if ('program' in props) {
      this.configuration = props.program && props.program.configuration;
    }
    if ('configuration' in props) {
      this.configuration = props.configuration;
    }
    if ('bindOnUse' in props) {
      props = props.bindOnUse;
    }
    if ('attributes' in props) {
      this.setAttributes(props.attributes);
    }
    if ('elements' in props) {
      this.setElements(props.elements);
    }
    return this;
  }

  // Resets all attributes (to default valued constants)
  reset(clear = true, disableZero = false) {
    this.elements = null;
    this.values = new Array(this.MAX_VERTEX_ATTRIBS).fill(null);
    this.infos = new Array(this.MAX_VERTEX_ATTRIBS).fill({});
    this.accessors = new Array(this.MAX_VERTEX_ATTRIBS).fill(null);
    this.unused = [];

    // Auto detects draw params
    this.drawParams = {
      isInstanced: false,
      // indexing is autodetected - buffer with target gl.ELEMENT_ARRAY_BUFFER
      // index type is saved for drawElement calls
      isIndexed: false,
      indexType: null
    };

    if (clear) {
      this.bind(() => {
        // Clear elements buffer
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
        // Clear attributes
        for (let i = 0; i < this.MAX_ATTRIBUTES; i++) {
          if (i > 0 || disableZero) {
            this.setConstant(i, [0, 0, 0, 1]); // match assumed WebGL defaults
          }
        }
      });
    }

    return this;
  }

  // Set (bind) an array or map of vertex array buffers, either in numbered or named locations.
  // For names that are not present in `location`, the supplied buffers will be ignored.
  // if a single buffer of type GL.ELEMENT_ARRAY_BUFFER is present, it will be set as elements
  setAttributes(attributes) {
    this.bind(() => {
      for (const locationOrName in attributes) {
        const value = attributes[locationOrName];
        if (value instanceof Buffer) {
          this.setBuffer(locationOrName, value);
        } else if (ArrayBuffer.isView(value) || Array.isArray(value)) {
          this.setConstant(locationOrName, value);
        } else {
          throw new Error(ERR_ATTRIBUTE_TYPE);
        }
      }
    });

    return this;
  }

  // Set (bind) an elements buffer, for indexed rendering.
  // Must be a Buffer bound to GL.ELEMENT_ARRAY_BUFFER. Constants not supported
  setElements(elementBuffer = null, opts = {}) {
    assert(!elementBuffer || elementBuffer.target === GL_ELEMENT_ARRAY_BUFFER, ERR_ELEMENTS);

    this.bind(() => {
      this.gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, elementBuffer ? elementBuffer.handle : null);
    });
    this.elements = elementBuffer;

    // Auto-deduce isIndexed draw param
    this.drawParams.isIndexed = Boolean(elementBuffer);
    if (elementBuffer) {
      this.drawParams.indexType = elementBuffer.accessor.getOptions(opts).type;
    } else {
      delete this.drawParams.indexType;
    }

    return this;
  }

  // Set a location in vertex attributes array to a buffer
  setBuffer(locationOrName, buffer, opts = {}) {
    const {gl} = this;

    // Check target
    if (buffer.target === gl.ELEMENT_ARRAY_BUFFER) {
      return this.setElements(buffer);
    }

    const location = this.getAttributeIndex(locationOrName);
    if (location < 0) {
      this.unused[locationOrName] = buffer;
      log.warn(() => `${this.id} unused buffer attribute ${locationOrName}`)();
      return this;
    }

    this.bind(() => {
      const accessInfo = this.getAttributeInfo(locationOrName, buffer, opts);
      const name = accessInfo ? accessInfo.name : String(location);

      // Override with any additional attribute configuration params
      let accessor = accessInfo ? accessInfo.accessor : new Accessor();
      accessor = accessor.getOptions(buffer, buffer.accessor, opts);

      this.values[location] = buffer;
      this.accessors[location] = accessor;
      this.infos[location] = {location, name, accessor};

      const {size, type, stride, offset, normalized, divisor} = accessor;
      assert(Number.isFinite(size) && Number.isFinite(type));

      // A non-zero buffer object must be bound to the GL_ARRAY_BUFFER target
      buffer.bind({target: gl.ARRAY_BUFFER});

      // Attach ARRAY_BUFFER with specified buffer format to location
      if (!opts.integer) {
        gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
      } else {
        // specifies *integer* data formats and locations of vertex attributes
        assert(isWebGL2(gl));
        gl.vertexAttribIPointer(location, size, type, stride, offset);
      }
      gl.enableVertexAttribArray(location);
      gl.vertexAttribDivisor(location, divisor || 0);

      // NOTE We don't unbind buffer here

      // Auto deduce isInstanced drawParam
      const isInstanced = divisor > 0;
      this.drawParams.isInstanced = this.drawParams.isInstanced || isInstanced;
    });

    return this;
  }

  // Set attribute to constant value (small typed array corresponding to one vertex' worth of data)
  // TODO - handle single values for size 1 attributes?
  // TODO - convert classic arrays based on known type?
  setConstant(locationOrName, arrayValue, opts) {
    const accessInfo = this.getAttributeInfo(locationOrName, arrayValue, opts);
    if (!accessInfo) {
      this.unused[locationOrName] = arrayValue;
      log.warn(() => `${this.id} unused constant attribute ${locationOrName}`)();
      return this;
    }

    // TODO - read type if provided
    if (Array.isArray(arrayValue)) {
      arrayValue = new Float32Array(arrayValue);
    }

    this.bind(() => {
      const {location} = accessInfo;

      // TODO - use known type in configuration to allow non-typed arrays?
      switch (arrayValue.constructor) {
      case Float32Array:
        this._setConstantFloatArray(location, arrayValue);
        break;
      case Int32Array:
        this._setConstantIntArray(location, arrayValue);
        break;
      case Uint32Array:
        this._setConstantUintArray(location, arrayValue);
        break;
      default:
        assert(false);
      }

      // To use the constant value, disable reading from arrays

      // NOTE: Possible perf penalty when disabling attribute 0:
      // https://stackoverflow.com/questions/20305231/webgl-warning-attribute-0-is-disabled-
      // this-has-significant-performance-penalt
      this.gl.disableVertexAttribArray(location);

      // Reset instanced divisor
      this.gl.vertexAttribDivisor(location, 0);

      // Save the value for debugging
      this.values[location] = arrayValue;
    });
    return this;
  }

  bind(funcOrHandle = this.handle) {
    if (typeof funcOrHandle !== 'function') {
      this.gl.bindVertexArray(funcOrHandle);
      return this;
    }

    let value;

    if (!this._bound) {
      this.gl.bindVertexArray(this.handle);
      this._bound = true;

      value = funcOrHandle();

      this._bound = false;
      this.gl.bindVertexArray(null);
    } else {
      value = funcOrHandle();
    }

    return value;
  }

  // PRIVATE

  getAttributeInfo(attributeName) {
    return this.configuration && this.configuration.getAttributeInfo(attributeName);
  }

  getAttributeIndex(locationOrName) {
    if (this.configuration) {
      return this.configuration.getLocation(locationOrName);
    }
    const location = Number(locationOrName);
    if (Number.isFinite(location)) {
      return location;
    }
    return -1;
  }

  // Currently just checks that elements is not duplicated
  _checkAttributes(attributes) {
    let elements = null;

    for (const bufferName in attributes) {
      const buffer = attributes[bufferName];
      // Check if this is an elements array
      if (buffer && buffer.target === GL_ELEMENT_ARRAY_BUFFER) {
        assert(!elements, 'Duplicate GL.ELEMENT_ARRAY_BUFFER');
        // assert(location === undefined, 'GL.ELEMENT_ARRAY_BUFFER assigned to location');
        elements = buffer;
      }

      const accessInfo = this.getAttributeInfo(bufferName, buffer);
      if (accessInfo.location === undefined) {
        // Check if this is an elements array
        log.warn(`${bufferName} not used`)();
      }
    }

    return elements;
  }

  _setConstantFloatArray(location, array) {
    const {gl} = this;
    switch (array.length) {
    case 1: gl.vertexAttrib1fv(location, array); break;
    case 2: gl.vertexAttrib2fv(location, array); break;
    case 3: gl.vertexAttrib3fv(location, array); break;
    case 4: gl.vertexAttrib4fv(location, array); break;
    default: assert(false);
    }
  }

  _setConstantIntArray(location, array) {
    const {gl} = this;
    assert(isWebGL2(gl));
    switch (array.length) {
    case 1: gl.vertexAttribI1iv(location, array); break;
    case 2: gl.vertexAttribI2iv(location, array); break;
    case 3: gl.vertexAttribI3iv(location, array); break;
    case 4: gl.vertexAttribI4iv(location, array); break;
    default: assert(false);
    }
  }

  _setConstantUintArray(location, array) {
    const {gl} = this;
    assert(isWebGL2(gl));
    switch (array.length) {
    case 1: gl.vertexAttribI1uiv(location, array); break;
    case 2: gl.vertexAttribI2uiv(location, array); break;
    case 3: gl.vertexAttribI3uiv(location, array); break;
    case 4: gl.vertexAttribI4uiv(location, array); break;
    default: assert(false);
    }
  }

  // RESOURCE IMPLEMENTATION

  _createHandle() {
    return this.gl.createVertexArray();
  }

  _deleteHandle(handle) {
    this.gl.deleteVertexArray(handle);
    return [this.elements];
    // return [this.elements, ...this.buffers];
  }

  // Generic getter for information about a vertex attribute at a given position
  _getParameter(pname, {location}) {
    assert(Number.isFinite(location));
    return this.bind(() => {
      switch (pname) {
      case GL.VERTEX_ATTRIB_ARRAY_POINTER: return this.gl.getVertexAttribOffset(location, pname);
      default: return this.gl.getVertexAttrib(location, pname);
      }
    });
  }

  _bind(handle) {
    this.gl.bindVertexArray(handle);
  }

  _getDebugTable({header = 'Attributes'} = {}) {
    if (!this.configuration) {
      return {};
    }

    const table = {}; // {[header]: {}};

    // Add index (elements) if available
    if (this.elements) {
      // const elements = Object.assign({size: 1}, this.elements);
      table.ELEMENT_ARRAY_BUFFER =
        this._getDebugTableRow(this.elements, null, header);
    }

    // Add used attributes
    const attributes = this.values;

    for (const attributeName in attributes) {
      const info = this.getAttributeInfo(attributeName);
      if (info) {
        let rowHeader = `${attributeName}: ${info.name}`;
        const accessor = this.accessors[info.location];
        if (accessor) {
          const typeAndName = getCompositeGLType(accessor.type, accessor.size);
          if (typeAndName) { // eslint-disable-line
            rowHeader = `${attributeName}: ${info.name} (${typeAndName.name})`;
          }
        }
        table[rowHeader] =
          this._getDebugTableRow(attributes[attributeName], accessor, header);
      }
    }

    // Add any unused attributes
    // for (const attributeName in attributes) {
    //   if (!table[attributeName]) {
    //     table[attributeName] = this._getDebugTableRow(attributes[attributeName], null, header);
    //   }
    // }

    return table;
  }

  /* eslint-disable max-statements */
  _getDebugTableRow(attribute, accessor, header) {
    // const round = xnum => Math.round(num * 10) / 10;

    let type = 'NOT PROVIDED';
    let instanced = 0;
    let size = 'N/A';
    let verts = 'N/A';
    let bytes = 'N/A';

    let isInteger;
    let marker;
    let value;

    if (attribute instanceof Buffer) {
      const buffer = attribute;

      if (accessor) {
        type = accessor.type;
        instanced = accessor.divisor > 0;
        size = accessor.size;

        // Generate a type name by dropping Array from Float32Array etc.
        type = String(type).replace('Array', '');
        // Look for 'nt' to detect integer types, e.g. Int32Array, Uint32Array
        isInteger = type.indexOf('nt') !== -1;
      } else {
        // element buffer
        isInteger = true;
      }

      const {data, modified} = buffer.getDebugData();
      marker = modified ? '*' : '';

      value = data;
      bytes = buffer.bytes;
      verts = bytes / data.BYTES_PER_ELEMENT / size;
    }

    return {
      [header]: `${marker}${formatValue(value, {size, isInteger})}`,
      'Format ': `${instanced ? 'I ' : 'P '} ${verts} (x${size}=${bytes}bytes ${type})`
    };
  }
  /* eslint-ensable max-statements */
}
