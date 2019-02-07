// Create a WebGL context
import assert from '../utils/assert';
/* global HTMLCanvasElement, WebGLRenderingContext */

/**
 * Installs a spy on Canvas.getContext
 * calls the provided callback with the {context}
 */
export function trackContextCreation({onContextCreate = () => null, onContextCreated = () => {}}) {
  assert(onContextCreate || onContextCreated);
  if (typeof HTMLCanvasElement !== 'undefined') {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContextSpy(type, opts) {
      // Let intercepter create context
      let context;
      if (type === 'webgl') {
        context = onContextCreate({canvas: this, type, opts, getContext: getContext.bind(this)});
      }
      // If not, create context
      context = context || getContext.call(this, type, opts);
      // Report it created
      if (context instanceof WebGLRenderingContext) {
        onContextCreated({canvas: this, context, type, opts});
      }
      return context;
    };
  }
}
