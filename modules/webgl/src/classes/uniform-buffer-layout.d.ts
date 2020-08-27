/**
 * Std140 layout for uniforms
 */
export default class UniformBufferLayout {
  constructor(layout: any);
  getBytes(): number;
  getData(): any;
  getSubData(
    index: any
  ): {
    data: any;
    offset: any;
  };
  setUniforms(values: any): this;
  _setValue(key: any, value: any): void;
  _addUniform(key: any, uniformType: any): void;
  _alignTo(size: any, count: any): any;
}
