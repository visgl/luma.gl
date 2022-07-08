export type GLTFMaterialParserProps = {
  attributes: any;
  material: any;
  pbrDebug: any;
  imageBasedLightingEnvironment: any;
  lights: any;
  useTangents: any;
};

export default class GLTFMaterialParser {
  readonly defines: object;
  readonly uniforms: object;
  readonly parameters: object;
  readonly generatedTextures: object[];

  constructor(gl: WebGLRenderingContext, props: GLTFMaterialParserProps);

  defineIfPresent(value: any, name: any): void;
  parseTexture(gltfTexture: any, name: any, define?: any): void;
  parsePbrMetallicRoughness(pbrMetallicRoughness: any): void;
  parseMaterial(material: any): void;
  delete(): void;
}
