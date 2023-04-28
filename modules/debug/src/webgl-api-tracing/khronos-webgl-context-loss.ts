// luma.gl, MIT license
// WebGLDeveloperTools fork: Various functions for helping debug WebGL apps.
// - Copyright (c) 2012 The Khronos Group Inc, MIT license
// - Node port Marcin Ignac, 2016-05-20

// @ts-nocheck External, untyped code
/* eslint-disable */

import {makePropertyWrapper} from './khronos-webgl-error';

/**
 * Resets a context to the initial state.
 * @param {!WebGLRenderingContext} ctx The webgl context to
 *     reset.
 */
function resetToInitialState(ctx) {
  const isWebGL2RenderingContext = Boolean(ctx.createTransformFeedback);

  if (isWebGL2RenderingContext) {
    ctx.bindVertexArray(null);
  }

  const numAttribs = ctx.getParameter(ctx.MAX_VERTEX_ATTRIBS);
  const tmp = ctx.createBuffer();
  ctx.bindBuffer(ctx.ARRAY_BUFFER, tmp);
  for (var ii = 0; ii < numAttribs; ++ii) {
    ctx.disableVertexAttribArray(ii);
    ctx.vertexAttribPointer(ii, 4, ctx.FLOAT, false, 0, 0);
    ctx.vertexAttrib1f(ii, 0);
    if (isWebGL2RenderingContext) {
      ctx.vertexAttribDivisor(ii, 0);
    }
  }
  ctx.deleteBuffer(tmp);

  const numTextureUnits = ctx.getParameter(ctx.MAX_TEXTURE_IMAGE_UNITS);
  for (let ii = 0; ii < numTextureUnits; ++ii) {
    ctx.activeTexture(ctx.TEXTURE0 + ii);
    ctx.bindTexture(ctx.TEXTURE_CUBE_MAP, null);
    ctx.bindTexture(ctx.TEXTURE_2D, null);
    if (isWebGL2RenderingContext) {
      ctx.bindTexture(ctx.TEXTURE_2D_ARRAY, null);
      ctx.bindTexture(ctx.TEXTURE_3D, null);
      ctx.bindSampler(ii, null);
    }
  }

  ctx.activeTexture(ctx.TEXTURE0);
  ctx.useProgram(null);
  ctx.bindBuffer(ctx.ARRAY_BUFFER, null);
  ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, null);
  ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
  ctx.bindRenderbuffer(ctx.RENDERBUFFER, null);
  ctx.disable(ctx.BLEND);
  ctx.disable(ctx.CULL_FACE);
  ctx.disable(ctx.DEPTH_TEST);
  ctx.disable(ctx.DITHER);
  ctx.disable(ctx.SCISSOR_TEST);
  ctx.blendColor(0, 0, 0, 0);
  ctx.blendEquation(ctx.FUNC_ADD);
  ctx.blendFunc(ctx.ONE, ctx.ZERO);
  ctx.clearColor(0, 0, 0, 0);
  ctx.clearDepth(1);
  ctx.clearStencil(-1);
  ctx.colorMask(true, true, true, true);
  ctx.cullFace(ctx.BACK);
  ctx.depthFunc(ctx.LESS);
  ctx.depthMask(true);
  ctx.depthRange(0, 1);
  ctx.frontFace(ctx.CCW);
  ctx.hint(ctx.GENERATE_MIPMAP_HINT, ctx.DONT_CARE);
  ctx.lineWidth(1);
  ctx.pixelStorei(ctx.PACK_ALIGNMENT, 4);
  ctx.pixelStorei(ctx.UNPACK_ALIGNMENT, 4);
  ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
  ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  // TODO: Delete this IF.
  if (ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL) {
    ctx.pixelStorei(ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL, ctx.BROWSER_DEFAULT_WEBGL);
  }
  ctx.polygonOffset(0, 0);
  ctx.sampleCoverage(1, false);
  ctx.scissor(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.stencilFunc(ctx.ALWAYS, 0, 0xFFFFFFFF);
  ctx.stencilMask(0xFFFFFFFF);
  ctx.stencilOp(ctx.KEEP, ctx.KEEP, ctx.KEEP);
  ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT | ctx.STENCIL_BUFFER_BIT);

  if (isWebGL2RenderingContext) {
    ctx.drawBuffers([ctx.BACK]);
    ctx.readBuffer(ctx.BACK);
    ctx.bindBuffer(ctx.COPY_READ_BUFFER, null);
    ctx.bindBuffer(ctx.COPY_WRITE_BUFFER, null);
    ctx.bindBuffer(ctx.PIXEL_PACK_BUFFER, null);
    ctx.bindBuffer(ctx.PIXEL_UNPACK_BUFFER, null);
    const numTransformFeedbacks = ctx.getParameter(ctx.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS);
    for (var ii = 0; ii < numTransformFeedbacks; ++ii) {
      ctx.bindBufferBase(ctx.TRANSFORM_FEEDBACK_BUFFER, ii, null);
    }
    const numUBOs = ctx.getParameter(ctx.MAX_UNIFORM_BUFFER_BINDINGS);
    for (var ii = 0; ii < numUBOs; ++ii) {
      ctx.bindBufferBase(ctx.UNIFORM_BUFFER, ii, null);
    }
    ctx.disable(ctx.RASTERIZER_DISCARD);
    ctx.pixelStorei(ctx.UNPACK_IMAGE_HEIGHT, 0);
    ctx.pixelStorei(ctx.UNPACK_SKIP_IMAGES, 0);
    ctx.pixelStorei(ctx.UNPACK_ROW_LENGTH, 0);
    ctx.pixelStorei(ctx.UNPACK_SKIP_ROWS, 0);
    ctx.pixelStorei(ctx.UNPACK_SKIP_PIXELS, 0);
    ctx.pixelStorei(ctx.PACK_ROW_LENGTH, 0);
    ctx.pixelStorei(ctx.PACK_SKIP_ROWS, 0);
    ctx.pixelStorei(ctx.PACK_SKIP_PIXELS, 0);
    ctx.hint(ctx.FRAGMENT_SHADER_DERIVATIVE_HINT, ctx.DONT_CARE);
  }

  // TODO: This should NOT be needed but Firefox fails with 'hint'
  while(ctx.getError());
}

