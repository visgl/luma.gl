import {getShaderDependencies, getShaderModule} from './register-shaders';
import {glGetDebugInfo} from '../../webgl';
import assert from 'assert';

const VERTEX_SHADER = 'vertexShader';
const FRAGMENT_SHADER = 'fragmentShader';

export function checkRendererVendor(debugInfo, gpuVendor) {
  const {vendor, renderer} = debugInfo;
  let result;
  switch (gpuVendor) {
  case 'nvidia':
    result = vendor.match(/NVIDIA/i) || renderer.match(/NVIDIA/i);
    break;
  case 'intel':
    result = vendor.match(/INTEL/i) || renderer.match(/INTEL/i);
    break;
  case 'amd':
    result =
      vendor.match(/AMD/i) || renderer.match(/AMD/i) ||
      vendor.match(/ATI/i) || renderer.match(/ATI/i);
    break;
  default:
    result = false;
  }
  return result;
}

export function getPlatformShaderDefines(gl) {
  /* eslint-disable */
  let platformDefines = '';
  const debugInfo = glGetDebugInfo(gl);

  if (checkRendererVendor(debugInfo, 'nvidia')) {
    platformDefines += `\
#define NVIDIA_GPU
#define NVIDIA_FP64_WORKAROUND 1
#define NVIDIA_EQUATION_WORKAROUND 1
`;
  } else if (checkRendererVendor(debugInfo, 'intel')) {
    platformDefines += `\
#define INTEL_GPU
#define INTEL_FP64_WORKAROUND 1
#define NVIDIA_EQUATION_WORKAROUND 1\n \
#define INTEL_TAN_WORKAROUND 1
`;
  } else if (checkRendererVendor(debugInfo, 'amd')) {
    platformDefines += `\
#define AMD_GPU
`;
  } else {
    platformDefines += `\
#define DEFAULT_GPU
`;
  }

  return platformDefines;
}

function assembleShader(gl, {
  source,
  type,
  modules = []
}) {
  assert(typeof source === 'string', 'shader source must be a string');

  // Add platform defines
  let assembledSource = `${getPlatformShaderDefines(gl)}\n`;

  // Add dependent modules in resolved order
  for (const moduleName of modules) {
    const shaderModule = getShaderModule(moduleName);
    if (!shaderModule) {
      assert(shaderModule, 'shader module is not defined');
    }
    const moduleSource = shaderModule[type];
    assembledSource += `\
// BEGIN SHADER MODULE ${moduleName}
#define MODULE_${moduleName.toUpperCase()}
${moduleSource}
// END SHADER MODULE ${moduleName}`;
  }

  // Add actual source of shader
  assembledSource += source;

  return assembledSource;
}

/**
 * Apply set of modules
 */
export function assembleShaders(gl, opts = {}) {
  const {vs, fs} = opts;
  const modules = getShaderDependencies(opts.modules || []);
  return {
    gl,
    vs: assembleShader(gl, Object.assign({}, opts, {source: vs, type: VERTEX_SHADER, modules})),
    fs: assembleShader(gl, Object.assign({}, opts, {source: fs, type: FRAGMENT_SHADER, modules}))
  };
}
