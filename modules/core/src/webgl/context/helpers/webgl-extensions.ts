// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GLExtensions} from '../../../webgl-constants/index';

/** Ensure extensions are only requested once */
export function getWebGLExtension(
  gl: WebGL2RenderingContext,
  name: string,
  extensions: GLExtensions
): unknown {
  // @ts-ignore TODO
  if (extensions[name] === undefined) {
    // @ts-ignore TODO
    extensions[name] = gl.getExtension(name) || null;
  }
  // @ts-ignore TODO
  return extensions[name];
}

// WebGL API extension names and GLSL directive names can differ.
const GLSL_EXTENSION_NAMES = new Map([
  ['EXT_conservative_depth', 'GL_EXT_conservative_depth'],
  ['NV_shader_noperspective_interpolation', 'GL_NV_shader_noperspective_interpolation'],
  ['OES_sample_variables', 'GL_OES_sample_variables'],
  ['OES_shader_multisample_interpolation', 'GL_OES_shader_multisample_interpolation'],
  ['OVR_multiview2', 'GL_OVR_multiview2'],
  ['WEBGL_blend_func_extended', 'GL_EXT_blend_func_extended'],
  ['WEBGL_clip_cull_distance', 'GL_ANGLE_clip_cull_distance'],
  ['WEBGL_multi_draw', 'GL_ANGLE_multi_draw'],
  ['WEBGL_multi_draw_instanced_base_vertex_base_instance', 'GL_ANGLE_multi_draw'],
  ['WEBGL_shader_pixel_local_storage', 'GL_ANGLE_shader_pixel_local_storage']
]);

/** Discover GLSL features without enabling WebGL extensions. */
export function getGLSLLanguageFeatures(
  gl: Pick<WebGL2RenderingContext, 'getSupportedExtensions'>
): ReadonlySet<string> {
  const languageFeatures = new Set<string>();
  for (const extension of gl.getSupportedExtensions() ?? []) {
    const directiveName = GLSL_EXTENSION_NAMES.get(extension);
    if (directiveName) {
      languageFeatures.add(directiveName);
    }
  }
  return languageFeatures;
}
