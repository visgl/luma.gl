/*
DEBUG CODE

const GL_VERTEX_ATTRIB_ARRAY_ENABLED = 0x8622;
const GL_VERTEX_ATTRIB_ARRAY_SIZE = 0x8623;
const GL_VERTEX_ATTRIB_ARRAY_STRIDE = 0x8624;
const GL_VERTEX_ATTRIB_ARRAY_TYPE = 0x8625;
const GL_VERTEX_ATTRIB_ARRAY_NORMALIZED = 0x886A;
const GL_VERTEX_ATTRIB_ARRAY_POINTER = 0x8645;
const GL_VERTEX_ATTRIB_ARRAY_BUFFER_BINDING = 0x889F;

const GL_VERTEX_ATTRIB_ARRAY_INTEGER = 0x88FD;
const GL_VERTEX_ATTRIB_ARRAY_DIVISOR = 0x88FE;

const PARAMETERS = [
  GL_VERTEX_ATTRIB_ARRAY_ENABLED,
  GL_VERTEX_ATTRIB_ARRAY_SIZE,
  GL_VERTEX_ATTRIB_ARRAY_STRIDE,
  GL_VERTEX_ATTRIB_ARRAY_TYPE,
  GL_VERTEX_ATTRIB_ARRAY_NORMALIZED,
  GL_VERTEX_ATTRIB_ARRAY_POINTER,
  GL_VERTEX_ATTRIB_ARRAY_BUFFER_BINDING,

  GL_VERTEX_ATTRIB_ARRAY_INTEGER,
  GL_VERTEX_ATTRIB_ARRAY_DIVISOR
];

// TODO - is this used?
function _getData(vertexArray) {
  return new Array(this.MAX_ATTRIBUTES).fill(0).map((_, location) => {
    const result = {};
    PARAMETERS.forEach(parameter => {
      result[getKey(vertexArray.gl, parameter)] = vertexArray.getParameter(parameter, {location});
    });
    return result;
  });
}
*/

