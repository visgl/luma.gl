import {DeviceInfo} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {isWebGL2} from '../../context/context/webgl-checks';

/** @returns strings identifying the GPU vendor and driver. */
export function getDeviceInfo(gl: WebGLRenderingContext): DeviceInfo {
  const vendorMasked = gl.getParameter(GL.VENDOR);
  const rendererMasked = gl.getParameter(GL.RENDERER);
  // Get unmasked strings if available
  // https://www.khronos.org/registry/webgl/extensions/WEBGL_debug_renderer_info/
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const vendorUnmasked = gl.getParameter(ext ? ext.UNMASKED_VENDOR_WEBGL : GL.VENDOR);
  const rendererUnmasked = gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : GL.RENDERER);
  const vendor = vendorUnmasked || vendorMasked;
  const renderer = rendererUnmasked || rendererMasked;
  const gpuVendor = identifyGPUVendor(vendor, renderer);
  return {
    type: isWebGL2(gl) ? 'webgl2' : 'webgl',
    gpuVendor,
    vendor: vendorUnmasked || vendorMasked,
    renderer: rendererUnmasked || rendererMasked,
    version: gl.getParameter(GL.VERSION),
    shadingLanguages: ['glsl'],
    shadingLanguageVersions: {
      'glsl': gl.getParameter(GL.SHADING_LANGUAGE_VERSION) as string
    }
  };
}

function identifyGPUVendor(vendor: string, renderer: string): 'NVIDIA' | 'INTEL' | 'APPLE' | 'AMD' | 'UNKNOWN' {
  if (vendor.match(/NVIDIA/i) || renderer.match(/NVIDIA/i)) {
    return 'NVIDIA';
  }
  if (vendor.match(/INTEL/i) || renderer.match(/INTEL/i)) {
    return 'INTEL';
  }
  if (vendor.match(/Apple/i) || renderer.match(/Apple/i)) {
    return 'APPLE';
  }
  if (
    vendor.match(/AMD/i) ||
    renderer.match(/AMD/i) ||
    vendor.match(/ATI/i) ||
    renderer.match(/ATI/i)
  ) {
    return 'AMD';
  }
  return 'UNKNOWN';
}
