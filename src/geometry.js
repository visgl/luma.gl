import {DRAW_MODES, isTypedArray} from './webgl/types';
import {uid, getArrayTypeFromGLType} from './utils';
import assert from 'assert';

const ILLEGAL_ARG = 'Geometry: Illegal argument';

export default class Geometry {

  constructor({
    id = uid('geometry'),
    drawMode = 'TRIANGLES',
    vertexCount = undefined,
    attributes,
    ...attrs
  }) {
    assert(DRAW_MODES.includes(drawMode), ILLEGAL_ARG);

    this.id = id;
    this.drawMode = drawMode;
    this.vertexCount = vertexCount;
    this.attributes = {};
    this.userData = {};
    Object.seal(this);

    if (attributes) {
      this.setAttributes(attributes);
    } else {
      this.setAttributes(attrs);
    }
  }

  setVertexCount(vertexCount) {
    this.vertexCount = vertexCount;
  }

  getVertexCount() {
    if (this.vertexCount !== undefined) {
      return this.vertexCount;
    } else if (this.attributes.indices) {
      return this.attributes.indices.value.length;
    } else if (this.attributes.vertices) {
      return this.attributes.vertices.value.length / 3;
    } else if (this.attributes.positions) {
      return this.attributes.positions.value.length / 3;
    }
    return false;
  }

  hasAttribute(attributeName) {
    return Boolean(this.attributes[attributeName]);
  }

  getAttribute(attributeName) {
    const attribute = this.attributes[attributeName];
    assert(attribute);
    return attribute.value;
  }

  getArray(attributeName) {
    const attribute = this.attributes[attributeName];
    assert(attribute);
    return attribute.value;
  }

  getAttributes() {
    return this.attributes;
  }

  // Attribute
  // value: typed array
  // type: indices, vertices, uvs
  // size: elements per vertex
  // target: WebGL buffer type (string or constant)
  setAttributes(attributes) {
    for (const attributeName in attributes) {
      let attribute = attributes[attributeName];

      // Wrap "unwrapped" arrays and try to autodetect their type
      if (Array.isArray(attribute) || isTypedArray(attribute)) {
        attribute = {
          value: attribute
          // TODO - autodetect attribute.type from Array type
        };
      }
      assert(Array.isArray(attribute.value) || isTypedArray(attribute.value),
        `attribute ${attributeName}: must be an array or an object` +
        `with value as typed array`);

      this._autoDetectAttribute(attributeName, attribute);

      this.attributes[attributeName] = {
        ...attribute,
        instanced: attribute.instanced || 0
      };
    }
    return this;
  }

  // Check for well known attribute names
  /* eslint-disable default-case */
  _autoDetectAttribute(attributeName, attribute) {

    // const arrayType = getTypeFromArray(attribute.value);
    // attribute.type = attribute.type || arrayType;
    // assert(attribute.type === arrayType);

    let category;
    switch (attributeName) {
    case 'indices':
      category = category || 'indices';
      break;
    case 'texCoords':
      category = 'uvs';
      break;
    case 'vertices':
    case 'positions':
    case 'normals':
    case 'pickingColors':
      category = 'vectors';
      break;
    }

    // Check for categorys
    switch (category) {
    case 'vectors':
      attribute.size = attribute.size || 3;
      attribute.type = attribute.type || 'FLOAT';
      break;
    case 'uvs':
      attribute.size = attribute.size || 2;
      attribute.type = attribute.type || 'FLOAT';
      break;
    case 'indices':
      attribute.size = attribute.size || 1;
      attribute.type = attribute.type || 'UNSIGNED_SHORT';
      attribute.target = attribute.target || 'ELEMENT_ARRAY_BUFFER';
      attribute.instanced = attribute.instanced || 0;
      break;
    }

    assert(attribute.size, `attribute ${attributeName} needs size`);

    // Convert Array to typed array if possible
    if (Array.isArray(attribute.value)) {
      const ArrayType = getArrayTypeFromGLType(attribute.type);
      attribute.value = new ArrayType(attribute.value);
    }

  }
  /* eslint-enable default-case */
}
