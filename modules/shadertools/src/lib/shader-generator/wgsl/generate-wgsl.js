// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { capitalize } from '../utils/capitalize';
export function generateWGSLForModule(module, options) {
    return generateWGSLUniformDeclarations(module, options);
}
export function generateWGSLUniformDeclarations(module, options) {
    const wgsl = [];
    // => uniform UniformBlockName {
    wgsl.push(`struct ${capitalize(module.name)} {`);
    for (const [uniformName, uniformFormat] of Object.entries(module?.uniformTypes || {})) {
        const wgslUniformType = uniformFormat;
        wgsl.push(`  ${uniformName} : ${wgslUniformType};`);
    }
    wgsl.push('};');
    wgsl.push(`var<uniform> ${module.name} : ${capitalize(module.name)};`);
    return wgsl.join('\n');
}
