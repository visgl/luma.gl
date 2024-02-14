// luma.gl, MIT license
// Copyright (c) vis.gl contributors
export { VERSION } from './init';
export { isTypedArray, isNumberArray } from './utils/is-array';
// MAIN API ACCESS POINTS
export { luma } from './lib/luma';
export { Device } from './adapter/device';
export { CanvasContext } from './adapter/canvas-context';
export { Resource } from './adapter/resources/resource';
export { Buffer } from './adapter/resources/buffer';
export { Texture } from './adapter/resources/texture';
export { ExternalTexture } from './adapter/resources/external-texture';
export { Shader } from './adapter/resources/shader';
export { Sampler } from './adapter/resources/sampler';
export { Framebuffer } from './adapter/resources/framebuffer';
export { RenderPipeline } from './adapter/resources/render-pipeline';
export { ComputePipeline } from './adapter/resources/compute-pipeline';
export { RenderPass } from './adapter/resources/render-pass';
export { ComputePass } from './adapter/resources/compute-pass';
export { CommandEncoder } from './adapter/resources/command-encoder';
export { CommandBuffer } from './adapter/resources/command-buffer';
export { VertexArray } from './adapter/resources/vertex-array';
export { TransformFeedback } from './adapter/resources/transform-feedback';
export { UniformBufferLayout } from './lib/uniforms/uniform-buffer-layout';
export { UniformBlock } from './lib/uniforms/uniform-block';
export { UniformStore } from './lib/uniforms/uniform-store';
// TYPE UTILS
export { decodeVertexFormat } from './adapter/type-utils/decode-vertex-format';
export { decodeTextureFormat } from './adapter/type-utils/decode-texture-format';
export { getDataTypeFromTypedArray, getTypedArrayFromDataType, getVertexFormatFromAttribute } from './adapter/type-utils/vertex-format-from-attribute';
// SHADER TYPE UTILS
export { decodeShaderUniformType } from './adapter/type-utils/decode-shader-types';
export { decodeShaderAttributeType } from './adapter/type-utils/decode-attribute-type';
export { formatCompilerLog } from './lib/compiler-log/format-compiler-log';
export { getAttributeInfosFromLayouts, mergeShaderLayout } from './adapter/attribute-utils/get-attribute-from-layouts';
// GENERAL UTILS
export { StatsManager } from './utils/stats-manager';
export { assert } from './utils/assert';
export { cast } from './utils/cast';
export { log } from './utils/log';
export { uid, isPowerOfTwo, isObjectEmpty } from './utils/utils';
export { isUniformValue, splitUniformsAndBindings } from './lib/uniforms/uniform';
export { formatValue } from './utils/format-value';
export { stubRemovedMethods } from './utils/stub-methods';
export { checkProps } from './utils/check-props';
export { setPathPrefix, loadFile, loadImage, loadImageBitmap, loadScript } from './utils/load-file';
export { getScratchArrayBuffer, getScratchArray, fillArray } from './utils/array-utils-flat';
export { makeRandomNumberGenerator, random } from './utils/random';
export { deepEqual } from './utils/deep-equal';
// ENGINE - TODO/move to @luma.gl/engine once that module is webgl-independent?
export { requestAnimationFrame, cancelAnimationFrame } from './utils/request-animation-frame';
// SHADER HELPERS
/**
 * Marks GLSL shaders for syntax highlighting: glsl`...`
 * Install https://marketplace.visualstudio.com/items?itemName=boyswan.glsl-literal
 */
export const glsl = (x) => `${x}`;