/**
   * Given a canvas element returns a wrapped canvas element that will
   * simulate lost context. The canvas returned adds the following functions.
   *
   * loseContext:
   *   simulates a lost context event.
   *
   * restoreContext:
   *   simulates the context being restored.
   *
   * lostContextInNCalls:
   *   loses the context after N gl calls.
   *
   * getNumCalls:
   *   tells you how many gl calls there have been so far.
   *
   * setRestoreTimeout:
   *   sets the number of milliseconds until the context is restored
   *   after it has been lost. Defaults to 0. Pass -1 to prevent
   *   automatic restoring.
   *
   * @param {!Canvas} canvas The canvas element to wrap.
   */
export function makeLostContextSimulatingCanvas(canvas) {
  let unwrappedContext_;
  const onLost_ = [];
  const onRestored_ = [];
  let wrappedContext_: Partial<Record<keyof WebGL2RenderingContext, any>> = {};
  let contextId_ = 1;
  let contextLost_ = false;
  const resourceId_ = 0;
  const resourceDb_ = [];
  let numCallsToLoseContext_ = 0;
  let numCalls_ = 0;
  let canRestore_ = false;
  let restoreTimeout_ = 0;
  let isWebGL2RenderingContext;

  // Holds booleans for each GL error so can simulate errors.
  const glErrorShadow_ = { };

  canvas.getContext = function(f) {
    return function() {
      const ctx = f.apply(canvas, arguments);
      // Did we get a context and is it a WebGL context?
      if ((ctx instanceof WebGLRenderingContext) || (window.WebGL2RenderingContext && (ctx instanceof WebGL2RenderingContext))) {
        if (ctx != unwrappedContext_) {
          if (unwrappedContext_) {
            throw 'got different context'
          }
          isWebGL2RenderingContext = window.WebGL2RenderingContext && (ctx instanceof WebGL2RenderingContext);
          unwrappedContext_ = ctx;
          wrappedContext_ = makeLostContextSimulatingContext(unwrappedContext_);
        }
        return wrappedContext_;
      }
      return ctx;
    }
  }(canvas.getContext);

  function wrapEvent(listener) {
    if (typeof(listener) === 'function') {
      return listener;
    } 
    return function(info) {
      listener.handleEvent(info);
    }
    
  }

  function addOnContextLostListener(listener) {
    onLost_.push(wrapEvent(listener));
  }

  function addOnContextRestoredListener(listener) {
    onRestored_.push(wrapEvent(listener));
  }

  function wrapAddEventListener(canvas) {
    const f = canvas.addEventListener;
    canvas.addEventListener = function(type, listener, bubble) {
      switch (type) {
        case 'webglcontextlost':
          addOnContextLostListener(listener);
          break;
        case 'webglcontextrestored':
          addOnContextRestoredListener(listener);
          break;
        default:
          f.apply(canvas, arguments);
      }
    };
  }

  wrapAddEventListener(canvas);

  canvas.loseContext = function() {
    if (!contextLost_) {
      contextLost_ = true;
      numCallsToLoseContext_ = 0;
      ++contextId_;
      while (unwrappedContext_.getError());
      clearErrors();
      glErrorShadow_[unwrappedContext_.CONTEXT_LOST_WEBGL] = true;
      const event = makeWebGLContextEvent('context lost');
      const callbacks = onLost_.slice();
      setTimeout(function() {
        // log("numCallbacks:" + callbacks.length);
        for (let ii = 0; ii < callbacks.length; ++ii) {
          // log("calling callback:" + ii);
          callbacks[ii](event);
        }
        if (restoreTimeout_ >= 0) {
          setTimeout(function() {
            canvas.restoreContext();
          }, restoreTimeout_);
        }
      }, 0);
    }
  };

  canvas.restoreContext = function() {
    if (contextLost_) {
      if (onRestored_.length) {
        setTimeout(function() {
          if (!canRestore_) {
            throw 'can not restore. webglcontestlost listener did not call event.preventDefault';
          }
          freeResources();
          resetToInitialState(unwrappedContext_);
          contextLost_ = false;
          numCalls_ = 0;
          canRestore_ = false;
          const callbacks = onRestored_.slice();
          const event = makeWebGLContextEvent('context restored');
          for (let ii = 0; ii < callbacks.length; ++ii) {
            callbacks[ii](event);
          }
        }, 0);
      }
    }
  };

  canvas.loseContextInNCalls = function(numCalls) {
    if (contextLost_) {
      throw 'You can not ask a lost contet to be lost';
    }
    numCallsToLoseContext_ = numCalls_ + numCalls;
  };

  canvas.getNumCalls = function() {
    return numCalls_;
  };

  canvas.setRestoreTimeout = function(timeout) {
    restoreTimeout_ = timeout;
  };

  function isWebGLObject(obj) {
    // return false;
    return (obj instanceof WebGLBuffer ||
            obj instanceof WebGLFramebuffer ||
            obj instanceof WebGLProgram ||
            obj instanceof WebGLRenderbuffer ||
            obj instanceof WebGLShader ||
            obj instanceof WebGLTexture);
  }

  function checkResources(args) {
    for (let ii = 0; ii < args.length; ++ii) {
      const arg = args[ii];
      if (isWebGLObject(arg)) {
        return arg.__webglDebugContextLostId__ == contextId_;
      }
    }
    return true;
  }

  function clearErrors() {
    const k = Object.keys(glErrorShadow_);
    for (let ii = 0; ii < k.length; ++ii) {
      delete glErrorShadow_[k[ii]];
    }
  }

  function loseContextIfTime() {
    ++numCalls_;
    if (!contextLost_) {
      if (numCallsToLoseContext_ == numCalls_) {
        canvas.loseContext();
      }
    }
  }

  // Makes a function that simulates WebGL when out of context.
  function makeLostContextFunctionWrapper(ctx, functionName) {
    const f = ctx[functionName];
    return function() {
      // log("calling:" + functionName);
      // Only call the functions if the context is not lost.
      loseContextIfTime();
      if (!contextLost_) {
        // if (!checkResources(arguments)) {
        //  glErrorShadow_[wrappedContext_.INVALID_OPERATION] = true;
        //  return;
        // }
        const result = f.apply(ctx, arguments);
        return result;
      }
    };
  }

  function freeResources() {
    for (let ii = 0; ii < resourceDb_.length; ++ii) {
      const resource = resourceDb_[ii];
      if (resource instanceof WebGLBuffer) {
        unwrappedContext_.deleteBuffer(resource);
      } else if (resource instanceof WebGLFramebuffer) {
        unwrappedContext_.deleteFramebuffer(resource);
      } else if (resource instanceof WebGLProgram) {
        unwrappedContext_.deleteProgram(resource);
      } else if (resource instanceof WebGLRenderbuffer) {
        unwrappedContext_.deleteRenderbuffer(resource);
      } else if (resource instanceof WebGLShader) {
        unwrappedContext_.deleteShader(resource);
      } else if (resource instanceof WebGLTexture) {
        unwrappedContext_.deleteTexture(resource);
      }
      else if (isWebGL2RenderingContext) {
        if (resource instanceof WebGLQuery) {
          unwrappedContext_.deleteQuery(resource);
        } else if (resource instanceof WebGLSampler) {
          unwrappedContext_.deleteSampler(resource);
        } else if (resource instanceof WebGLSync) {
          unwrappedContext_.deleteSync(resource);
        } else if (resource instanceof WebGLTransformFeedback) {
          unwrappedContext_.deleteTransformFeedback(resource);
        } else if (resource instanceof WebGLVertexArrayObject) {
          unwrappedContext_.deleteVertexArray(resource);
        }
      }
    }
  }

  function makeWebGLContextEvent(statusMessage) {
    return {
      statusMessage,
      preventDefault() {
        canRestore_ = true;
      }
    };
  }

  return canvas;

  function makeLostContextSimulatingContext(ctx) {
    // copy all functions and properties to wrapper
    for (const propertyName in ctx) {
      if (typeof ctx[propertyName] === 'function') {
        wrappedContext_[propertyName] = makeLostContextFunctionWrapper(
          ctx, propertyName);
      } else {
        makePropertyWrapper(wrappedContext_, ctx, propertyName);
      }
    }

    // Wrap a few functions specially.
    wrappedContext_.getError = function() {
      loseContextIfTime();
      if (!contextLost_) {
        let err;
        while (err = unwrappedContext_.getError()) {
          glErrorShadow_[err] = true;
        }
      }
      for (const err in glErrorShadow_) {
        if (glErrorShadow_[err]) {
          delete glErrorShadow_[err];
          return err;
        }
      }
      return wrappedContext_.NO_ERROR;
    };

    const creationFunctions = [
      'createBuffer',
      'createFramebuffer',
      'createProgram',
      'createRenderbuffer',
      'createShader',
      'createTexture'
    ];
    if (isWebGL2RenderingContext) {
      creationFunctions.push(
        'createQuery',
        'createSampler',
        'fenceSync',
        'createTransformFeedback',
        'createVertexArray'
      );
    }
    for (var ii = 0; ii < creationFunctions.length; ++ii) {
      var functionName = creationFunctions[ii];
      wrappedContext_[functionName] = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return null;
          }
          const obj = f.apply(ctx, arguments);
          obj.__webglDebugContextLostId__ = contextId_;
          resourceDb_.push(obj);
          return obj;
        };
      }(ctx[functionName]);
    }

    const functionsThatShouldReturnNull = [
      'getActiveAttrib',
      'getActiveUniform',
      'getBufferParameter',
      'getContextAttributes',
      'getAttachedShaders',
      'getFramebufferAttachmentParameter',
      'getParameter',
      'getProgramParameter',
      'getProgramInfoLog',
      'getRenderbufferParameter',
      'getShaderParameter',
      'getShaderInfoLog',
      'getShaderSource',
      'getTexParameter',
      'getUniform',
      'getUniformLocation',
      'getVertexAttrib'
    ];
    if (isWebGL2RenderingContext) {
      functionsThatShouldReturnNull.push(
        'getInternalformatParameter',
        'getQuery',
        'getQueryParameter',
        'getSamplerParameter',
        'getSyncParameter',
        'getTransformFeedbackVarying',
        'getIndexedParameter',
        'getUniformIndices',
        'getActiveUniforms',
        'getActiveUniformBlockParameter',
        'getActiveUniformBlockName'
      );
    }
    for (var ii = 0; ii < functionsThatShouldReturnNull.length; ++ii) {
      var functionName = functionsThatShouldReturnNull[ii];
      wrappedContext_[functionName] = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return null;
          }
          return f.apply(ctx, arguments);
        }
      }(wrappedContext_[functionName]);
    }

    const isFunctions = [
      'isBuffer',
      'isEnabled',
      'isFramebuffer',
      'isProgram',
      'isRenderbuffer',
      'isShader',
      'isTexture'
    ];
    if (isWebGL2RenderingContext) {
      isFunctions.push(
        'isQuery',
        'isSampler',
        'isSync',
        'isTransformFeedback',
        'isVertexArray'
      );
    }
    for (var ii = 0; ii < isFunctions.length; ++ii) {
      var functionName = isFunctions[ii];
      wrappedContext_[functionName] = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return false;
          }
          return f.apply(ctx, arguments);
        }
      }(wrappedContext_[functionName]);
    }

    wrappedContext_.checkFramebufferStatus = function(f) {
      return function() {
        loseContextIfTime();
        if (contextLost_) {
          return wrappedContext_.FRAMEBUFFER_UNSUPPORTED;
        }
        return f.apply(ctx, arguments);
      };
    }(wrappedContext_.checkFramebufferStatus);

    wrappedContext_.getAttribLocation = function(f) {
      return function() {
        loseContextIfTime();
        if (contextLost_) {
          return -1;
        }
        return f.apply(ctx, arguments);
      };
    }(wrappedContext_.getAttribLocation);

    wrappedContext_.getVertexAttribOffset = function(f) {
      return function() {
        loseContextIfTime();
        if (contextLost_) {
          return 0;
        }
        return f.apply(ctx, arguments);
      };
    }(wrappedContext_.getVertexAttribOffset);

    wrappedContext_.isContextLost = function() {
      return contextLost_;
    };

    if (isWebGL2RenderingContext) {
      wrappedContext_.getFragDataLocation = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return -1;
          }
          return f.apply(ctx, arguments);
        };
      }(wrappedContext_.getFragDataLocation);

      wrappedContext_.clientWaitSync = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return wrappedContext_.WAIT_FAILED;
          }
          return f.apply(ctx, arguments);
        };
      }(wrappedContext_.clientWaitSync);

      wrappedContext_.getUniformBlockIndex = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return wrappedContext_.INVALID_INDEX;
          }
          return f.apply(ctx, arguments);
        };
      }(wrappedContext_.getUniformBlockIndex);
    }

    return wrappedContext_;
  }
}
