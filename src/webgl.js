// webgl.js
// Checks if WebGL is enabled and creates a context for using WebGL.
/* global window */

export function createGLContext(canvas, opt) {
  if (!isBrowserContext()) {
    throw new Error("Can't create a WebGL context outside a browser context.")
  }
  var gl = null;
  canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
  let ctx;
  ctx = canvas.getContext('experimental-webgl', opt);
  if (!ctx) {
    ctx = canvas.getContext('webgl', opt);
  }
  // Set as debug handler
  if (ctx && opt && opt.debug) {
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
  } else {
    gl = ctx;
  }

  // add a get by name param
  if (gl) {
    gl.get = function(name) {
      return typeof name == 'string'? gl[name] : name;
    };
  }

  return gl;
}

export function hasWebGL() {
  if (!isBrowserContext()) {
    return false;
  }
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
  if (!hasWebGL()) {
    return false;
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl') ||
    canvas.getContext('experimental-webgl');
  // Should maybe be return !!context.getExtension(name);
  return context.getExtension(name);
}

function isBrowserContext() {
  if (typeof window === 'undefined') {
    return false;
  }
  return true;
}
