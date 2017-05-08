const {GL, AnimationLoop, createGLContext, Cube, Matrix4, radians} = LumaGL;

// length given a 45 fov angle, and 0.2 distance to camera
const length = 0.16568542494923805;
const camera = new PerspectiveCamera({
  fov: 45,
  aspect: 1,
  near: 0.1,
  far: 500,
  position: [0, 0, 0.2]
});

// post process an image by setting it to a texture with a specified fragment
// and vertex shader.
export function postProcessImage({
  program,
  fromTexture,
  toFrameBuffer,
  toScreen,
  width,
  height,
  x = 0,
  y = 0,
  aspectRatio,
  uniforms = {}
} = {}) {
  aspectRatio = aspectRatio || Math.max(height / width, width / height);

  var textures = fromTexture ? [fromTexture] : [];

  const plane = new Plane({
    program,
    type: 'x,y',
    xlen: length,
    ylen: length,
    offset: 0
  });
  plane.textures = textures;
  plane.program = program;

  camera.aspect = aspectRatio;
  camera.update();

  const scene = new Scene(app, program, camera);
  scene.program = program;

  if (!scene.models.length) {
    scene.add(plane);
  }

  var fbo = framebuffer || new FrameBuffer({
    width,
    height,
    bindToTexture: {
      [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
      [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
      generateMipmap: false
    },
    bindToRenderBuffer: false
  });

  fbo.bind();
  gl.viewport(x, y, width, height);
  gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
  program.setUniforms(uniforms);
  scene.renderToTexture(framebuffer);
  app.setFrameBuffer(framebuffer, false);

  if (screen) {
    program.use();
    gl.viewport(x, y, width, height);
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    program.setUniforms(uniforms);
    scene.render();
  }

  return this;
}

const VERTEX_SHADER = `\
attribute vec3 position;
attribute vec2 texCoord1;

uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;

varying   vec2 pixel;
void main(void) {
   gl_Position = projectionMatrix * worldMatrix * vec4(position, 1.);
   pixel = texCoord1;
}
`;

const FRAGMENT_SHADER_ADVANCE = `\
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler1;//sampler_prev;

varying vec2 pixel;
uniform vec2 mouse;

bool is_onscreen(vec2 uv){
  return (uv.x < 1.) && (uv.x > 0.) && (uv.y < 1.) && (uv.y > 0.);
}

void main(void) {
  vec2 c = vec2(-0.25, 0.0) + (mouse.yx-0.5)*vec2(0.2,-0.55);
  vec2 tuning =  vec2(1.8) - (mouse.y-0.5)*0.3;
  vec2 complexSquaredPlusC; // One steps towards the Julia Attractor
  vec2 uv = (pixel - vec2(0.5))*tuning;
  complexSquaredPlusC.x = (uv.x * uv.x - uv.y * uv.y + c.x + 0.5);
  complexSquaredPlusC.y = (2. * uv.x * uv.y + c.y + 0.5);

  if (is_onscreen(complexSquaredPlusC)) {
    vec4 old = texture2D(sampler1, complexSquaredPlusC);
    gl_FragColor = old + vec4( .004, .008, .012, 1.); // increment to white
  } else {
    // return border color
    gl_FragColor = vec4(0., 0., 0., 1.); // out is black
  }
  gl_FragColor.a = 1.;
}
`;

const FRAGMENT_SHADER_COMPOSITE = `\
#ifdef GL_ES
precision highp float;
#endif

  uniform sampler2D sampler1;//sampler_prev;

  varying vec2 pixel;
  uniform vec2 mouse;

void main(void) {
  // negative
  gl_FragColor = texture2D(sampler1, pixel);
  gl_FragColor.a = 1.;
}
`;

let browserSize;
let halted = false;
let mouseX = 0.5;
let mouseY = 0.5;
let sizeX = 512;
let sizeY = 512;
let viewX = 900;
let viewY = 550;
let c;

new AnimationLoop()
.context(() => createGLContext())
.init((canvas) => {
  addEvents(canvas, {
    centerOrigin: false,
    onMouseMove(e) {
      mouseX = e.x / viewX;
      mouseY = 1 - e.y / viewY;
    },
    onTouchStart(e) {
      e.stop();
    },
    onTouchMove(e) {
      var evt = e.event;
      if (evt.preventDefault) evt.preventDefault();
      if (evt.stopPropagation) evt.stopPropagation();

      e.stop();
      mouseX = e.x / viewX;
      mouseY = 1 - e.y / viewY;
    },
    onTouchEnd(e) {
      e.stop();
    },
    onClick(e) {
      halted = !halted;
    }
  });

  const advanceProgram = new Program({
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER_ADVANCE
  });
  const compositeProgram = new Program({
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER_COMPOSITE
  });

  const main = new Framebuffer({
    width: sizeX,
    height: sizeY,
    bindToTexture: {
      parameters: [{
        name: GL.TEXTURE_MAG_FILTER,
        value: GL.LINEAR
      }, {
        name: GL.TEXTURE_MIN_FILTER,
        value: GL.LINEAR,
        generateMipmap: false
      }]
    },
    bindToRenderBuffer: false
  });
  const main2 = new Framebuffer({
    width: sizeX,
    height: sizeY,
    bindToTexture: {
      parameters: [{
        name: GL.TEXTURE_MAG_FILTER,
        value: GL.LINEAR
      }, {
        name: GL.TEXTURE_MIN_FILTER,
        value: GL.LINEAR,
        generateMipmap: false
      }]
    },
    bindToRenderBuffer: false
  });
})
.frame(() => {
  const uniforms = {
    time: Date.now(),
    mouse: [mouseX, mouseY]
  };

  postProcess(advanceProgram, {
    width: sizeX,
    height: sizeY,
    fromTexture: main.texture,
    toFrameBuffer: main2,
    uniforms
  });
  postProcess(advanceProgram, {
    width: sizeX,
    height: sizeY,
    fromTexture: main2.texture,
    toFrameBuffer: main,
    uniforms
  });
  postProcess(advanceProgram, {
    width: sizeX,
    height: sizeY,
    fromTexture: main.texture,
    toFrameBuffer: main2,
    uniforms
  })
  postProcess(advanceProgram, {
    width: sizeX,
    height: sizeY,
    fromTexture: main2.texture,
    toFrameBuffer: main,
    uniforms
  })
  postProcess(compositeProgram, {
    width: viewX,
    height: viewY,
    fromTexture: main.texture,
    toScreen: true,
    uniforms
  });
});
