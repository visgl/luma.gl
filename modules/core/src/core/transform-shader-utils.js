import assert from 'assert';

const REGEX_DECLARATIONS = /^(#version[^\n]*\n)?/; // Beginning of file
const REGEX_START_OF_MAIN = /main\s*\([^\)]*\)\s*\{\n?/; // Beginning of main
const FS100 = 'void main() {}';
const FS300 = `#version 300 es\n${FS100}`;

// scan and update vertex shader for texture atrributes.
// All attribute definitions, that have corresponding texture in `textureMap`
// will be removed and a sample instruction is added to main body.
// Also for each such attribute two uniforms are returend, one for Sampler and one for Size.
// While scanning the source also collects size of texture target if rendering to texture.
export function updateForTextureRead({vs, textureMap}) {
  const texAttributeNames = Object.keys(textureMap);
  const uniforms = {};
  let updatedVs = vs;
  let mainInstructions = null;
  if (texAttributeNames.length > 0) {
    const vsLines = updatedVs.split('\n');
    const updateVsLines = vsLines.slice();
    const sampleInstructions = [];
    vsLines.forEach((line, index, lines) => {
      const updated = processAttributeDefinition(line, textureMap);
      if (updated) {
        const {updatedLine, sampleInstruction, samplerUniforms} = updated;
        updateVsLines[index] = updatedLine;
        sampleInstructions.push(sampleInstruction);
        Object.assign(uniforms, samplerUniforms);
      }
    });
    updatedVs = updateVsLines.join('\n');
    mainInstructions = mainInstructions ?
      mainInstructions + sampleInstructions : sampleInstructions;
  }

  if (mainInstructions) {
    updatedVs = updatedVs.replace(REGEX_START_OF_MAIN, match => match + mainInstructions);
  }

  return {vs: updatedVs, uniforms};
}

export function updateForTextureWrite({vs, texture, targetVarying}) {
  const uniforms = {};
  let targetTextureSize = null;
  let updatedVs = vs;
  assert(vs && texture && targetVarying);
  const vsLines = updatedVs.split('\n');
  // Find target texture size from varying definition
  for (let i = 0; i < vsLines.length && !targetTextureSize; i++) {
    targetTextureSize = getVaryingSize(vsLines[i], targetVarying);
  }
  const sizeName = `transform_uSize_${targetVarying}`;
  const {width, height} = texture;
  uniforms[sizeName] = [width, height];

  const uniformDeclaration = `uniform vec2 ${sizeName};\n`;
  updatedVs = updatedVs.replace(REGEX_DECLARATIONS, match => match + uniformDeclaration);

  // Writing to a texture, output position
  const posInstructions = `\
 vec2 pos = transform_getPos(${sizeName});\n gl_Position = vec4(pos, 0, 1.);\n`;
  updatedVs = updatedVs.replace(REGEX_START_OF_MAIN, match => match + posInstructions);

  return {vs: updatedVs, uniforms, targetTextureSize};
}

// build required definitions, sample instructions and uniforms for each texture attribute
export function processAttributeDefinition(line, textureMap) {
  const samplerUniforms = {};
  const words = line.replace(/^\s+/, '').split(/\s+/);
  const [qualifier, size, definition] = words;
  if (
    (qualifier !== 'attribute' && qualifier !== 'in') ||
    !size ||
    !definition
  ) {
    return null;
  }
  // check if a texture source is specified for this attribute
  const name = definition.split(';')[0];
  if (name && textureMap[name]) {
    const updatedLine = `\
uniform sampler2D transform_uSampler_${definition} \// ${line}
uniform vec2 transform_uSize_${definition}`;
    const channels = sizeToChannelSuffix(size);
    const sampler = `transform_uSampler_${name}`;
    const texSize = `transform_uSize_${name}`;
    const sampleInstruction =
      `  ${size} ${name} = transform_getInput(${sampler}, ${texSize}).${channels};\n`;

    const samplerName = `transform_uSampler_${name}`;
    const sizeName = `transform_uSize_${name}`;
    const {width, height} = textureMap[name];
    samplerUniforms[samplerName] = textureMap[name];
    samplerUniforms[sizeName] = [width, height];

    return {updatedLine, sampleInstruction, samplerUniforms};
  }
  return null;
}

// Return size (float, vec2 etc) of a given varying, null if doens't exist.
export function getVaryingSize(line, varying) {
  const words = line.replace(/^\s+/, '').split(/\s+/);
  const [qualifier, size, definition] = words;
  if (
    (qualifier !== 'varying' && qualifier !== 'out') ||
    !size ||
    definition !== `${varying};`
  ) {
    return null;
  }
  return size;
}

// Given the shader version, varying and size,
// build and return a pass through fragment shader.
export function getPassthroughFS({version, varying, size}) {
  if (!varying) {
    return version === 300 ? FS300 : FS100;
  }
  if (version === 300) {
    return `\
#version 300 es
in ${size} ${varying};
out vec4 transform_output;
void main() {
  transform_output = ${getPaddedOutput(varying, size)};
}`;
  }
  // version 100
  return `\
varying ${size} ${varying};
void main() {
  gl_FragColor = ${getPaddedOutput(varying, size)};
}`;
}

export function sizeToChannelSuffix(size) {
  switch (size) {
  case 'float': return 'x';
  case 'vec2': return 'xy';
  case 'vec3': return 'xyz';
  case 'vec4': return 'xyzw';
  default :
    assert(false);
    return null;
  }
}

export function sizeToChannelCount(size) {
  switch (size) {
  case 'float': return 1;
  case 'vec2': return 2;
  case 'vec3': return 3;
  case 'vec4': return 4;
  default :
    assert(false);
    return null;
  }
}

function getPaddedOutput(variable, size) {
  switch (size) {
  case 'float': return `vec4(${variable}, 0.0, 0.0, 1.0)`;
  case 'vec2': return `vec4(${variable}, 0.0, 1.0)`;
  case 'vec3': return `vec4(${variable}, 1.0)`;
  case 'vec4': return variable;
  default :
    assert(false);
    return null;
  }
}
