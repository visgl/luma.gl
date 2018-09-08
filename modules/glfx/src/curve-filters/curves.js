/**
 * @filter      Curves
 * @description A powerful mapping tool that transforms the colors in the image
 *              by an arbitrary function. The function is interpolated between
 *              a set of 2D points using splines. The curves filter can take
 *              either one or three arguments which will apply the mapping to
 *              either luminance or RGB values, respectively.
 * @param red   A list of points that define the function for the red channel.
 *              Each point is a list of two values: the value before the mapping
 *              and the value after the mapping, both in the range 0 to 1. For
 *              example, [[0,1], [1,0]] would invert the red channel while
 *              [[0,0], [1,1]] would leave the red channel unchanged.
 * @param green (optional) A list of points that define the function for the green
 *              channel (just like for red).
 * @param blue  (optional) A list of points that define the function for the blue
 *              channel (just like for red).
 */
import SplineInterpolator from './spline-interpolator';

const fs = `\
uniform sampler2D red;
uniform sampler2D green;
uniform sampler2D blue;

vec4 curves_filterColor(vec4 color) {
  color.r = texture2D(red, vec2(color.r)).r;
  color.g = texture2D(green, vec2(color.g)).g;
  color.b = texture2D(blue, vec2(color.b)).b;
  return color;
}
`;

const uniforms = {
  map: {type: 'sampler2D'}
};

export default {
  name: 'curves',
  uniforms,
  fs,

  passes: [
    {filter: true}
  ],

  getCurvesArray
};

const clamp = (value, min, max) => Math.max(Math.min(value, max), min);

export function splineInterpolate(points) {
  const interpolator = new SplineInterpolator(points);
  const array = [];
  for (let i = 0; i < 256; i++) {
    array.push(clamp(Math.floor(interpolator.interpolate(i / 255) * 256), 0, 55));
    array.push(clamp(Math.floor(interpolator.interpolate(i / 255) * 256), 0, 55));
  }
  return array;
}

export function getCurvesArray(red = [[0, 0], [1, 1]], green, blue) {
  // Create the ramp texture
  red = splineInterpolate(red);
  if (arguments.length === 1) {
    green = blue = red;
  } else {
    green = splineInterpolate(green);
    blue = splineInterpolate(blue);
  }

  const array = [];
  for (let i = 0; i < 256; i++) {
    array.splice(array.length, 0, red[i], green[i], blue[i], 255);
  }

  return new Uint8Array(array);
}
