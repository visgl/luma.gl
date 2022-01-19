import {log, assert, AttributeBinding} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import VertexArrayObject, {VertexArrayObjectProps} from '../../classes/vertex-array-object';
import Accessor from '../../classes/accessor';
import Buffer from '../../classes/webgl-buffer';
import Program from '../../classes/program'; 
import ProgramConfiguration from '../../classes/program-configuration';

const ERR_ATTRIBUTE_TYPE =
  'VertexArray: attributes must be Buffers or constants (i.e. typed array)';

// This is done to support mat type attributes.
// See section "Notes about setting mat type attributes"
// in vertex-array.md
const MULTI_LOCATION_ATTRIBUTE_REGEXP = /^(.+)__LOCATION_([0-9]+)$/;

export type VertexArrayProps = {
  id?: string;
  program?: Program;
  configuration?: ProgramConfiguration;
  attributes?: Record<string, any>;
  elements?: any;
  bindOnUse?: boolean;
};

export type DrawParams = {
  elementCount: number;
  indexType: Uint16ArrayConstructor | Uint32ArrayConstructor;
  indexOffset: number;
  isIndexed: boolean;
  isInstanced: boolean;
  indexCount: number;
  vertexCount: number;
  instanceCount: number;
};

export default class WEBGLVertexArray {
  id: string;
  gl: WebGLRenderingContext;
  handle: WebGLVertexArrayObject;
  readonly attributes: object = {};
  vertexArrayObject: VertexArrayObject;
  accessors: Accessor[] = [];
  configuration: ProgramConfiguration | null = null;

  // Extracted information
  elements = null;
  elementsAccessor = null;
  values = null;
  unused = {};
  drawParams = null;
  buffer = null; // For attribute 0 on desktops, and created when unbinding buffers
  
  bindOnUse = false;

  constructor(gl: WebGLRenderingContext, props?: VertexArrayProps) {
    // Use program's id if program is supplied but no id is supplied
    const id = props?.id || (props?.program && props?.program.id);
    // super(gl, Object.assign({}, props, {id}));

    this.vertexArrayObject = new VertexArrayObject(gl);
    this.handle = this.vertexArrayObject.handle;

    this.id = id;
    this.gl = gl;
    this.configuration = null;

    Object.seal(this);
  }


  // Set (bind) an array or map of vertex array buffers, either in numbered or named locations.
  // For names that are not present in `location`, the supplied buffers will be ignored.
  // if a single buffer of type GL.ELEMENT_ARRAY_BUFFER is present, it will be set as elements
  //   Signatures:
  //     {attributeName: buffer}
  //     {attributeName: [buffer, accessor]}
  //     {attributeName: (typed) array} => constant
  setAttributes(attributes): this {
    Object.assign(this.attributes, attributes);
    this.vertexArrayObject.bind(() => {
      for (const locationOrName in attributes) {
        const value = attributes[locationOrName];
        this._setAttribute(locationOrName, value);
      }
      // Make sure we don't leave any bindings
      this.gl.bindBuffer(GL.ARRAY_BUFFER, null);
    });

    return this;
  }

  // Set (bind) an elements buffer, for indexed rendering.
  // Must be a Buffer bound to GL.ELEMENT_ARRAY_BUFFER. Constants not supported
  setElementBuffer(elementBuffer: Buffer | null = null, accessor = {}): this {
    this.elements = elementBuffer; // Save value for debugging
    this.elementsAccessor = accessor;
    this.clearDrawParams();
    this.vertexArrayObject.setElementBuffer(elementBuffer, accessor);

    return this;
  }

  // Set a location in vertex attributes array to a buffer
  setBuffer(locationOrName: number | string, buffer: Buffer, appAccessor = {}): this {
    // Check target
    if (buffer.target === GL.ELEMENT_ARRAY_BUFFER) {
      this.setElementBuffer(buffer, appAccessor);
      return this;
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
      this.vertexArrayObject.setBuffer(location, buffer, accessor);
    }

    return this;
  }

