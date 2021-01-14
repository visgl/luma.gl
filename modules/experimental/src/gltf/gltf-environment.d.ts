export default class GLTFEnvironment {
  constructor(
    gl: WebGLRenderingContext,
    props: {
      brdfLutUrl: any;
      getTexUrl: any;
      specularMipLevels?: number;
    }
  );
  makeCube(options: {id: any; getTextureForFace: any; parameters: any}): any;
  getDiffuseEnvSampler(): any;
  getSpecularEnvSampler(): any;
  getBrdfTexture(): any;
  delete(): void;
}
