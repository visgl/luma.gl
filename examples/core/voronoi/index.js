/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements */

window.webGLStart = function() {
  const createGLContext = LumaGL.createGLContext;
  const getShadersFromHTML = LumaGL.addons.getShadersFromHTML;
  const IcoSphere = LumaGL.IcoSphere;
  const Program = LumaGL.Program;
  const Buffer = LumaGL.Buffer;
  const PerspectiveCamera = LumaGL.PerspectiveCamera;
  const Framebuffer = LumaGL.Framebuffer;
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
    this.app && this.app.update();
  }

  window.toggleFullscreen = toggleFullscreen;
  window.toggleWeighted = toggleWeighted;

  function resize() {
    var canvas = document.getElementById('voronoi');
    var style = window.getComputedStyle(canvas);
    canvas.height = parseFloat(style.getPropertyValue('height'));
    canvas.width = parseFloat(style.getPropertyValue('width'));
    this.app && this.app.update();
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

  var canvas = document.getElementById();
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
    from: 'uris',
    vs: 'sph-shader.vs.glsl',
    fs: 'sph-shader.fs.glsl'
  });

  addEvents(canvas, {
    cachePosition: false,
    onDragStart: function(e) {
      matStart = mat.clone();
      dragStart = [e.x, e.y];
    },
    onMouseWheel: function(e) {
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
      this.update();
      e.event.preventDefault();
      e.event.stopPropagation();
    },
    onDragMove: function(e) {
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
      this.update();
    },
    onDragEnd: function (e) {
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
      this.update();
    },
    onMouseMove: function (e) {
      var v3 = calcXYZ(e);
      sites[0] = v3[0];
      sites[1] = v3[1];
      sites[2] = v3[2];
      this.update();
    },
    onClick: function (e) {
      var v3 = calcXYZ(e);
      sites.push(v3[0], v3[1], v3[2]);
      siteColors.push(Math.random(), Math.random(), Math.random());
      weight.push(Math.random() * 2 + 1);
      numSites++;
      this.update();
    }
  });

  function onLoad(app) {
    app.update = function () {
      draw();
    }

    function draw() {
      gl.clearColor(0, 0, 0, 1);
      gl.clearDepth(1);
      gl.viewport(0, 0, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      Media.Image.postProcess({
        program: 'voronoi',
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

    app.update();
  });
};