    // Workaround for Chrome TransformFeedback binding issue
  // If required, unbind temporarily to avoid conflicting with TransformFeedback
  unbindBuffers(): this {
    this.vertexArrayObject.bind(() => {
      if (this.elements) {
        this.vertexArrayObject.setElementBuffer(null);
      }

      // Chrome does not like buffers that are bound to several binding points,
      // so we need to offer and unbind facility
      // WebGL offers disabling, but no clear way to set a VertexArray buffer to `null`
      // So we just bind all the attributes to the dummy "attribute zero" buffer
      this.buffer = this.buffer || new Buffer(this.gl, {accessor: {size: 4}});

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
  bindBuffers(): this {
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
  bindForDraw(vertexCount, instanceCount, func) {}

  clearDrawParams() {}
  setConstant(l: any, v: any) {}

  // PRIVATE

  // Resolve locations and accessors
  _resolveLocationAndAccessor(locationOrName, value, valueAccessor, appAccessor) {
    const INVALID_RESULT = {
      location: -1,
      accessor: null
    };

    const {location, name} = this._getAttributeIndex(locationOrName);
    if (!Number.isFinite(location) || location < 0) {
      this.unused[locationOrName] = value;
      log.once(3, () => `unused value ${locationOrName} in ${this.id}`)();
      return INVALID_RESULT;
    }

    const accessInfo = this._getAttributeInfo(name || location);

    // Attribute location wasn't directly found.
    // Likely due to multi-location attributes (e.g. matrix)
    if (!accessInfo) {
      return INVALID_RESULT;
    }

    // Resolve the partial accessors into a final accessor
    const currentAccessor = this.accessors[location] || {};
    const accessor = Accessor.resolve(
      accessInfo.accessor,
      currentAccessor,
      valueAccessor,
      appAccessor
    );

    const {size, type} = accessor;
    assert(Number.isFinite(size) && Number.isFinite(type));

    return {location, accessor};
  }

  _getAttributeInfo(attributeName: string | number): AttributeBinding {
    return this.configuration && this.configuration.getAttributeInfo(attributeName);
  }

  _getAttributeIndex(locationOrName: number | string): {location: number, name?: string} {
    const location = Number(locationOrName);
    if (Number.isFinite(location)) {
      return {location};
    }

    const multiLocation = MULTI_LOCATION_ATTRIBUTE_REGEXP.exec(String(locationOrName));
    const name = multiLocation ? multiLocation[1] : String(locationOrName);
    const locationOffset = multiLocation ? Number(multiLocation[2]) : 0;

    if (this.configuration) {
      return {
        location: this.configuration.getAttributeLocation(name) + locationOffset,
        name
      };
    }

    return {location: -1};
  }

  _setAttribute(locationOrName: number | string, value: Buffer): void;
  _setAttribute(locationOrName: number | string, value: [Buffer, any]): void;
  _setAttribute(locationOrName: number | string, value: ArrayBuffer | any[]): void;
  _setAttribute(locationOrName: number | string, value: {value: Buffer}): void;

  _setAttribute(locationOrName: number | string, value): void {
    if (value instanceof Buffer) {
      //  Signature: {attributeName: Buffer}
      this.setBuffer(locationOrName, value);
    } else if (Array.isArray(value) && value.length && value[0] instanceof Buffer) {
      // Signature: {attributeName: [buffer, accessor]}
      const buffer = value[0];
      const accessor = value[1];
      this.setBuffer(locationOrName, buffer, accessor);
    } else if (ArrayBuffer.isView(value) || Array.isArray(value)) {
      // Signature: {attributeName: constant}, constant == short (typed) array
      const constant = value;
      this.setConstant(locationOrName, constant);
    } else if (value.buffer instanceof Buffer) {
      // luma.gl v7: Support accessor objects with 'buffer' field
      // for interleaved data
      // Signature: {attributeName: {...accessor, buffer}}
      const accessor = value;
      this.setBuffer(locationOrName, accessor.buffer, accessor);
    } else {
      throw new Error(ERR_ATTRIBUTE_TYPE);
    }
  }
}
