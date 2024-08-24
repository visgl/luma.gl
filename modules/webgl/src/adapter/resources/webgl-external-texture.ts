// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/*
export class WEBGLExternalTexture extends WEBGLTexture {
  readonly device: WebGLDevice;
  readonly gl: WebGL2RenderingContext;
  readonly handle: WebGLTexture;

  data;

  width: number = undefined;
  height: number = undefined;
  depth: number = undefined;

  format = undefined;
  type = undefined;
  dataFormat = undefined;
  border = undefined;
  mipmaps: boolean = undefined;

  textureUnit: number = undefined;

  sampler: WEBGLSampler;

  // Program.draw() checks the loaded flag of all textures to avoid
  // Textures that are still loading from promises
  // Set to true as soon as texture has been initialized with valid data
  loaded = false;
  _video;

  readonly target: GL;
  // target cannot be modified by bind:
  // textures are special because when you first bind them to a target,
  // they get special information. When you first bind a texture as a
  // GL_TEXTURE_2D, you are actually setting special state in the texture.
  // You are saying that this texture is a 2D texture.
  // And it will always be a 2D texture; this state cannot be changed ever.
  // If you have a texture that was first bound as a GL_TEXTURE_2D,
  // you must always bind it as a GL_TEXTURE_2D;
  // attempting to bind it as GL_TEXTURE_3D will give rise to an error
  // (while run-time).

  static isSupported(device: WebGLDevice, options?: TextureSupportOptions): boolean {
    const {format, linearFiltering} = options;
    let supported = true;
    if (format) {
      supported = supported && isFormatSupported(device.gl, format);
      supported = supported && (!linearFiltering || isTextureFormatFilterable(device.gl, format));
    }
    return supported;
  }

  // eslint-disable-next-line max-statements
  constructor(device: Device , props: TextureProps) {
    super(device as WebGLDevice, {id: uid('texture'), ...props});

    this.glTarget = getWebGLTextureTarget(props);

    this.device = device as WebGLDevice;
    this.gl = this.device.gl;
    this.gl2 = this.device.gl2;
    this.handle = this.props.handle || this.gl.createTexture();

    let data = props.data;

    const isVideo = typeof HTMLVideoElement !== 'undefined' && data instanceof HTMLVideoElement;
    // @ts-expect-error
    if (isVideo && data.readyState < HTMLVideoElement.HAVE_METADATA) {
      this._video = null; // Declare member before the object is sealed
      data.addEventListener('loadeddata', () => this.initialize(props));
      return this;
    }
  }

  initialize() {
        // TODO - Video handling, move to ExternalTexture?
    // if (isVideo) {
    //   this._video = {
    //     video: data,
    //     // TODO  - should we be using the sampler parameters here?
    //     parameters: {},
    //     // @ts-expect-error HTMLVideoElement.HAVE_CURRENT_DATA is not declared
    //     lastTime: data.readyState >= HTMLVideoElement.HAVE_CURRENT_DATA ? data.currentTime : -1
    //   };
    // }
  }

  update(): this {
    if (this._video) {
      const {video, parameters, lastTime} = this._video;
      // @ts-expect-error
      if (lastTime === video.currentTime || video.readyState < HTMLVideoElement.HAVE_CURRENT_DATA) {
        return;
      }
      this.setSubImageData({
        data: video,
        parameters
      });
      if (this.mipmaps) {
        this.generateMipmap();
      }
      this._video.lastTime = video.currentTime;
    }
  }


*/
