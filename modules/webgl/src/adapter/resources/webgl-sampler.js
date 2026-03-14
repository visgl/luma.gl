// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Sampler } from '@luma.gl/core';
import { GL } from '@luma.gl/constants';
import { convertSamplerParametersToWebGL } from '../converters/sampler-parameters';
/**
 * Sampler object -
 * so that they can be set directly on the texture
 * https://github.com/WebGLSamples/WebGL2Samples/blob/master/samples/sampler_object.html
 */
export class WEBGLSampler extends Sampler {
    device;
    handle;
    parameters;
    constructor(device, props) {
        super(device, props);
        this.device = device;
        this.parameters = convertSamplerParametersToWebGL(props);
        this.handle = props.handle || this.device.gl.createSampler();
        this._setSamplerParameters(this.parameters);
    }
    destroy() {
        if (this.handle) {
            this.device.gl.deleteSampler(this.handle);
            // @ts-expect-error read-only/undefined
            this.handle = undefined;
        }
    }
    toString() {
        return `Sampler(${this.id},${JSON.stringify(this.props)})`;
    }
    /** Set sampler parameters on the sampler */
    _setSamplerParameters(parameters) {
        for (const [pname, value] of Object.entries(parameters)) {
            // Apparently there are integer/float conversion issues requires two parameter setting functions in JavaScript.
            // For now, pick the float version for parameters specified as GLfloat.
            const param = Number(pname);
            switch (param) {
                case GL.TEXTURE_MIN_LOD:
                case GL.TEXTURE_MAX_LOD:
                    this.device.gl.samplerParameterf(this.handle, param, value);
                    break;
                default:
                    this.device.gl.samplerParameteri(this.handle, param, value);
                    break;
            }
        }
    }
}
