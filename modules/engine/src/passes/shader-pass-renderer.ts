// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, Framebuffer, RenderPass, Texture} from '@luma.gl/core';
import type {ShaderModule, ShaderPass, ShaderPassRenderTarget} from '@luma.gl/shadertools';
import {initializeShaderModule} from '@luma.gl/shadertools';
import {ShaderInputs} from '../shader-inputs';
import {DynamicTexture} from '../dynamic-texture/dynamic-texture';
import {ClipSpace} from '../models/clip-space';
import {SwapFramebuffers} from '../compute/swap';
import {BackgroundTextureModel} from '../models/billboard-texture-model';

import {getFragmentShaderForRenderPass} from './get-fragment-shader';

type ShaderSubPass = NonNullable<ShaderPass['passes']>[0];

const RESERVED_RENDER_TARGET_NAMES = new Set(['original', 'previous']);

const textureTransform = {
  name: 'textureTransform',
  uniformTypes: {
    scale: 'vec2<f32>'
  }
} as const satisfies ShaderModule<{}, {scale: [number, number]}>;

/** Props for ShaderPassRenderer */
export type ShaderPassRendererProps = {
  /** List of ShaderPasses to apply to the sourceTexture */
  shaderPasses: ShaderPass[];
  /** Optional typed ShaderInputs object for setting uniforms */
  shaderInputs?: ShaderInputs;
};

/** A pass that renders a given texture into screen space */
export class ShaderPassRenderer {
  device: Device;
  shaderInputs: ShaderInputs;
  passRenderers: PassRenderer[];
  swapFramebuffers: SwapFramebuffers;
  textureModel: BackgroundTextureModel;

  constructor(device: Device, props: ShaderPassRendererProps) {
    this.device = device;

    props.shaderPasses.map(shaderPass => initializeShaderModule(shaderPass));

    const modules = props.shaderPasses.reduce(
      (object, shaderPass) => ({...object, [shaderPass.name]: shaderPass}),
      {}
    );
    this.shaderInputs = props.shaderInputs || new ShaderInputs(modules);

    const size = device.getCanvasContext().getDrawingBufferSize();
    this.swapFramebuffers = new SwapFramebuffers(device, {
      colorAttachments: [device.preferredColorFormat],
      width: size[0],
      height: size[1]
    });

    this.textureModel = new BackgroundTextureModel(device, {
      backgroundTexture: this.swapFramebuffers.current.colorAttachments[0].texture
    });

    this.passRenderers = props.shaderPasses.map(shaderPass => new PassRenderer(device, shaderPass));
  }

  /** Destroys resources created by this ShaderPassRenderer */
  destroy() {
    for (const subPassRenderer of this.passRenderers) {
      subPassRenderer.destroy();
    }
    this.swapFramebuffers.destroy();
    this.textureModel.destroy();
  }

  resize(size?: [width: number, height: number]): void {
    size ||= this.device.getCanvasContext().getDrawingBufferSize();
    this.swapFramebuffers.resize({width: size[0], height: size[1]});
    for (const passRenderer of this.passRenderers) {
      passRenderer.resize(size);
    }
  }

  renderToScreen(options: {
    sourceTexture: DynamicTexture;
    uniforms?: any;
    bindings?: any;
  }): boolean {
    // Run the shader passes and generate an output texture
    const outputTexture = this.renderToTexture(options);
    if (!outputTexture) {
      // source texture not yet loaded
      return false;
    }

    const framebuffer = this.device
      .getDefaultCanvasContext()
      .getCurrentFramebuffer({depthStencilFormat: false});
    const renderPass = this.device.beginRenderPass({
      id: 'shader-pass-renderer-to-screen',
      framebuffer,
      // clearColor: [1, 1, 0, 1],
      clearDepth: false
    });
    this.textureModel.setProps({backgroundTexture: outputTexture});
    this.textureModel.draw(renderPass);
    renderPass.end();
    return true;
  }

