// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  assert,
  Texture,
  type Device,
  type Framebuffer,
  type RenderPass,
  type TextureFormatColor
} from '@luma.gl/core';
import {lightmapFilter} from '@luma.gl/shaders';
import {ClipSpace} from '../models/clip-space';

export type LightmapBakerProps = {width: number; height: number; format?: TextureFormatColor};
export type LightmapTextures = {lightmapTexture: Texture};
export type LightmapBakeView = {
  width: number;
  height: number;
  sampleIndex: number;
  framebuffer: Framebuffer;
  renderPass: RenderPass;
};
export type LightmapBakeOptions = {
  /** Upload model uniforms and prepare shadow maps before the atlas pass starts. */
  prepareSample?: (view: Omit<LightmapBakeView, 'renderPass'>) => void;
  /** Draw caller-selected UV-space models. Alpha must contain positive chart IDs. */
  drawSample: (view: LightmapBakeView) => void;
  /** Borrowed same-size linear texture: red contains the permitted chart ID for each gutter texel. */
  chartTexture?: Texture;
  /** Number of one-texel dilation steps, from zero to sixteen. Requires chartTexture. */
  dilationSteps?: number;
};

type Target = {texture: Texture; framebuffer: Framebuffer; format: TextureFormatColor};

/** Owns an independent linear irradiance texture, including alpha chart coverage. */
export class LightmapBakeResult {
  readonly textures: LightmapTextures;
  private destroyed = false;
  constructor(texture: Texture) {
    this.textures = {lightmapTexture: texture};
  }
  destroy(): void {
    if (!this.destroyed) {
      this.destroyed = true;
      this.textures.lightmapTexture.destroy();
    }
  }
}

/** Records UV-space samples and arithmetic-mean accumulation without traversal or submission. */
export class LightmapBaker {
  readonly device: Device;
  readonly format: TextureFormatColor;
  private targets: Target[] = [];
  private filters = new Map<number, ClipSpace>();
  private activeIndex = 1;
  private previewIndex = 3;
  private destroyed = false;
  private needsClear = true;
  private samples = 0;

  constructor(device: Device, props: LightmapBakerProps) {
    this.device = device;
    this.format = props.format ?? 'rgba16float';
    const capabilities = device.getTextureFormatCapabilities(this.format);
    // Require explicit linear floating-point storage; never silently clip irradiance.
    assert(
      (this.format === 'rgba16float' || this.format === 'rgba32float') &&
        capabilities.render &&
        capabilities.filter
    );
    // Accumulation uses unfiltered float32 history so small late samples survive rounding.
    assert(device.getTextureFormatCapabilities('rgba32float').render);
    this.resize(props);
  }
  get width(): number {
    return this.targets[0].texture.width;
  }
  get height(): number {
    return this.targets[0].texture.height;
  }
  get sampleCount(): number {
    return this.samples;
  }
  /** Borrowed current preview. Reacquire after every update or resize. */
  get textures(): LightmapTextures {
    assert(!this.destroyed);
    return {lightmapTexture: this.targets[this.previewIndex].texture};
  }

  reset(): void {
    assert(!this.destroyed);
    this.samples = 0;
    this.needsClear = true;
  }
  resize(props: Pick<LightmapBakerProps, 'width' | 'height'>): void {
    assert(!this.destroyed);
    assert(
      Number.isInteger(props.width) &&
        props.width > 0 &&
        Number.isInteger(props.height) &&
        props.height > 0
    );
    if (this.targets.length && props.width === this.width && props.height === this.height) return;
    const targets: Target[] = [];
    try {
      for (let index = 0; index < 5; index++)
        targets.push(
          this.createTarget(
            props.width,
            props.height,
            index === 1 || index === 2 ? 'rgba32float' : this.format
          )
        );
    } catch (error) {
      for (const target of targets) this.destroyTarget(target);
      throw error;
    }
    for (const target of this.targets) this.destroyTarget(target);
    this.targets = targets;
    this.activeIndex = 1;
    this.previewIndex = 3;
    this.reset();
  }

