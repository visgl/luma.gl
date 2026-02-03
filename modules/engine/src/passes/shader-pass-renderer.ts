// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, RenderPass, Texture} from '@luma.gl/core';
import type {ShaderPass} from '@luma.gl/shadertools';
import {initializeShaderModule} from '@luma.gl/shadertools';
import {ShaderInputs} from '../shader-inputs';
import {DynamicTexture} from '../dynamic-texture/dynamic-texture';
import {ClipSpace} from '../models/clip-space';
import {SwapFramebuffers} from '../compute/swap';
import {BackgroundTextureModel} from '../models/billboard-texture-model';

import {getFragmentShaderForRenderPass} from './get-fragment-shader';

type ShaderSubPass = NonNullable<ShaderPass['passes']>[0];

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
  /** For rendering to the screen */
  clipSpace: ClipSpace;
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

    this.clipSpace = new ClipSpace(device, {
      source: /* wgsl */ `\
  @group(0) @binding(0) var sourceTexture: texture_2d<f32>;
  @group(0) @binding(1) var sourceTextureSampler: sampler;

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
	let texCoord: vec2<f32> = inputs.coordinate;
	return textureSample(sourceTexture, sourceTextureSampler, texCoord);
}
`,

      fs: /* glsl */ `\
#version 300 es

uniform sampler2D sourceTexture;
in vec2 uv;
out vec4 fragColor;

void main() {
  fragColor = texture(sourceTexture, uv);
}
`
    });

    this.passRenderers = props.shaderPasses.map(shaderPass => new PassRenderer(device, shaderPass));
  }

  /** Destroys resources created by this ShaderPassRenderer */
  destroy() {
    for (const subPassRenderer of this.passRenderers) {
      subPassRenderer.destroy();
    }
    this.swapFramebuffers.destroy();
    this.clipSpace.destroy();
    this.textureModel.destroy();
  }

  resize(size?: [width: number, height: number]): void {
    size ||= this.device.getCanvasContext().getDrawingBufferSize();
    this.swapFramebuffers.resize({width: size[0], height: size[1]});
  }

  /** Check if any internal models need to redraw */
  needsRedraw(): string | false {
    let redraw: string | false = this.clipSpace.needsRedraw() || this.textureModel.needsRedraw();
    for (const passRenderer of this.passRenderers) {
      redraw = redraw || passRenderer.needsRedraw();
    }
    return redraw;
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
      // @ts-expect-error TODO - remove after republish
      .getCurrentFramebuffer({depthStencilAttachment: false});
    const renderPass = this.device.beginRenderPass({
      id: 'shader-pass-renderer-to-screen',
      framebuffer,
      // clearColor: [1, 1, 0, 1],
      clearDepth: 1
    });
    this.clipSpace.setBindings({sourceTexture: outputTexture});
    this.clipSpace.draw(renderPass);
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

    this.textureModel.setProps({backgroundTexture: sourceTexture});

    // Clear the current texture before we begin
    const clearTexturePass = this.device.beginRenderPass({
      id: 'shader-pass-renderer-clear-texture',
      framebuffer: this.swapFramebuffers.current,
      clearColor: [1, 0, 0, 1]
    });
    this.textureModel.draw(clearTexturePass);
    clearTexturePass.end();

    // Copy the texture contents
    // const commandEncoder = this.device.createCommandEncoder();
    // commandEncoder.copyTextureToTexture({
    //   sourceTexture: sourceTexture.texture,
    //   destinationTexture: this.swapFramebuffers.current.colorAttachments[0].texture
    // });
    // commandEncoder.finish();

    let first = true;
    for (const passRenderer of this.passRenderers) {
      for (const subPassRenderer of passRenderer.subPassRenderers) {
        if (!first) {
          this.swapFramebuffers.swap();
        }
        first = false;

        const swapBufferTexture = this.swapFramebuffers.current.colorAttachments[0].texture;

        const bindings = {
          sourceTexture: swapBufferTexture
          // texSize: [sourceTextures.width, sourceTextures.height]
        };

        const renderPass = this.device.beginRenderPass({
          id: 'shader-pass-renderer-run-pass',
          framebuffer: this.swapFramebuffers.next,
          clearColor: [0, 0, 0, 1],
          clearDepth: 1
        });
        subPassRenderer.render({renderPass, bindings});
        renderPass.end();
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

  needsRedraw(): string | false {
    let redraw: string | false = false;
    for (const subPassRenderer of this.subPassRenderers) {
      redraw = redraw || subPassRenderer.needsRedraw();
    }
    return redraw;
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
      modules: [shaderPass],
      parameters: {
        depthWriteEnabled: false
      }
    });
  }

  destroy() {
    this.model.destroy();
  }

  needsRedraw(): string | false {
    return this.model.needsRedraw();
  }

  render(options: {renderPass: RenderPass; bindings: any}): void {
    const {renderPass, bindings} = options;

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
