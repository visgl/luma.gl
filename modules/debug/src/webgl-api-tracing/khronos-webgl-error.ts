// luma.gl, MIT license
// WebGLDeveloperTools fork: Various functions for helping debug WebGL apps.
// - Copyright (c) 2012 The Khronos Group Inc, MIT license
// - Node port Marcin Ignac, 2016-05-20

// @ts-nocheck External, untyped code
/* eslint-disable */

/**
 * Which arguments are enums based on the number of arguments to the function.
 *
 * @example
 *    'texImage2D': {
 *       9: { 0:true, 2:true, 6:true, 7:true },
 *       6: { 0:true, 2:true, 3:true, 4:true },
 *    },
 *
 * means if there are 9 arguments then 6 and 7 are enums, if there are 6
 * arguments 3 and 4 are enums
 *
 * @type {!Object.<number, !Object.<number, string>}
 */
const glValidEnumContexts = {
  // Generic setters and getters

  enable: {1: {0: true}},
  disable: {1: {0: true}},
  getParameter: {1: {0: true}},

  // Rendering

  drawArrays: {3: {0: true}},
  drawElements: {4: {0: true, 2: true}},

  // Shaders

  createShader: {1: {0: true}},
  getShaderParameter: {2: {1: true}},
  getProgramParameter: {2: {1: true}},
  getShaderPrecisionFormat: {2: {0: true, 1: true}},

  // Vertex attributes

  getVertexAttrib: {2: {1: true}},
  vertexAttribPointer: {6: {2: true}},

  // Textures

  bindTexture: {2: {0: true}},
  activeTexture: {1: {0: true}},
  getTexParameter: {2: {0: true, 1: true}},
  texParameterf: {3: {0: true, 1: true}},
  texParameteri: {3: {0: true, 1: true, 2: true}},
  // texImage2D and texSubImage2D are defined below with WebGL 2 entrypoints
  copyTexImage2D: {8: {0: true, 2: true}},
  copyTexSubImage2D: {8: {0: true}},
  generateMipmap: {1: {0: true}},
  // compressedTexImage2D and compressedTexSubImage2D are defined below with WebGL 2 entrypoints

  // Buffer objects

  bindBuffer: {2: {0: true}},
  // bufferData and bufferSubData are defined below with WebGL 2 entrypoints
  getBufferParameter: {2: {0: true, 1: true}},

  // Renderbuffers and framebuffers

  pixelStorei: {2: {0: true, 1: true}},
  // readPixels is defined below with WebGL 2 entrypoints
  bindRenderbuffer: {2: {0: true}},
  bindFramebuffer: {2: {0: true}},
  checkFramebufferStatus: {1: {0: true}},
  framebufferRenderbuffer: {4: {0: true, 1: true, 2: true}},
  framebufferTexture2D: {5: {0: true, 1: true, 2: true}},
  getFramebufferAttachmentParameter: {3: {0: true, 1: true, 2: true}},
  getRenderbufferParameter: {2: {0: true, 1: true}},
  renderbufferStorage: {4: {0: true, 1: true}},

  // Frame buffer operations (clear, blend, depth test, stencil)

  clear: {1: {0: {enumBitwiseOr: ['COLOR_BUFFER_BIT', 'DEPTH_BUFFER_BIT', 'STENCIL_BUFFER_BIT']}}},
  depthFunc: {1: {0: true}},
  blendFunc: {2: {0: true, 1: true}},
  blendFuncSeparate: {4: {0: true, 1: true, 2: true, 3: true}},
  blendEquation: {1: {0: true}},
  blendEquationSeparate: {2: {0: true, 1: true}},
  stencilFunc: {3: {0: true}},
  stencilFuncSeparate: {4: {0: true, 1: true}},
  stencilMaskSeparate: {2: {0: true}},
  stencilOp: {3: {0: true, 1: true, 2: true}},
  stencilOpSeparate: {4: {0: true, 1: true, 2: true, 3: true}},

  // Culling

  cullFace: {1: {0: true}},
  frontFace: {1: {0: true}},

  // ANGLE_instanced_arrays extension

  drawArraysInstancedANGLE: {4: {0: true}},
  drawElementsInstancedANGLE: {5: {0: true, 2: true}},

  // EXT_blend_minmax extension

  blendEquationEXT: {1: {0: true}},

  // WebGL 2 Buffer objects

  bufferData: {
    3: {0: true, 2: true}, // WebGL 1
    4: {0: true, 2: true}, // WebGL 2
    5: {0: true, 2: true} // WebGL 2
  },
  bufferSubData: {
    3: {0: true}, // WebGL 1
    4: {0: true}, // WebGL 2
    5: {0: true} // WebGL 2
  },
  copyBufferSubData: {5: {0: true, 1: true}},
  getBufferSubData: {3: {0: true}, 4: {0: true}, 5: {0: true}},

  // WebGL 2 Framebuffer objects

  blitFramebuffer: {
    10: {
      8: {enumBitwiseOr: ['COLOR_BUFFER_BIT', 'DEPTH_BUFFER_BIT', 'STENCIL_BUFFER_BIT']},
      9: true
    }
  },
  framebufferTextureLayer: {5: {0: true, 1: true}},
  invalidateFramebuffer: {2: {0: true}},
  invalidateSubFramebuffer: {6: {0: true}},
  readBuffer: {1: {0: true}},

  // WebGL 2 Renderbuffer objects

  getInternalformatParameter: {3: {0: true, 1: true, 2: true}},
  renderbufferStorageMultisample: {5: {0: true, 2: true}},

  // WebGL 2 Texture objects

  texStorage2D: {5: {0: true, 2: true}},
  texStorage3D: {6: {0: true, 2: true}},
  texImage2D: {
    9: {0: true, 2: true, 6: true, 7: true}, // WebGL 1 & 2
    6: {0: true, 2: true, 3: true, 4: true}, // WebGL 1
    10: {0: true, 2: true, 6: true, 7: true} // WebGL 2
  },
  texImage3D: {
    10: {0: true, 2: true, 7: true, 8: true},
    11: {0: true, 2: true, 7: true, 8: true}
  },
  texSubImage2D: {
    9: {0: true, 6: true, 7: true}, // WebGL 1 & 2
    7: {0: true, 4: true, 5: true}, // WebGL 1
    10: {0: true, 6: true, 7: true} // WebGL 2
  },
  texSubImage3D: {
    11: {0: true, 8: true, 9: true},
    12: {0: true, 8: true, 9: true}
  },
  copyTexSubImage3D: {9: {0: true}},
  compressedTexImage2D: {
    7: {0: true, 2: true}, // WebGL 1 & 2
    8: {0: true, 2: true}, // WebGL 2
    9: {0: true, 2: true} // WebGL 2
  },
  compressedTexImage3D: {
    8: {0: true, 2: true},
    9: {0: true, 2: true},
    10: {0: true, 2: true}
  },
  compressedTexSubImage2D: {
    8: {0: true, 6: true}, // WebGL 1 & 2
    9: {0: true, 6: true}, // WebGL 2
    10: {0: true, 6: true} // WebGL 2
  },
  compressedTexSubImage3D: {
    10: {0: true, 8: true},
    11: {0: true, 8: true},
    12: {0: true, 8: true}
  },

  // WebGL 2 Vertex attribs

  vertexAttribIPointer: {5: {2: true}},

  // WebGL 2 Writing to the drawing buffer

  drawArraysInstanced: {4: {0: true}},
  drawElementsInstanced: {5: {0: true, 2: true}},
  drawRangeElements: {6: {0: true, 4: true}},

  // WebGL 2 Reading back pixels

  readPixels: {
    7: {4: true, 5: true}, // WebGL 1 & 2
    8: {4: true, 5: true} // WebGL 2
  },

  // WebGL 2 Multiple Render Targets

  clearBufferfv: {3: {0: true}, 4: {0: true}},
  clearBufferiv: {3: {0: true}, 4: {0: true}},
  clearBufferuiv: {3: {0: true}, 4: {0: true}},
  clearBufferfi: {4: {0: true}},

  // WebGL 2 Query objects

  beginQuery: {2: {0: true}},
  endQuery: {1: {0: true}},
  getQuery: {2: {0: true, 1: true}},
  getQueryParameter: {2: {1: true}},

  // WebGL 2 Sampler objects

  samplerParameteri: {3: {1: true, 2: true}},
  samplerParameterf: {3: {1: true}},
  getSamplerParameter: {2: {1: true}},

  // WebGL 2 Sync objects

  fenceSync: {2: {0: true, 1: {enumBitwiseOr: []}}},
  clientWaitSync: {3: {1: {enumBitwiseOr: ['SYNC_FLUSH_COMMANDS_BIT']}}},
  waitSync: {3: {1: {enumBitwiseOr: []}}},
  getSyncParameter: {2: {1: true}},

  // WebGL 2 Transform Feedback

  bindTransformFeedback: {2: {0: true}},
  beginTransformFeedback: {1: {0: true}},
  transformFeedbackVaryings: {3: {2: true}},

  // WebGL2 Uniform Buffer Objects and Transform Feedback Buffers

  bindBufferBase: {3: {0: true}},
  bindBufferRange: {5: {0: true}},
  getIndexedParameter: {2: {0: true}},
  getActiveUniforms: {3: {2: true}},
  getActiveUniformBlockParameter: {3: {2: true}}
};

