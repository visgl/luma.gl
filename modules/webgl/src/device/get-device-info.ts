import {DeviceInfo} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {isWebGL2} from '../context/context/webgl-checks';
  
/** @returns strings identifying the GPU vendor and driver. */
export function getDeviceInfo(gl: WebGLRenderingContext): DeviceInfo {
  const vendorMasked = gl.getParameter(GL.VENDOR);
  const rendererMasked = gl.getParameter(GL.RENDERER);
  // Get unmasked strings if available
  // https://www.khronos.org/registry/webgl/extensions/WEBGL_debug_renderer_info/
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const vendorUnmasked = ext && gl.getParameter(ext.UNMASKED_VENDOR_WEBGL || GL.VENDOR);
  const rendererUnmasked =
    ext && this.gl.getParameter(ext.UNMASKED_RENDERER_WEBGL || GL.RENDERER);
  return {
    type: isWebGL2(gl) ? 'webgl2' : 'webgl',
    vendor: vendorUnmasked || vendorMasked,
    renderer: rendererUnmasked || rendererMasked,
    version: gl.getParameter(GL.VERSION),
    shadingLanguages: ['glsl'],
    shadingLanguageVersions: {
      'glsl': gl.getParameter(GL.SHADING_LANGUAGE_VERSION) as string
    }
  };
}