  /** Runs the shaderPasses in sequence on the sourceTexture and returns a texture with the results.
   * @returns null if the the sourceTexture has not yet been loaded
   */
  renderToTexture(options: {
    sourceTexture: DynamicTexture;
    uniforms?: any;
    bindings?: any;
  }): Texture | null {
    const {sourceTexture} = options;
    if (!sourceTexture.isReady) {
      return null;
    }

    // If no shader passes are provided, just return the original texture
    if (this.passRenderers.length === 0) {
      return sourceTexture.texture;
    }

    let previousTexture: Texture = sourceTexture.texture;
    let previousFramebuffer: Framebuffer | null = null;
    for (const passRenderer of this.passRenderers) {
      for (const subPassRenderer of passRenderer.subPassRenderers) {
        const outputFramebuffer =
          subPassRenderer.subPass.output === 'previous' ||
          subPassRenderer.subPass.output === undefined
            ? getNextPreviousFramebuffer(this.swapFramebuffers, previousFramebuffer)
            : passRenderer.getRenderTarget(subPassRenderer.subPass.output).framebuffer;
        const outputTexture = getFramebufferTexture(outputFramebuffer);
        const resolvedBindings = passRenderer.resolveBindings({
          subPass: subPassRenderer.subPass,
          originalTexture: sourceTexture.texture,
          previousTexture,
          outputTexture,
          externalBindings: options.bindings || {}
        });

        const renderPass = this.device.beginRenderPass({
          id: 'shader-pass-renderer-run-pass',
          framebuffer: outputFramebuffer,
          clearColor: [0, 0, 0, 1],
          clearDepth: 1
        });
        subPassRenderer.render({
          renderPass,
          bindings: resolvedBindings,
          textureScale: calculateTextureScale(
            (resolvedBindings.sourceTexture as Texture) || previousTexture,
            outputTexture
          )
        });
        renderPass.end();

        if (
          subPassRenderer.subPass.output === 'previous' ||
          subPassRenderer.subPass.output === undefined
        ) {
          previousTexture = outputTexture;
          previousFramebuffer = outputFramebuffer;
        }
      }
    }
    return previousTexture;
  }
}

/** renders one ShaderPass */
class PassRenderer {
  shaderPass: ShaderPass;
  subPassRenderers: SubPassRenderer[];
  renderTargets: Record<string, PrivateRenderTarget>;
  device: Device;

  constructor(device: Device, shaderPass: ShaderPass, props = {}) {
    this.device = device;
    this.shaderPass = shaderPass;
    // const id = `${shaderPass.name}-pass`;

    const subPasses = shaderPass.passes || [];
    // normalizePasses(gl, module, id, props);
    this.validateRenderTargets();
    this.renderTargets = this.createRenderTargets();
    this.validateSubPasses(subPasses);

    this.subPassRenderers = subPasses.map(subPass => {
      // const idn = `${id}-${subPasses.length + 1}`;
      return new SubPassRenderer(device, shaderPass, subPass);
    });
  }

  destroy() {
    for (const subPassRenderer of this.subPassRenderers) {
      subPassRenderer.destroy();
    }
    for (const renderTarget of Object.values(this.renderTargets)) {
      renderTarget.framebuffer.destroy();
      renderTarget.texture.destroy();
    }
  }

  resize(size: [width: number, height: number]) {
    for (const renderTarget of Object.values(this.renderTargets)) {
      const targetSize = getRenderTargetSize(size, renderTarget.spec.scale);
      if (
        renderTarget.texture.width === targetSize[0] &&
        renderTarget.texture.height === targetSize[1]
      ) {
        continue;
      }

      renderTarget.framebuffer.destroy();
      renderTarget.texture.destroy();
      const replacement = createPrivateRenderTarget(
        this.device,
        renderTarget.name,
        renderTarget.spec,
        size
      );
      renderTarget.texture = replacement.texture;
      renderTarget.framebuffer = replacement.framebuffer;
    }
  }

  getRenderTarget(name: string): PrivateRenderTarget {
    const renderTarget = this.renderTargets[name];
    if (!renderTarget) {
      throw new Error(`${this.shaderPass.name}: unknown render target "${name}"`);
    }
    return renderTarget;
  }

  resolveBindings(options: {
    subPass: ShaderSubPass;
    originalTexture: Texture;
    previousTexture: Texture;
    outputTexture: Texture;
    externalBindings: Record<string, unknown>;
  }): Record<string, unknown> {
    const {subPass, originalTexture, previousTexture, outputTexture, externalBindings} = options;
    const inputMap = subPass.inputs || {sourceTexture: 'previous'};
    const resolvedBindings: Record<string, unknown> = {...externalBindings};

    for (const [bindingName, inputSource] of Object.entries(inputMap)) {
      if (!inputSource) {
        continue;
      }
      const texture = this.resolveInputTexture(inputSource, originalTexture, previousTexture);
      if (subPass.output && subPass.output !== 'previous' && inputSource === subPass.output) {
        throw new Error(
          `${this.shaderPass.name}: subpass cannot read and write render target "${subPass.output}" in the same draw`
        );
      }
      if (bindingName === 'sourceTexture' && texture === outputTexture) {
        throw new Error(
          `${this.shaderPass.name}: subpass cannot sample from the render target it is writing to`
        );
      }
      resolvedBindings[bindingName] = texture;
    }

    if (!('sourceTexture' in resolvedBindings)) {
      resolvedBindings.sourceTexture = previousTexture;
    }

    return resolvedBindings;
  }

  private resolveInputTexture(
    inputSource: string,
    originalTexture: Texture,
    previousTexture: Texture
  ): Texture {
    switch (inputSource) {
      case 'original':
        return originalTexture;
      case 'previous':
        return previousTexture;
      default:
        return this.getRenderTarget(inputSource).texture;
    }
  }

  private validateRenderTargets(): void {
    for (const name of Object.keys(this.shaderPass.renderTargets || {})) {
      if (RESERVED_RENDER_TARGET_NAMES.has(name)) {
        throw new Error(`${this.shaderPass.name}: render target name "${name}" is reserved`);
      }
    }
  }

