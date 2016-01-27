// webgl.js
// Checks if WebGL is enabled and creates a context for using WebGL.
/* global window */

// TODO - untested code
function getDebugHandler(ctx) {
  gl = {};
  for (var m in ctx) {
    var f = ctx[m];
    if (typeof f === 'function') {
      gl[m] = ((k, v) => {
        return () => {
          console.log(
            k,
            Array.prototype.join.call(arguments),
            Array.prototype.slice.call(arguments)
          );
          try {
            var ans = v.apply(ctx, arguments);
          } catch (e) {
            throw new Error(`${k} ${e}`);
          }
          const errorStack = [];
          let error;
          while((error = ctx.getError()) !== ctx.NO_ERROR) {
            errorStack.push(error);
          }
          if (errorStack.length) {
            throw errorStack.join();
          }
          return ans;
        };
      })(m, f);
    } else {
      gl[m] = f;
    }
  }
  return gl
}

export function createGLContext(canvas, opt = {}) {
  canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
  let gl = canvas.getContext('experimental-webgl', opt);
  if (!gl) {
    gl = canvas.getContext('webgl', opt);
  }
  if (!gl) {
    throw new Error('Could not initialize WebGL context');
  }

  // Override debug handlers
  if (opt.debug) {
    gl = getDebugHandler(gl);
  }

  // add a get by name param
  // TODO - what is the purpose?
  if (gl) {
    gl.get = function(name) {
      return typeof name == 'string'? gl[name] : name;
    };
  }

  if (opt.initialize) {
    initializeGLContext(gl, canvas.width, canvas.height);
  }

  return gl;
}

export function initializeGLContext(gl, width, height) {
  gl.viewport(0, 0, width, height);
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
}

export function hasWebGL() {
  // Feature test WebGL
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (error) {
    return false;
  }
}

export function hasExtension(name) {
  if (!LumaGL.hasWebGL()) {
    return false;
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl') ||
    canvas.getContext('experimental-webgl');
  // Should maybe be return !!context.getExtension(name);
  return context.getExtension(name);
}
