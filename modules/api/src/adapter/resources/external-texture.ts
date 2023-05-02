import type Device from '../device';
import Resource, {ResourceProps, DEFAULT_RESOURCE_PROPS} from './resource';

export type ExternalTextureProps = ResourceProps & {
  source: HTMLVideoElement | null;
  colorSpace?: 'srgb';
}

const DEFAULT_TEXTURE_PROPS: Required<ExternalTextureProps> = {
  ...DEFAULT_RESOURCE_PROPS,
  source: null,
  colorSpace: 'srgb'
};

export default abstract class Texture extends Resource<ExternalTextureProps> {
  override get [Symbol.toStringTag](): string { return 'ExternalTexture'; }

  constructor(device: Device, props: ExternalTextureProps) {
    super(device, props, DEFAULT_TEXTURE_PROPS);
  }
}
