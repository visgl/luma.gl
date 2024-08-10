import {Device, Framebuffer, RenderPass} from '@luma.gl/core';
import {_ShaderInputs, ClipSpace, Swap} from '@luma.gl/engine';
import {ShaderPass, initializeShaderModule, getShaderModuleUniforms} from '@luma.gl/shadertools';
import {getFragmentShaderForRenderPass} from './get-fragment-shader';

type ShaderSubPass = ShaderPass['passes'][0];

export type ShaderPassRendererProps = {};

//
// A pass that renders a given texture into screen space
//
export class ShaderPassRenderer {
  shaderInputs: _ShaderInputs;
  passRenderers: PassRenderer[];
  framebuffers: Swap<Framebuffer>[];

  constructor(device: Device, shaderPasses: ShaderPass[], props: ShaderPassRendererProps) {
    this.passRenderers = shaderPasses.map(shaderPass => new PassRenderer(device, {id});
  }

  destroy() {
    // TODO
  }

  resize(width: number, height: number): void {
    // this.props.passes.forEach(pass => pass.resize(width, height));
  }

  render(): void {
    let first = true;
    for (const passRenderer of this.passRenderers) {
      for (const subPassRenderer of passRenderer.subPassRenderers) {
        const uniforms1 = getShaderModuleUniforms(shaderPasses);
        const uniforms2 = getShaderModuleUniforms(props);
        Object.assign(module.getUniforms(), module.getUniforms(props));
    
        const {inputBuffer, swapBuffers} = this.framebuffers;
   
        if (!first) {
          this.swapBuffers();
          first = false;
        }
      
        const {uniforms, model} = pass.props;
        if (uniforms) {
          model.setUniforms(uniforms);
        }
        // swapBuffers();
        model.draw({
          uniforms: {
            texture: inputBuffer,
            texSize: [inputBuffer.width, inputBuffer.height]
          },
          parameters: {
            depthWrite: false,
            depthTest: false
          }
        });
      
        const renderPass = subPassRenderer.beginRenderPass(inputBuffer);
        subPassRenderer.render({renderPass, inputBuffer, swapBuffers});
        renderPass.end();
      }
    }
  }
}

/** renders one ShaderPass */
class PassRenderer {
  shaderPass: ShaderPass;
  subPassRenderers: SubPassRenderer[];

  constructor(device: Device, shaderPass: ShaderPass, props = {}) {
    this.shaderPass = shaderPass;
    const id = `${shaderPass.name}-pass`;
    initializeShaderModule(shaderPass);

    const subPasses = shaderPass.passes || [];
    // normalizePasses(gl, module, id, props);

    this.subPassRenderers = subPasses.map(subPass => {
      const idn = `${id}-${subPasses.length + 1}`;
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
  subPass: ShaderSubPass;

  constructor(
    device: Device,
    shaderPass: ShaderPass,
    subPass: ShaderSubPass
  ) {
    this.subPass = subPass;
    // @ts-expect-error TODO(ib) - remove this line when types are published
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
        depthWriteEnabled: false,
        depthCompare: 'always'
      }
    });
  }

  destroy() {
    this.model.destroy();
  }

  beginRenderPass(framebuffer: Framebuffer): RenderPass {
    return this.model.device.beginRenderPass({
      framebuffer
    });
  }

  render(options: {renderPass: RenderPass; inputBuffer; swapBuffers}) {
    const {renderPass, inputBuffer, swapBuffers} = options;
    
    this.model.setUniforms(this.subPass.uniforms || {});

    this.model.setUniforms({
      uniforms: {
        texture: inputBuffer,
        texSize: [inputBuffer.width, inputBuffer.height]
      },
    });

    this.model.draw(renderPass);
  }
}
