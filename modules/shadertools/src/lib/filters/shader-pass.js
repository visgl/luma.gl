export function moduleToFilter(module) {
  let fs = null;

  if (module.filter) {
    const args = Array.isArray(module.filter) ? `, ${module.filter.join(',')}` : '';
    fs = `\
${module.fs}

uniform sampler2D texture;
uniform vec2 texSize;
varying vec2 texCoord;

void main() {
  gl_FragColor = texture2D(texture, texCoord);
  gl_FragColor = ${module.name}_filterColor(gl_FragColor${args});
}
`;
  }

  if (module.sampler) {
    fs = `\
${module.fs}

uniform sampler2D texture;
uniform vec2 texSize;
varying vec2 texCoord;

void main() {
  gl_FragColor = ${module.name}_sampleColor(texture, texCoord, texSize);
}
`;
  }

  if (!fs) {
    throw new Error(`${module.name} no fragment shader generated`);
  }

  return fs;
}
