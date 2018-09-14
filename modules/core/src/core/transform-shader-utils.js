import assert from 'assert';
import {combineInjects, getQualifierDetails, typeToChannelSuffix} from '../shadertools/src';

const SAMPLER_UNIFORM_PREFIX = 'transform_uSampler_';
const SIZE_UNIFORM_PREFIX = 'transform_uSize_';
const VS_POS_VARIABLE = 'transform_position';

// Scan provided vertex shader
// for each texture attribute, inject sampler instructions and build uniforms for size and sampler
// for texture target, get varying type and inject position instruction
export function updateForTextures({vs, sourceTextureMap, targetTextureVarying, targetTexture}) {
  const texAttributeNames = Object.keys(sourceTextureMap);
  let sourceCount = texAttributeNames.length;
  let targetTextureType = null;
  const uniforms = {};
  let updatedVs = vs;
  let finalInject = {};

  if (sourceCount > 0 || targetTextureVarying) {
    const vsLines = updatedVs.split('\n');
    const updateVsLines = vsLines.slice();
    vsLines.forEach((line, index, lines) => { // TODO add early exit
      if (sourceCount > 0) {
        const updated = processAttributeDefinition(line, sourceTextureMap);
        if (updated) {
          const {updatedLine, inject, samplerUniforms} = updated;
          updateVsLines[index] = updatedLine;
          // sampleInstructions.push(sampleInstruction);
          finalInject = combineInjects([finalInject, inject]);
          Object.assign(uniforms, samplerUniforms);
          sourceCount--;
        }
      }
      if (targetTextureVarying && !targetTextureType) {
        targetTextureType = getVaryingType(line, targetTextureVarying);
      }
    });

    if (targetTextureVarying) {
      assert(targetTexture);
      const sizeName = `${SIZE_UNIFORM_PREFIX}${targetTextureVarying}`;
      const {width, height} = targetTexture;
      uniforms[sizeName] = [width, height];

      const uniformDeclaration = `uniform vec2 ${sizeName};\n`;
      const posInstructions = `\
     vec2 ${VS_POS_VARIABLE} = transform_getPos(${sizeName});
     gl_Position = vec4(${VS_POS_VARIABLE}, 0, 1.);\n`;
      const inject = {
        'vs:#decl': uniformDeclaration,
        'vs:#main-start': posInstructions
      };
      finalInject = combineInjects([finalInject, inject]);
    }
    updatedVs = updateVsLines.join('\n');
  }
  return {vs: updatedVs, uniforms, targetTextureType, inject: finalInject};
}

// Checks if provided line is defining an attribute, if so returns details otherwise null
function getAttributeDefinition(line) {
  return getQualifierDetails(line, ['attribute', 'in']);
}

function getSamplerDeclerations(textureName) {
  const samplerName = `${SAMPLER_UNIFORM_PREFIX}${textureName}`;
  const sizeName = `${SIZE_UNIFORM_PREFIX}${textureName}`;
  const uniformDeclerations = `\
  uniform sampler2D ${samplerName};
  uniform vec2 ${sizeName};`;
  return {samplerName, sizeName, uniformDeclerations};
}

// Return size (float, vec2 etc) of a given varying, null if doens't exist.
export function getVaryingType(line, varying) {
  const qualaiferDetails = getQualifierDetails(line, ['varying', 'out']);
  if (!qualaiferDetails) {
    return null;
  }
  return qualaiferDetails.name === varying ? qualaiferDetails.type : null;
}

// build required definitions, sample instructions and uniforms for each texture attribute
export function processAttributeDefinition(line, textureMap) {
  const samplerUniforms = {};

  const attributeData = getAttributeDefinition(line);
  if (!attributeData) {
    return null;
  }
  const {type, name} = attributeData;
  if (name && textureMap[name]) {
    const updatedLine = `\// ${line} => Replaced by Transform with a sampler`;
    const {samplerName, sizeName, uniformDeclerations} = getSamplerDeclerations(name);

    const channels = typeToChannelSuffix(type);
    const sampleInstruction =
      `  ${type} ${name} = transform_getInput(${samplerName}, ${sizeName}).${channels};\n`;

    const {width, height} = textureMap[name];
    samplerUniforms[samplerName] = textureMap[name];
    samplerUniforms[sizeName] = [width, height];
    const inject = {
      'vs:#decl': uniformDeclerations,
      'vs:#main-start': sampleInstruction
    };

    return {updatedLine, inject, samplerUniforms};
  }
  return null;
}
