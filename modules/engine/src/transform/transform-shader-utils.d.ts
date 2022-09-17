export function updateForTextures(options: {
  vs: any;
  sourceTextureMap: any;
  targetTextureVarying: any;
  targetTexture: any;
}): {
  vs: any;
  targetTextureType: any;
  inject: {};
  samplerTextureMap: {};
};

export function getSizeUniforms(options: {
  sourceTextureMap: any;
  targetTextureVarying: any;
  targetTexture: any;
}): {};

export function getVaryingType(line: any, varying: any): any;

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
};
