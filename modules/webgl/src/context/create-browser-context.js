/**
 * Create a WebGL context for a canvas
 * Note calling this multiple time on the same canvas does return the same context
 */
export function createBrowserContext({
  canvas,
  opts = {}, // WebGLRenderingContext options
  onError = message => null
}) {
  // Try to extract any extra information about why context creation failed
  function onContextCreationError(error) {
    onError(`WebGL context: ${error.statusMessage || 'Unknown error'}`);
  }
  canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);

  const {webgl1 = true, webgl2 = true} = opts;
  let gl = null;
  // Prefer webgl2 over webgl1, prefer conformant over experimental
  if (webgl2) {
    gl = gl || canvas.getContext('webgl2', opts);
    gl = gl || canvas.getContext('experimental-webgl2', opts);
  }
  if (webgl1) {
    gl = gl || canvas.getContext('webgl', opts);
    gl = gl || canvas.getContext('experimental-webgl', opts);
  }

  canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);

  if (!gl) {
    return onError(`Failed to create ${webgl2 && !webgl1 ? 'WebGL2' : 'WebGL'} context`);
  }

  return gl;
}