  private createRenderTargets(): Record<string, PrivateRenderTarget> {
    const size = this.device.getCanvasContext().getDrawingBufferSize();
    return Object.entries(this.shaderPass.renderTargets || {}).reduce(
      (renderTargets, [name, spec]) => ({
        ...renderTargets,
        [name]: createPrivateRenderTarget(this.device, name, spec, size)
      }),
      {} as Record<string, PrivateRenderTarget>
    );
  }

  private validateSubPasses(subPasses: ShaderSubPass[]): void {
    for (const subPass of subPasses) {
      const inputMap = subPass.inputs || {sourceTexture: 'previous'};
      for (const inputSource of Object.values(inputMap)) {
        if (
          inputSource &&
          inputSource !== 'original' &&
          inputSource !== 'previous' &&
          !(inputSource in this.renderTargets)
        ) {
          throw new Error(`${this.shaderPass.name}: unknown input source "${inputSource}"`);
        }
      }

      if (
        subPass.output &&
        subPass.output !== 'previous' &&
        !(subPass.output in this.renderTargets)
      ) {
        throw new Error(`${this.shaderPass.name}: unknown output target "${subPass.output}"`);
      }
    }
  }
}

/** Renders one subpass of a ShaderPass */
class SubPassRenderer {
  model: ClipSpace;
  shaderPass: ShaderPass;
  subPass: ShaderSubPass;

  constructor(device: Device, shaderPass: ShaderPass, subPass: ShaderSubPass) {
    this.shaderPass = shaderPass;
    this.subPass = subPass;
    const action =
      subPass.action || (subPass.filter && 'filter') || (subPass.sampler && 'sample') || 'filter';
    const fs = getFragmentShaderForRenderPass({
      shaderPass,
      action,
      shadingLanguage: device.info.shadingLanguage
    });

    this.model = new ClipSpace(device, {
      id: `${shaderPass.name}-subpass`,
      source: fs,
      fs,
      modules: [textureTransform, shaderPass],
      parameters: {
        depthWriteEnabled: false
      }
    });
  }

  destroy() {
    this.model.destroy();
  }

  render(options: {renderPass: RenderPass; bindings: any; textureScale: [number, number]}): void {
    const {renderPass, bindings, textureScale} = options;

    this.model.shaderInputs.setProps({
      textureTransform: {scale: textureScale}
    });
    this.model.shaderInputs.setProps({
      [this.shaderPass.name]: this.shaderPass.uniforms || {}
    });
    this.model.shaderInputs.setProps({
      [this.shaderPass.name]: this.subPass.uniforms || {}
    });
    // this.model.setBindings(this.subPass.bindings || {});
    this.model.setBindings(bindings || {});
    this.model.draw(renderPass);
  }
}

type PrivateRenderTarget = {
  name: string;
  spec: ShaderPassRenderTarget;
  texture: Texture;
  framebuffer: Framebuffer;
};

function createPrivateRenderTarget(
  device: Device,
  name: string,
  spec: ShaderPassRenderTarget,
  size: [number, number]
): PrivateRenderTarget {
  const targetSize = getRenderTargetSize(size, spec.scale);
  const texture = device.createTexture({
    id: `${name}-texture`,
    width: targetSize[0],
    height: targetSize[1],
    format: spec.format || device.preferredColorFormat,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST
  });
  const framebuffer = device.createFramebuffer({
    id: `${name}-framebuffer`,
    width: targetSize[0],
    height: targetSize[1],
    colorAttachments: [texture]
  });

  return {name, spec, texture, framebuffer};
}

function getRenderTargetSize(
  size: [width: number, height: number],
  scale: [number, number] = [1, 1]
): [width: number, height: number] {
  return [Math.max(1, Math.round(size[0] * scale[0])), Math.max(1, Math.round(size[1] * scale[1]))];
}

function getFramebufferTexture(framebuffer: Framebuffer): Texture {
  const texture = framebuffer.colorAttachments[0]?.texture;
  if (!texture) {
    throw new Error('ShaderPassRenderer: framebuffer is missing a color attachment texture');
  }
  return texture;
}

function getNextPreviousFramebuffer(
  swapFramebuffers: SwapFramebuffers,
  previousFramebuffer: Framebuffer | null
): Framebuffer {
  if (previousFramebuffer === swapFramebuffers.current) {
    return swapFramebuffers.next;
  }
  return swapFramebuffers.current;
}

function calculateTextureScale(
  sourceTexture: Texture,
  outputTexture: Texture
): [scaleX: number, scaleY: number] {
  const sourceAspect = sourceTexture.width / sourceTexture.height;
  const outputAspect = outputTexture.width / outputTexture.height;

  if (outputAspect > sourceAspect) {
    return [1, outputAspect / sourceAspect];
  }

  return [sourceAspect / outputAspect, 1];
}
