// Contains metadata describing attribute configurations for a program's shaders
// Much of this is automatically extracted from shaders after program linking
import {isWebGL2} from '../webgl-utils';
import {decomposeCompositeGLType} from '../webgl-utils/attribute-utils';
import Accessor from './accessor';

export default class ProgramConfiguration {

  constructor(program) {
    this.attributeInfos = [];
    this.attributeInfosByName = {};
    this.varyings = [];
    this.varyingsByName = {};
    this.varyingMap = program.varyingMap;
    Object.seal(this);
    this._readAttributesFromProgram(program);
    this._readVaryingsFromProgram(program);
  }

  getAttributeInfo(locationOrName) {
    const location = Number(locationOrName);
    if (Number.isFinite(location)) {
      return this.attributeInfos[location];
    }
    return this.attributeInfosByName[locationOrName] || null;
  }

  getLocation(locationOrName) {
    const attributeInfo = this.getAttributeInfo(locationOrName);
    return attributeInfo ? attributeInfo.location : -1;
  }

  getVaryingInfo(locationOrName) {
    const location = Number(locationOrName);
    if (Number.isFinite(location)) {
      return this.varyings[location];
    }
    return this.varyingsByName[locationOrName] || null;
  }

  getVaryingIndex(locationOrName) {
    const varying = this.getVaryingInfo(locationOrName);
    return varying ? varying.location : -1;
  }

  _addAttribute(location, name, compositeType, size) {
    const {type, components} = decomposeCompositeGLType(compositeType);
    const accessor = new Accessor({type, size: size * components});
    this._inferProperties(name, accessor);

    const attributeInfo = {location, name, accessor}; // Base values
    this.attributeInfos.push(attributeInfo);
    this.attributeInfosByName[attributeInfo.name] = attributeInfo; // For quick name based lookup
  }

  // Extract additional attribute metadata from shader names (based on attribute naming conventions)
  _inferProperties(location, name, accessor) {
    if ((/instance/i).test(name)) {
      // Any attribute containing the word "instance" will be assumed to be instanced
      accessor.update({instanced: true});
    }
  }

  _addVarying(location, name, compositeType, size) {
    const {type, components} = decomposeCompositeGLType(compositeType);
    const accessor = new Accessor({type, size: size * components});

    const varying = {location, name, accessor}; // Base values
    this.varyings.push(varying);
    this.varyingsByName[varying.name] = varying; // For quick name based lookup
  }

  // linkProgram needs to have been called, although linking does not need to have been successful
  _readAttributesFromProgram(program) {
    const {gl} = program;
    const count = gl.getProgramParameter(program.handle, gl.ACTIVE_ATTRIBUTES);

    for (let index = 0; index < count; index++) {
      const {name, type, size} = gl.getActiveAttrib(program.handle, index);
      const location = gl.getAttribLocation(program.handle, name);
      this._addAttribute(location, name, type, size);
    }

    this.attributeInfos.sort((a, b) => a.location - b.location);
  }

  // linkProgram needs to have been called, although linking does not need to have been successful
  _readVaryingsFromProgram(program) {
    const {gl} = program;
    if (!isWebGL2(gl)) {
      return;
    }

    const count = gl.getProgramParameter(program.handle, gl.TRANSFORM_FEEDBACK_VARYINGS);
    for (let location = 0; location < count; location++) {
      const {name, type, size} = gl.getTransformFeedbackVarying(program.handle, location);
      this._addVarying(location, name, type, size);
    }

    this.varyings.sort((a, b) => a.location - b.location);
  }

  /*
  // Get a map of buffer indices
  getVaryingMap(program, varyings, bufferMode) {
    const {gl} = program;
    // assert(bufferMode === gl.SEPARATE_ATTRIBS || bufferMode === gl.INTERLEAVED_ATTRIBS);

    const varyingMap = {};
    let index = 0;
    const indexIncrement = bufferMode === gl.SEPARATE_ATTRIBS ? 1 : 0;
    for (const varying of varyings) {
      varyingMap[varying] = index;
      index += indexIncrement;
    }
    return varyingMap;
  }

  /*
  // query uniform locations and build name to setter map.
  _readUniformLocationsFromLinkedProgram() {
    const {gl} = this;
    this._uniformSetters = {};
    this._uniformCount = this.getUniformCount();
    for (let i = 0; i < this._uniformCount; i++) {
      const info = this.getUniformInfo(i);
      const parsedName = parseUniformName(info.name);
      const location = this.getUniformLocation(parsedName.name);
      this._uniformSetters[parsedName.name] =
        getUniformSetter(gl, location, info, parsedName.isArray);
    }
    this._textureIndexCounter = 0;
  }

  // create uniform setters
  // Map of uniform names to setter functions
  // linkProgram needs to have been called, although linking does not need to have been successful
  _readUniformDescriptorsFromProgram2(program) {
    const uniformDescriptors = {};
    const length = program._getParameter(GL.ACTIVE_UNIFORMS);
    for (let i = 0; i < length; i++) {
      const info = program.getUniformInfo(i);
      const location = this.gl.getActiveUniform(this.handle, this.handle, info.name);
      const descriptor = getUniformSetter(gl, location, info);
      uniformDescriptors[descriptor.name] = descriptor;
    }
    return uniformDescriptors;
  }
  */
}
