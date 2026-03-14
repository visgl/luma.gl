// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { generateGLSLForModule } from './glsl/generate-glsl';
import { generateWGSLForModule } from './wgsl/generate-wgsl';
/** Generates shader code for a module */
export function generateShaderForModule(module, options) {
    switch (options.shaderLanguage) {
        case 'glsl':
            return generateGLSLForModule(module, options);
        case 'wgsl':
            return generateWGSLForModule(module, options);
    }
}
