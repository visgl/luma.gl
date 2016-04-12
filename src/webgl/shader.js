import formatCompilerError from 'gl-format-compiler-error';

// For now this is an internal class
export class Shader {

  /* eslint-disable max-statements */
  constructor(gl, shaderSource, shaderType) {
    this.gl = gl;
    this.shaderType = shaderType;
    this.handle = gl.createShader(shaderType);
    if (this.handle === null) {
      throw new Error(`Error creating shader with type ${shaderType}`);
    }
    this._compile(shaderSource);
  }

  delete() {
    const {gl} = this;
    if (this.handle) {
      gl.deleteShader(this.handle);
      this.handle = null;
    }
  }

  _compile(shaderSource) {
    const {gl} = this;
    gl.shaderSource(this.handle, shaderSource);
    gl.compileShader(this.handle);
    const compiled = gl.getShaderParameter(this.handle, gl.COMPILE_STATUS);
    if (!compiled) {
      const info = gl.getShaderInfoLog(this.handle);
      gl.deleteShader(this.handle);
      /* eslint-disable no-try-catch */
      let formattedLog;
      try {
        formattedLog = formatCompilerError(info, shaderSource, this.shaderType);
      } catch (error) {
        /* eslint-disable no-console */
        /* global console */
        console.warn('Error formatting glsl compiler error:', error);
        /* eslint-enable no-console */
        throw new Error(`Error while compiling the shader ${info}`);
      }
      /* eslint-enable no-try-catch */
      throw new Error(formattedLog.long);
    }
  }
  /* eslint-enable max-statements */
}

export class VertexShader extends Shader {
  constructor(gl, shaderSource) {
    super(gl, shaderSource, gl.VERTEX_SHADER);
  }
}

export class FragmentShader extends Shader {
  constructor(gl, shaderSource) {
    super(gl, shaderSource, gl.FRAGMENT_SHADER);
  }
}
