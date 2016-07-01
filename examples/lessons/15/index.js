/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements */
function $id(d) {
  return document.getElementById(d);
}

window.webGLStart = function() {
  var createGLContext = LumaGL.createGLContext;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Scene = LumaGL.Scene;
  var Fx = LumaGL.Fx;
  var Vec3 = LumaGL.Vec3;
  var Sphere = LumaGL.Sphere;
  var loadTextures = LumaGL.loadTextures;
  var loadProgram = LumaGL.loadProgram;

  var canvas = document.getElementById('lesson15-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext({canvas});

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.viewport(0, 0, Number(canvas.width), Number(canvas.height));

  var camera = new PerspectiveCamera({
    aspect: canvas.width / canvas.height,
    position: new Vec3(0, 0, -6)
  });

  Promise.all([
    loadProgram(gl, {
      vs: '../../../shaderlib/spec-map.vs.glsl',
      fs: '../../../shaderlib/spec-map.fs.glsl'
    }),
    loadTextures(gl, {
      urls: ['earth.jpg', 'earth-specular.gif'],
      parameters: [{
        magFilter: gl.LINEAR,
        minFilter: gl.LINEAR_MIPMAP_NEAREST,
        generateMipmap: true
      }, {
        magFilter: gl.LINEAR,
        minFilter: gl.LINEAR_MIPMAP_NEAREST,
        generateMipmap: true
      }]
    })
  ])
  .then(function(results) {

    var program = results[0];
    var tDiffuse = results[1][0];
    var tSpecular = results[1][1];

    var earth = new Sphere({
      nlat: 30,
      nlong: 30,
      radius: 2,
      uniforms: {
        shininess: 32
      },
      textures: [tDiffuse, tSpecular],
      colors: [1, 1, 1, 1]
    });

    program.use();
    var scene = new Scene(gl, program, camera);
    var specularMap = $id('specular-map');
    const colorMap = $id('color-map');
    // get light config from forms
    const lighting = $id('lighting');
    const ambient = {
      r: $id('ambientR'),
      g: $id('ambientG'),
      b: $id('ambientB')
    };
    const point = {
      x: $id('lightPositionX'),
      y: $id('lightPositionY'),
      z: $id('lightPositionZ'),

      sr: $id('specularR'),
      sg: $id('specularG'),
      sb: $id('specularB'),

      dr: $id('diffuseR'),
      dg: $id('diffuseG'),
      db: $id('diffuseB')
    };
    // object rotation
    var theta = 0;

    // onBeforeRender
    earth.onBeforeRender = function(program, camera) {
      program.setUniforms({
        enableSpecularMap: specularMap.checked,
        enableColorMap: colorMap.checked
      });
    };

    // Add objects to the scene
    scene.add(earth);

    // Draw the scene
    function draw() {
      // Setup lighting
      var lights = scene.config.lights;
      lights.enable = lighting.checked;
      lights.ambient = {
        r: Number(ambient.r.value),
        g: Number(ambient.g.value),
        b: Number(ambient.b.value)
      };
      lights.points = {
        diffuse: {
          r: Number(point.dr.value),
          g: Number(point.dg.value),
          b: Number(point.db.value)
        },
        specular: {
          r: Number(point.sr.value),
          g: Number(point.sg.value),
          b: Number(point.sb.value)
        },
        position: {
          x: Number(point.x.value),
          y: Number(point.y.value),
          z: Number(point.z.value)
        }
      };

      // Update position
      theta += 0.01;
      earth.setRotation(new Vec3(Math.PI, theta, 0.1));
      earth.updateMatrix();

      // render objects
      scene.render({camera});

      // request new frame
      Fx.requestAnimationFrame(draw);
    }

    // Animate
    draw();
  });
};
