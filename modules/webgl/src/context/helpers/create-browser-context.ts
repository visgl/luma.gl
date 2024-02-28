// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * ContextProps
 * @param onContextLost
 * @param onContextRestored
 *
 * BROWSER CONTEXT PARAMETERS
 * @param debug Instrument context (at the expense of performance).
 * @param alpha Default render target has an alpha buffer.
 * @param depth Default render target has a depth buffer of at least 16 bits.
 * @param stencil Default render target has a stencil buffer of at least 8 bits.
 * @param antialias Boolean that indicates whether or not to perform anti-aliasing.
 * @param premultipliedAlpha Boolean that indicates that the page compositor will assume the drawing buffer contains colors with pre-multiplied alpha.
 * @param preserveDrawingBuffer Default render target buffers will not be automatically cleared and will preserve their values until cleared or overwritten
 * @param failIfMajorPerformanceCaveat Do not create if the system performance is low.
 */
type ContextProps = {
  onContextLost?: (event: Event) => void;
  onContextRestored?: (event: Event) => void;
  alpha?: boolean; // indicates if the canvas contains an alpha buffer.
  desynchronized?: boolean; // hints the user agent to reduce the latency by desynchronizing the canvas paint cycle from the event loop
  antialias?: boolean; // indicates whether or not to perform anti-aliasing.
  depth?: boolean; // indicates that the drawing buffer has a depth buffer of at least 16 bits.
  failIfMajorPerformanceCaveat?: boolean; // indicates if a context will be created if the system performance is low or if no hardware GPU is available.
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  premultipliedAlpha?: boolean; // page compositor will assume the drawing buffer contains colors with pre-multiplied alpha.
  preserveDrawingBuffer?: boolean; // buffers will not be cleared and will preserve their values until cleared or overwritten by the author.
};

const DEFAULT_CONTEXT_PROPS: ContextProps = {
  powerPreference: 'high-performance', // After all, most apps are using WebGL for performance reasons
  // eslint-disable-next-line no-console
  onContextLost: () => console.error('WebGL context lost'),
  // eslint-disable-next-line no-console
  onContextRestored: () => console.info('WebGL context restored')
};

/**
 * Create a WebGL context for a canvas
 * Note calling this multiple time on the same canvas does return the same context
 * @param canvas A canvas element or offscreen canvas
 */
export function createBrowserContext(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  props: ContextProps
): WebGL2RenderingContext {
  props = {...DEFAULT_CONTEXT_PROPS, ...props};

  // Try to extract any extra information about why context creation failed
  let errorMessage = null;
  const onCreateError = error => (errorMessage = error.statusMessage || errorMessage);
  canvas.addEventListener('webglcontextcreationerror', onCreateError, false);

  // Create the desired context
  let gl: WebGL2RenderingContext | null = null;

  // props.failIfMajorPerformanceCaveat = true;

  // We require webgl2 context
  gl ||= canvas.getContext('webgl2', props) as WebGL2RenderingContext;

  // Software GPU

  // props.failIfMajorPerformanceCaveat = false;

  // if (!gl && props.webgl1) {
  //   gl = canvas.getContext('webgl', props);
  // }

  // TODO are we removing this listener before giving it a chance to fire?
  canvas.removeEventListener('webglcontextcreationerror', onCreateError, false);

  if (!gl) {
    throw new Error(`Failed to create WebGL context: ${errorMessage || 'Unknown error'}`);
  }

  if (props.onContextLost) {
    // Carefully extract and wrap callbacks to prevent addEventListener from rebinding them.
    const {onContextLost} = props;
    canvas.addEventListener('webglcontextlost', (event: Event) => onContextLost(event), false);
  }
  if (props.onContextRestored) {
    // Carefully extract and wrap callbacks to prevent addEventListener from rebinding them.
    const {onContextRestored} = props;
    canvas.addEventListener(
      'webglcontextrestored',
      (event: Event) => onContextRestored(event),
      false
    );
  }

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
