// luma.gl, MIT license
// Copyright (c) vis.gl contributors
import { isWebGL2 } from '../../context/context/webgl-checks';
import { isOldIE } from './is-old-ie';
import { getTextureFeatures, _checkFloat32ColorAttachment } from '../converters/texture-formats';
/** Get WebGPU style feature strings */
export function getDeviceFeatures(gl) {
    const features = getWebGLFeatures(gl);
    // texture features
    // features.add('texture-compression-bc'); 
    for (const textureFeature of getTextureFeatures(gl)) {
        features.add(textureFeature);
    }
    // TODO
    // features.add('depth-clip-control'); // GPUPrimitiveState.clampDepth
    // features.add('depth24unorm-stencil8'); // GPUTextureFormat 'depth24unorm-stencil8'.
    // features.add('depth32float-stencil8'); // GPUTextureFormat 'depth32float-stencil8'.
    // features.add('timestamp-query'); // GPUQueryType "timestamp-query"
    // "indirect-first-instance"
    return features;
}
/** Extract all WebGL features */
export function getWebGLFeatures(gl) {
    // Enables EXT_float_blend first: https://developer.mozilla.org/en-US/docs/Web/API/EXT_float_blend
    gl.getExtension('EXT_color_buffer_float');
    gl.getExtension('WEBGL_color_buffer_float');
    gl.getExtension('EXT_float_blend');
    const features = new Set();
    for (const feature of Object.keys(WEBGL_FEATURES)) {
        // @ts-expect-error
        if (isFeatureSupported(gl, feature)) {
            // @ts-expect-error
            features.add(feature);
        }
    }
    return features;
}
function isFeatureSupported(gl, feature) {
    const featureInfo = WEBGL_FEATURES[feature];
    if (!featureInfo) {
        return false;
    }
    const [webgl1Feature, webgl2Feature] = featureInfo || [];
    // Get extension name from table
    const featureDefinition = isWebGL2(gl) ? webgl2Feature : webgl1Feature;
    // Check if the value is dependent on checking one or more extensions
    if (typeof featureDefinition === 'boolean') {
        return featureDefinition;
    }
    switch (feature) {
        case 'texture-renderable-rgba32float-webgl':
            return isWebGL2(gl) ? Boolean(gl.getExtension(featureDefinition)) :
                _checkFloat32ColorAttachment(gl);
        case 'glsl-derivatives':
            return canCompileGLSLExtension(gl, featureDefinition); // TODO options
        case 'glsl-frag-data':
            return canCompileGLSLExtension(gl, featureDefinition, { behavior: 'require' }); // TODO options
        case 'glsl-frag-depth':
            return canCompileGLSLExtension(gl, featureDefinition); // TODO options
        default:
            return Boolean(gl.getExtension(featureDefinition));
    }
}
const compiledGLSLExtensions = {};
/*
 * Enables feature detection in IE11 due to a bug where gl.getExtension may return true
 * but fail to compile when the extension is enabled in the shader. Specifically,
 * the OES_standard_derivatives and WEBGL_draw_buffers extensions fails to compile in IE11 even though its included
 * in the list of supported extensions.
 * opts allows user agent to be overridden for testing
 * Inputs :
 *  gl : WebGL context
 *  cap : Key of WEBGL_FEATURES object identifying the extension
 *  opts :
 *   behavior : behavior of extension to be tested, by defualt `enable` is used
 * Returns : true, if shader is compiled successfully, false otherwise
 */
export function canCompileGLSLExtension(gl, extensionName, opts = {}) {
    if (!isOldIE(opts)) {
        return true;
    }
    if (extensionName in compiledGLSLExtensions) {
        return compiledGLSLExtensions[extensionName];
    }
    const behavior = opts.behavior || 'enable';
    const source = `#extension GL_${extensionName} : ${behavior}\nvoid main(void) {}`;
    const shader = gl.createShader(gl.VERTEX_SHADER);
    if (!shader) {
        throw new Error('shader');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const canCompile = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    gl.deleteShader(shader);
    compiledGLSLExtensions[extensionName] = canCompile;
    return canCompile;
}
/** Defines luma.gl "feature" names and semantics
 * Format: 'feature-name: [WebGL1 support, WebGL2 support] / [WebGL1 and WebGL2 support]', when support is 'string' it is the name of the extension
 */
const WEBGL_FEATURES = {
    'webgl': [true, true],
    'webgl2': [false, true],
    'timer-query-webgl': ['EXT_disjoint_timer_query', 'EXT_disjoint_timer_query_webgl2'],
    'transform-feedback-webgl2': [false, true],
    // WEBGL1 SUPPORT
    'vertex-array-object-webgl1': ['OES_vertex_array_object', true],
    'instanced-rendering-webgl1': ['ANGLE_instanced_arrays', true],
    'multiple-render-targets-webgl1': ['WEBGL_draw_buffers', true],
    'index-uint32-webgl1': ['OES_element_index_uint', true],
    'blend-minmax-webgl1': ['EXT_blend_minmax', true],
    'texture-blend-float-webgl1': ['EXT_float_blend', 'EXT_float_blend'],
    // TEXTURES, RENDERBUFFERS
    'texture-formats-srgb-webgl1': ['EXT_sRGB', true],
    // TEXTURES
    'texture-formats-depth-webgl1': ['WEBGL_depth_texture', true],
    'texture-formats-float32-webgl1': ['OES_texture_float', true],
    'texture-formats-float16-webgl1': ['OES_texture_half_float', true],
    'texture-filter-linear-float32-webgl': ['OES_texture_float_linear', 'OES_texture_float_linear'],
    'texture-filter-linear-float16-webgl': ['OES_texture_half_float_linear', 'OES_texture_half_float_linear'],
    'texture-filter-anisotropic-webgl': ['EXT_texture_filter_anisotropic', 'EXT_texture_filter_anisotropic'],
    // FRAMEBUFFERS, TEXTURES AND RENDERBUFFERS
    'texture-renderable-rgba32float-webgl': ['WEBGL_color_buffer_float', 'EXT_color_buffer_float'], // Note override check
    'texture-renderable-float32-webgl': [false, 'EXT_color_buffer_float'],
    'texture-renderable-float16-webgl': ['EXT_color_buffer_half_float', 'EXT_color_buffer_half_float'],
    // GLSL extensions
    'glsl-frag-data': ['WEBGL_draw_buffers', true],
    'glsl-frag-depth': ['EXT_frag_depth', true],
    'glsl-derivatives': ['OES_standard_derivatives', true],
    'glsl-texture-lod': ['EXT_shader_texture_lod', true]
};
