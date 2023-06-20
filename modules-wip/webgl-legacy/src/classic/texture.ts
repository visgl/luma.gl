import {Device, TextureFormat, TextureProps, assert} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {isWebGL2} from '@luma.gl/webgl';
import {getKey, getKeyValue} from '../webgl-utils/constants-to-keys';
import {WebGLDevice, WEBGLTexture} from '@luma.gl/webgl';
import {convertGLToTextureFormat} from '@luma.gl/webgl';
// import {isTextureFormatSupported, isTextureFormatFilterable} from '../adapter/converters/texture-formats';


export type ClassicTextureProps = Omit<TextureProps, 'format'> & {
  format?: TextureFormat | number;
};

export type {TextureProps};

export type TextureSupportOptions = {
  format?: number;
  linearFiltering?: number;
};

/**
 * This is a legacy class that adds some deprecated methods to WebGLTexture and
 * serves as base class for the deprecated Texture2D, TextureCube and Texture3D classes
 * @deprecated Use device.createTexture()
 */
export default class ClassicTexture extends WEBGLTexture {
  /** @deprecated Use device.isTextureFormatSupported() and device.isTextureFormatFilterable() */
  static isSupported(
    device: Device | WebGLRenderingContext,
    options?: TextureSupportOptions
  ): boolean {
    const webglDevice = WebGLDevice.attach(device);
    const {format, linearFiltering} = options;
    let supported = true;
    if (format) {
      const textureFormat = convertGLToTextureFormat(format);
      supported = supported && webglDevice.isTextureFormatSupported(textureFormat);
      supported = supported && (!linearFiltering || webglDevice.isTextureFormatFilterable(textureFormat));
    }
    return supported;
  }

  constructor(device: Device | WebGLRenderingContext, props: ClassicTextureProps) {
    const webglDevice = WebGLDevice.attach(device);
    super(webglDevice, {...props, format: convertGLToTextureFormat(props.format || GL.RGBA)});
  }

  // RESOURCE METHODS

  /**
   * Query a Resource parameter
   * @param name
   * @return param
   */
  getParameter(pname: number): any {
    pname = getKeyValue(this.gl, pname);
    assert(pname);

    // @ts-expect-error
    const parameters = this.constructor.PARAMETERS || {};

    // Use parameter definitions to handle unsupported parameters
    const parameter = parameters[pname];
    if (parameter) {
      const isWebgl2 = isWebGL2(this.gl);

      // Check if we can query for this parameter
      const parameterAvailable =
        (!('webgl2' in parameter) || isWebgl2) &&
        (!('extension' in parameter) || this.gl.getExtension(parameter.extension));

      if (!parameterAvailable) {
        const webgl1Default = parameter.webgl1;
        const webgl2Default = 'webgl2' in parameter ? parameter.webgl2 : parameter.webgl1;
        const defaultValue = isWebgl2 ? webgl2Default : webgl1Default;
        return defaultValue;
      }
    }

    // If unknown parameter - Could be a valid parameter not covered by PARAMS
    // Attempt to query for it and let WebGL report errors
    return this._getParameter(pname);
  }

  // Many resources support a getParameter call -
  // getParameters will get all parameters - slow but useful for debugging
  // eslint-disable-next-line complexity
  getParameters(options: {
    parameters?: any; 
    keys?: any
  } = {}): any {
    const {parameters, keys} = options;

    // Get parameter definitions for this Resource
    // @ts-expect-error
    const PARAMETERS = this.constructor.PARAMETERS || {};

    const isWebgl2 = isWebGL2(this.gl);

    const values: Record<string, unknown> = {};

    // Query all parameters if no list provided
    const parameterKeys = parameters || Object.keys(PARAMETERS);

    // WEBGL limits
    for (const pname of parameterKeys) {
      const parameter = PARAMETERS[pname];

      // Check if this parameter is available on this platform
      const parameterAvailable =
        parameter &&
        (!('webgl2' in parameter) || isWebgl2) &&
        (!('extension' in parameter) || this.gl.getExtension(parameter.extension));

      if (parameterAvailable) {
        const key = keys ? getKey(this.gl, pname) : pname;
        values[key] = this.getParameter(pname);
        if (keys && parameter.type === 'GLenum') {
          // @ts-expect-error
          values[key] = getKey(this.gl, values[key]);
        }
      }
    }

    return values;
  }

  _getParameter(pname: number): any {
    switch (pname) {
      case GL.TEXTURE_WIDTH:
        return this.width;
      case GL.TEXTURE_HEIGHT:
        return this.height;
      default:
        this.gl.bindTexture(this.target, this.handle);
        const value = this.gl.getTexParameter(this.target, pname);
        this.gl.bindTexture(this.target, null);
        return value;
    }
  }

  /**
   * Update a Resource setting
   *
   * @todo - cache parameter to avoid issuing WebGL calls?
   *
   * @param {string} pname - parameter (GL constant, value or key)
   * @param {GLint|GLfloat|GLenum} value
   * @return {Resource} returns self to enable chaining
   */
  setParameter(pname: string | number, value: any): this {
    pname = getKeyValue(this.gl, pname);
    assert(pname);

    // @ts-expect-error
    const parameters = this.constructor.PARAMETERS || {};

    const parameter = parameters[pname];
    if (parameter) {
      const isWebgl2 = isWebGL2(this.gl);

      // Check if this parameter is available on this platform
      const parameterAvailable =
        (!('webgl2' in parameter) || isWebgl2) &&
        (!('extension' in parameter) || this.gl.getExtension(parameter.extension));

      if (!parameterAvailable) {
        throw new Error('Parameter not available on this platform');
      }

      // Handle string keys
      if (parameter.type === 'GLenum') {
        // @ts-expect-error
        value = getKeyValue(value);
      }
    }

    // If unknown parameter - Could be a valid parameter not covered by PARAMS
    // attempt to set it and let WebGL report errors
    this._setParameter(pname, value);
    return this;
  }

  /*
   * Batch update resource parameters
   * Assumes the subclass supports a setParameter call
   */
  setParameters(parameters: any): this {
    for (const pname in parameters) {
      this.setParameter(pname, parameters[pname]);
    }
    return this;
  }

  /** Set one parameter */
  _setParameter(pname: number, param: number): this {
    this.gl.bindTexture(this.target, this.handle);

    param = this._getWebGL1NPOTParameterOverride(pname, param);

    // Apparently there are some integer/float conversion rules that made
    // the WebGL committe expose two parameter setting functions in JavaScript.
    // For now, pick the float version for parameters specified as GLfloat.
    switch (pname) {
      case GL.TEXTURE_MIN_LOD:
      case GL.TEXTURE_MAX_LOD:
        this.gl.texParameterf(this.target, pname, param);
        break;

      case GL.TEXTURE_WIDTH:
      case GL.TEXTURE_HEIGHT:
        assert(false);
        break;

      default:
        this.gl.texParameteri(this.target, pname, param);
        break;
    }

    this.gl.bindTexture(this.target, null);
    return this;
  }
}
