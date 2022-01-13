import {Sampler, SamplerProps} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import type {WebGLSamplerParameters} from '../../types/webgl';
import {convertSamplerParametersToWebGL} from '../converters/sampler-parameters';
import type WebGLDevice from '../webgl-device';

/**
 * Sampler object -
 * Under WebGL2 we create an actual WebGL sampler
 * Under WebGL1, we just store the sampler parameters
 * so that they can be set directly on the texture
 * https://github.com/WebGLSamples/WebGL2Samples/blob/master/samples/sampler_object.html
 */
export default class WEBGLSampler extends Sampler {
  readonly device: WebGLDevice;
  readonly handle: WebGLSampler;
  readonly parameters: WebGLSamplerParameters;

  constructor(device: WebGLDevice, props: SamplerProps) {
    super(device, props);
    this.device = device;
    this.parameters = convertSamplerParametersToWebGL(props);
    if (this.device.isWebGL2) {
      this.handle = this.handle || this.device.gl2.createSampler();
      this._setSamplerParameters(this.parameters);
    }
  }

  destroy(): void {
    if (this.handle) {
      this.device.gl2.deleteSampler(this.handle);
      // @ts-expect-error
      this.handle = undefined;
    }
  }

  /** Set sampler parameters on the sampler */
  private _setSamplerParameters(parameters: WebGLSamplerParameters): void {
    for (const [pname, value] of Object.entries(parameters)) {
      // Apparently there are integer/float conversion issues requires two parameter setting functions in JavaScript.
      // For now, pick the float version for parameters specified as GLfloat.
      const param = Number(pname);
      switch (param) {
        case GL.TEXTURE_MIN_LOD:
        case GL.TEXTURE_MAX_LOD:
          this.device.gl2.samplerParameterf(this.handle, param, value);
          break;
        default:
          this.device.gl2.samplerParameteri(this.handle, param, value);
          break;
      }
    }
  }
}
