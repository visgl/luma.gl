/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements */


const VERTEX_SHADER = `
attribute vec3 position;
attribute vec2 texCoord1;
varying vec2 vTexCoord1;

void main(void) {
  vTexCoord1 = texCoord1;
  gl_Position = vec4(position.x * 2., position.y * 2., 0, 1);
}
`;

const FRAGMENT_SHADER = `
#ifdef GL_ES
precision highp float;
#endif
#define SITE_MAX 50
varying vec2 vTexCoord1;
uniform int numberSites;
uniform float p;
uniform float width;
uniform float height;
uniform bool weighted;
uniform vec3 sites[SITE_MAX];
uniform float ws[SITE_MAX];
uniform vec3 siteColors[SITE_MAX];
uniform mat4 modelMat;
#define R 200.0
#define PI 3.1415926535897

vec4 sample(float x0, float y0) {
  float minDist = -1., dist;
  vec4 color;
  float x = (x0 - width * 0.5) / R, y = (y0 - height * 0.5) / R, z = 1.0 - x * x - y * y;
  if (z < 0.) {
    color = vec4(0,0,0,1);
  } else {
    z = sqrt(z);
    vec3 v = vec3(x, y, z);
    float il = clamp(dot(v, vec3(1,1,2)) / sqrt(6.) * 0.7 + dot(v, vec3(0,0,1)) * 0.03, 0., 1.) + 0.3;
    color = vec4(il, il, il, 1.0);
    for (int i = 0; i < SITE_MAX; i++) {
      if (i < numberSites) {
        vec3 vs = (modelMat * vec4(sites[i], 1)).xyz;
        float w = weighted ? abs(ws[i]) : 1.;
        if (z > 0.) {
          float d = dot(vs,v);
          float dist = acos(d) / PI * 180.;
          if (dist < 1.) {
            il = 1.;
            color = vec4(il, il, il,1);
            break;
          } else if (minDist < 0. || minDist > dist / w) {
            color = vec4(siteColors[i] * il, 1.0);
            minDist = dist / w;
          }
        }
      } else {
        break;
      }
    }
  }
  return color;
}
void main(void) {
  float x = vTexCoord1.x * width, y = vTexCoord1.y * height;
  gl_FragColor = sample(x, y);
}
`;

window.webGLStart = function() {
  const createGLContext = LumaGL.createGLContext;
  const IcoSphere = LumaGL.IcoSphere;
  const Program = LumaGL.Program;
  const Buffer = LumaGL.Buffer;
  const PerspectiveCamera = LumaGL.PerspectiveCamera;
  const Framebuffer = LumaGL.Framebuffer;
  const Media = LumaGL.Media;
  const Mat4 = LumaGL.Mat4;
  const Vec3 = LumaGL.Vec3;
  const Fx = LumaGL.Fx;
  const addEvents = LumaGL.addEvents;

  const numSites = 1;
  const sites = [0, 0, 1];
  const siteColors = [0.5, 0.5, 0.7];
  const width = 800;
  const height = 600;
  const R = 200;
  const weight = [1];
  const dragStart = [];
  const matStart = null;
  const mat = new Mat4();
  const imat = mat.clone();
  const weighted = false;

  // const vs = [];
  // const fullscreen = false;

  mat.id();
  imat.id();

  function toggleFullscreen() {
    document.body.classList.toggle('fullscreen');
    resize();
  }

  function toggleWeighted() {
    weighted = !weighted;
    update();
  }

  window.toggleFullscreen = toggleFullscreen;
  window.toggleWeighted = toggleWeighted;

  function resize() {
    var canvas = document.getElementById('voronoi');
    var style = window.getComputedStyle(canvas);
    canvas.height = parseFloat(style.getPropertyValue('height'));
    canvas.width = parseFloat(style.getPropertyValue('width'));
    update();
  }

  window.addEventListener('resize', resize);
  resize();

  function calcXYZ(e) {
    var x = e.x / R;
    var y = e.y / R;
    var z = 1.0 - x * x - y * y;

    if (z < 0) {
      while (z < 0) {
        x *= Math.exp(z);
        y *= Math.exp(z);
        z = 1.0 - x * x - y * y;
      }
      z = -Math.sqrt(z);
    } else {
      z = Math.sqrt(z);
    }
    var v3 = new Vec3(x, y, z, 1);
    imat.$mulVec3(v3);
    return v3;
  }

  var canvas = document.getElementById('voronoi');
  var gl = createGLContext({canvas});

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  var program = new Program(gl, {
    id: 'voronoi',
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER
  });

  addEvents(canvas, {
    cachePosition: false,
    onDragStart(e) {
      matStart = mat.clone();
      dragStart = [e.x, e.y];
    },
    onMouseWheel(e) {
      var id = new Mat4();
      id.id();
      id.$rotateAxis(('wheelDeltaX' in e.event ? e.event.wheelDeltaX : 0) / 5 / R, [0, 1, 0])
        .$rotateAxis(('wheelDeltaY' in e.event ? e.event.wheelDeltaY : e.wheel * 120) / 5 / R, [1, 0, 0]);
      mat = id.mulMat4(mat);
      imat = mat.invert();
      var v3 = calcXYZ(e);
      sites[0] = v3[0];
      sites[1] = v3[1];
      sites[2] = v3[2];
      update();
      e.event.preventDefault();
      e.event.stopPropagation();
    },
    onDragMove(e) {
      var id = new Mat4();
      id.id();
      id.$rotateAxis((e.x - dragStart[0]) / R, [0, 1, 0])
        .$rotateAxis((e.y - dragStart[1]) / R, [-1, 0, 0]);
      mat = id.mulMat4(matStart);
      imat = mat.invert();
      var v3 = calcXYZ(e);
      sites[0] = v3[0];
      sites[1] = v3[1];
      sites[2] = v3[2];
      update();
    },
    onDragEnd(e) {
      var id = new Mat4();
      id.id();
      id.$rotateAxis((e.x - dragStart[0]) / R, [0, 1, 0])
        .$rotateAxis((e.y - dragStart[1]) / R, [-1, 0, 0]);
      mat = id.mulMat4(matStart);
      imat = mat.invert();
      var v3 = calcXYZ(e);
      sites[0] = v3[0];
      sites[1] = v3[1];
      sites[2] = v3[2];
      update();
    },
    onMouseMove(e) {
      var v3 = calcXYZ(e);
      sites[0] = v3[0];
      sites[1] = v3[1];
      sites[2] = v3[2];
      update();
    },
    onClick(e) {
      var v3 = calcXYZ(e);
      sites.push(v3[0], v3[1], v3[2]);
      siteColors.push(Math.random(), Math.random(), Math.random());
      weight.push(Math.random() * 2 + 1);
      numSites++;
      update();
    }
  });

  function update() {
    draw();
  }

  function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    Media.Image.postProcess({
      program,
      width: width,
      height: height,
      toScreen: true,
      uniforms: {
        numberSites: numSites,
        sites: sites,
        ws: weight,
        siteColors: siteColors,
        p: 2,
        modelMat: mat,
        weighted: weighted,
        width: width,
        height: height,
        R: R
      }
    });
  }

  update();
};
