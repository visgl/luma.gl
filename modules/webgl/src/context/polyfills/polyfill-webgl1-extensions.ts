// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Goal is to make WebGL2 contexts look like WebGL1
// @note Partly inspired by with some older code from the `regl` library

/* eslint-disable camelcase */

import {GL} from '@luma.gl/constants';

// webgl1 extensions natively supported by webgl2
const WEBGL1_STATIC_EXTENSIONS = {
  WEBGL_depth_texture: {
    UNSIGNED_INT_24_8_WEBGL: GL.UNSIGNED_INT_24_8
  } as const satisfies WEBGL_depth_texture,
  OES_element_index_uint: {} as const satisfies OES_element_index_uint,
  OES_texture_float: {} as const satisfies OES_texture_float,
  OES_texture_half_float: {
    // @ts-expect-error different numbers?
    HALF_FLOAT_OES: GL.HALF_FLOAT
  } as const satisfies OES_texture_half_float,
  EXT_color_buffer_float: {} as const satisfies EXT_color_buffer_float,
  OES_standard_derivatives: {
    FRAGMENT_SHADER_DERIVATIVE_HINT_OES: GL.FRAGMENT_SHADER_DERIVATIVE_HINT
  } as const satisfies OES_standard_derivatives,
  EXT_frag_depth: {} as const satisfies EXT_frag_depth,
  EXT_blend_minmax: {
    MIN_EXT: GL.MIN,
    MAX_EXT: GL.MAX
  } as const satisfies EXT_blend_minmax,
  EXT_shader_texture_lod: {} as const satisfies EXT_shader_texture_lod
};

const getWEBGL_draw_buffers = (gl: WebGL2RenderingContext) =>
  ({
    drawBuffersWEBGL(buffers: number[]) {
      return gl.drawBuffers(buffers);
    },
    COLOR_ATTACHMENT0_WEBGL: GL.COLOR_ATTACHMENT0,
    COLOR_ATTACHMENT1_WEBGL: GL.COLOR_ATTACHMENT1,
    COLOR_ATTACHMENT2_WEBGL: GL.COLOR_ATTACHMENT2,
    COLOR_ATTACHMENT3_WEBGL: GL.COLOR_ATTACHMENT3
  }) as const satisfies Partial<WEBGL_draw_buffers>; // - too many fields

const getOES_vertex_array_object = (gl: WebGL2RenderingContext) =>
  ({
    VERTEX_ARRAY_BINDING_OES: GL.VERTEX_ARRAY_BINDING,
    createVertexArrayOES() {
      return gl.createVertexArray();
    },
    deleteVertexArrayOES(vertexArray: WebGLVertexArrayObject): void {
      return gl.deleteVertexArray(vertexArray);
    },
    isVertexArrayOES(vertexArray: WebGLVertexArrayObject): boolean {
      return gl.isVertexArray(vertexArray);
    },
    bindVertexArrayOES(vertexArray: WebGLVertexArrayObject): void {
      return gl.bindVertexArray(vertexArray);
    }
  }) as const satisfies OES_vertex_array_object;

const getANGLE_instanced_arrays = (gl: WebGL2RenderingContext) =>
  ({
    VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE: 0x88fe,
    drawArraysInstancedANGLE(...args) {
      return gl.drawArraysInstanced(...args);
    },
    drawElementsInstancedANGLE(...args) {
      return gl.drawElementsInstanced(...args);
    },
    vertexAttribDivisorANGLE(...args) {
      return gl.vertexAttribDivisor(...args);
    }
  }) as const satisfies ANGLE_instanced_arrays;

/**
 * Make browser return WebGL2 contexts even if WebGL1 contexts are requested
 * @param enforce
 * @returns
 */
