import {ShaderPass} from '../../../lib/shader-module/shader-pass';
import {glsl} from '../../../lib/glsl-utils/highlight';

const fs = glsl`\
uniform float amount;

vec4 vibrance_filterColor(vec4 color) {
  float average = (color.r + color.g + color.b) / 3.0;
  float mx = max(color.r, max(color.g, color.b));
  float amt = (mx - average) * (-amount * 3.0);
  color.rgb = mix(color.rgb, vec3(mx), amt);
  return color;
}

vec4 vibrance_filterColor(vec4 color, vec2 texSize, vec2 texCoord) {
  return vibrance_filterColor(color);
}
`;

/**
 * Vibrance - Modifies the saturation of desaturated colors, leaving saturated colors unmodified.
 */
export type VibranceProps = {
  /** -1 to 1 (-1 is minimum vibrance, 0 is no change, and 1 is maximum vibrance) */
  amount: number;
};

/** Vibrance - Modifies the saturation of desaturated colors, leaving saturated colors unmodified. */
export const vibrance: ShaderPass<VibranceProps> = {
  name: 'vibrance',
  uniforms: {
    amount: {value: 0, min: -1, max: 1}
  },
  fs,
  passes: [{filter: true}]
};
