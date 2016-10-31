/* global LumaGL, document */
const {AnimationFrame, createGLContext, ClipSpaceQuad} = LumaGL;

// CONTEXT 0 - CONCENTRICS

const CONTEXT_0_FRAGMENT_SHADER = `\
#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;

varying vec2 position;

void main(void) {
  float d = length(position * 64.0);
  d = 0.5 * sin(d * sin(uTime)) + 0.5 * sin(position.x * 64.0) * sin(position.y * 64.0);
  gl_FragColor = vec4(1.0-d,0,d, 1);
}
`;

new AnimationFrame()
.context(() => createGLContext({canvas: 'canvas-0'}))
.init(({gl}) => ({
  clipSpaceQuad: new ClipSpaceQuad({gl, fs: CONTEXT_0_FRAGMENT_SHADER})
}))
.setupFrame(({gl, canvas}) => {
  canvas.width = canvas.clientWidth;
  canvas.style.height = `${canvas.width}px`;
  canvas.height = canvas.width;
  gl.viewport(0, 0, canvas.width, canvas.height);
})
.frame(({tick, clipSpaceQuad}) => {
  clipSpaceQuad.render({uTime: tick * 0.01});
});

// CONTEXT 1 - 32 bit mandelbrot

const CONTEXT_1_FRAGMENT_SHADER = `\
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

new AnimationFrame()
.context(() => createGLContext({canvas: 'canvas-1'}))
.init(({gl}) => ({
  clipSpaceQuad: new ClipSpaceQuad({gl, fs: CONTEXT_1_FRAGMENT_SHADER})
}))
.setupFrame(({gl, canvas}) => {
  canvas.width = canvas.clientWidth;
  canvas.style.height = `${canvas.width}px`;
  canvas.height = canvas.width;
  gl.viewport(0, 0, canvas.width, canvas.height);
})
.frame(({tick, clipSpaceQuad}) => {
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

  const div = document.getElementById('zoom');
  div.innerHTML = `Zoom ${zoom.toPrecision(2)}`;

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
});

/* SHADERTOY SMOOTH SHADER
<script id="shader-fs" type="x-shader/x-fragment">
  precision mediump float

  varying vec2 vPosition;

  void main(void) {
    float cx = vPosition.x;
    float cy = vPosition.y;

    float hue;
    float saturation;
    float value;
    float hueRound;
    int hueIndex;
    float f;
    float p;
    float q;
    float t;

    float x = 0.0;
    float y = 0.0;
    float tempX = 0.0;
    int i = 0;
    int runaway = 0;
    for (int i=0; i < 100; i++) {
      tempX = x * x - y * y + float(cx);
      y = 2.0 * x * y + float(cy);
      x = tempX;
      if (runaway == 0 && x * x + y * y > 100.0) {
        runaway = i;
      }
    }

    if (runaway != 0) {
      hue = float(runaway) / 200.0;
      saturation = 0.6;
      value = 1.0;

      hueRound = hue * 6.0;
      hueIndex = int(mod(float(int(hueRound)), 6.0));
      f = fract(hueRound);
      p = value * (1.0 - saturation);
      q = value * (1.0 - f * saturation);
      t = value * (1.0 - (1.0 - f) * saturation);

      if (hueIndex == 0)
        gl_FragColor = vec4(value, t, p, 1.0);
      else if (hueIndex == 1)
        gl_FragColor = vec4(q, value, p, 1.0);
      else if (hueIndex == 2)
        gl_FragColor = vec4(p, value, t, 1.0);
      else if (hueIndex == 3)
        gl_FragColor = vec4(p, q, value, 1.0);
      else if (hueIndex == 4)
        gl_FragColor = vec4(t, p, value, 1.0);
      else if (hueIndex == 5)
        gl_FragColor = vec4(value, p, q, 1.0);

    } else {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  }
</script>
*/
