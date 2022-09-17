import Texture2D from '../classes/texture-2d';
import TextureCube from '../classes/texture-cube';
import Texture3D from '../classes/texture-3d';
import Texture from '../classes/texture';
import Framebuffer, {FramebufferProps} from '../classes/framebuffer';

type TextureType = Texture2D | TextureCube | Texture3D;

export function cloneTextureFrom<T extends TextureType>(refTexture: T, overrides?: any): T;

export function toFramebuffer(texture: Texture, opts?: FramebufferProps): Framebuffer;
