import assert from 'assert';

const REGEX_START_OF_MAIN = /main\s*\([^\)]*\)\s*\{\n?/; // Beginning of main

// scan and update vertex shader for texture atrributes.
// All attribute definitions , that have corresponding texture in `textureMap`
// will be removed and a sample instruction is added to main body.
// Also for each such attribute two uniforms are returend, one for Sampler and one for Size.
export function updateTextureAttributes(vs, textureMap) {
  const texAttributeNames = Object.keys(textureMap);
  const uniforms = {};
  // if (!this.hasSourceTextures) {
  //   return {vs, uniforms};
  // }
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
    const channels = sizeToChannels(size);
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

export function sizeToChannels(size) {
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
