/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements */

var createGLContext = LumaGL.createGLContext;
var PerspectiveCamera = LumaGL.PerspectiveCamera;
var Scene = LumaGL.Scene;
var Fx = LumaGL.Fx;
var Vec3 = LumaGL.Vec3;
var Model = LumaGL.Model;
var loadFiles = LumaGL.loadFiles;
var loadTextures = LumaGL.loadTextures;
var loadProgram = LumaGL.loadProgram;
var parseModel = LumaGL.parseModel;

function $id(d) {
  return document.getElementById(d);
}

window.webGLStart = function() {

  // Get Model

  var canvas = document.getElementById('lesson14-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext({canvas});

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.viewport(0, 0, canvas.width, canvas.height);

  var camera = new PerspectiveCamera({
    aspect: canvas.width / canvas.height,
    position: new Vec3(0, 0, -50)
  });

  Promise.all([
    loadFiles({
      urls: ['Teapot.json']
    }),
    loadProgram(gl, {
      id: 'teapot-program',
      vs: '../../../shaderlib/frag-lighting.vs.glsl',
      fs: '../../../shaderlib/frag-lighting.fs.glsl',
      noCache: true
    }),
    loadTextures(gl, {
      urls: ['arroway.de_metal+structure+06_d100_flat.jpg', 'earth.jpg'],
      parameters: [{
        magFilter: gl.LINEAR,
        minFilter: gl.LINEAR_MIPMAP_NEAREST,
        wrapS: gl.REPEAT,
        wrapT: gl.REPEAT,
        generateMipmap: true
      }, {
        magFilter: gl.LINEAR,
        minFilter: gl.LINEAR_MIPMAP_NEAREST,
        wrapS: gl.REPEAT,
        wrapT: gl.REPEAT,
        generateMipmap: true
      }]
    })
  ])
  .then(function(results) {
    var teapotJSON = results[0][0];
    var program = results[1];
    var tGalvanized = results[2][0];
    var tEarth = results[2][1];

    var teapot = parseModel(gl, {
      id: 'teapot',
      file: teapotJSON,
      program,
      // attributes: {
      //   colors: [1, 1, 1, 1]
      // },
      uniforms: {
        hasTexture1: true,
        sampler1: tGalvanized
      }
    });

    var scene = new Scene(gl);
    var shininess = $id('shininess');
    // specular
    const specular = $id('specular');
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

    const texture = $id('texture');
    // object rotation
    var theta = 0;

    // Basic gl setup
    // Add objects to the scene
    scene.add(teapot);

    // Animate
    draw();

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
      // Set/Unset specular highlights
      if (!specular.checked) {
        delete lights.points.specular;
      }
      // Set shininess
      teapot.uniforms.shininess = Number(shininess.value);
      // Set texture
      if (texture.value === 'none') {
        delete teapot.textures;
      } else if (texture.value === 'galvanized') {
        teapot.textures = tGalvanized;
      } else {
        teapot.textures = tEarth;
      }

      // Update position
      theta += 0.01;
      teapot.update({
        rotation: new Vec3(theta / 100, theta, 0)
      });

      // render objects
      scene.render(camera.getUniforms());

      // request new frame
      Fx.requestAnimationFrame(draw);
    }
  });
};
