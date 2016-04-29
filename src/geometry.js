import {DRAW_MODES, isTypedArray} from './webgl/types';
import {uid} from './utils';
import assert from 'assert';

const ILLEGAL_ARG = 'Geometry: Illegal argument';

export default class Geometry {

  constructor({
    id = uid(),
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

    this.setAttributes(attributes);
    this.setAttributes(attrs);
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

  // Attribute
  // value: typed array
  // type: indices, vertices, uvs
  // size: elements per vertex
  // bufferType: WebGL buffer type (string or constant)
  /* eslint-disable default-case */
  setAttributes(attributes) {
    for (const attributeName in attributes) {
      let attribute = attributes[attributeName];
      // Support type arrays
      if (isTypedArray(attribute)) {
        attribute = {value: attribute};
      }
      // Check for well known attribute names
      switch (attributeName) {
      case 'indices':
        attribute.type = attribute.type || 'indices';
        break;
      case 'texCoords':
        attribute.type = 'uvs';
        break;
      case 'vertices':
      case 'positions':
      case 'colors':
      case 'normals':
      case 'pickingColors':
        attribute.size = 3;
        break;
      }

      // Check for types
      switch (attribute.type) {
      case 'indices':
        attribute.size = 1;
        attribute.bufferType = 'ELEMENT_ARRAY_BUFFER';
        attribute.instanced = 0;
        break;
      case 'uvs':
        attribute.size = 2;
        break;
      }
      assert(attribute.value, `attribute ${attributeName} needs value`);
      assert(attribute.size, `attribute ${attributeName} needs size`);

      this.attributes[attributeName] = {
        ...attribute,
        instanced: attribute.instanced || 0
      };
    }
    return this;
  }
  /* eslint-enable default-case */

  getAttributes() {
    return this.attributes;
  }

  // TODO - remove code below
  get vertices() {
    return this.attributes.vertices;
  }

  get normals() {
    return this.attributes.normals;
  }

  get colors() {
    return this.attributes.colors;
  }

  get texCoords() {
    return this.attributes.texCoords;
  }

  get indices() {
    return this.attributes.indices;
  }

}
