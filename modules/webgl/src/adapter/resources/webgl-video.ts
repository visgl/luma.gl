import {ExternalTexture} from "@luma.gl/api/";
import Video from './video';


export default class WEBGLVideo extends Video {
  constructor(props) {
    super(props);
  }

  _initializeTexture() {

  }

  getCurrentFrame(): ExternalTexture {
    // @ts-expect-error
    if (lastTime === this._video.currentTime || this._video.readyState < HTMLVideoElement.HAVE_CURRENT_DATA) {
      return;
    }
    this.setSubImageData({
      data: this._video,
      parameters
    });
    if (this.mipmaps) {
      this.generateMipmap();
    }
    this._video.lastTime = this._video.currentTime;
  }
}

export default class WebGPUVideo extends Video {
  readonly device: WebGPUDevice;
  readonly handle: GPUExternalTexture;
  sampler: WebGPUSampler;

  constructor(device: WebGPUDevice, props: ExternalTextureProps) {
    super(device, props);
    this.device = device;
    this.handle = this.props.handle || this.device.handle.importExternalTexture({
      source: props.source,
      colorSpace: props.colorSpace
    });
    this.sampler = null;
  }

  destroy(): void {
    // External textures are destroyed automatically,
    // as a microtask, instead of manually or upon garbage collection like other resources.
    // this.handle.destroy();
  }

  getCurrentFrame(): ExternalTexture {
    return new WEBGPUExternalTexture(this.device, this.props);
  }
  /** Set default sampler */
  setSampler(sampler: Sampler | SamplerProps): this {
    // We can accept a sampler instance or set of props;
    this.sampler = sampler instanceof WebGPUSampler ? sampler : new WebGPUSampler(this.device, sampler);
    return this;
  }
}
