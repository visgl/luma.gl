// Contains metadata describing attribute configurations for a program's shaders
// Much of this is automatically extracted from shaders after program linking
// import Accessor from './accessor';
import type {AttributeBinding, VaryingBinding} from '@luma.gl/api';
import {getProgramBindings} from '@luma.gl/webgl';
import type Program from './program';

/**
 * is a mechanism for taking a program object and querying information
 * about it, so as to be able to interface and interact with it.
 * For example, if there is a uniform, you may need to query its
 * location so that you can set its value.
 * 
 * @deprecated Use ShaderLayout
 */
export default class ProgramConfiguration {
  id: string;
  attributeInfos: AttributeBinding[] = [];
  attributeInfosByName: Record<string, AttributeBinding> = {};
  // Locations may not be contiguous the case of matrix attributes
  // so keep a separate location->attribute map.
  attributeInfosByLocation: AttributeBinding[] = [];
  varyingInfos: VaryingBinding[] = [];
  varyingInfosByName: Record<string, VaryingBinding> = {};

  constructor(program: Program) {
    this.id = program.id;
    Object.seal(this);

    const bindings = getProgramBindings(program.gl2, program.handle);

    this.attributeInfos = bindings.attributes;
    for (const attributeInfo of bindings.attributes) {
      this.attributeInfosByName[attributeInfo.name] = attributeInfo;
      this.attributeInfosByLocation[attributeInfo.location] = attributeInfo;
    }

    for (const varyingInfo of bindings.varyings) {
      this.varyingInfosByName[varyingInfo.name] = varyingInfo;
    }
  }

  getAttributeInfo(locationOrName: number | string): AttributeBinding {
    const location = Number(locationOrName);
    if (Number.isFinite(location)) {
      return this.attributeInfosByLocation[location];
    }
    return this.attributeInfosByName[locationOrName] || null;
  }

  // Resolves an attribute name or index to an index
  getAttributeLocation(locationOrName: number | string): number {
    const attributeInfo = this.getAttributeInfo(locationOrName);
    return attributeInfo ? attributeInfo.location : -1;
  }

  getAttributeAccessor(locationOrName: number | string) {
    const attributeInfo = this.getAttributeInfo(locationOrName);
    return attributeInfo ? attributeInfo.accessor : null;
  }

  getVaryingInfo(locationOrName: number | string): VaryingBinding {
    const location = Number(locationOrName);
    if (Number.isFinite(location)) {
      return this.varyingInfos[location];
    }
    return this.varyingInfosByName[locationOrName] || null;
  }

  getVaryingIndex(locationOrName: number | string): number {
    const varying = this.getVaryingInfo(locationOrName);
    return varying ? varying.location : -1;
  }

  getVaryingAccessor(locationOrName: number | string) {
    const varying = this.getVaryingInfo(locationOrName);
    return varying ? varying.accessor : null;
  }
}
