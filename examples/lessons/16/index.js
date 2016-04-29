/* global LumaGL, document */
var webGLStart = function() {

  var createGLContext = LumaGL.createGLContext;
  var loadTextures = LumaGL.loadTextures;
  var makeProgramFromShaderURIs = LumaGL.addons.makeProgramFromShaderURIs;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Scene = LumaGL.Scene;
  var Fx = LumaGL.Fx;
  var Vec3 = LumaGL.Vec3;
  var Sphere = LumaGL.Sphere;
  var Cube = LumaGL.Cube;
  var IO = LumaGL.IO;
  var Model = LumaGL.Model;
  var Framebuffer = LumaGL.Framebuffer;

  new IO.XHR({
    url: 'macbook.json',
    onError: function() {
      alert('Unable to load macbook model');
    },
    onSuccess: function(jsonString) {
      var json = JSON.parse(jsonString);
      json.shininess = 5;
      json.uniforms = {
        'enableSpecularHighlights': true,
        'materialAmbientColor': [1, 1, 1],
        'materialDiffuseColor': [1, 1, 1],
        'materialSpecularColor': [1.5, 1.5, 1.5],
        'materialEmissiveColor': [0, 0, 0]
      };
      createApp(json);
    }
  }).send();

  var canvas = document.getElementById('lesson16-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext(canvas);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  var outerCamera = new PerspectiveCamera({
    aspect: canvas.width / canvas.height,
    position: new Vec3(0, 0, -3)
  });

  function createApp(macbookJSON) {

    Promise.all([

      makeProgramFromShaderURIs(gl,
        'render-tex.vs.glsl',
        'render-tex.fs.glsl',
        {path: '../../../shaders/'}
      ),

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

    ]).then(function(results) {

      var program = results[0];

      var tMoon = results[1][0];
      var tCrate = results[1][1];

      var screenWidth = 512,
          screenHeight = 512,
          screenRatio = 1.66;

      var models = {};

      models.moon = new Sphere({
        nlat: 30,
        nlong: 30,
        radius: 2,
        textures: tMoon,
        uniforms: {
          shininess: 5,
          'enableSpecularHighlights': false,
          'materialAmbientColor': [1, 1, 1],
          'materialDiffuseColor': [1, 1, 1],
          'materialSpecularColor': [0, 0, 0],
          'materialEmissiveColor': [0, 0, 0]
        }
      });

      models.box = new Cube({
        textures: tCrate,
        uniforms: {
          shininess: 5,
          'enableSpecularHighlights': false,
          'materialAmbientColor': [1, 1, 1],
          'materialDiffuseColor': [1, 1, 1],
          'materialSpecularColor': [0, 0, 0],
          'materialEmissiveColor': [0, 0, 0]
        }
      });
      models.box.scale.set(2, 2, 2);

      models.macbookscreen = new Model({
        normals: [
          0, -0.965926, 0.258819,
          0, -0.965926, 0.258819,
          0, -0.965926, 0.258819,
          0, -0.965926, 0.258819
        ],
        vertices: [
          0.580687, 0.659, 0.813106,
          -0.580687, 0.659, 0.813107,
          0.580687, 0.472, 0.113121,
          -0.580687, 0.472, 0.113121
        ],
        texCoords: [
          1.0, 1.0,
          0.0, 1.0,
          1.0, 0.0,
          0.0, 0.0
        ],
        drawMode: 'TRIANGLE_STRIP',
        uniforms: {
          shininess: 0.2,
          'enableSpecularHighlights': false,
          'materialAmbientColor': [0, 0, 0],
          'materialDiffuseColor': [0, 0, 0],
          'materialSpecularColor': [0.5, 0.5, 0.5],
          'materialEmissiveColor': [1.5, 1.5, 1.5]
        }
      });

      program.use();

      models.macbook = new Model(macbookJSON);

      var outerScene = new Scene(gl, program, outerCamera, {
        lights: {
          enable: true,
          points: {
            position: {
              x: 1, y: 2, z: -1
            },
            diffuse: {
              r: 0.8, g: 0.8, b: 0.8
            },
            specular: {
              r: 0.8, g: 0.8, b: 0.8
            }
          }
        }
      });

      var innerCamera = new PerspectiveCamera({
          fov: 45,
          aspect: screenRatio,
          near: 0.1,
          far: 100,
          position: new Vec3(0, 0, -17)
        }),
        innerScene = new Scene(gl, program, innerCamera, {
          lights: {
            enable: true,
            points: {
              position: {
                x: -1, y: 2, z: -1
              },
              diffuse: {
                r: 0.8, g: 0.8, b: 0.8
              },
              specular: {
                r: 0.8, g: 0.8, b: 0.8
              }
            }
          }
        }),
        rho = 4,
        theta = 0,
        laptopTheta = Math.PI,
        // models
        macbook = models.macbook,
        macbookscreen = models.macbookscreen,
        box = models.box,
        moon = models.moon;

      // create framebuffer
      var fb = new Framebuffer(gl, {
        width: screenWidth,
        height: screenHeight,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
      });

      models.macbookscreen.textures = fb.texture;

      // Add objects to different scenes
      outerScene.add(macbook, macbookscreen);
      innerScene.add(moon, box);

      outerCamera.update();
      innerCamera.update();

      outerCamera.view.$translate(0, -0.5, 0);

      function drawInnerScene() {
        theta += 0.04;

        moon.position = {
          x: rho * Math.cos(theta),
          y: 0,
          z: rho * Math.sin(theta)
        };
        moon.update();

        box.position = {
          x: rho * Math.cos(Math.PI + theta),
          y: 0,
          z: rho * Math.sin(Math.PI + theta)
        };
        box.update();

        gl.viewport(0, 0, screenWidth, screenHeight);

        fb.bind();
        innerScene.render();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }

      function drawOuterScene() {
        gl.viewport(0, 0, canvas.width, canvas.height);

        laptopTheta += 0.005;

        var phi = Math.sin(laptopTheta) * 1.77 + Math.PI;

        macbook.rotation.set(-Math.PI / 2, phi, 0);
        macbook.update();

        macbookscreen.rotation.set(-Math.PI / 2, phi, 0);
        macbookscreen.update();

        outerScene.render();
      }

      function draw() {
        drawInnerScene();
        drawOuterScene();
        Fx.requestAnimationFrame(draw);
      }

      // Animate
      draw();
    });
  }
};
