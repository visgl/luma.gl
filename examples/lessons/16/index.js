/* global LumaGL */
/* eslint-disable max-statements, indent, no-multi-spaces */
const {GL, AnimationLoop, createGLContext, loadImages, loadProgram} = LumaGL;
const {Sphere, Matrix4, Vec3, PerspectiveCamera} = LumaGL;

var createGLContext = LumaGL.createGLContext;
var Geometry = LumaGL.Geometry;
var PerspectiveCamera = LumaGL.PerspectiveCamera;
var Scene = LumaGL.Scene;
var Fx = LumaGL.Fx;
var Vec3 = LumaGL.Vec3;
var Sphere = LumaGL.Sphere;
var Cube = LumaGL.Cube;
var Model = LumaGL.Model;
var Framebuffer = LumaGL.Framebuffer;
var loadFiles = LumaGL.loadFiles;
var loadTextures = LumaGL.loadTextures;
var loadProgram = LumaGL.loadProgram;
var parseModel = LumaGL.parseModel;

export const animation = new AnimationLoop()
.context(() => createGLContext({canvas: 'lesson16-canvas'}))
.init(({gl}) => {
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);


  function createApp(macbookJSON) {

    Promise.all([
      loadProgram(gl, {
        vs: '../../../src/shaderlib/render-tex.vs.glsl',
        fs: '../../../src/shaderlib/render-tex.fs.glsl'
      }),
      loadTextures(gl, {
        urls: ['moon.gif', 'crate.gif'],
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
      var tMoon = results[1][0];
      var tCrate = results[1][1];

      var screenWidth = 512;
      var screenHeight = 512;
      var screenRatio = 1.66;

      var moon = new Sphere({
        nlat: 30,
        nlong: 30,
        radius: 2,
        program,
        uniforms: {
          hasTexture1: true,
          sampler1: tMoon,
          shininess: 5,
          enableSpecularHighlights: false,
          materialAmbientColor: [1, 1, 1],
          materialDiffuseColor: [1, 1, 1],
          materialSpecularColor: [0, 0, 0],
          materialEmissiveColor: [0, 0, 0]
        }
      });


      const innerCamera = new PerspectiveCamera({
        fov: 45,
        aspect: screenRatio,
        near: 0.1,
        far: 100,
        position: new Vec3(0, 0, -17)
      });

      const innerScene = new Scene(gl, {
        lights: {
          enable: true,
          points: {
            position: {x: -1, y: 2, z: -1},
            diffuse: {r: 0.8, g: 0.8, b: 0.8},
            specular: {r: 0.8, g: 0.8, b: 0.8}
          }
        }
      });

      const rho = 4;
      const theta = 0;
      const laptopTheta = Math.PI;

      // create framebuffer
      const fb = new Framebuffer(gl, {
        width: screenWidth,
        height: screenHeight,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR
      });

      macbookscreen.textures = fb.texture;

      // Add objects to different scenes
      outerScene.add(macbook, macbookscreen);
      innerScene.add(moon, box);

      outerCamera.update();
      innerCamera.update();

      outerCamera.view.$translate(0, -0.5, 0);

.frame(() => {
  drawInnerScene();
  drawOuterScene();
})
.finalize(() => {
});



function setupInnerScene(gl) {
  return Promise.all([
    loadTexture(gl, {
      url: 'moon.gif',
      [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
      [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    }),

    loadTexture({
      url: 'crate.gif',
      [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
      [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    })
  ])
  .then([tMoon, tCrate] => {
    const moon = new Sphere({
      nlat: 30,
      nlong: 30,
      radius: 2,
      program,
      uniforms: {
        hasTexture1: true,
        sampler1: tMoon,
        shininess: 5,
        enableSpecularHighlights: false,
        materialAmbientColor: [1, 1, 1],
        materialDiffuseColor: [1, 1, 1],
        materialSpecularColor: [0, 0, 0],
        materialEmissiveColor: [0, 0, 0]
      }
    });

    const box = new Cube({
      program,
      uniforms: {
        hasTexture1: true,
        sampler1: tCrate,
        shininess: 5,
        enableSpecularHighlights: false,
        materialAmbientColor: [1, 1, 1],
        materialDiffuseColor: [1, 1, 1],
        materialSpecularColor: [0, 0, 0],
        materialEmissiveColor: [0, 0, 0]
      }
    });
    box.setScale(new Vec3(2, 2, 2));

    return new Group({children: [moon, box]});
  });
})

function drawInnerScene({gl, tick}) {
  const theta = tick * 0.04;

  moon
    .setPosition(new Vec3(
      rho * Math.cos(theta),
      0,
      rho * Math.sin(theta)
    ))
    .updateMatrix();

  box
    .setPosition(new Vec3(
      rho * Math.cos(Math.PI + theta),
      0,
      rho * Math.sin(Math.PI + theta)
    ))
    .updateMatrix();

  gl.viewport(0, 0, screenWidth, screenHeight);

  withState(gl, {
    framebuffer: fb,
    viewport: [0, 0, screenWidth, screenHeight]
  }, () => {
    innerScene.render({camera: innerCamera});
  });
}

function createOuterScene(gl) {
  return Promise.all([
    loadFiles({urls: ['macbook.json']})
    .catch(error => window.alert('Unable to load macbook model: ' + error)),

    loadProgram(gl, {
      vs: '../../../shaderlib/render-tex.vs.glsl',
      fs: '../../../shaderlib/render-tex.fs.glsl'
    }),
  ])
  .then([macbookJSON, program] => {
    const screenWidth = 512;
    const screenHeight = 512;
    const screenRatio = 1.66;

    var json = JSON.parse(macbookJSON);
    json.shininess = 5;
    json.uniforms = {
      'enableSpecularHighlights': true,
      'materialAmbientColor': [1, 1, 1],
      'materialDiffuseColor': [1, 1, 1],
      'materialSpecularColor': [1.5, 1.5, 1.5],
      'materialEmissiveColor': [0, 0, 0]
    };

    const macbookscreen = new Model({
      program,
      drawMode: GL.TRIANGLE_STRIP,
      vertexCount: 4,
      attributes: {
        normals: new Float32Array([
          0, -0.965926, 0.258819,
          0, -0.965926, 0.258819,
          0, -0.965926, 0.258819,
          0, -0.965926, 0.258819
        ]),
        vertices: new Float32Array([
          0.580687, 0.659, 0.813106,
          -0.580687, 0.659, 0.813107,
          0.580687, 0.472, 0.113121,
          -0.580687, 0.472, 0.113121
        ]),
        texCoords: new Float32Array([
          1.0, 1.0,
          0.0, 1.0,
          1.0, 0.0,
          0.0, 0.0
        ])
      }),
      uniforms: {
        shininess: 0.2,
        enableSpecularHighlights: false,
        materialAmbientColor: [0, 0, 0],
        materialDiffuseColor: [0, 0, 0],
        materialSpecularColor: [0.5, 0.5, 0.5],
        materialEmissiveColor: [1.5, 1.5, 1.5]
      }
    });

    const macbook = parseModel(gl, {file: macbookJSON, program});

    const outerScene = new Group({
      children: [macbook, macbookscreen],
      lights: {
        enable: true,
        points: {
          position: {x: 1, y: 2, z: -1},
          diffuse: {r: 0.8, g: 0.8, b: 0.8},
          specular: {r: 0.8, g: 0.8, b: 0.8}
        }
      }
    });
  })
}

function drawOuterScene() {
  gl.viewport(0, 0, canvas.width, canvas.height);

  laptopTheta += 0.005;

  var phi = Math.sin(laptopTheta) * 1.77 + Math.PI;

  macbook
    .setRotation(new Vec3(-Math.PI / 2, phi, 0))
    .updateMatrix();

  macbookscreen
    .setRotation(new Vec3(-Math.PI / 2, phi, 0))
    .updateMatrix();

  outerScene.render({camera: outerCamera});
}
