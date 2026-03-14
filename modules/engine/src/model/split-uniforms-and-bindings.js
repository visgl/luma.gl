// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { isNumericArray } from '@math.gl/types';
export function isUniformValue(value) {
    return isNumericArray(value) || typeof value === 'number' || typeof value === 'boolean';
}
export function splitUniformsAndBindings(uniforms) {
    const result = { bindings: {}, uniforms: {} };
    Object.keys(uniforms).forEach(name => {
        const uniform = uniforms[name];
        if (isUniformValue(uniform)) {
            result.uniforms[name] = uniform;
        }
        else {
            result.bindings[name] = uniform;
        }
    });
    return result;
}
