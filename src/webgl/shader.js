import {GL} from './webgl';
import formatCompilerError from './webgl-format-glsl-error';
import getShaderName from 'glsl-shader-name';
import {log, uid, isBrowser} from '../utils';

// For now this is an internal class
export class Shader {

  /* eslint-disable max-statements */
  constructor(gl, shaderSource, shaderType) {
    this.id = getShaderName(shaderSource) || uid(this.getTypeName(shaderType));
    this.gl = gl;
    this.shaderType = shaderType;
    this.source = shaderSource;
    this.handle = gl.createShader(shaderType);
    if (this.handle === null) {
      throw new Error(`Error creating shader with type ${shaderType}`);
    }
    this.compile();
  }

  delete() {
    const {gl} = this;
    if (this.handle) {
      gl.deleteShader(this.handle);
      this.handle = null;
    }
  }

  getName() {
    return getShaderName(this.source);
  }

  getTypeName(shaderType) {
    switch (shaderType) {
    case GL.VERTEX_SHADER: return 'vertex-shader';
    case GL.FRAGMENT_SHADER: return 'fragment-shader';
    default: return 'shader';
    }
  }

  compile() {
    const {gl} = this;
    gl.shaderSource(this.handle, this.source);
    gl.compileShader(this.handle);
    const compiled = gl.getShaderParameter(this.handle, GL.COMPILE_STATUS);
    if (!compiled) {
      const infoLog = gl.getShaderInfoLog(this.handle);
      const error = formatCompilerError(infoLog, this.source, this.shaderType);

      if (log.priority > 0) {
        this.copyToClipboard(this.source);
      }

      this.delete();

      throw new Error(`Error while compiling the shader ${error}`);
    }
  }
  /* eslint-enable max-statements */

  // TODO - move to debug utils?
  copyToClipboard(text) {
    if (isBrowser) {
      /* global document */
      const input = document.createElement('textarea');
      document.body.appendChild(input);
      input.value = text;
      input.focus();
      input.select();
      if (!document.execCommand('copy')) {
        /* eslint-disable no-console */
        /* global console */
        console.log('Failed to copy to clipboard');
      }
      input.remove();
    }
  }
}

export class VertexShader extends Shader {
  constructor(gl, source) {
    super(gl, source, GL.VERTEX_SHADER);
  }
}

export class FragmentShader extends Shader {
  constructor(gl, source) {
    super(gl, source, GL.FRAGMENT_SHADER);
  }
}
