/*
** Copyright (c) 2015 The Khronos Group Inc.
**
** Permission is hereby granted, free of charge, to any person obtaining a
** copy of this software and/or associated documentation files (the
** 'Materials'), to deal in the Materials without restriction, including
** without limitation the rights to use, copy, modify, merge, publish,
** distribute, sublicense, and/or sell copies of the Materials, and to
** permit persons to whom the Materials are furnished to do so, subject to
** the following conditions:
**
** The above copyright notice and this permission notice shall be included
** in all copies or substantial portions of the Materials.
**
** THE MATERIALS ARE PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
*/

// This file is a repackaging of the Khronos groups VertexArrayObject polyfill

/* eslint-disable camelcase, no-console */
/* global console */

const OES_vertex_array_object = 'OES_vertex_array_object';
const GL_VERTEX_ARRAY_BINDING = 0x85B5;

// A helper class
class VertexAttrib {
  constructor(gl) {
    this.enabled = false;
    this.buffer = null;
    this.size = 4;
    this.type = gl.FLOAT;
    this.normalized = false;
    this.stride = 16;
    this.offset = 0;

    this.cached = '';
    this.recache();
  }

  recache() {
    this.cached = [this.size, this.type, this.normalized, this.stride, this.offset].join(':');
  }
}

// The emulated VertexArrayObject instance
class WebGLVertexArrayObjectOES {
  constructor(ext) {
    const gl = ext.gl;

    this.ext = ext;
    this.isAlive = true;
    this.hasBeenBound = false;

    this.elementArrayBuffer = null;
    this.attribs = new Array(ext.maxVertexAttribs);
    for (let n = 0; n < this.attribs.length; n++) {
      const attrib = new VertexAttrib(gl);
      this.attribs[n] = attrib;
    }

    this.maxAttrib = 0;
  }
}

// The emulated OES_vertex_array_object **weblg extension**
class OESVertexArrayObject {
  constructor(gl) {
    this.gl = gl;

    wrapGLError(gl);

    this._polyfillWebGLRenderingContext(gl);
  }

  get VERTEX_ARRAY_BINDING_OES() {
    return GL_VERTEX_ARRAY_BINDING;
  }

  createVertexArrayOES() {
    const arrayObject = new WebGLVertexArrayObjectOES(this);
    this.vertexArrayObjects.push(arrayObject);
    return arrayObject;
  }

  deleteVertexArrayOES(arrayObject) {
    arrayObject.isAlive = false;
    this.vertexArrayObjects.splice(this.vertexArrayObjects.indexOf(arrayObject), 1);
    if (this.currentVertexArrayObject === arrayObject) {
      this.bindVertexArrayOES(null);
    }
  }

  isVertexArrayOES(arrayObject) {
    if (arrayObject && arrayObject instanceof WebGLVertexArrayObjectOES) {
      if (arrayObject.hasBeenBound && arrayObject.ext === this) {
        return true;
      }
    }
    return false;
  }

  /* eslint-disable max-statements, complexity, max-depth */
  bindVertexArrayOES(arrayObject) {
    const gl = this.gl;
    if (arrayObject && !arrayObject.isAlive) {
      synthesizeGLError(gl.INVALID_OPERATION,
        'bindVertexArrayOES: attempt to bind deleted arrayObject');
      return;
    }
    const original = this.original;

    const oldVAO = this.currentVertexArrayObject;
    this.currentVertexArrayObject = arrayObject || this.defaultVertexArrayObject;
    this.currentVertexArrayObject.hasBeenBound = true;
    const newVAO = this.currentVertexArrayObject;

    if (oldVAO === newVAO) {
      return;
    }

    if (!oldVAO || newVAO.elementArrayBuffer !== oldVAO.elementArrayBuffer) {
      original.bindBuffer.call(gl, gl.ELEMENT_ARRAY_BUFFER, newVAO.elementArrayBuffer);
    }

    let currentBinding = this.currentArrayBuffer;
    const maxAttrib = Math.max(oldVAO ? oldVAO.maxAttrib : 0, newVAO.maxAttrib);
    for (let n = 0; n <= maxAttrib; n++) {
      const attrib = newVAO.attribs[n];
      const oldAttrib = oldVAO ? oldVAO.attribs[n] : null;

      if (!oldVAO || attrib.enabled !== oldAttrib.enabled) {
        if (attrib.enabled) {
          original.enableVertexAttribArray.call(gl, n);
        } else {
          original.disableVertexAttribArray.call(gl, n);
        }
      }

      if (attrib.enabled) {
        let bufferChanged = false;
        if (!oldVAO || attrib.buffer !== oldAttrib.buffer) {
          if (currentBinding !== attrib.buffer) {
            original.bindBuffer.call(gl, gl.ARRAY_BUFFER, attrib.buffer);
            currentBinding = attrib.buffer;
          }
          bufferChanged = true;
        }

        if (bufferChanged || attrib.cached !== oldAttrib.cached) {
          original.vertexAttribPointer.call(
            gl, n, attrib.size, attrib.type, attrib.normalized, attrib.stride, attrib.offset);
        }
      }
    }

    if (this.currentArrayBuffer !== currentBinding) {
      original.bindBuffer.call(gl, gl.ARRAY_BUFFER, this.currentArrayBuffer);
    }
  }
  /* eslint-enable max-statements, complexity, max-depth */

