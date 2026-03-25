// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, RenderPass, Texture} from '@luma.gl/core';
import type {ShaderModule, ShaderPass} from '@luma.gl/shadertools';
import {initializeShaderModule} from '@luma.gl/shadertools';
import {ShaderInputs} from '../shader-inputs';
import {DynamicTexture} from '../dynamic-texture/dynamic-texture';
import {ClipSpace} from '../models/clip-space';
import {SwapFramebuffers} from '../compute/swap';
import {BackgroundTextureModel} from '../models/billboard-texture-model';

import {getFragmentShaderForRenderPass} from './get-fragment-shader';

type ShaderSubPass = NonNullable<ShaderPass['passes']>[0];

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

    let first = true;
    for (const passRenderer of this.passRenderers) {
      for (const subPassRenderer of passRenderer.subPassRenderers) {
        if (!first) {
          this.swapFramebuffers.swap();
        }
        const subPassSourceTexture = first
          ? sourceTexture.texture
          : this.swapFramebuffers.current.colorAttachments[0].texture;
        const outputTexture = this.swapFramebuffers.next.colorAttachments[0].texture;

        const renderPass = this.device.beginRenderPass({
          id: 'shader-pass-renderer-run-pass',
          framebuffer: this.swapFramebuffers.next,
          clearColor: [0, 0, 0, 1],
          clearDepth: 1
        });
        subPassRenderer.render({
          renderPass,
          bindings: {sourceTexture: subPassSourceTexture},
          textureScale: calculateTextureScale(subPassSourceTexture, outputTexture)
        });
        renderPass.end();
        first = false;
      }
    }

    this.swapFramebuffers.swap();
    const outputTexture = this.swapFramebuffers.current.colorAttachments[0].texture;
    return outputTexture;
  }
}

/** renders one ShaderPass */
class PassRenderer {
  shaderPass: ShaderPass;
  subPassRenderers: SubPassRenderer[];

  constructor(device: Device, shaderPass: ShaderPass, props = {}) {
    this.shaderPass = shaderPass;
    // const id = `${shaderPass.name}-pass`;

    const subPasses = shaderPass.passes || [];
    // normalizePasses(gl, module, id, props);

    this.subPassRenderers = subPasses.map(subPass => {
      // const idn = `${id}-${subPasses.length + 1}`;
      return new SubPassRenderer(device, shaderPass, subPass);
    });
  }

  destroy() {
    for (const subPassRenderer of this.subPassRenderers) {
      subPassRenderer.destroy();
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
