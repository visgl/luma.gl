import glTFConfig from './gltf-config';
import {Buffer, Accessor, Texture2D, Model, Group} from 'luma.gl';

export default class glTFConfigLuma extends glTFConfig {
  constructor(gl) {
    super();
    this.gl = gl;
  }

  createBuffer(accessor) {
    accessor = this.createAccessor(accessor);
    return new Buffer(this.gl, accessor).setData();
  }

  createAccessor(accessor) {
    return new Accessor({
      type: accessor.componentType,
      size: accessor.components,
      offset: accessor.byteOffset || 0,
      stride: accessor.byteStride || 0
    });
  }

  createPrimitive(primitive) {
    // TODO - handle primitive.material
    return new Model(this.gl, {
      attributes: this.mapAttributes(primitive.attributes, primitive.indices),
      drawMode: primitive.mode
    });
  }

  createGroup(meshes) {
    return new Group(meshes);
  }

  mapAttributes(attributes, indices) {

  }

  createTexture(texture) {
    return Texture2D(this.gl, {
      parameters: texture.sampler

    });
  }

  createSampler(sampler) {
    return sampler;
  }

  needsPOT() {
    // Has a wrapping mode (either wrapS or wrapT) equal to REPEAT or MIRRORED_REPEAT, or
    // Has a minification filter (minFilter) that uses mipmapping
    // (NEAREST_MIPMAP_NEAREST, NEAREST_MIPMAP_LINEAR,
    // LINEAR_MIPMAP_NEAREST, or LINEAR_MIPMAP_LINEAR).
    return false;
  }
}
