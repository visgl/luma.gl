import {log, assert, AttributeBinding, TypedArray} from '@luma.gl/api';
import {ClassicBuffer, WEBGLBuffer, AccessorObject} from '@luma.gl/webgl';
import GL from '@luma.gl/constants';
import Accessor from './accessor';
import Program from './program';
import ProgramConfiguration from './program-configuration';
import VertexArrayObject from './vertex-array-object';

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

// returns number of vertices in the buffer (assuming that the full buffer is used)
function getVertexCount(buffer: ClassicBuffer, accessor = buffer.accessor): number {
  return Math.round(buffer.byteLength / Accessor.getBytesPerVertex(accessor));
}

/** @deprecated Use RenderPipeline (public) and WEBGLVertexArrayObject (internal) */
export default class VertexArray {
  id: string;
  gl: WebGLRenderingContext;
  handle: WebGLVertexArrayObject;

  readonly attributes: object = {};

  vertexArrayObject: VertexArrayObject;
  accessors: Accessor[] = [];
  configuration: ProgramConfiguration | null = null;

  // Extracted information
  elements: ClassicBuffer | null = null;
  elementsAccessor: Accessor | null = null;
  values: (ClassicBuffer | TypedArray | null)[];
  unused: Record<string, any> = null;
  drawParams: DrawParams | null = null;
  buffer: ClassicBuffer | null = null; // For attribute 0 on desktops, and created when unbinding buffers

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