/** Map of numbers to names. */
let glEnums: Record<number, string> = null;

/** Map of names to numbers. */
let enumStringToValue: Record<string, number> = null;

/**
 * Initializes this module. Safe to call more than once.
 * @param ctx A WebGL context. If
 *    you have more than one context it doesn't matter which one
 *    you pass in, it is only used to pull out constants.
 */
export function init(ctx: WebGLRenderingContext): void {
  if (glEnums == null) {
    glEnums = {};
    enumStringToValue = {};
    for (const propertyName in ctx) {
      if (typeof ctx[propertyName] === 'number') {
        glEnums[ctx[propertyName]] = propertyName;
        enumStringToValue[propertyName] = ctx[propertyName];
      }
    }
  }
}

/**
 * Checks the utils have been initialized.
 */
function checkInit() {
  if (glEnums == null) {
    throw 'WebGLDebugUtils.init(ctx) not called';
  }
}

/**
 * Returns true or false if value matches any WebGL enum
 * @param value Value to check if it might be an enum.
 * @return True if value matches one of the WebGL defined enums
 */
export function mightBeEnum(value: any): boolean {
  checkInit();
  return glEnums[value] !== undefined;
}

/**
 * Gets an string version of an WebGL enum.
 *
 * @example
 *   WebGLDebugUtil.init(ctx);
 *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
 *
 * @param value Value to return an enum for
 * @return  The string version of the enum.
 */
