// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { initializeShaderModule } from '@luma.gl/shadertools';
import { ShaderInputs } from '../shader-inputs';
import { ClipSpace } from '../models/clip-space';
import { SwapFramebuffers } from '../compute/swap';
import { BackgroundTextureModel } from '../models/billboard-texture-model';
import { getFragmentShaderForRenderPass } from './get-fragment-shader';
/** A pass that renders a given texture into screen space */
export class ShaderPassRenderer {
    device;
    shaderInputs;
    passRenderers;
    swapFramebuffers;
    /** For rendering to the screen */
    clipSpace;
    textureModel;
    constructor(device, props) {
        this.device = device;
        props.shaderPasses.map(shaderPass => initializeShaderModule(shaderPass));
        const modules = props.shaderPasses.reduce((object, shaderPass) => ({ ...object, [shaderPass.name]: shaderPass }), {});
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
    resize(size) {
        size ||= this.device.getCanvasContext().getDrawingBufferSize();
        this.swapFramebuffers.resize({ width: size[0], height: size[1] });
    }
    renderToScreen(options) {
        // Run the shader passes and generate an output texture
        const outputTexture = this.renderToTexture(options);
        if (!outputTexture) {
            // source texture not yet loaded
            return false;
        }
        const framebuffer = this.device
            .getDefaultCanvasContext()
            // @ts-expect-error TODO - remove after republish
            .getCurrentFramebuffer({ depthStencilAttachment: false });
        const renderPass = this.device.beginRenderPass({
            id: 'shader-pass-renderer-to-screen',
            framebuffer,
            // clearColor: [1, 1, 0, 1],
            clearDepth: 1
        });
        this.clipSpace.setBindings({ sourceTexture: outputTexture });
        this.clipSpace.draw(renderPass);
        renderPass.end();
        return true;
    }
    /** Runs the shaderPasses in sequence on the sourceTexture and returns a texture with the results.
     * @returns null if the the sourceTexture has not yet been loaded
     */
    renderToTexture(options) {
        const { sourceTexture } = options;
        if (!sourceTexture.isReady) {
            return null;
        }
        // If no shader passes are provided, just return the original texture
        if (this.passRenderers.length === 0) {
            return sourceTexture.texture;
        }
        this.textureModel.setProps({ backgroundTexture: sourceTexture });
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
                subPassRenderer.render({ renderPass, bindings });
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
    shaderPass;
    subPassRenderers;
    constructor(device, shaderPass, props = {}) {
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
    model;
    shaderPass;
    subPass;
    constructor(device, shaderPass, subPass) {
        this.shaderPass = shaderPass;
        this.subPass = subPass;
        const action = subPass.action || (subPass.filter && 'filter') || (subPass.sampler && 'sample') || 'filter';
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
    render(options) {
        const { renderPass, bindings } = options;
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
