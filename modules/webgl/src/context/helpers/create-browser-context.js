// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { getWebGLContextData } from './webgl-context-data';
/**
 * Create a WebGL context for a canvas
 * Note calling this multiple time on the same canvas does return the same context
 * @param canvas A canvas element or offscreen canvas
 */
export function createBrowserContext(canvas, props, webglContextAttributes) {
    // Try to extract any extra information about why context creation failed
    let errorMessage = '';
    const onCreateError = (event) => {
        const statusMessage = event.statusMessage;
        if (statusMessage) {
            errorMessage ||= statusMessage;
        }
    };
    canvas.addEventListener('webglcontextcreationerror', onCreateError, false);
    const allowSoftwareRenderer = webglContextAttributes.failIfMajorPerformanceCaveat !== true;
    const webglProps = {
        preserveDrawingBuffer: true,
        ...webglContextAttributes,
        // Always start by requesting a high-performance context.
        failIfMajorPerformanceCaveat: true
    };
    // Create the desired context
    let gl = null;
    try {
        // Create a webgl2 context
        gl ||= canvas.getContext('webgl2', webglProps);
        if (!gl && webglProps.failIfMajorPerformanceCaveat) {
            errorMessage ||=
                'Only software GPU is available. Set `failIfMajorPerformanceCaveat: false` to allow.';
        }
        // Creation failed with failIfMajorPerformanceCaveat - Try a Software GPU
        let softwareRenderer = false;
        if (!gl && allowSoftwareRenderer) {
            webglProps.failIfMajorPerformanceCaveat = false;
            gl = canvas.getContext('webgl2', webglProps);
            softwareRenderer = true;
        }
        if (!gl) {
            gl = canvas.getContext('webgl', {});
            if (gl) {
                gl = null;
                errorMessage ||= 'Your browser only supports WebGL1';
            }
        }
        if (!gl) {
            errorMessage ||= 'Your browser does not support WebGL';
            throw new Error(`Failed to create WebGL context: ${errorMessage}`);
        }
        // Initialize luma.gl specific context data
        const luma = getWebGLContextData(gl);
        luma.softwareRenderer = softwareRenderer;
        // Carefully extract and wrap callbacks to prevent addEventListener from rebinding them.
        const { onContextLost, onContextRestored } = props;
        canvas.addEventListener('webglcontextlost', (event) => onContextLost(event), false);
        canvas.addEventListener('webglcontextrestored', (event) => onContextRestored(event), false);
        return gl;
    }
    finally {
        canvas.removeEventListener('webglcontextcreationerror', onCreateError, false);
    }
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
