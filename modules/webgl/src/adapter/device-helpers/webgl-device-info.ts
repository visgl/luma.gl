// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DeviceInfo} from '@luma.gl/core';
import {GL, GLExtensions} from '@luma.gl/constants';
import {getWebGLExtension} from '../../context/helpers/webgl-extensions';

/** @returns strings identifying the GPU vendor and driver. */
export function getDeviceInfo(gl: WebGL2RenderingContext, extensions: GLExtensions): DeviceInfo {
  // "Masked" info is always available, but don't contain much useful information
  const vendorMasked = gl.getParameter(GL.VENDOR);
  const rendererMasked = gl.getParameter(GL.RENDERER);

  // If we are lucky, unmasked info is available
  // https://www.khronos.org/registry/webgl/extensions/WEBGL_debug_renderer_info/
  getWebGLExtension(gl, 'WEBGL_debug_renderer_info', extensions);
  const ext = extensions.WEBGL_debug_renderer_info;
  const vendorUnmasked = gl.getParameter(ext ? ext.UNMASKED_VENDOR_WEBGL : GL.VENDOR);
  const rendererUnmasked = gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : GL.RENDERER);
  const vendor = vendorUnmasked || vendorMasked;
  const renderer = rendererUnmasked || rendererMasked;

  // Driver version
  const version = gl.getParameter(GL.VERSION) as string;

  // "Sniff" the GPU type and backend from the info. This works best if unmasked info is available.
  const gpu = identifyGPUVendor(vendor, renderer);
  const gpuBackend = identifyGPUBackend(vendor, renderer);
  const gpuType = identifyGPUType(vendor, renderer);

  // Determine GLSL version
  // For now, skip parsing of the long version string, just use context type below to deduce version
  // const version = gl.getParameter(GL.SHADING_LANGUAGE_VERSION) as string;
  // const shadingLanguageVersion = parseGLSLVersion(version);
  const shadingLanguage = 'glsl';
  const shadingLanguageVersion = 300;

  return {
    type: 'webgl',
    gpu,
    gpuType,
    gpuBackend,
    vendor,
    renderer,
    version,
    shadingLanguage,
    shadingLanguageVersion
  };
}

/** "Sniff" the GPU type from the info. This works best if unmasked info is available. */
function identifyGPUVendor(
  vendor: string,
  renderer: string
): 'nvidia' | 'intel' | 'apple' | 'amd' | 'software' | 'unknown' {
  if (/NVIDIA/i.exec(vendor) || /NVIDIA/i.exec(renderer)) {
    return 'nvidia';
  }
  if (/INTEL/i.exec(vendor) || /INTEL/i.exec(renderer)) {
    return 'intel';
  }
  if (/Apple/i.exec(vendor) || /Apple/i.exec(renderer)) {
    return 'apple';
  }
  if (
    /AMD/i.exec(vendor) ||
    /AMD/i.exec(renderer) ||
    /ATI/i.exec(vendor) ||
    /ATI/i.exec(renderer)
  ) {
    return 'amd';
  }
  if (/SwiftShader/i.exec(vendor) || /SwiftShader/i.exec(renderer)) {
    return 'software';
  }

  return 'unknown';
}

/** "Sniff" the GPU backend from the info. This works best if unmasked info is available. */
function identifyGPUBackend(vendor: string, renderer: string): 'opengl' | 'metal' | 'unknown' {
  if (/Metal/i.exec(vendor) || /Metal/i.exec(renderer)) {
    return 'metal';
  }
  if (/ANGLE/i.exec(vendor) || /ANGLE/i.exec(renderer)) {
    return 'opengl';
  }
  return 'unknown';
}

function identifyGPUType(
  vendor: string,
  renderer: string
): 'discrete' | 'integrated' | 'cpu' | 'unknown' {
  if (/SwiftShader/i.exec(vendor) || /SwiftShader/i.exec(renderer)) {
    return 'cpu';
  }

  const gpuVendor = identifyGPUVendor(vendor, renderer);
  switch (gpuVendor) {
    case 'intel':
      return 'integrated';
    case 'software':
      return 'cpu';
    case 'unknown':
      return 'unknown';
    default:
      return 'discrete';
  }
}
