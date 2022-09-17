/**
 * Initialize WebGL state caching on a context
 * can be called multiple times to enable/disable
 */
export function trackContextState(
  gl: WebGLRenderingContext,
  options?: {
    enable?: boolean;
    copyState?: boolean;
    log?: any;
  }
): WebGLRenderingContext;

/**
 * Saves current WebGL context state onto an internal per-context stack
 */
export function pushContextState(gl: WebGLRenderingContext): void;

/**
 * Restores previously saved WebGL context state
 */
export function popContextState(gl: WebGLRenderingContext): void;