    this.initialize(props);
    Object.seal(this);
  }

  destroy(): void {
    if (this.buffer) {
      this.buffer.destroy();
    }

    if (this.handle) {
      this.vertexArrayObject.destroy();
      this.handle = null;
    }
  }

  /** @deprecated Use .destroy() */
  delete(): void {
    this.destroy();
  }

  initialize(props?: VertexArrayProps) {
    this.reset();
    this.configuration = null;
    this.bindOnUse = false;
    return this.setProps(props || {});
  }

  // Resets all attributes (to default valued constants)
  reset() {
    // this.vertexArrayObject.reset();

    this.elements = null;
    this.elementsAccessor = null;
    const {MAX_ATTRIBUTES} = this.vertexArrayObject;
    this.values = new Array(MAX_ATTRIBUTES).fill(null);
    this.accessors = new Array(MAX_ATTRIBUTES).fill(null);
    this.unused = {};

    // Auto detects draw params
    this.drawParams = null;

    return this;
  }

  setProps(props: VertexArrayProps) {
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
      // @ts-expect-error
      props = props.bindOnUse;
    }
    return this;
  }

  // Automatically called if buffers changed through VertexArray API
  clearDrawParams(): void {
    this.drawParams = null;
  }

  getDrawParams(): DrawParams {
    // Auto deduced draw parameters
    this.drawParams = this.drawParams || this._updateDrawParams();
    return this.drawParams;
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
  // Must be a WEBGLBuffer bound to GL.ELEMENT_ARRAY_BUFFER. Constants not supported
  setElementBuffer(elementBuffer: ClassicBuffer | null = null, accessor: AccessorObject = {}): this {
    this.elements = elementBuffer; // Save value for debugging
    this.elementsAccessor = new Accessor(accessor);
    this.clearDrawParams();
    this.vertexArrayObject.setElementBuffer(elementBuffer, accessor);

    return this;
  }

  // Set a location in vertex attributes array to a buffer
  setBuffer(locationOrName: number | string, buffer: ClassicBuffer, appAccessor = {}): this {
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

  // Set attribute to constant value (small typed array corresponding to one vertex' worth of data)
  setConstant(locationOrName: string | number, arrayValue: TypedArray, appAccessor: AccessorObject = {}): this {
    // @ts-expect-error
    const {location, accessor} = this._resolveLocationAndAccessor(
      locationOrName,
      arrayValue,
      // Ensure that size isn't taken from program for multi-column
      // attributes
      {size: arrayValue.length, ...appAccessor}
    );

    if (location >= 0) {
      arrayValue = this.vertexArrayObject._normalizeConstantArrayValue(arrayValue);

      this.values[location] = arrayValue;
      this.accessors[location] = accessor;
      this.clearDrawParams();

      // NOTE: We set the actual constant value later on bind. We can't set the value now since
      // constants are global and affect all other VertexArrays that have disabled attributes
      // in the same location.
      // We do disable the attribute which makes it use the global constant value at that location
      this.vertexArrayObject.enable(location, false);
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
      this.buffer = this.buffer || new ClassicBuffer(this.gl, {accessor: {size: 4}});

      for (let location = 0; location < this.vertexArrayObject.MAX_ATTRIBUTES; location++) {
        if (this.values[location] instanceof WEBGLBuffer) {
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
        if (buffer instanceof WEBGLBuffer) {
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
  bindForDraw(vertexCount: number, instanceCount: number, func: Function) {
    let value;

    this.vertexArrayObject.bind(() => {
      // Make sure that any constant attributes are updated (stored on the context, not the VAO)
      // Also handles attribute 0
      this._setConstantAttributes(vertexCount, instanceCount);

      value = func();
    });

    return value;
  }

  // PRIVATE

  // Resolve locations and accessors
  _resolveLocationAndAccessor(
    locationOrName: string | number, value, valueAccessor, appAccessor: AccessorObject
  ) {
    const INVALID_RESULT = {
      location: -1,
      accessor: null as Accessor | null
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

  _getAttributeIndex(locationOrName: number | string): {location: number; name?: string} {
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

  _setAttribute(
    locationOrName: number | string,
    value: ClassicBuffer | [ClassicBuffer, any] | number[] | {buffer: ClassicBuffer}
  ): void {
    if (value instanceof ClassicBuffer) {
      //  Signature: {attributeName: ClassicBuffer}
      this.setBuffer(locationOrName, value);
    } else if (Array.isArray(value) && value.length && value[0] instanceof ClassicBuffer) {
      // Signature: {attributeName: [buffer, accessor]}
      const buffer = value[0];
      const accessor = value[1];
      this.setBuffer(locationOrName, buffer, accessor);
    } else if (ArrayBuffer.isView(value) || Array.isArray(value)) {
      // Signature: {attributeName: constant}, constant == short (typed) array
      const constant = value;
      // @ts-expect-error TODO
      this.setConstant(locationOrName, constant);
    } else if (value.buffer instanceof ClassicBuffer) {
      // luma.gl v7: Support accessor objects with 'buffer' field
      // for interleaved data
      // Signature: {attributeName: {...accessor, buffer}}
      const accessor = value;
      this.setBuffer(locationOrName, accessor.buffer, accessor);
    } else {
      throw new Error(ERR_ATTRIBUTE_TYPE);
    }
  }

  // Updates all constant attribute values (constants are used when vertex attributes are disabled).
  // This needs to be done repeatedly since in contrast to buffer bindings,
  // constants are stored on the WebGL context, not the VAO
  _setConstantAttributes(vertexCount: number, instanceCount: number): void {
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

  _setConstantAttributeZero(constant: TypedArray, elementCount: number): void {
    if (VertexArrayObject.isSupported(this.gl, {constantAttributeZero: true})) {
      this._setConstantAttribute(0, constant);
      return;
    }

    // Get a dummy buffer populated with repeated constants
    const buffer = this.vertexArrayObject.getConstantBuffer(elementCount, constant);

    // Set the buffer on location 0
    this.vertexArrayObject.setBuffer(0, buffer, this.accessors[0]);
  }

  _setConstantAttribute(location: number | string, constant: TypedArray): void {
    VertexArrayObject.setConstant(this.gl, location, constant);
  }

  // Walks the buffers and updates draw parameters
  _updateDrawParams(): DrawParams {
    const drawParams: DrawParams = {
      elementCount: 0,
      indexType: Uint16Array,
      indexOffset: 0,
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
      // @ts-expect-error TODO looks like a valid type mismatch
      drawParams.indexType = this.elementsAccessor.type || this.elements.accessor.type;
      drawParams.indexOffset = this.elementsAccessor.offset || 0;
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

  _updateDrawParamsForLocation(drawParams: DrawParams, location: number): void {
    const value = this.values[location];
    const accessor = this.accessors[location];

    if (!value) {
      return;
    }

    // Check if instanced (whether buffer or constant)
    const {divisor} = accessor;
    const isInstanced = divisor > 0;
    drawParams.isInstanced = drawParams.isInstanced || isInstanced;

    if (value instanceof ClassicBuffer) {
      const buffer = value;

      if (isInstanced) {
        // instance attribute
        const instanceCount = getVertexCount(buffer, accessor);
        drawParams.instanceCount = Math.min(drawParams.instanceCount, instanceCount);
      } else {
        // normal attribute
        const vertexCount = getVertexCount(buffer, accessor);
        drawParams.vertexCount = Math.min(drawParams.vertexCount, vertexCount);
      }
    }
  }

  // DEPRECATED in v6.x - but not warnings not properly implemented

  setElements(elementBuffer: ClassicBuffer = null, accessor = {}) {
    log.deprecated('setElements', 'setElementBuffer')();
    return this.setElementBuffer(elementBuffer, accessor);
  }
}