export function enforceWebGL2(enforce: boolean = true): void {
  const prototype = HTMLCanvasElement.prototype as any;
  if (!enforce && prototype.originalGetContext) {
    // Reset the original getContext function
    prototype.getContext = prototype.originalGetContext;
    prototype.originalGetContext = undefined;
    return;
  }

  // Store the original getContext function
  prototype.originalGetContext = prototype.getContext;

  // Override the getContext function
  prototype.getContext = function (contextId: string, options?: WebGLContextAttributes) {
    // Attempt to force WebGL2 for all WebGL1 contexts
    if (contextId === 'webgl' || contextId === 'experimental-webgl') {
      const context = this.originalGetContext('webgl2', options) as WebGL2RenderingContext;
      // Work around test mocking
      if (context instanceof HTMLElement) {
        polyfillWebGL1Extensions(context);
      }
      return context;
    }
    // For any other type, return the original context
    return this.originalGetContext(contextId, options);
  };
}

/** Install WebGL1-only extensions on WebGL2 contexts */
export function polyfillWebGL1Extensions(gl: WebGL2RenderingContext): void {
  // Enable, to support float and half-float textures
  gl.getExtension('EXT_color_buffer_float');

  // WebGL1 extensions implemented using WebGL2 APIs
  const boundExtensions = {
    ...WEBGL1_STATIC_EXTENSIONS,
    WEBGL_disjoint_timer_query: gl.getExtension('EXT_disjoint_timer_query_webgl2'),
    WEBGL_draw_buffers: getWEBGL_draw_buffers(gl),
    OES_vertex_array_object: getOES_vertex_array_object(gl),
    ANGLE_instanced_arrays: getANGLE_instanced_arrays(gl)
  };

  // Override gl.getExtension
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const originalGetExtension = gl.getExtension;
  gl.getExtension = function (extensionName: string) {
    const ext = originalGetExtension.call(gl, extensionName);
    if (ext) {
      return ext;
    }

    // Injected extensions
    if (extensionName in boundExtensions) {
      return boundExtensions[extensionName];
    }

    return null;
  };

  // Override gl.getSupportedExtensions
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const originalGetSupportedExtensions = gl.getSupportedExtensions;
  gl.getSupportedExtensions = function (): string[] | null {
    const extensions = originalGetSupportedExtensions.apply(gl) || [];
    return extensions?.concat(Object.keys(boundExtensions));
  };
}

// Update unsized WebGL1 formats to sized WebGL2 formats
// todo move to texture format file
// export function getInternalFormat(gl: WebGL2RenderingContext, format: GL, type: GL): GL {
//   // webgl2 texture formats
//   // https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html
//   switch (format) {
//     case GL.DEPTH_COMPONENT:
//       return GL.DEPTH_COMPONENT24;
//     case GL.DEPTH_STENCIL:
//       return GL.DEPTH24_STENCIL8;
//     case GL.RGBA:
//       return type === GL.HALF_FLOAT ? GL.RGBA16F : GL.RGBA32F;
//     case GL.RGB:
//       return type === GL.HALF_FLOAT ? GL.RGB16F : GL.RGB32F;
//     default:
//       return format;
//   }
// }

/*
// texture type to update on the fly
export function getTextureType(gl: WebGL2RenderingContext, type: GL): GL {
  if (type === HALF_FLOAT_OES) {
    return GL.HALF_FLOAT;
  }
  return type;
}

  // And texImage2D to convert the internalFormat to webgl2.
  const webgl2 = this;
  const origTexImage = gl.texImage2D;
  gl.texImage2D = function (target, miplevel, iformat, a, typeFor6, c, d, typeFor9, f) {
    if (arguments.length == 6) {
      var ifmt = webgl2.getInternalFormat(gl, iformat, typeFor6);
      origTexImage.apply(gl, [target, miplevel, ifmt, a, webgl.getTextureType(gl, typeFor6), c]);
    } else {
      // arguments.length == 9
      var ifmt = webgl2.getInternalFormat(gl, iformat, typeFor9);
      origTexImage.apply(gl, [
        target,
        miplevel,
        ifmt,
        a,
        typeFor6,
        c,
        d,
        webgl2.getTextureType(gl, typeFor9),
        f
      ]);
    }
  };
};
*/
