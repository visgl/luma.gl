// luma.gl, MIT license
// Copyright (c) vis.gl contributors
const DEFAULT_CONTEXT_PROPS = {
    webgl2: true, // Attempt to create a WebGL2 context
    webgl1: true, // Attempt to create a WebGL1 context (false to fail if webgl2 not available)
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
export function createBrowserContext(canvas, props) {
    props = { ...DEFAULT_CONTEXT_PROPS, ...props };
    // Try to extract any extra information about why context creation failed
    let errorMessage = null;
    const onCreateError = error => (errorMessage = error.statusMessage || errorMessage);
    canvas.addEventListener('webglcontextcreationerror', onCreateError, false);
    // Create the desired context
    let gl = null;
    if (props.type === 'webgl2') {
        props = { ...props, webgl1: false };
    }
    if (props.type === 'webgl1') {
        props = { ...props, webgl2: false };
    }
    // props.failIfMajorPerformanceCaveat = true;
    // Prefer webgl2 over webgl1 if both are acceptable
    if (!gl && props.webgl2) {
        gl = canvas.getContext('webgl2', props);
    }
    if (!gl && props.webgl1) {
        gl = canvas.getContext('webgl', props);
    }
    // Software GPU
    // props.failIfMajorPerformanceCaveat = false;
    // if (!gl && props.webgl2) {
    //   gl = canvas.getContext('webgl2', props);
    // }
    // if (!gl && props.webgl1) {
    //   gl = canvas.getContext('webgl', props);
    // }
    // TODO are we removing this listener before giving it a chance to fire?
    canvas.removeEventListener('webglcontextcreationerror', onCreateError, false);
    if (!gl) {
        throw new Error(`Failed to create ${props.webgl2 && !props.webgl1 ? 'WebGL2' : 'WebGL'} context: ${errorMessage || 'Unknown error'}`);
    }
    if (props.onContextLost) {
        // Carefully extract and wrap callbacks to prevent addEventListener from rebinding them.
        const { onContextLost } = props;
        canvas.addEventListener('webglcontextlost', (event) => onContextLost(event), false);
    }
    if (props.onContextRestored) {
        // Carefully extract and wrap callbacks to prevent addEventListener from rebinding them.
        const { onContextRestored } = props;
        canvas.addEventListener('webglcontextrestored', (event) => onContextRestored(event), false);
    }
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
