/**
 * @filter               Tilt Shift
 * @description          Simulates the shallow depth of field normally encountered in close-up
 *                       photography, which makes the scene seem much smaller than it actually
 *                       is. This filter assumes the scene is relatively planar, in which case
 *                       the part of the scene that is completely in focus can be described by
 *                       a line (the intersection of the focal plane and the scene). An example
 *                       of a planar scene might be looking at a road from above at a downward
 *                       angle. The image is then blurred with a blur radius that starts at zero
 *                       on the line and increases further from the line.
 * @param startX         The x coordinate of the start of the line segment.
 * @param startY         The y coordinate of the start of the line segment.
 * @param endX           The x coordinate of the end of the line segment.
 * @param endY           The y coordinate of the end of the line segment.
 * @param blurRadius     The maximum radius of the pyramid blur.
 * @param gradientRadius The distance from the line at which the maximum blur radius is reached.
 */
import random from '../utils/random';

const fs = `\
uniform float blurRadius;
uniform float gradientRadius;
uniform vec2 start;
uniform vec2 end;
uniform bool invert;

vec2 tiltShift_getDelta(vec2 texSize) {
  vec2 vector = normalize((end - start) * texSize);
  return invert ? vec2(-vector.y, vector.x) : vector;
}

vec4 tiltShift_sampleColor(sampler2D texture, vec2 texSize, vec2 texCoord) {
  vec4 color = vec4(0.0);
  float total = 0.0;

  /* randomize the lookup values to hide the fixed number of samples */
  float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);

  vec2 normal = normalize(vec2((start.y - end.y) * texSize.y, (end.x - start.x) * texSize.x));
  float radius = smoothstep(0.0, 1.0,
    abs(dot(texCoord * texSize - start * texSize, normal)) / gradientRadius) * blurRadius;

  for (float t = -30.0; t <= 30.0; t++) {
    float percent = (t + offset - 0.5) / 30.0;
    float weight = 1.0 - abs(percent);
    vec4 sample = texture2D(texture, texCoord + tiltShift_getDelta(texSize) / texSize * percent * radius);

    /* switch to pre-multiplied alpha to correctly blur transparent images */
    sample.rgb *= sample.a;

    color += sample * weight;
    total += weight;
  }

  color = color / total;

  /* switch back from pre-multiplied alpha */
  color.rgb /= color.a + 0.00001;

  return color;
}
`;

const uniforms = {
  blurRadius: {value: 15, min: 0, max: 50},
  gradientRadius: {value: 200, min: 0, max: 400},
  start: [0, 0],
  end: [1, 1],
  invert: {value: false, private: true}
};

export default {
  name: 'tiltShift',
  uniforms,
  fs,
  dependencies: [random],

  passes: [{sampler: true, uniforms: {invert: false}}, {sampler: true, uniforms: {invert: true}}]
};

/*
function tiltShift(startX, startY, endX, endY, blurRadius, gradientRadius) {
  var dx = endX - startX;
  var dy = endY - startY;
  var d = Math.sqrt(dx * dx + dy * dy);
  simpleShader.call(this, gl.tiltShift, {
    blurRadius: blurRadius,
    gradientRadius: gradientRadius,
    start: [startX, startY],
    end: [endX, endY],
    delta: [dx / d, dy / d],
    texSize: [this.width, this.height]
  });
  simpleShader.call(this, gl.tiltShift, {
    blurRadius: blurRadius,
    gradientRadius: gradientRadius,
    start: [startX, startY],
    end: [endX, endY],
    delta: [-dy / d, dx / d],
    texSize: [this.width, this.height]
  });

  return this;
}
*/