// CUT FROM PROGRAM

  // TO BE REMOVED

  /*
  // query attribute locations and build name to location map.
  _readAttributeMapFromLinkedProgram() {
    this._attributeToLocationMap = {};
    this._attributeCount = this.getAttributeCount();
    for (let location = 0; location < this._attributeCount; location++) {
      const name = this.getAttributeInfo(location).name;
      this._attributeToLocationMap[name] = this.getAttributeLocation(name);
    }
    this._warnedLocations = {};
  }

  _sortBuffersByLocation(buffers) {
    let elements = null;
    let locations = [];

    // Reutrn early if no buffers to be bound.
    if (isObjectEmpty(buffers)) {
      return {locations, elements};
    }

    locations = new Array(this._attributeCount);
    for (const bufferName in buffers) {
      const buffer = buffers[bufferName];
      const location = this._attributeToLocationMap[bufferName];
      if (location === undefined) {
        if (buffer.target === GL.ELEMENT_ARRAY_BUFFER && elements) {
          throw new Error(`${this._print(bufferName)} duplicate GL.ELEMENT_ARRAY_BUFFER`);
        } else if (buffer.target === GL.ELEMENT_ARRAY_BUFFER) {
          elements = bufferName;
        } else if (!this._warnedLocations[location]) {
          log.log(2, `${this._print(bufferName)} not used`)();
          this._warnedLocations[location] = true;
        }
      } else {
        if (buffer.target === GL.ELEMENT_ARRAY_BUFFER) {
          throw new Error(`${this._print(bufferName)}:${location} ` +
            'has both location and type gl.ELEMENT_ARRAY_BUFFER');
        }
        locations[location] = bufferName;
      }
    }
    return {locations, elements};
  }

  _print(bufferName) {
    return `Program ${this.id}: Attribute ${bufferName}`;
  }
  */

  /**
   * Attach a map of Buffers values to a program
   * Only attributes with names actually present in the linked program
   * will be updated. Other supplied buffers will be ignored.
   *
   * @param {Object} attributes - An object map with attribute names being keys
   *  and values are expected to be instances of Attribute.
   * @returns {Program} Returns itself for chaining.
   *
  setAttributes(attributes, {clear = true, drawParams = {}} = {}) {
    if (clear) {
      this.vertexArray.clearBindings();
    }

    // indexing is autodetected - buffer with target gl.ELEMENT_ARRAY_BUFFER
    // index type is saved for drawElement calls
    drawParams.isInstanced = false;
    drawParams.isIndexed = false;
    drawParams.indexType = null;

    const {locations, elements} = this._sortBuffersByLocation(attributes);

    // Process locations in order
    for (let location = 0; location < locations.length; ++location) {
      const attributeName = locations[location];
      const attribute = attributes[attributeName];
      // DISABLE MISSING ATTRIBUTE
      if (!attribute) {
        this.vertexArray.disable(location);
      } else if (attribute.isGeneric) {
        this._setAttributeToGeneric({location, array: attribute.value});
      } else {
        this._setAttributeToBuffer({location, buffer: attribute.getBuffer(), layout: attribute});
        Object.assign(drawParams, {
          isInstanced: attribute.instanced > 0
        });
      }
    }

    // SET ELEMENTS ARRAY BUFFER
    if (elements) {
      const attribute = attributes[elements];
      attribute.getBuffer().bind();
      drawParams.isIndexed = true;
      drawParams.indexType = attribute.type;
    }

    return this;
  }

  /**
   * Attach a map of Buffers values to a program
   * Only attributes with names actually present in the linked program
   * will be updated. Other supplied buffers will be ignored.
   *
   * @param {Object} buffers - An object map with attribute names being keys
   *  and values are expected to be instances of Buffer.
   * @returns {Program} Returns itself for chaining.
   *
  /* eslint-disable max-statements *
  setBuffers(buffers, {clear = true, drawParams = {}} = {}) {
    log.deprecated('Program: `setBuffers`', '`setAttributes`');

    if (clear) {
      this.vertexArray.clearBindings();
    }

    // indexing is autodetected - buffer with target gl.ELEMENT_ARRAY_BUFFER
    // index type is saved for drawElement calls
    drawParams.isInstanced = false;
    drawParams.isIndexed = false;
    drawParams.indexType = null;

    const {locations, elements} = this._sortBuffersByLocation(buffers);

    // Process locations in order
    for (let location = 0; location < locations.length; ++location) {
      const bufferName = locations[location];
      const buffer = buffers[bufferName];
      // DISABLE MISSING ATTRIBUTE
      if (!buffer) {
        this.vertexArray.disable(location);
      } else if (buffer instanceof Buffer) {
        this._setAttributeToBuffer({location, buffer, layout: buffer.layout});
        Object.assign(drawParams, {
          isInstanced: buffer.layout.instanced > 0
        });
      } else {
        this._setAttributeToGeneric({location, array: buffer});
      }
    }

    // SET ELEMENTS ARRAY BUFFER
    if (elements) {
      const buffer = buffers[elements];
      buffer.bind();
      drawParams.isIndexed = true;
      drawParams.indexType = buffer.layout.type;
    }

    return this;
  }
  /* eslint-enable max-statements *

  /*
   * @returns {Program} Returns itself for chaining.
   *
  unsetBuffers() {
    const length = this._attributeCount;
    for (let i = 1; i < length; ++i) {
      // this.vertexArray.setDivisor(i, 0);
      this.vertexArray.disable(i);
    }

    // Clear elements buffer
    this.gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
    return this;
  }

  // Generates warning if a vertex shader attribute is not setup.
  checkAttributeBindings(vertexArray = this.vertexArray) {
    const filledLocations = vertexArray.filledLocations;
    for (const attributeName in this._attributeToLocationMap) {
      const location = this._attributeToLocationMap[attributeName];
      if (!filledLocations[location] && !this._warnedLocations[location]) {
        // throw new Error(`Program ${this.id}: ` +
        //   `Attribute ${location}:${attributeName} not supplied`);
        log.warn(`Program ${this.id}: Attribute ${location}:${attributeName} not supplied`)();
        this._warnedLocations[location] = true;
      }
    }
    return this;
  }

  _setAttributeToGeneric({location, array}) {
    this.vertexArray.setGeneric({location, array});
    this.vertexArray.disable(location, true);
  }

  _setAttributeToBuffer({location, buffer, layout}) {
    const divisor = layout.instanced ? 1 : 0;
    this.vertexArray.setBuffer({location, buffer, layout});
    this.vertexArray.setDivisor(location, divisor);
    this.vertexArray.enable(location);
  }
  */

  // CUT FROM VERTEX ARRAY

  /**
   * Attach a map of Buffers values to a program
   * Only attributes with names actually present in the linked program
   * will be updated. Other supplied buffers will be ignored.
   *
   * @param {Object} attributes - An object map with attribute names being keys
   *  and values are expected to be instances of Attribute.
   * @returns {Program} Returns itself for chaining.
   */
  // setAttributes(attributes, {drawParams = {}, disable = false} = {}) {
  //   // indexing is autodetected - buffer with target gl.ELEMENT_ARRAY_BUFFER
  //   // index type is saved for drawElement calls
  //   drawParams.isInstanced = false;
  //   drawParams.isIndexed = false;
  //   drawParams.indexType = null;

  //   const {locations, elements} = this._sortBuffersByLocation(attributes);

  //   // Process locations in order
  //   for (let location = 0; location < locations.length; ++location) {
  //     const attributeName = locations[location];
  //     const attribute = attributes[attributeName];

  //     if (attribute) {
  //       this.setAttribute(attributeName, attributeName, {drawParams});
  //     } else if (disable) {
  //       // OPTIONALLY DISABLE MISSING ATTRIBUTE
  //       this.disable(location);
  //     }
  //   }

  //   // SET ELEMENTS ARRAY BUFFER
  //   if (elements) {
  //     const attribute = attributes[elements];
  //     attribute.getBuffer().bind();
  //     drawParams.isIndexed = true;
  //     drawParams.indexType = attribute.type;
  //   }

  //   /* setBuffers
  //   const {locations, elements} = this._getLocations(buffers);

  //   this.bind(() => {

  //     // Process locations in order
  //     for (const location in locations) {
  //       const bufferData = locations[location];
  //       if (bufferData) {
  //         const {buffer, layout} = this._getBufferAndLayout(bufferData);
  //         this.setBuffer({location, buffer, layout});
  //         this.setDivisor(location, layout.instanced ? 1 : 0);
  //         this.enable(location);
  //       } else {
  //         // DISABLE MISSING ATTRIBUTE
  //         this.disable(location);
  //       }
  //     }
  //     this.buffers = buffers;

  //   });

  //   if (elements) {
  //     this.setElements(elements);
  //   }

  //   */
  //   return this;
  // }

  /**
   * Attach a map of Buffers values to a program
   * Only attributes with names actually present in the linked program
   * will be updated. Other supplied buffers will be ignored.
   *
   * @param {Object} buffers - An object map with attribute names being keys
   *  and values are expected to be instances of Buffer.
   * @returns {Program} Returns itself for chaining.
   *
  /* eslint-disable max-statements *
  setBuffers(buffers, {clear = true, drawParams = {}} = {}) {
    log.deprecated('Program: `setBuffers`', '`setAttributes`');

    if (clear) {
      this.clearBindings();
    }

    // indexing is autodetected - buffer with target gl.ELEMENT_ARRAY_BUFFER
    // index type is saved for drawElement calls
    drawParams.isInstanced = false;
    drawParams.isIndexed = false;
    drawParams.indexType = null;

    const {locations, elements} = this._sortBuffersByLocation(buffers);

    // Process locations in order
    for (let location = 0; location < locations.length; ++location) {
      const bufferName = locations[location];
      const buffer = buffers[bufferName];
      // DISABLE MISSING ATTRIBUTE
      if (!buffer) {
        this.disable(location);
      } else if (buffer instanceof Buffer) {
        this._setAttributeToBuffer({location, buffer, layout: buffer.layout});
        Object.assign(drawParams, {
          isInstanced: buffer.layout.instanced > 0
        });
      } else {
        this._setAttributeToGeneric({location, array: buffer});
      }
    }

    // SET ELEMENTS ARRAY BUFFER
    if (elements) {
      const buffer = buffers[elements];
      buffer.bind();
      drawParams.isIndexed = true;
      drawParams.indexType = buffer.layout.type;
    }

    return this;
  }
  /* eslint-enable max-statements */

  /**
   * Attach a map of Buffers values to a program
   * Only attributes with names actually present in the linked program
   * will be updated. Other supplied buffers will be ignored.
   *
   * @param {Object} attributes - An object map with attribute names being keys
   *  and values are expected to be instances of Attribute.
   * @returns {Program} Returns itself for chaining.
   *
  setAttributes(attributes, {clear = true, drawParams = {}} = {}) {
    if (clear) {
      this.clearBindings();
    }

    // indexing is autodetected - buffer with target gl.ELEMENT_ARRAY_BUFFER
    // index type is saved for drawElement calls
    drawParams.isInstanced = false;
    drawParams.isIndexed = false;
    drawParams.indexType = null;

    const {locations, elements} = this._sortBuffersByLocation(attributes);

    // Process locations in order
    for (let location = 0; location < locations.length; ++location) {
      const attributeName = locations[location];
      const attribute = attributes[attributeName];
      // DISABLE MISSING ATTRIBUTE
      if (!attribute) {
        this.disable(location);
      } else if (attribute.isGeneric) {
        this._setAttributeToGeneric({location, array: attribute.value});
      } else {
        this._setAttributeToBuffer({location, buffer: attribute.getBuffer(), layout: attribute});
        Object.assign(drawParams, {
          isInstanced: attribute.instanced > 0
        });
      }
    }

    // SET ELEMENTS ARRAY BUFFER
    if (elements) {
      const attribute = attributes[elements];
      attribute.getBuffer().bind();
      drawParams.isIndexed = true;
      drawParams.indexType = attribute.type;
    }

    return this;
  }
  */
