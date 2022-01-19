import {log, assert, AttributeBinding} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import Accessor from './accessor';
import Buffer from './webgl-buffer';
import Program from './program'; 
import ProgramConfiguration from './program-configuration';
import VertexArrayObject, {VertexArrayObjectProps} from './vertex-array-object';
import WEBGLVertexArray from '../adapter/objects/webgl-vertex-array';

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

export default class VertexArray extends WEBGLVertexArray {

  constructor(gl: WebGLRenderingContext, props?: VertexArrayProps) {
    super(gl, props);
    this.initialize(props);
  }

  delete(): void {
    if (this.buffer) {
      this.buffer.delete();
    }

    if (this.handle) {
      this.vertexArrayObject.delete();
      this.handle = null;
    }
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

  // Set attribute to constant value (small typed array corresponding to one vertex' worth of data)
  setConstant(locationOrName, arrayValue, appAccessor = {}): this {
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

      value = func();
    });

    return value;
  }

  // PRIVATE

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

  _setConstantAttributeZero(constant, elementCount: number): void {
    if (VertexArrayObject.isSupported(this.gl, {constantAttributeZero: true})) {
      this._setConstantAttribute(0, constant);
      return;
    }

    // Get a dummy buffer populated with repeated constants
    const buffer = this.vertexArrayObject.getConstantBuffer(elementCount, constant);

    // Set the buffer on location 0
    this.vertexArrayObject.setBuffer(0, buffer, this.accessors[0]);
  }

  _setConstantAttribute(location: number | string, constant): void {
    VertexArrayObject.setConstant(this.gl, location, constant);
  }

  // Walks the buffers and updates draw parameters
  _updateDrawParams(): DrawParams {
    const drawParams = {
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

  _updateDrawParamsForLocation(drawParams: DrawParams, location): void {
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

  // DEPRECATED in v6.x - but not warnings not properly implemented

  setElements(elementBuffer = null, accessor = {}) {
    log.deprecated('setElements', 'setElementBuffer')();
    return this.setElementBuffer(elementBuffer, accessor);
  }
}