  /** Record one update per submission. Failed draw callbacks leave accumulation/sample count unchanged. */
  update(options: LightmapBakeOptions): LightmapTextures {
    assert(!this.destroyed);
    const steps = options.dilationSteps ?? 0;
    assert(Number.isInteger(steps) && steps >= 0 && steps <= 16);
    const chartTexture = options.chartTexture;
    if (steps) {
      // Chart ownership is explicit, preventing dilation between adjacent islands.
      assert(
        chartTexture &&
          !chartTexture.destroyed &&
          chartTexture.device === this.device &&
          chartTexture.width === this.width &&
          chartTexture.height === this.height &&
          chartTexture.dimension === '2d'
      );
    }
    if (this.needsClear) {
      for (const target of this.targets) {
        const pass = this.device.beginRenderPass({
          framebuffer: target.framebuffer,
          clearColor: [0, 0, 0, 0]
        });
        pass.end();
      }
      this.needsClear = false;
    }
    const target = this.targets[0];
    const view = {
      width: this.width,
      height: this.height,
      sampleIndex: this.samples,
      framebuffer: target.framebuffer
    };
    options.prepareSample?.(view);
    const renderPass = this.device.beginRenderPass({
      framebuffer: target.framebuffer,
      clearColor: [0, 0, 0, 0]
    });
    try {
      renderPass.setParameters({viewport: [0, 0, this.width, this.height]});
      options.drawSample({...view, renderPass});
    } finally {
      renderPass.end();
    }
    const nextIndex = this.activeIndex === 1 ? 2 : 1;
    this.filter(
      0,
      0,
      this.targets[this.activeIndex].texture,
      this.targets[0].texture,
      this.targets[nextIndex],
      1 / (this.samples + 1)
    );
    this.activeIndex = nextIndex;
    this.samples++;
    this.filter(
      17,
      2,
      this.targets[nextIndex].texture,
      this.targets[nextIndex].texture,
      this.targets[3],
      1
    );
    this.previewIndex = 3;
    for (let step = 0; step < steps; step++) {
      const destinationIndex = step % 2 === 0 ? 4 : 3;
      this.filter(
        step + 1,
        1,
        chartTexture!,
        this.targets[this.previewIndex].texture,
        this.targets[destinationIndex],
        1
      );
      this.previewIndex = destinationIndex;
    }
    return this.textures;
  }

  /** Records a copy into independent storage. Submit before releasing referenced resources. */
  createResult(): LightmapBakeResult {
    assert(!this.destroyed && this.samples > 0);
    const target = this.createTarget(this.width, this.height);
    try {
      this.device.commandEncoder.copyTextureToTexture({
        sourceTexture: this.textures.lightmapTexture,
        destinationTexture: target.texture,
        width: this.width,
        height: this.height
      });
      return new LightmapBakeResult(target.texture);
    } catch (error) {
      target.texture.destroy();
      throw error;
    } finally {
      target.framebuffer.destroy();
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const filter of this.filters.values()) filter.destroy();
    for (const target of this.targets) this.destroyTarget(target);
  }
  private createTarget(
    width: number,
    height: number,
    format: TextureFormatColor = this.format
  ): Target {
    const texture = this.device.createTexture({
      width,
      height,
      format,
      usage: Texture.RENDER_ATTACHMENT | Texture.SAMPLE | Texture.COPY_SRC | Texture.COPY_DST,
      sampler:
        format === 'rgba32float'
          ? {minFilter: 'nearest', magFilter: 'nearest'}
          : {minFilter: 'linear', magFilter: 'linear'}
    });
    try {
      return {
        texture,
        format,
        framebuffer: this.device.createFramebuffer({width, height, colorAttachments: [texture]})
      };
    } catch (error) {
      texture.destroy();
      throw error;
    }
  }
  private destroyTarget(target: Target): void {
    target.framebuffer.destroy();
    target.texture.destroy();
  }
  private filter(
    index: number,
    mode: number,
    previous: Texture,
    current: Texture,
    target: Target,
    weight: number
  ): void {
    let model = this.filters.get(index);
    if (!model) {
      model = new ClipSpace(this.device, {
        modules: [lightmapFilter],
        shaderLayout: {
          attributes: [],
          bindings: ['currentTexture', 'previousTexture', 'chartTexture'].map((name, index) => ({
            name,
            type: 'texture',
            group: 0,
            location: index + 101,
            sampleType: 'unfilterable-float'
          }))
        },
        source:
          '@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {return lightmapFilter_getColor(vec2i(inputs.Position.xy));}',
        fs: '#version 300 es\nout vec4 fragmentColor;\nvoid main() {fragmentColor = lightmapFilter_getColor(ivec2(gl_FragCoord.xy));}',
        colorAttachmentFormats: [target.format],
        parameters: {depthWriteEnabled: false}
      });
      this.filters.set(index, model);
    }
    model.setBindings({currentTexture: current, previousTexture: previous, chartTexture: previous});
    model.shaderInputs.setProps({lightmapFilter: {weight, mode}});
    // Uniform preparation must precede the render pass.
    model.predraw(this.device.commandEncoder);
    const pass = this.device.beginRenderPass({framebuffer: target.framebuffer});
    try {
      pass.setParameters({viewport: [0, 0, this.width, this.height]});
      model.draw(pass);
    } finally {
      pass.end();
    }
  }
}
