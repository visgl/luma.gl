/* global luma */
const {Framebuffer, withParameters, normalizeShaderModule, ClipSpace} = luma;

// eslint-disable-next-line
const multipass = (function multipass() {
  class RenderState {
    constructor(gl, props = {}) {
      this.gl = gl;

      this.framebuffer1 = new Framebuffer(gl, {id: 'multi-pass-1', stencil: true});
      this.framebuffer2 = new Framebuffer(gl, {id: 'multi-pass-2', stencil: true});

      this.reset();
    }

    reset() {
      this.framebuffer1.resize();
      this.framebuffer2.resize();

      this.writeBuffer = this.framebuffer1;
      this.readBuffer = this.framebuffer2;

      this.maskActive = false;
    }

    delete() {
      this.framebuffer1.delete();
      this.framebuffer2.delete();
    }

    _swapFramebuffers() {
      const tmp = this.readBuffer;
      this.readBuffer = this.writeBuffer;
      this.writeBuffer = tmp;
    }
  }

  class Pass {
    constructor(gl, props = {}) {
      const {id = 'pass'} = props;
      this.id = id; // id of this pass
      this.gl = gl;
      this.props = {enabled: true, screen: false, swap: false};
      Object.assign(this.props, props);
    }

    setProps(props) {
      Object.assign(this.props, props);
    }

    render(renderState, animationProps) {
      if (!this.props.enabled) {
        return;
      }

      const gl = this.gl;

      const renderParams = {
        gl,
        outputBuffer: renderState.writeBuffer,
        inputBuffer: renderState.readBuffer,
        animationProps,
        swapBuffers: () => renderState._swapFramebuffers()
      };

      // TODO: Calirfy/Fix : is `screen` or `swap` must be true at this point
      // if so comment. We can also remove `enabled` from props and deduce that based on these two flags
      if (this.props.screen) {
        renderParams.inputBuffer = renderParams.outputBuffer;
        renderParams.outputBuffer = Framebuffer.getDefaultFramebuffer(gl);
      } else if (this.props.swap) {
        renderParams.inputBuffer = renderState.writeBuffer;
        renderParams.outputBuffer = renderState.readBuffer;
      }

      withParameters(gl, {framebuffer: renderParams.outputBuffer}, () =>
        this._renderPass(renderParams)
      );

      if (this.props.debug) {
        renderParams.outputBuffer.log(1, this.id);
      }

      if (this.props.swap) {
        renderState._swapFramebuffers();
      }
    }

    delete() {
      // Delete any resources crated
    }

    /**
     * Renders the effect.
     * This is an abstract method that should be overridden.
     * @param {Framebuffer} inputBuffer - Frame buffer that contains the result of the previous pass
     * @param {Framebuffer} outputBuffer - Frame buffer that serves as the output render target
     */
    _renderPass({gl, inputBuffer, outputBuffer, animationProps}) {
      // assert(false, 'Draw/render methods not implemented!');
    }
  }

  class CompositePass extends Pass {
    constructor(gl, props = {}) {
      props = Array.isArray(props) ? {passes: props} : props;
      super(gl, Object.assign({id: 'composite-pass'}, props));
    }

    // Override render() to just forward the call
    render(...args) {
      const {passes = []} = this.props;
      for (const pass of passes) {
        pass.render(...args);
      }
    }

    delete() {
      // Delete any resources crated
    }
  }

  class MultiPassRenderer extends CompositePass {
    constructor(gl, props = {}) {
      props = Array.isArray(props) ? {passes: props} : props;
      super(gl, Object.assign({id: 'multi-pass'}, props));
      this.renderState = new RenderState(gl, props);
    }

    // Override render() to just forward the call
    render(animationProps) {
      this.renderState.reset();
      const {passes = []} = this.props;
      for (const pass of passes) {
        pass.render(this.renderState, animationProps);
      }
      return this;
    }

    delete() {
      this.renderState.delete();
      super.delete();
    }
  }

  class ShaderModuleSinglePass extends Pass {
    constructor(gl, props = {}) {
      super(gl, Object.assign({swap: true}, props));
    }

    _renderPass({inputBuffer, swapBuffers}) {
      this.props.model.setUniforms(this.props);

      // swapBuffers();
      this.props.model.draw({
        uniforms: {
          texture: inputBuffer,
          texSize: [inputBuffer.width, inputBuffer.height]
        },
        parameters: {
          depthWrite: false,
          depthTest: false
        }
      });
    }
  }

  class ShaderModulePass extends CompositePass {
    constructor(gl, module, props = {}) {
      const id = `${module.name}-pass`;
      normalizeShaderModule(module);
      const passes = normalizePasses(gl, module, id, props);
      super(gl, Object.assign({id, passes}, props));
      this.module = module;
    }

    _renderPass({inputBuffer, swapBuffers}) {
      let first = true;
      for (const pass of this.props.passes) {
        if (!first) {
          swapBuffers();
        }
        first = false;
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
      }
    }
  }

  function normalizePasses(gl, module, id, props) {
    if (module.filter || module.sampler) {
      const fs = getFragmentShaderForRenderPass(module);
      const pass = new ShaderModuleSinglePass(gl, {
        id,
        model: getModel(gl, module, fs, id, props),
        uniforms: null
      });
      return [pass];
    }

    const passes = module.passes || [];
    return passes.map(pass => {
      const fs = getFragmentShaderForRenderPass(module, pass);
      const idn = `${id}-${passes.length + 1}`;

      return new ShaderModuleSinglePass(
        gl,
        Object.assign(
          {
            id: idn,
            model: getModel(gl, module, fs, idn, props),
            uniforms: pass.uniforms
          },
          props
        )
      );
    });
  }

  function getModel(gl, module, fs, id, props) {
    const model = new ClipSpace(gl, {id, fs, modules: [module]});

    const uniforms = Object.assign(module.getUniforms(), module.getUniforms(props));

    model.setUniforms(uniforms);
    return model;
  }

  const FILTER_FS_TEMPLATE = func => `\
  uniform sampler2D texture;
  uniform vec2 texSize;

  varying vec2 position;
  varying vec2 coordinate;
  varying vec2 uv;

  void main() {
    vec2 texCoord = coordinate;

    gl_FragColor = texture2D(texture, texCoord);
    gl_FragColor = ${func}(gl_FragColor, texSize, texCoord);
  }
  `;

  const SAMPLER_FS_TEMPLATE = func => `\
  uniform sampler2D texture;
  uniform vec2 texSize;

  varying vec2 position;
  varying vec2 coordinate;
  varying vec2 uv;

  void main() {
    vec2 texCoord = coordinate;

    gl_FragColor = ${func}(texture, texSize, texCoord);
  }
  `;

  function getFragmentShaderForRenderPass(module, pass = module) {
    if (pass.filter) {
      const func = typeof pass.filter === 'string' ? pass.filter : `${module.name}_filterColor`;
      return FILTER_FS_TEMPLATE(func);
    }

    if (pass.sampler) {
      const func = typeof pass.sampler === 'string' ? pass.sampler : `${module.name}_sampleColor`;
      return SAMPLER_FS_TEMPLATE(func);
    }

    // console.error(`${module.name} no fragment shader generated`);
    return null;
  }

  class CopyPass extends Pass {
    constructor(gl, props = {}) {
      super(gl, Object.assign({id: 'copy-pass', swap: true}, props));
      this.clipspace = new ClipSpace(gl, {
        id: 'copy-pass',
        fs: `\
        uniform sampler2D uDiffuseSampler;
        uniform float uOpacity;

        varying vec2 uv;

        void main() {
          vec4 texel = texture2D(uDiffuseSampler, uv);
          gl_FragColor = uOpacity * texel;
        }
        `
      });
    }

    delete() {
      super.delete();
      this.clipspace.delete();
    }

    _renderPass({inputBuffer}) {
      const {opacity = 1.0} = this.props;

      this.clipspace.draw({
        uniforms: {
          uDiffuseSampler: inputBuffer,
          uOpacity: opacity
        },
        parameters: {
          depthWrite: false,
          depthTest: false
        }
      });
    }
  }

  class TexturePass extends Pass {
    constructor(gl, options = {}) {
      super(gl, Object.assign({id: 'texture-pass'}, options));
      const {texture, opacity = 1.0} = options;
      this.clipspace = new ClipSpace(gl, {
        id: 'texture-pass',
        fs: `\
        uniform sampler2D uDiffuseSampler;
        uniform float uOpacity;
        varying vec2 uv;

        void main() {
          vec4 texel = texture2D(uDiffuseSampler, uv);
          gl_FragColor = uOpacity * texel;
        }
        `,
        uniforms: {
          uDiffuseSampler: texture,
          uOpacity: opacity
        }
      });
    }

    delete() {
      this.clipspace.delete();
      super.delete();
    }

    _renderPass() {
      this.clipspace.draw({
        parameters: {
          depthWrite: false,
          depthTest: false
        }
      });
    }
  }

  class ClearPass extends Pass {
    constructor(gl, props = {}) {
      super(gl, Object.assign({id: 'clear-pass'}, props));
    }

    // TODO - add support for colors, align with model.clear and framebuffer.clear
    // TODO - integrate with luma.gl clear, make sure right buffer is cleared
    _renderPass() {
      const {gl} = this;
      const {clearBits = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT} = this.props;
      gl.clear(clearBits);
    }
  }

  return {
    TexturePass,
    CopyPass,
    MultiPassRenderer,
    ClearPass,
    ShaderModulePass
  };
})();
