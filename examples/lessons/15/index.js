var webGLStart = function() {
  var $id = function(d) { return document.getElementById(d); };

  var createGLContext = LumaGL.createGLContext;
  var loadTextures = LumaGL.loadTextures;
  var makeProgramFromShaderURIs = LumaGL.addons.makeProgramFromShaderURIs;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Scene = LumaGL.Scene;
  var Fx = LumaGL.Fx;
  var Vec3 = LumaGL.Vec3;
  var Sphere = LumaGL.Sphere;

  var canvas = document.getElementById('lesson15-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext(canvas);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.viewport(0, 0, +canvas.width, +canvas.height);

  var camera = new PerspectiveCamera({
    aspect: canvas.width/canvas.height,
    position: new Vec3(0, 0, -6),
  });

  Promise.all([

    makeProgramFromShaderURIs(gl, 'spec-map.vs.glsl', 'spec-map.fs.glsl', {
      path: '../../../shaders/'
    }),

    loadTextures(gl, {
      urls: ['earth.jpg', 'earth-specular.gif'],
      parameters: [{
        magFilter: gl.LINEAR,
        minFilter: gl.LINEAR_MIPMAP_NEAREST,
        generateMipmap: true
      },{
        magFilter: gl.LINEAR,
        minFilter: gl.LINEAR_MIPMAP_NEAREST,
        generateMipmap: true
      }]
    })

  ]).then(function(results) {

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
    var specularMap = $id('specular-map'),
        colorMap = $id('color-map'),
        //get light config from forms
        lighting = $id('lighting'),
        ambient = {
          r: $id('ambientR'),
          g: $id('ambientG'),
          b: $id('ambientB')
        },
        point = {
          x: $id('lightPositionX'),
          y: $id('lightPositionY'),
          z: $id('lightPositionZ'),

          sr: $id('specularR'),
          sg: $id('specularG'),
          sb: $id('specularB'),

          dr: $id('diffuseR'),
          dg: $id('diffuseG'),
          db: $id('diffuseB')
        },
        //object rotation
        theta = 0;

    //onBeforeRender
    earth.onBeforeRender = function(program, camera) {
      program.setUniform('enableSpecularMap', specularMap.checked);
      program.setUniform('enableColorMap', colorMap.checked);
    };

    //Add objects to the scene
    scene.add(earth);

    //Draw the scene
    function draw() {
      //Setup lighting
      var lights = scene.config.lights;
      lights.enable = lighting.checked;
      lights.ambient = {
        r: +ambient.r.value,
        g: +ambient.g.value,
        b: +ambient.b.value
      };
      lights.points = {
        diffuse: {
          r: +point.dr.value,
          g: +point.dg.value,
          b: +point.db.value
        },
        specular: {
          r: +point.sr.value,
          g: +point.sg.value,
          b: +point.sb.value
        },
        position: {
          x: +point.x.value,
          y: +point.y.value,
          z: +point.z.value
        }
      };

      //Update position
      theta += 0.01;
      earth.rotation.set(Math.PI, theta,  0.1);
      earth.update();

      //render objects
      scene.render();

      //request new frame
      Fx.requestAnimationFrame(draw);
    }

    //Animate
    draw();
  });
}
