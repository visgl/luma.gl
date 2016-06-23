import {DRAW_MODES, isTypedArray} from './webgl/types';
import {uid} from './utils';
import assert from 'assert';

const ILLEGAL_ARG = 'Geometry: Illegal argument';

export default class Geometry {

  constructor({
    id = uid(),
    drawMode = 'TRIANGLES',
    vertexCount = undefined,
    isIndexed = false,
    attributes,
    ...attrs
  }) {
    assert(DRAW_MODES.includes(drawMode), ILLEGAL_ARG);

    this.id = id;
    this.drawMode = drawMode;
    this.vertexCount = vertexCount;
    this.isIndexed = isIndexed;
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

      // Support type arrays
      if (isTypedArray(attribute)) {
        attribute = {value: attribute};
      }

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
    let type;
    switch (attributeName) {
    case 'indices':
      type = type || 'indices';
      break;
    case 'texCoords':
      type = 'uvs';
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
    switch (type) {
    case 'indices':
      attribute.size = 1;
      attribute.target = 'ELEMENT_ARRAY_BUFFER';
      attribute.instanced = 0;
      this.isIndexed = true;
      break;
    case 'uvs':
      attribute.size = 2;
      break;
    }
    assert(attribute.value, `attribute ${attributeName} needs value`);
    assert(attribute.size, `attribute ${attributeName} needs size`);
  }
  /* eslint-enable default-case */
}
