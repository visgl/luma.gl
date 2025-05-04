import {Texture, ExternalTexture} from "@luma.gl/api";

// @ts-expect-error
const {HAVE_CURRENT_DATA, HAVE_METADATA} = HTMLVideoElement;

type ResourceProps = {};

export type ExternalTextureProps = ResourceProps & {
  source: HTMLVideoElement;
  colorSpace?: 'srgb';
}

abstract class Video {
  protected _video: HTMLVideoElement;
  protected _videoLoaded: boolean = false;
  protected _lastTime: number = -1

  constructor(props) {
    if (this._video.readyState >= HAVE_METADATA) {
      this._videoLoaded = true;
    } else {
      this._video.addEventListener('loadeddata', () => {
        this._videoLoaded = true;
        this._initializeTexture();
      });
    }

    lastTime: this._video.readyState >= HAVE_CURRENT_DATA ? this._video.currentTime : -1
  }

  abstract getCurrentFrame(): Texture | ExternalTexture;

  abstract _initializeTexture(): void;

  /** Check if video has advanced and a texture should be generated */
  protected _updateTime(): boolean {
    if (this._lastTime === this._video.currentTime || this._video.readyState < HAVE_CURRENT_DATA) {
      return false;
    }
    this._lastTime = this._video.currentTime;
    return true;
  }
}