export function glEnumToString(value: number): string {
  checkInit();
  const name = glEnums[value];
  return name !== undefined ? `gl.${  name}` : `/*UNKNOWN WebGL ENUM*/ 0x${  value.toString(16)  }`;
}

/**
 * Converts the argument of a WebGL function to a string.
 * Attempts to convert enum arguments to strings.
 *
 * @example
 *   WebGLDebugUtil.init(ctx);
 *   var str = WebGLDebugUtil.glFunctionArgToString('bindTexture', 2, 0, gl.TEXTURE_2D);
 *
 * would return 'TEXTURE_2D'
 *
 * @param functionName the name of the WebGL function.
 * @param numArgs the number of arguments passed to the function.
 * @param argumentIndx the index of the argument.
 * @param value The value of the argument.
 * @return The value as a string.
 */
export function glFunctionArgToString(
  functionName: string,
  numArgs: number,
  argumentIndex: number,
  value: any
): string {
  var funcInfo = glValidEnumContexts[functionName];
  if (funcInfo !== undefined) {
    var funcInfo = funcInfo[numArgs];
    if (funcInfo !== undefined) {
      if (funcInfo[argumentIndex]) {
        if (
          typeof funcInfo[argumentIndex] === 'object' &&
          funcInfo[argumentIndex].enumBitwiseOr !== undefined
        ) {
          const enums = funcInfo[argumentIndex].enumBitwiseOr;
          let orResult = 0;
          const orEnums = [];
          for (let i = 0; i < enums.length; ++i) {
            const enumValue = enumStringToValue[enums[i]];
            if ((value & enumValue) !== 0) {
              orResult |= enumValue;
              orEnums.push(glEnumToString(enumValue));
            }
          }
          if (orResult === value) {
            return orEnums.join(' | ');
          } 
          return glEnumToString(value);
          
        } 
        return glEnumToString(value);
        
      }
    }
  }
  if (value === null) {
    return 'null';
  } else if (value === undefined) {
    return 'undefined';
  } 
  return value.toString();
  
}

/**
 * Converts the arguments of a WebGL function to a string.
 * Attempts to convert enum arguments to strings.
 *
 * @param functionName the name of the WebGL function.
 * @param args The arguments.
 * @return The arguments as a string.
 */
export function glFunctionArgsToString(functionName: string, args): string {
  // apparently we can't do args.join(",");
  let argStr = '';
  const numArgs = args.length;
  for (let ii = 0; ii < numArgs; ++ii) {
    argStr += (ii == 0 ? '' : ', ') + glFunctionArgToString(functionName, numArgs, ii, args[ii]);
  }
  return argStr;
}

