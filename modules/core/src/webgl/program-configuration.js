// Contains metadata describing attribute configurations for a program's shaders
// Much of this is automatically extracted from shaders after program linking
import Accessor from './accessor';
import {isWebGL2} from '../webgl-utils';
import {decomposeCompositeGLType} from '../webgl-utils/attribute-utils';
import log from '../utils/log';

export default class ProgramConfiguration {

  constructor(program) {
    this.attributeInfos = [];
    this.attributeInfosByName = {};
    this.varyings = [];
    this.varyingsByName = {};
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

  // Resolves an attribute name or index to an index
  getAttributeLocation(locationOrName) {
    const attributeInfo = this.getAttributeInfo(locationOrName);
    return attributeInfo ? attributeInfo.location : -1;
  }

  getAttributeAccessor(locationOrName) {
    const attributeInfo = this.getAttributeInfo(locationOrName);
    return attributeInfo ? attributeInfo.accessor : null;
  }

  getVaryingInfo(locationOrName) {
    const location = Number(locationOrName);
    if (Number.isFinite(location)) {
      return this.varyings[location];
    }
    return this.varyingsByName[locationOrName] || null;
  }

  getVaryingIndex(locationOrName) {
    const varying = this.getVaryingInfo();
    return varying ? varying.location : -1;
  }

  getVaryingAccessor(locationOrName) {
    const varying = this.getVaryingInfo();
    return varying ? varying.accessor : null;
  }

  // PRIVATE METHODS

  _log() {
    log.console(this._getDebugTable());
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

  _addAttribute(location, name, compositeType, size) {
    const {type, components} = decomposeCompositeGLType(compositeType);
    const accessor = {type, size: size * components};
    this._inferProperties(location, name, accessor);

    const attributeInfo = {location, name, accessor: new Accessor(accessor)}; // Base values
    this.attributeInfos.push(attributeInfo);
    this.attributeInfosByName[attributeInfo.name] = attributeInfo; // For quick name based lookup
  }

  // Extract additional attribute metadata from shader names (based on attribute naming conventions)
  _inferProperties(location, name, accessor) {
    if ((/instance/i).test(name)) {
      // Any attribute containing the word "instance" will be assumed to be instanced
      accessor.divisor = 1;
    }
  }

  _addVarying(location, name, compositeType, size) {
    const {type, components} = decomposeCompositeGLType(compositeType);
    const accessor = new Accessor({type, size: size * components});

    const varying = {location, name, accessor}; // Base values
    this.varyings.push(varying);
    this.varyingsByName[varying.name] = varying; // For quick name based lookup
  }

  _getDebugTable() {
    const table = {};

    for (const attributeInfo of this.attributeInfos) {
      if (attributeInfo) {
        table[`in ${attributeInfo.name}`] = {accessor: JSON.stringify(attributeInfo.accessor)};
      }
    }

    for (const varyingInfo of this.varyingInfos) {
      if (varyingInfo) {
        table[`out ${varyingInfo.name}`] = {accessor: JSON.stringify(varyingInfo.accessor)};
      }
    }

    return table;
  }
}
