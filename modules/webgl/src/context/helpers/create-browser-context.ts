// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * ContextProps
 * @param onContextLost
 * @param onContextRestored *
 */
type ContextProps = {
  /** Called when a context is lost */
  onContextLost: (event: Event) => void;
  /** Called when a context is restored */
  onContextRestored: (event: Event) => void;
};

/**
 * Create a WebGL context for a canvas
 * Note calling this multiple time on the same canvas does return the same context
 * @param canvas A canvas element or offscreen canvas
 */
export function createBrowserContext(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  props: ContextProps,
  webglContextAttributes: WebGLContextAttributes
): WebGL2RenderingContext {
  // Try to extract any extra information about why context creation failed
  let errorMessage = '';
  // const onCreateError = error => (errorMessage = error.statusMessage || errorMessage);

  // Avoid multiple listeners?
  // canvas.removeEventListener('webglcontextcreationerror', onCreateError, false);
  // canvas.addEventListener('webglcontextcreationerror', onCreateError, false);

  const webglProps: WebGLContextAttributes = {
    preserveDrawingBuffer: true,
    // failIfMajorPerformanceCaveat: true,
    ...webglContextAttributes
  };

  // Create the desired context
  let gl: WebGL2RenderingContext | null = null;

  // Create a webgl2 context
  gl ||= canvas.getContext('webgl2', webglProps);
  if (webglProps.failIfMajorPerformanceCaveat) {
    errorMessage ||=
      'Only software GPU is available. Set `failIfMajorPerformanceCaveat: false` to allow.';
  }

  // Creation failed with failIfMajorPerformanceCaveat - Try a Software GPU
  if (!gl && !webglContextAttributes.failIfMajorPerformanceCaveat) {
    webglProps.failIfMajorPerformanceCaveat = false;
    gl = canvas.getContext('webgl2', webglProps);
    // @ts-expect-error
    gl.luma ||= {};
    // @ts-expect-error
    gl.luma.softwareRenderer = true;
  }

  if (!gl) {
    gl = canvas.getContext('webgl', {}) as WebGL2RenderingContext;
    if (gl) {
      gl = null;
      errorMessage ||= 'Your browser only supports WebGL1';
    }
  }

  if (!gl) {
    errorMessage ||= 'Your browser does not support WebGL';
    throw new Error(`Failed to create WebGL context: ${errorMessage}`);
  }

  // Carefully extract and wrap callbacks to prevent addEventListener from rebinding them.
  const {onContextLost, onContextRestored} = props;
  canvas.addEventListener('webglcontextlost', (event: Event) => onContextLost(event), false);
  canvas.addEventListener(
    'webglcontextrestored',
    (event: Event) => onContextRestored(event),
    false
  );

  // @ts-expect-error
  gl.luma ||= {};
  return gl;
}

/* TODO - can we call this asynchronously to catch the error events?
export async function createBrowserContextAsync(canvas: HTMLCanvasElement | OffscreenCanvas, props: ContextProps): Promise<WebGL2RenderingContext> {
  props = {...DEFAULT_CONTEXT_PROPS, ...props};

 // Try to extract any extra information about why context creation failed
 let errorMessage = null;
 const onCreateError = (error) => (errorMessage = error.statusMessage || errorMessage);
 canvas.addEventListener('webglcontextcreationerror', onCreateError, false);

 const gl = createBrowserContext(canvas, props);

 // Give the listener a chance to fire
 await new Promise(resolve => setTimeout(resolve, 0));

 canvas.removeEventListener('webglcontextcreationerror', onCreateError, false);

 return gl;
}
*/
