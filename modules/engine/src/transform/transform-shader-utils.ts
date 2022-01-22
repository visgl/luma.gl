import {assert} from '@luma.gl/api';
import {combineInjects, getQualifierDetails, typeToChannelSuffix} from '@luma.gl/shadertools';

const SAMPLER_UNIFORM_PREFIX = 'transform_uSampler_';
const SIZE_UNIFORM_PREFIX = 'transform_uSize_';
const VS_POS_VARIABLE = 'transform_position';

// Scan provided vertex shader
// for each texture attribute, inject sampler instructions and build uniforms for sampler
// for texture target, get varying type and inject position instruction
export function updateForTextures(options: {
  vs: any;
  sourceTextureMap: any;
  targetTextureVarying?: any;
  targetTexture?: any;
}): {
  vs: any;
  targetTextureType: any;
  inject: {};
  samplerTextureMap: {};
} {
  const {vs, sourceTextureMap, targetTextureVarying, targetTexture} = options;
  const texAttributeNames = Object.keys(sourceTextureMap);
  let sourceCount = texAttributeNames.length;
  let targetTextureType = null;
  const samplerTextureMap = {};
  let updatedVs = vs;
  let finalInject = {};

  if (sourceCount > 0 || targetTextureVarying) {
    const vsLines = updatedVs.split('\n');
    const updateVsLines = vsLines.slice();
    vsLines.forEach((line, index, lines) => {
      // TODO add early exit
      if (sourceCount > 0) {
        const updated = processAttributeDefinition(line, sourceTextureMap);
        if (updated) {
          const {updatedLine, inject} = updated;
          updateVsLines[index] = updatedLine;
          // sampleInstructions.push(sampleInstruction);
          finalInject = combineInjects([finalInject, inject]);
          Object.assign(samplerTextureMap, updated.samplerTextureMap);
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
  return {
    // updated vertex shader (commented texture attribute definition)
    vs: updatedVs,
    // type (float, vec2, vec3 of vec4) target texture varying
    targetTextureType,
    // required vertex and fragment shader injects
    inject: finalInject,
    // map of sampler name to texture name, can be used to set attributes
    // usefull when swapping textures, as source and destination texture change when swap is called.
    samplerTextureMap
  };
}

// builds and returns an object contaning size uniform for each texture
export function getSizeUniforms(options: {
  sourceTextureMap: any;
  targetTextureVarying: any;
  targetTexture: any;
}): {} {
  const uniforms = {};
  let width;
  let height;
  if (options.targetTextureVarying) {
    ({width, height} = options.targetTexture);
    uniforms[`${SIZE_UNIFORM_PREFIX}${options.targetTextureVarying}`] = [width, height];
  }
  for (const textureName in options.sourceTextureMap) {
    ({width, height} = options.sourceTextureMap[textureName]);
    uniforms[`${SIZE_UNIFORM_PREFIX}${textureName}`] = [width, height];
  }
  return uniforms;
}

// Return size (float, vec2 etc) of a given varying, null if doens't exist.

export function getVaryingType(line: any, varying: any): any {
  const qualiferDetails = getQualifierDetails(line, ['varying', 'out']);
  if (!qualiferDetails) {
    return null;
  }
  return qualiferDetails.name === varying ? qualiferDetails.type : null;
}

// build required definitions, sample instructions for each texture attribute
export function processAttributeDefinition(
  line: any,
  textureMap: any
): {
  updatedLine: string;
  inject: {
    'vs:#decl': string;
    'vs:#main-start': string;
  };
  samplerTextureMap: {};
} {
  const samplerTextureMap = {};
  const attributeData = getAttributeDefinition(line);
  if (!attributeData) {
    return null;
  }
  const {type, name} = attributeData;
  if (name && textureMap[name]) {
    // eslint-disable-next-line no-useless-escape
    const updatedLine = `\// ${line} => Replaced by Transform with a sampler`;
    const {samplerName, sizeName, uniformDeclerations} = getSamplerDeclarations(name);

    const channels = typeToChannelSuffix(type);
    const sampleInstruction = `  ${type} ${name} = transform_getInput(${samplerName}, ${sizeName}).${channels};\n`;

    samplerTextureMap[samplerName] = name;
    const inject = {
      'vs:#decl': uniformDeclerations,
      'vs:#main-start': sampleInstruction
    };

    // samplerNameMap
    return {
      // update vertex shader line.
      updatedLine,
      // inject object with sampler instructions.
      inject,
      // sampler name to texture name map
      samplerTextureMap
    };
  }
  return null;
}

// HELPERS

// Checks if provided line is defining an attribute, if so returns details otherwise null
function getAttributeDefinition(line) {
  return getQualifierDetails(line, ['attribute', 'in']);
}

function getSamplerDeclarations(textureName) {
  const samplerName = `${SAMPLER_UNIFORM_PREFIX}${textureName}`;
  const sizeName = `${SIZE_UNIFORM_PREFIX}${textureName}`;
  const uniformDeclerations = `\
  uniform sampler2D ${samplerName};
  uniform vec2 ${sizeName};`;
  return {samplerName, sizeName, uniformDeclerations};
}
