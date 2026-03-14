// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { arrayEqual, arrayCopy } from '../utils/array-equal';
/**
 * A uniform block holds values of the of uniform values for one uniform block / buffer.
 * It also does some book keeping on what has changed, to minimize unnecessary writes to uniform buffers.
 */
export class UniformBlock {
    name;
    uniforms = {};
    modifiedUniforms = {};
    modified = true;
    bindingLayout = {};
    needsRedraw = 'initialized';
    constructor(props) {
        this.name = props?.name || 'unnamed';
        // TODO - Extract uniform layout from the shaderLayout object
        if (props?.name && props?.shaderLayout) {
            const binding = props?.shaderLayout.bindings?.find(binding_ => binding_.type === 'uniform' && binding_.name === props?.name);
            if (!binding) {
                throw new Error(props?.name);
            }
            const uniformBlock = binding;
            for (const uniform of uniformBlock.uniforms || []) {
                this.bindingLayout[uniform.name] = uniform;
            }
        }
    }
    /** Set a map of uniforms */
    setUniforms(uniforms) {
        for (const [key, value] of Object.entries(uniforms)) {
            this._setUniform(key, value);
            if (!this.needsRedraw) {
                this.setNeedsRedraw(`${this.name}.${key}=${value}`);
            }
        }
    }
    setNeedsRedraw(reason) {
        this.needsRedraw = this.needsRedraw || reason;
    }
    /** Returns all uniforms */
    getAllUniforms() {
        // @ts-expect-error
        this.modifiedUniforms = {};
        this.needsRedraw = false;
        return (this.uniforms || {});
    }
    /** Set a single uniform */
    _setUniform(key, value) {
        if (arrayEqual(this.uniforms[key], value)) {
            return;
        }
        this.uniforms[key] = arrayCopy(value);
        this.modifiedUniforms[key] = true;
        this.modified = true;
    }
}
