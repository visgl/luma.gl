import formatCompilerError from 'gl-format-compiler-error';

// For now this is an internal class
export class Shader {

  constructor(gl, shaderSource, shaderType) {
    this.gl = gl;
    this.handle = gl.createShader(shaderType);
    if (this.handle === null) {
      throw new Error(`Error creating shader with type ${shaderType}`);
    }
    gl.shaderSource(this.handle, shaderSource);
    gl.compileShader(this.handle);
    var compiled = gl.getShaderParameter(this.handle, gl.COMPILE_STATUS);
    if (!compiled) {
      var info = gl.getShaderInfoLog(this.handle);
      gl.deleteShader(this.handle);
      /* eslint-disable no-try-catch */
      var formattedLog;
      try {
        formattedLog = formatCompilerError(info, shaderSource, shaderType);
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