// Internal export for context-loss
export function makePropertyWrapper(wrapper, original, propertyName) {
  // log("wrap prop: " + propertyName);
  wrapper.__defineGetter__(propertyName, function () {
    return original[propertyName];
  });
  // TODO(gmane): this needs to handle properties that take more than
  // one value?
  wrapper.__defineSetter__(propertyName, function (value) {
    // log("set: " + propertyName);
    original[propertyName] = value;
  });
}

// Makes a function that calls a function on another object.
function makeFunctionWrapper(original, functionName) {
  // log("wrap fn: " + functionName);
  const f = original[functionName];
  return function () {
    // log("call: " + functionName);
    const result = f.apply(original, arguments);
    return result;
  };
}

/**
 * Given a WebGL context returns a wrapped context that calls
 * gl.getError after every command and calls a function if the
 * result is not NO_ERROR.
 *
 * You can supply your own function if you want. For example, if you'd like
 * an exception thrown on any GL error you could do this
 *
 * @example
 *
 *    function throwOnGLError(err, funcName, args) {
 *      throw WebGLDebugUtils.glEnumToString(err) +
 *            " was caused by call to " + funcName;
 *    };
 *
 *    ctx = WebGLDebugUtils.makeDebugContext(
 *        canvas.getContext("webgl"), throwOnGLError);
 *
 * @param {!WebGLRenderingContext} ctx The webgl context to wrap.
 * @param {!function(err, funcName, args): void} opt_onErrorFunc
 *        The function to call when gl.getError returns an
 *        error. If not specified the default function calls
 *        console.log with a message.
 * @param {!function(funcName, args): void} opt_onFunc The
 *        function to call when each webgl function is called.
 *        You can use this to log all calls for example.
 * @param {!WebGLRenderingContext} opt_err_ctx The webgl context
 *        to call getError on if different than ctx.
 */
export function makeDebugContext(ctx, opt_onErrorFunc, opt_onFunc, opt_err_ctx) {
  opt_err_ctx = opt_err_ctx || ctx;
  init(ctx);
  opt_onErrorFunc =
    opt_onErrorFunc ||
    function (err, functionName, args) {
      // apparently we can't do args.join(",");
      let argStr = '';
      const numArgs = args.length;
      for (let ii = 0; ii < numArgs; ++ii) {
        argStr +=
          (ii == 0 ? '' : ', ') + glFunctionArgToString(functionName, numArgs, ii, args[ii]);
      }
      // error
      err(`WebGL error ${  glEnumToString(err)  } in ${  functionName  }(${  argStr  })`);
    };

  // Holds booleans for each GL error so after we get the error ourselves
  // we can still return it to the client app.
  const glErrorShadow = {};

  // Makes a function that calls a WebGL function and then calls getError.
  function makeErrorWrapper(ctx, functionName) {
    return function () {
      if (opt_onFunc) {
        opt_onFunc(functionName, arguments);
      }
      const result = ctx[functionName].apply(ctx, arguments);
      const err = opt_err_ctx.getError();
      if (err != 0) {
        glErrorShadow[err] = true;
        opt_onErrorFunc(err, functionName, arguments);
      }
      return result;
    };
  }

  // Make a an object that has a copy of every property of the WebGL context
  // but wraps all functions.
  const wrapper = {};
  for (const propertyName in ctx) {
    if (typeof ctx[propertyName] === 'function') {
      if (propertyName != 'getExtension') {
        wrapper[propertyName] = makeErrorWrapper(ctx, propertyName);
      } else {
        var wrapped = makeErrorWrapper(ctx, propertyName);
        wrapper[propertyName] = function () {
          const result = wrapped.apply(ctx, arguments);
          if (!result) {
            return null;
          }
          return makeDebugContext(result, opt_onErrorFunc, opt_onFunc, opt_err_ctx);
        };
      }
    } else {
      makePropertyWrapper(wrapper, ctx, propertyName);
    }
  }

  // @ts-expect-error Override the getError function with one that returns our saved results.
  wrapper.getError = function () {
    for (const err in glErrorShadow) {
      if (glErrorShadow.hasOwnProperty(err)) {
        if (glErrorShadow[err]) {
          glErrorShadow[err] = false;
          return err;
        }
      }
    }
    return ctx.NO_ERROR;
  };

  return wrapper;
}
