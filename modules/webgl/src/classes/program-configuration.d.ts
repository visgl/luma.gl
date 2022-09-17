/**
 * is a mechanism for taking a program object and querying information 
 * about it, so as to be able to interface and interact with it. 
 * For example, if there is a uniform, you may need to query its 
 * location so that you can set its value.
 */
export default class ProgramConfiguration {
  constructor(program: any);
  getAttributeInfo(locationOrName: any): any;
  getAttributeLocation(locationOrName: any): any;
  getAttributeAccessor(locationOrName: any): any;
  getVaryingInfo(locationOrName: any): any;
  getVaryingIndex(locationOrName: any): any;
  getVaryingAccessor(locationOrName: any): any;
}
