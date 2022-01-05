// luma.gl, MIT license

/**
 * ContextProps
* @param webgl2 Set to false to not create a WebGL2 context (force webgl1)
* @param webgl1 set to false to not create a WebGL1 context (fail if webgl2 not available)
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
  type?: 'webgl' | 'webgl1' | 'webgl2' | string;
  webgl1?: boolean;
  webgl2?: boolean;
  onContextLost?: (event: Event) => void;
  onContextRestored?: (event: Event) => void;
  alpha?: boolean; // indicates if the canvas contains an alpha buffer.
  desynchronized?: boolean; // hints the user agent to reduce the latency by desynchronizing the canvas paint cycle from the event loop
  antialias?: boolean; // indicates whether or not to perform anti-aliasing.
  depth?: boolean; // indicates that the drawing buffer has a depth buffer of at least 16 bits.
  failIfMajorPerformanceCaveat?: boolean, // indicates if a context will be created if the system performance is low or if no hardware GPU is available.
  powerPreference?: 'default' |  'high-performance' | 'low-power',
  premultipliedAlpha?: boolean, // page compositor will assume the drawing buffer contains colors with pre-multiplied alpha.
  preserveDrawingBuffer?: boolean // buffers will not be cleared and will preserve their values until cleared or overwritten by the author.
};

const DEFAULT_CONTEXT_PROPS: ContextProps = {
  webgl2: true, // Attempt to create a WebGL2 context
  webgl1: true, // Attempt to create a WebGL1 context (false to fail if webgl2 not available)
  powerPreference: 'high-performance', // After all, most apps are using WebGL for performance reasons
  onContextLost: () => console.error('WebGL context lost'),
  onContextRestored: () => console.info('WebGL context restored'),
};

/**
 * Create a WebGL context for a canvas
 * Note calling this multiple time on the same canvas does return the same context
* @param canvas A canvas element or offscreen canvas
 */
 export function createBrowserContext(canvas: HTMLCanvasElement | OffscreenCanvas, props: ContextProps): WebGLRenderingContext {
   props = {...DEFAULT_CONTEXT_PROPS, ...props};

  // Try to extract any extra information about why context creation failed
  let errorMessage = null;
  const onCreateError = (error) => (errorMessage = error.statusMessage || errorMessage);
  canvas.addEventListener('webglcontextcreationerror', onCreateError, false);

  // Create the desired context
  let gl = null;

  if (props.type === 'webgl2') {
    props = {...props, webgl1: false};
  }
  if (props.type === 'webgl1') {
    props = {...props, webgl2: false};
  }

  // Prefer webgl2 over webgl1 if both are acceptable
  if (props.webgl2) {
    gl = gl || canvas.getContext('webgl2', props);
  }
  if (props.webgl1) {
    gl = gl || canvas.getContext('webgl', props);
  }

  // TODO are we removing this listener before giving it a chance to fire?
  canvas.removeEventListener('webglcontextcreationerror', onCreateError, false);

  if (!gl) {
    throw new Error(
      `Failed to create ${props.webgl2 && !props.webgl1 ? 'WebGL2' : 'WebGL'} context: ${
        errorMessage || 'Unknown error'
      }`
    );
  }

  canvas.addEventListener('webglcontextlost', props.onContextLost, false);
  canvas.addEventListener('webglcontextrestored', props.onContextRestored, false);

  return gl;
}

/* TODO - can we call this asynchronously to catch the error events?
export async function createBrowserContextAsync(canvas: HTMLCanvasElement | OffscreenCanvas, props: ContextProps): Promise<WebGLRenderingContext> {
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
