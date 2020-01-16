/*
** Copyright (c) 2015 The Khronos Group Inc.
**
** Permission is hereby granted, free of charge, to any person obtaining a
** copy of this software and/or associated documentation files (the
** "Materials"), to deal in the Materials without restriction, including
** without limitation the rights to use, copy, modify, merge, publish,
** distribute, sublicense, and/or sell copies of the Materials, and to
** permit persons to whom the Materials are furnished to do so, subject to
** the following conditions:
**
** The above copyright notice and this permission notice shall be included
** in all copies or substantial portions of the Materials.
**
** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
*/

// Modified to use ES6 and polyfill a provided context rather than
// the global class.

import {global} from 'probe.gl/env';

const glErrorShadow = {};

function error(msg) {
  if (global.console && global.console.error) {
    global.console.error(msg);
  }
}

function log(msg) {
  if (global.console && global.console.log) {
    global.console.log(msg);
  }
}

function synthesizeGLError(err, opt_msg) {
  glErrorShadow[err] = true;
  if (opt_msg !== undefined) {
    error(opt_msg);
  }
}

function wrapGLError(gl) {
  const f = gl.getError;
  gl.getError = function getError() {
    let err;
    do {
      err = f.apply(gl);
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
  };
}

const WebGLVertexArrayObjectOES = function WebGLVertexArrayObjectOES(ext) {
  const gl = ext.gl;

  this.ext = ext;
  this.isAlive = true;
  this.hasBeenBound = false;

  this.elementArrayBuffer = null;
  this.attribs = new Array(ext.maxVertexAttribs);
  for (let n = 0; n < this.attribs.length; n++) {
    const attrib = new WebGLVertexArrayObjectOES.VertexAttrib(gl);
    this.attribs[n] = attrib;
  }

  this.maxAttrib = 0;
};

WebGLVertexArrayObjectOES.VertexAttrib = function VertexAttrib(gl) {
  this.enabled = false;
  this.buffer = null;
  this.size = 4;
  this.type = gl.FLOAT;
  this.normalized = false;
  this.stride = 16;
  this.offset = 0;

  this.cached = '';
  this.recache();
};
WebGLVertexArrayObjectOES.VertexAttrib.prototype.recache = function recache() {
  this.cached = [this.size, this.type, this.normalized, this.stride, this.offset].join(':');
};

const OESVertexArrayObject = function OESVertexArrayObject(gl) {
  const self = this;
  this.gl = gl;

  wrapGLError(gl);

  const original = (this.original = {
    getParameter: gl.getParameter,
    enableVertexAttribArray: gl.enableVertexAttribArray,
    disableVertexAttribArray: gl.disableVertexAttribArray,
    bindBuffer: gl.bindBuffer,
    getVertexAttrib: gl.getVertexAttrib,
    vertexAttribPointer: gl.vertexAttribPointer
  });

  gl.getParameter = function getParameter(pname) {
    if (pname === self.VERTEX_ARRAY_BINDING_OES) {
      if (self.currentVertexArrayObject === self.defaultVertexArrayObject) {
        return null;
      }
      return self.currentVertexArrayObject;
    }
    return original.getParameter.apply(this, arguments);
  };

  gl.enableVertexAttribArray = function enableVertexAttribArray(index) {
    const vao = self.currentVertexArrayObject;
    vao.maxAttrib = Math.max(vao.maxAttrib, index);
    const attrib = vao.attribs[index];
    attrib.enabled = true;
    return original.enableVertexAttribArray.apply(this, arguments);
  };
  gl.disableVertexAttribArray = function disableVertexAttribArray(index) {
    const vao = self.currentVertexArrayObject;
    vao.maxAttrib = Math.max(vao.maxAttrib, index);
    const attrib = vao.attribs[index];
    attrib.enabled = false;
    return original.disableVertexAttribArray.apply(this, arguments);
  };

  gl.bindBuffer = function bindBuffer(target, buffer) {
    switch (target) {
      case gl.ARRAY_BUFFER:
        self.currentArrayBuffer = buffer;
        break;
      case gl.ELEMENT_ARRAY_BUFFER:
        self.currentVertexArrayObject.elementArrayBuffer = buffer;
        break;
      default:
    }
    return original.bindBuffer.apply(this, arguments);
  };

  gl.getVertexAttrib = function getVertexAttrib(index, pname) {
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
  };

  gl.vertexAttribPointer = function vertexAttribPointer(
    indx,
    size,
    type,
    normalized,
    stride,
    offset
  ) {
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
  };

  if (gl.instrumentExtension) {
    gl.instrumentExtension(this, 'OES_vertex_array_object');
  }

  // undefined for headless gl
  if (gl.canvas) {
    gl.canvas.addEventListener(
      'webglcontextrestored',
      () => {
        log('OESVertexArrayObject emulation library context restored');
        self.reset_();
      },
      true
    );
  }

  this.reset_();
};

OESVertexArrayObject.prototype.VERTEX_ARRAY_BINDING_OES = 0x85b5;

OESVertexArrayObject.prototype.reset_ = function reset_() {
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
};

OESVertexArrayObject.prototype.createVertexArrayOES = function createVertexArrayOES() {
  const arrayObject = new WebGLVertexArrayObjectOES(this);
  this.vertexArrayObjects.push(arrayObject);
  return arrayObject;
};

OESVertexArrayObject.prototype.deleteVertexArrayOES = function deleteVertexArrayOES(arrayObject) {
  arrayObject.isAlive = false;
  this.vertexArrayObjects.splice(this.vertexArrayObjects.indexOf(arrayObject), 1);
  if (this.currentVertexArrayObject === arrayObject) {
    this.bindVertexArrayOES(null);
  }
};

OESVertexArrayObject.prototype.isVertexArrayOES = function isVertexArrayOES(arrayObject) {
  if (arrayObject && arrayObject instanceof WebGLVertexArrayObjectOES) {
    if (arrayObject.hasBeenBound && arrayObject.ext === this) {
      return true;
    }
  }
  return false;
};

OESVertexArrayObject.prototype.bindVertexArrayOES = function bindVertexArrayOES(arrayObject) {
  const gl = this.gl;
  if (arrayObject && !arrayObject.isAlive) {
    synthesizeGLError(
      gl.INVALID_OPERATION,
      'bindVertexArrayOES: attempt to bind deleted arrayObject'
    );
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
          gl,
          n,
          attrib.size,
          attrib.type,
          attrib.normalized,
          attrib.stride,
          attrib.offset
        );
      }
    }
  }

  if (this.currentArrayBuffer !== currentBinding) {
    original.bindBuffer.call(gl, gl.ARRAY_BUFFER, this.currentArrayBuffer);
  }
};

export function polyfillVertexArrayObject(gl) {
  if (typeof gl.createVertexArray === 'function') {
    // VAOs directly supported on object (i.e. WebGL 2 context)
    return;
  }

  const original_getSupportedExtensions = gl.getSupportedExtensions;
  gl.getSupportedExtensions = function getSupportedExtensions() {
    const list = original_getSupportedExtensions.call(this) || [];
    if (list.indexOf('OES_vertex_array_object') < 0) {
      list.push('OES_vertex_array_object');
    }
    return list;
  };

  const original_getExtension = gl.getExtension;
  gl.getExtension = function getExtension(name) {
    const ext = original_getExtension.call(this, name);
    if (ext) {
      return ext;
    }
    if (name !== 'OES_vertex_array_object') {
      return null;
    }

    if (!gl.__OESVertexArrayObject) {
      this.__OESVertexArrayObject = new OESVertexArrayObject(this);
    }
    return this.__OESVertexArrayObject;
  };
}