  _polyfillWebGLRenderingContext(gl) {

    const original = this.original = {
      getParameter: gl.getParameter,
      enableVertexAttribArray: gl.enableVertexAttribArray,
      disableVertexAttribArray: gl.disableVertexAttribArray,
      bindBuffer: gl.bindBuffer,
      getVertexAttrib: gl.getVertexAttrib,
      vertexAttribPointer: gl.vertexAttribPointer
    };

    const self = this;

    Object.assign(gl, {
      getParameter(pname) {
        if (pname === self.VERTEX_ARRAY_BINDING_OES) {
          return self.currentVertexArrayObject === self.defaultVertexArrayObject ?
            null :
            self.currentVertexArrayObject;
        }
        return original.getParameter.apply(this, arguments);
      },

      enableVertexAttribArray(index) {
        const vao = self.currentVertexArrayObject;
        vao.maxAttrib = Math.max(vao.maxAttrib, index);
        const attrib = vao.attribs[index];
        attrib.enabled = true;
        return original.enableVertexAttribArray.apply(this, arguments);
      },

      disableVertexAttribArray(index) {
        const vao = self.currentVertexArrayObject;
        vao.maxAttrib = Math.max(vao.maxAttrib, index);
        const attrib = vao.attribs[index];
        attrib.enabled = false;
        return original.disableVertexAttribArray.apply(this, arguments);
      },

      bindBuffer(target, buffer) {
        switch (target) {
        case gl.ARRAY_BUFFER:
          self.currentArrayBuffer = buffer;
          break;
        case gl.ELEMENT_ARRAY_BUFFER:
          self.currentVertexArrayObject.elementArrayBuffer = buffer;
          break;
        default:
          throw new Error();
        }
        return original.bindBuffer.apply(this, arguments);
      },

      getVertexAttrib(index, pname) {
        const vao = self.currentVertexArrayObject;
        const attrib = vao.attribs[index];
        switch (pname) {
        case gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING:
          return attrib.buffer;
        case gl.VERTEX_ATTRIB_ARRAY_ENABLED:
          return attrib.enabled;
        case gl.VERTEX_ATTRIB_ARRAY_SIZE:
          return attrib.size;
        case gl.VERTEX_ATTRIB_ARRAY_STRIDE:
          return attrib.stride;
        case gl.VERTEX_ATTRIB_ARRAY_TYPE:
          return attrib.type;
        case gl.VERTEX_ATTRIB_ARRAY_NORMALIZED:
          return attrib.normalized;
        default:
          return original.getVertexAttrib.apply(this, arguments);
        }
      },

      /* eslint-disable max-params */
      vertexAttribPointer(indx, size, type, normalized, stride, offset) {
      /* eslint-enable max-params */
        const vao = self.currentVertexArrayObject;
        vao.maxAttrib = Math.max(vao.maxAttrib, indx);
        const attrib = vao.attribs[indx];
        attrib.buffer = self.currentArrayBuffer;
        attrib.size = size;
        attrib.type = type;
        attrib.normalized = normalized;
        attrib.stride = stride;
        attrib.offset = offset;
        attrib.recache();
        return original.vertexAttribPointer.apply(this, arguments);
      }
    });

    if (gl.instrumentExtension) {
      gl.instrumentExtension(this, OES_vertex_array_object);
    }

    // Note: gl.canvas is not available in headless gl
    if (gl.canvas) {
      gl.canvas.addEventListener('webglcontextrestored', function() {
        console.debug('OESVertexArrayObject emulation library context restored');
        self._reset();
      }, true);
    }

    this._reset();
  }

