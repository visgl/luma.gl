import Texture, {TextureProps} from './texture';

export type TextureCubeProps = TextureProps & {
};

export default class TextureCube extends Texture {
  static readonly FACES: number[];

  constructor(gl: WebGLRenderingContext, props?: TextureCubeProps);

  initialize(props?: TextureCubeProps): void;
  subImage(options: {face: any; data: any; x?: number; y?: number; mipmapLevel?: number}): any;
  setCubeMapImageData(options: {
    width: any;
    height: any;
    pixels: any;
    data: any;
    border?: number;
    format?: any;
    type?: any;
  }): Promise<void>;
  setImageDataForFace(options: any): this;
}
