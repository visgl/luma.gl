import Resource, {ResourceProps} from './resource';

/** Abstract Texture interface */
export type TextureProps = ResourceProps & {
  data?: any;
  width?: number;
  height?: number;
  depth?: number;

  pixels?: any;
  format?: number;
  dataFormat?: number;
  border?: number;
  recreate?: boolean;
  type?: number;
  compressed?: boolean;
  mipmaps?: boolean;

  parameters?: object;
  pixelStore?: object;
  textureUnit?: number;

  target?: number;
};

/** Abstract Texture interface */
export class Texture extends Resource<TextureProps> {
  get [Symbol.toStringTag](): string {
    return 'Texture';
  }
};