  _reset() {
    const contextWasLost = this.vertexArrayObjects !== undefined;
    if (contextWasLost) {
      for (let ii = 0; ii < this.vertexArrayObjects.length; ++ii) {
        this.vertexArrayObjects.isAlive = false;
      }
    }
    const gl = this.gl;
    this.maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);

    this.defaultVertexArrayObject = new WebGLVertexArrayObjectOES(this);
    this.currentVertexArrayObject = null;
    this.currentArrayBuffer = null;
    this.vertexArrayObjects = [this.defaultVertexArrayObject];

    this.bindVertexArrayOES(null);
  }
}

// ERROR emulation

const glErrorShadow = {};

function synthesizeGLError(err, optionalMessage) {
  glErrorShadow[err] = true;
  if (optionalMessage !== undefined) {
    console.error(optionalMessage);
  }
}

function wrapGLError(gl) {
  const originalFunc = gl.getError;
  Object.assign(gl, {
    getError() {
      let err;
      do {
        err = originalFunc.apply(gl);
        if (err !== gl.NO_ERROR) {
          glErrorShadow[err] = true;
        }
      } while (err !== gl.NO_ERROR);

      for (err in glErrorShadow) {
        if (glErrorShadow[err]) {
          delete glErrorShadow[err];
          return parseInt(err, 10);
        }
      }
      return gl.NO_ERROR;
    }
  });
}

// Install polyfill as extension
export default function polyfillVertexArrayObject(WebGLRenderingContext, gl) {
  // 1) WebGL2 supports VertexArrayObjects by default, so return
  // 2) If already installed, VERTEX_ARRAY_BINDING is defined
  const isWebGL2 = WebGLRenderingContext.VERTEX_ARRAY_BINDING === GL_VERTEX_ARRAY_BINDING;
  if (isWebGL2) {
    return;
  }

  const originalMethods = {};

  const POLYFILL_METHODS = {
    // TODO - not per extension spec
    VERTEX_ARRAY_BINDING: GL_VERTEX_ARRAY_BINDING,

    getSupportedExtensions() {
      const list = originalMethods.getSupportedExtensions.call(this) || [];
      if (list.indexOf(OES_vertex_array_object) < 0) {
        list.push(OES_vertex_array_object);
      }
      return list;
    },

    getExtension(name) {
      const ext = originalMethods.getExtension.call(this, name);
      if (ext) {
        return ext;
      }
      if (name !== OES_vertex_array_object) {
        return null;
      }

      if (!this.__OESVertexArrayObject) {
        // console.debug('Setup OES_vertex_array_object polyfill');
        this.__OESVertexArrayObject = new OESVertexArrayObject(this);
      }
      return this.__OESVertexArrayObject;
    }
  };

  // Prefer polyfilling on prototype, however headless gl defines methods on context instance.
  const contextUsesPrototype = Boolean(WebGLRenderingContext.prototype.getExtension);
  const polyfillContext = contextUsesPrototype ? WebGLRenderingContext.prototype : gl;
  Object.assign(originalMethods, {
    getSupportedExtensions: polyfillContext.getSupportedExtensions,
    getExtension: polyfillContext.getExtension
  });

  // Add polyfills, either once on prototype, or on each context if needed
  if (contextUsesPrototype) {
    if (WebGLRenderingContext.prototype.getExtension !== POLYFILL_METHODS.getExtension) {
      Object.assign(WebGLRenderingContext.prototype, POLYFILL_METHODS);
    }
  } else {
    Object.assign(gl, POLYFILL_METHODS);
  }
}
