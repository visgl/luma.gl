// Contains metadata describing attribute configurations for a program's shaders
// Much of this is automatically extracted from shaders after program linking
import {decomposeCompositeGLType} from '../webgl-utils/attribute-utils';
import Accessor from './accessor';

export default class ProgramConfiguration {

  constructor(program, varyingMap = {}) {
    this.attributeInfos = [];
    this.attributeInfosByName = {};
    this.varyingMap = varyingMap;
    Object.seal(this);
    this._readAttributesFromProgram(program);
  }

  getAttributeInfo(locationOrName) {
    const location = Number(locationOrName);
    if (Number.isFinite(location)) {
      return this.attributeInfos[location];
    }
    return this.attributeInfosByName[locationOrName] || null;
  }

  getLocation(locationOrName) {
    const attributeInfo = this.getAttributeInfo();
    return attributeInfo ? attributeInfo.location : -1;
  }

  // linkProgram needs to have been called, although linking does not need to have been successful
  _readAttributesFromProgram(program) {
    const {gl} = program;
    const count = gl.getProgramParameter(program.handle, gl.ACTIVE_ATTRIBUTES);

    for (let location = 0; location < count; location++) {
      const {name, type, size} = gl.getActiveAttrib(program.handle, location);
      this._addAttribute(location, name, type, size);
    }
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
}

