/* eslint-disable max-len */
import {GL, glKey} from 'luma.gl';

// Sampler Parameters

/*
| Sampler Parameter                    | Default        | Description |
| ------------------------------------ | -------------- | ----------- |
  [GL.TEXTURE_MAG_FILTER]              | `GL.LINEAR`    | texture magnification filter |
  [GL.TEXTURE_MIN_FILTER]              | `GL.NEAREST_MIPMAP_LINEAR` | texture minification filter |
  [GL.TEXTURE_WRAP_S]                  | `GL.REPEAT`    | texture wrapping function for texture coordinate `s` |
  [GL.TEXTURE_WRAP_T]                  | `GL.REPEAT`    | texture wrapping function for texture coordinate `t` |
  [GL.TEXTURE_WRAP_R] **WebGL2**       | `GL.REPEAT`    | texture wrapping function for texture coordinate `r` |
| `GL_TEXTURE_MAX_ANISOTROPY           | fLargest
  [GL.TEXTURE_BASE_LEVEL] **WebGL2**   | `0`            | Texture mipmap level |
  [GL.TEXTURE_MAX_LEVEL] **WebGL2**    | `1000`         | Maximum texture mipmap array level |
  [GL.TEXTURE_COMPARE_FUNC] **WebGL2** | `GL.LEQUAL`    | texture comparison function |
  [GL.TEXTURE_COMPARE_MODE] **WebGL2** | `GL.NONE`      | whether r tex coord should be compared to depth texture |
  [GL.TEXTURE_MIN_LOD] **WebGL2**      | `-1000`        | minimum level-of-detail value |
  [GL.TEXTURE_MAX_LOD] **WebGL2**      | `1000`         | maximum level-of-detail value |

export const SAMPLER_PARAMETERS_TITLES = {
  [GL.TEXTURE_MIN_FILTER]: Controls how a pixel is textured maps to more than one texel.

[GL.TEXTURE_COMPARE_FUNC]: {
### Texture Comparison Function
};
*/

export const SAMPLER_PARAMETERS = {
  [GL.TEXTURE_MIN_FILTER]: {
    [GL.LINEAR]: 'interpolated texel',
    [GL.NEAREST]: 'nearest texel',
    [GL.NEAREST_MIPMAP_NEAREST]: 'nearest texel in closest mipmap',
    [GL.LINEAR_MIPMAP_NEAREST]: 'interpolated texel in closest mipmap',
    [GL.NEAREST_MIPMAP_LINEAR]: 'average texel from two closest mipmaps',
    [GL.LINEAR_MIPMAP_LINEAR]: 'interpolated texel from two closest mipmaps'
  },

  [GL.TEXTURE_MAG_FILTER]: {
    [GL.LINEAR]: 'interpolated texel',
    [GL.NEAREST]: 'nearest texel'
  },

  [GL.TEXTURE_WRAP_S]: {
    [GL.REPEAT]: 'use fractional part of texture coordinates',
    [GL.CLAMP_TO_EDGE]: 'clamp texture coordinates',
    [GL.MIRRORED_REPEAT]: 'use fractional part of texture coordinate if integer part is odd, otherwise `1 - frac'
  },

  [GL.TEXTURE_WRAP_T]: {
    [GL.REPEAT]: 'use fractional part of texture coordinates',
    [GL.CLAMP_TO_EDGE]: 'clamp texture coordinates',
    [GL.MIRRORED_REPEAT]: 'use fractional part of texture coordinate if integer part is odd, otherwise `1 - frac'
  }
};

export const SAMPLER_PARAMETERS_WEBGL2 = {
  [GL.TEXTURE_WRAP_R]: {
    [GL.REPEAT]: 'use fractional part of texture coordinates',
    [GL.CLAMP_TO_EDGE]: 'clamp texture coordinates',
    [GL.MIRRORED_REPEAT]: 'use fractional part of texture coordinate if integer part is odd, otherwise `1 - frac'
  },

  [GL.TEXTURE_COMPARE_MODE]: {
    [GL.NONE]: 'no comparison of `r` coordinate is performed',
    [GL.COMPARE_REF_TO_TEXTURE]: 'interpolated and clamped `r` texture coordinate is compared to currently bound depth texture, result is assigned to the red channel'
  },

  [GL.TEXTURE_COMPARE_FUNC]: {
    [GL.LEQUAL]: 'result = 1.0 0.0, r <= D t r > D t',
    [GL.GEQUAL]: 'result = 1.0 0.0, r >= D t r < D t',
    [GL.LESS]: 'result = 1.0 0.0, r < D t r >= D t',
    [GL.GREATER]: 'result = 1.0 0.0, r > D t r <= D t',
    [GL.EQUAL]: 'result = 1.0 0.0, r = D t r ≠ D t',
    [GL.NOTEQUAL]: 'result = 1.0 0.0, r ≠ D t r = D t',
    [GL.ALWAYS]: 'result = 1.0',
    [GL.NEVER]: 'result = 0.0'
  }
};

// Shared with texture*.spec.js
export function testSamplerParameters({t, texture, parameters}) {
  for (let parameter in parameters) {
    parameter = Number(parameter);
    const values = parameters[parameter];
    for (let value in values) {
      value = Number(value);
      texture.setParameters({
        [parameter]: value
      });
      const name = texture.constructor.name;
      const newValue = texture.getParameter(parameter);
      t.equals(newValue, value,
        `${name}.setParameters({[${glKey(parameter)}]: ${glKey(value)}}) read back OK`);
    }
  }
}
