/* eslint-disable max-len, prefer-template, camelcase */
/* eslint-disable no-console */
import {setParameters} from '@luma.gl/core';
import {createTestContext} from '@luma.gl/test-utils';

// Utilities functions that to be moved to a common place for future tests

function glEnumToString(gl, value) {
  // Optimization for the most common enum:
  if (value === gl.NO_ERROR) {
    return 'NO_ERROR';
  }
  for (const p in gl) {
    if (gl[p] === value) {
      return p;
    }
  }
  return '0x' + value.toString(16);
}

function glErrorShouldBe(gl, glErrors, opt_msg) {
  if (!glErrors.length) {
    glErrors = [glErrors];
  }
  opt_msg = opt_msg || '';
  const err = gl.getError();
  const ndx = glErrors.indexOf(err);
  const errStrs = [];
  for (let ii = 0; ii < glErrors.length; ++ii) {
    errStrs.push(glEnumToString(gl, glErrors[ii]));
  }
  // const expected = errStrs.join(' or ');
  if (ndx < 0) {
    const msg = `getError expected${glErrors.length > 1 ? ' one of: ' : ': '}`;
    console.error('FAIL ' + msg);
  }
}

export function initializeGL(canvas) {
  const gl = createTestContext(canvas);
  setParameters(gl, {
    viewport: [0, 0, canvas.width, canvas.height]
  });
  setParameters(gl, {
    clearColor: [0, 0, 0, 1],
    clearDepth: 1
  });
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  return gl;
}

export function initializeTexTarget(gl) {
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  framebuffer.width = 10;
  framebuffer.height = 10;

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA32F,
    framebuffer.width,
    framebuffer.height,
    0,
    gl.RGBA,
    gl.FLOAT,
    null
  );

  const renderbuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
  gl.renderbufferStorage(
    gl.RENDERBUFFER,
    gl.DEPTH_COMPONENT16,
    framebuffer.width,
    framebuffer.height
  );
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
}

export function render(gl) {
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  glErrorShouldBe(gl, gl.NO_ERROR, 'no error from draw');
}

export function getGPUOutput(gl) {
  const width = gl.canvas.width;
  const height = gl.canvas.height;
  const buf = new Float32Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, buf);
  return buf;
}
