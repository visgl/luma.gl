import {parsePropTypes} from './prop-types';

function defaultGetUniforms(module, props) {
  const uniforms = {};

  if (props === undefined) {
    for (const key in module.uniforms) {
      uniforms[key] = module.uniforms[key].value;
    }
    return uniforms;
  }

  for (const key in props) {
    // TODO validate, clamp etc
    uniforms[key] = props[key];
  }

  return uniforms;
}

// Note: modifies and returns the same module
export function normalizeShaderModule(module) {
  if (!module.normalized) {
    module.normalized = true;

    // Normalize uniforms
    if (module.uniforms) {
      const {propTypes} = parsePropTypes(module.uniforms);
      module.uniforms = propTypes;
    }

    // Build a getUniforms from the uniforms array
    if (module.uniforms && !module.getUniforms) {
      module.getUniforms = defaultGetUniforms.bind(null, module);
    }
  }

  return module;
}
