/**
 * @filter         Unsharp Mask
 * @description    A form of image sharpening that amplifies high-frequencies in the image. It
 *                 is implemented by scaling pixels away from the average of their neighbors.
 * @param radius   The blur radius that calculates the average of the neighboring pixels.
 * @param strength A scale factor where 0 is no effect and higher values cause a stronger effect.
 */
import triangleBlur from '../blur-filters/triangleblur';

const fs = `\
uniform float strength;
uniform float threshold;
uniform sampler2D blurredTexture;

vec4 unsharpMark_sampleColor(sampler2D texture, vec2 texSize, vec2 texCoord) {
  vec4 blurred = texture2D(blurredTexture, texCoord);
  vec4 original = texture2D(texture, texCoord);
  gl_FragColor = mix(blurred, original, 1.0 + strength);
}
`;

const uniforms = {
  radius: {value: 20, min: 0, softMax: 200},
  strength: {value: 1, min: 0, softMax: 5}
};

export default {
  name: 'unsharpMask',
  uniforms,
  dependencies: [triangleBlur],
  passes: [
    {module: triangleBlur, target: 'texture1'},
    {sampler: true, uniforms: {blurredTexture: 'texture1'}}
  ]
};

// TODO: FIXME
/* eslint-disable */
function unsharpMask(radius, strength) {
  gl.unsharpMask = gl.unsharpMask || new Shader(null, fs);

  // Store a copy of the current texture in the second texture unit
  window._.extraTexture.ensureFormat(window._.texture);
  window._.texture.use();
  window._.extraTexture.drawTo(() => Shader.getDefaultShader(this.gl).drawRect());

  // Blur the current texture, then use the stored texture to detect edges
  window._.extraTexture.use(1);
  this.triangleBlur(radius);
  gl.unsharpMask.textures({
    originalTexture: 1
  });
  simpleShader.call(this, gl.unsharpMask, {
    strength: strength
  });
  window._.extraTexture.unuse(1);
}
