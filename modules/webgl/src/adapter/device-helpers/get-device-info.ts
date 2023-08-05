import {DeviceInfo} from '@luma.gl/api';
import {GL} from '@luma.gl/constants';
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
  const gpu = identifyGPUVendor(vendor, renderer);
  return {
    type: isWebGL2(gl) ? 'webgl2' : 'webgl',
    gpu,
    vendor: vendorUnmasked || vendorMasked,
    renderer: rendererUnmasked || rendererMasked,
    version: gl.getParameter(GL.VERSION),
    shadingLanguages: ['glsl'],
    shadingLanguageVersions: {
      'glsl': gl.getParameter(GL.SHADING_LANGUAGE_VERSION) as string
    }
  };
}

function identifyGPUVendor(vendor: string, renderer: string): 'nvidia' | 'intel' | 'apple' | 'amd' | 'software' | 'unknown' {
  if ((/NVIDIA/i.exec(vendor)) || (/NVIDIA/i.exec(renderer))) {
    return 'nvidia';
  }
  if ((/INTEL/i.exec(vendor)) || (/INTEL/i.exec(renderer))) {
    return 'intel';
  }
  if ((/Apple/i.exec(vendor)) || (/Apple/i.exec(renderer))) {
    return 'apple';
  }
  if (
    (/AMD/i.exec(vendor)) ||
    (/AMD/i.exec(renderer)) ||
    (/ATI/i.exec(vendor)) ||
    (/ATI/i.exec(renderer))
  ) {
    return 'amd';
  }
  if ((/SwiftShader/i.exec(vendor)) || (/SwiftShader/i.exec(renderer))) {
    return 'software';
  }
  
  return 'unknown';
}
