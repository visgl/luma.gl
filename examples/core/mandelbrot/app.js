/* global document */
import {AnimationLoop, ClipSpaceQuad} from 'luma.gl';

// CONTEXT 1 - 32 bit mandelbrot

const MANDELBROT_FRAGMENT_SHADER = `\
#define SHADER_NAME mandelbrot32

#ifdef GL_ES
precision highp float;
#endif

// Based on a renderman shader by Michael Rivero
const int maxIterations = 1;
varying vec2 coordinate;
void main (void)
{
  vec2 pos = coordinate;
  float real = pos.x;
  float imag = pos.y;
  float Creal = real;
  float Cimag = imag;

  int divergeIteration = 0;
  for (int i = 0; i < 100; i++)
  {
    // z = z^2 + c
    float tempreal = real;
    float tempimag = imag;
    real = (tempreal * tempreal) - (tempimag * tempimag);
    imag = 2. * tempreal * tempimag;
    real += Creal;
    imag += Cimag;
    float r2 = (real * real) + (imag * imag);
    if (divergeIteration == 0 && r2 >= 4.) {
      divergeIteration = i;
    }
  }
  // Base the color on the number of iterations
  vec4 color;
  // if (divergeIteration < 9) {
  //   color = vec4 (0., 0., 0., 1.0); // black
  // }
  // else
  {
    float tmpval = fract((float(divergeIteration) / 100.));
    color = vec4 (tmpval, 0, tmpval, 1.0);
    // color = vec4 (coordinate.r, coordinate.g, 0., 1.0);
  }
  gl_FragColor = color;
}
`;

let centerOffsetX = 0;
let centerOffsetY = 0;
let zoom = 1;
const zoomThreshold = 1e5;
const zoomCenterX = -0.0150086889504513;
const zoomCenterY = 0.78186693904085048;

const animationLoop = new AnimationLoop({
  // onCreateContext: () => createGLContext({canvas: 'canvas-1'}),
  onInitialize: ({gl}) => {
    addControls();
    return {
      clipSpaceQuad: new ClipSpaceQuad({gl, fs: MANDELBROT_FRAGMENT_SHADER})
    };
  },
  onRender: ({gl, canvas, tick, clipSpaceQuad}) => {
    canvas.width = canvas.clientWidth;
    canvas.style.height = `${canvas.width}px`;
    canvas.height = canvas.width;
    gl.viewport(0, 0, canvas.width, canvas.height);

    const baseCorners = [
      [-2.2, -1.2],
      [0.7, -1.2],
      [-2.2, 1.2],
      [0.7, 1.2]
    ];

    zoom *= 1.01;
    if (zoom > zoomThreshold) {
      zoom = 1;
    }

    // const div = document.getElementById('zoom');
    // div.innerHTML = `Zoom ${zoom.toPrecision(2)}`;

    const corners = [];
    for (const corner of baseCorners) {
      corners.push(
        corner[0] / zoom + centerOffsetX,
        corner[1] / zoom + centerOffsetY
      );
    }

    if (centerOffsetX !== zoomCenterX) {
      centerOffsetX += (zoomCenterX - centerOffsetX) / 20;
    }
    if (centerOffsetY !== zoomCenterY) {
      centerOffsetY += (zoomCenterY - centerOffsetY) / 20;
    }

    clipSpaceQuad
      .setAttributes({
        aCoordinate: {value: new Float32Array(corners), size: 2}
      })
      .render();
  }
});

function addControls() {
  const controlPanel = document.querySelector('.control-panel');
  if (controlPanel) {
    controlPanel.innerHTML = `
  <p>
  <code>Mandelbrot</code> set zoom implemented as a GLSL fragment shader.
  <p>
  Uses a luma.gl <code>ClipSpaceQuad</code> to set up a screen spaced model
  in which the <code>fragment shader</code> can render.
    `;
  }
}

export default animationLoop;

/* global window */
if (typeof window !== 'undefined') {
  window.animationLoop = animationLoop;
}
