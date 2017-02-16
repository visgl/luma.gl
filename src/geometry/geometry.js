import {uid} from '../utils';
import {log} from '../utils';
import assert from 'assert';

const ILLEGAL_ARG = 'Geometry: Illegal argument';

export default class Geometry {

  constructor(opts = {}) {
    const {
      id,
      drawMode = 'TRIANGLES',
      vertexCount = undefined,
      attributes
    } = opts;

    assert(drawMode, ILLEGAL_ARG);

    this.id = id || uid(this.constructor.name);
    this.drawMode = drawMode;
    this.vertexCount = vertexCount;
    this.attributes = {};
    this.needsRedraw = true;
    this.userData = {};
    Object.seal(this);

    if (attributes) {
      this.setAttributes(attributes);
    } else {
      log.once('Geometry: top-level attributes are deprecated, use "attributes" param');
      // TODO this is deprecated
      delete opts.id;
      delete opts.drawMode;
      delete opts.vertexCount;
      delete opts.attributes;
      this.setAttributes(opts);
    }
  }

  setNeedsRedraw(redraw = true) {
    this.needsRedraw = redraw;
    return this;
  }

  getNeedsRedraw({clearRedrawFlags = false} = {}) {
    let redraw = false;
    redraw = redraw || this.needsRedraw;
    this.needsRedraw = this.needsRedraw && !clearRedrawFlags;
    return redraw;
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
      attribute = ArrayBuffer.isView(attribute) ? {value: attribute} : attribute;

      assert(ArrayBuffer.isView(attribute.value),
        `${this._print(attributeName)}: must be typed array or object with value as typed array`);

      this._autoDetectAttribute(attributeName, attribute);

      this.attributes[attributeName] = Object.assign({}, attribute, {
        instanced: attribute.instanced || 0
      });
    }
    this.setNeedsRedraw();
    return this;
  }

  // Check for well known attribute names
  /* eslint-disable default-case, complexity */
  _autoDetectAttribute(attributeName, attribute) {
    let category;
    switch (attributeName) {
    case 'indices':
      category = category || 'indices';
      break;
    case 'texCoords':
    case 'texCoord1':
    case 'texCoord2':
    case 'texCoord3':
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
      break;
    case 'uvs':
      attribute.size = attribute.size || 2;
      break;
    case 'indices':
      attribute.size = attribute.size || 1;
      attribute.isIndexed = attribute.isIndexed || true;
      assert(
        attribute.value instanceof Uint16Array ||
        attribute.value instanceof Uint32Array,
        'attribute array for "indices" must be of integer type'
      );
      break;
    }

    assert(attribute.size, `attribute ${attributeName} needs size`);
  }
  /* eslint-enable default-case, complexity */

  _print(attributeName) {
    return `Geometry ${this.id} attribute ${attributeName}`;
  }
}
