import GL from '@luma.gl/constants';
import {isWebGL2, getContextDebugInfo} from '@luma.gl/gltools';
import WEBGL_LIMITS from './webgl-limits-table';
import {getLumaContextData} from '../context/luma-context-data';

export function getContextLimits(gl) {
  const lumaContextData = getLumaContextData(gl);

  if (!lumaContextData.limits) {
    lumaContextData.limits = {};
    lumaContextData.webgl1MinLimits = {};
    lumaContextData.webgl2MinLimits = {};

    const isWebgl2 = isWebGL2(gl);

    // WEBGL limits
    for (const parameter in WEBGL_LIMITS) {
      const limit = WEBGL_LIMITS[parameter];

      const webgl1MinLimit = limit.gl1;
      const webgl2MinLimit = 'gl2' in limit ? limit.gl2 : limit.gl1;
      const minLimit = isWebgl2 ? webgl2MinLimit : webgl1MinLimit;

      // Check if we can query for this limit
      const limitNotAvailable =
        ('gl2' in limit && !isWebgl2) ||
        // @ts-ignore
        ('extension' in limit && !gl.getExtension(limit.extension));

      const value = limitNotAvailable ? minLimit : gl.getParameter(parameter);
      lumaContextData.limits[parameter] = value;
      lumaContextData.webgl1MinLimits[parameter] = webgl1MinLimit;
      lumaContextData.webgl2MinLimits[parameter] = webgl2MinLimit;
    }
  }

  return lumaContextData.limits;
}

export function getGLContextInfo(gl) {
  const lumaContextData = getLumaContextData(gl);

  const info = getContextDebugInfo(gl);
  if (!lumaContextData.info) {
    lumaContextData.info = {
      [GL.UNMASKED_VENDOR_WEBGL]: info.vendor,
      [GL.UNMASKED_RENDERER_WEBGL]: info.renderer,
      [GL.VENDOR]: info.vendorMasked,
      [GL.RENDERER]: info.rendererMasked,
      [GL.VERSION]: info.version,
      [GL.SHADING_LANGUAGE_VERSION]: info.shadingLanguageVersion
    };
  }

  return lumaContextData.info;
}

export function getContextInfo(gl) {
  const lumaContextData = getLumaContextData(gl);
  return Object.assign(getContextDebugInfo(gl), {
    limits: getContextLimits(gl),
    info: getGLContextInfo(gl),
    webgl1MinLimits: lumaContextData.webgl1MinLimits,
    webgl2MinLimits: lumaContextData.webgl2MinLimits
  });
}
