/* global window, document, LumaGL */
/* eslint-disable max-statements */
window.webGLStart = function() {

  var createGLContext = LumaGL.createGLContext;
  var XHR = LumaGL.XHR;
  var loadTextures = LumaGL.loadTextures;
  var Model = LumaGL.Model;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Scene = LumaGL.Scene;
  var Events = LumaGL.Events;
  var Fx = LumaGL.Fx;
  var Program = LumaGL.Program;
  var Geometry = LumaGL.Geometry;

  var pitch = 0;
  var pitchRate = 0;
  var yaw = 0;
  var yawRate = 0;
  var xPos = 0;
  var yPos = 0.4;
  var zPos = 0;
  var speed = 0;
  var joggingAngle = 0;
  var program;

  // Model
  var world;

  var canvas = document.getElementById('lesson10-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext(canvas);

  // load world
  new XHR({
    url: 'world.txt',
    onSuccess: function(data) {
      var lines = data.split('\n');
      var vertexCount = 0;
      var vertexPositions = [];
      var vertexTextureCoords = [];
      for (var i in lines) {
        var vals = lines[i].replace(/^\s+/, '').split(/\s+/);
        if (vals.length === 5 && vals[0] !== '// ') {
          //  It is a line describing a vertex; get X, Y and Z first
          vertexPositions.push(parseFloat(vals[0]));
          vertexPositions.push(parseFloat(vals[1]));
          vertexPositions.push(parseFloat(vals[2]));

          //  And then the texture coords
          vertexTextureCoords.push(parseFloat(vals[3]));
          vertexTextureCoords.push(parseFloat(vals[4]));

          vertexCount += 1;
        }
      }

      worldGeometry = new Geometry({
        attributes: {
          vertices: new Float32Array(vertexPositions),
          texCoords: new Float32Array(vertexTextureCoords),
        }
      });

      loadTextures(gl, {
        src: ['mud.gif'],
        parameters: [{
          magFilter: gl.LINEAR,
          minFilter: gl.LINEAR_MIPMAP_NEAREST,
          wrapS: gl.REPEAT,
          wrapT: gl.REPEAT,
          generateMipmap: true
        }]
      }).then(function(textures) {
        program = new Program(gl, {});
        program.use();
        world = new Model({
          program: program,
          geometry: worldGeometry,
          textures: textures[0]
        });
        startApp();
      });

    },
    onError: function() {
      console.log('There was something wrong with loading the world.');
    }
  }).send();

  function startApp() {

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    var camera = new PerspectiveCamera({
      aspect: canvas.width / canvas.height
    });

    var scene = new Scene(gl, {});

    Events.create(canvas, {
      onKeyDown: function(e) {
        switch (e.key) {
        case 'left': case 'a':
          yawRate = 0.001;
          break;
        case 'right': case 'd':
          yawRate = -0.001;
          break;
        case 'up': case 'w':
          speed = 0.001;
          break;
        case 'down': case 's':
          speed = -0.001;
          break;
        }
        if (e.code === 33) {
          pichRate = 0.001;
        } else if (e.code === 34) {
          pichRate = -0.001;
        }
      },
      onKeyUp: function() {
        speed = 0;
        pitchRate = 0;
        yawRate = 0;
      }
    });

    scene.add(world);

    var lastTime = 0;
    function animate() {
      var timeNow = Date.now();
      if (lastTime !== 0) {
        var elapsed = timeNow - lastTime;

        if (speed !== 0) {
          xPos -= Math.sin(yaw) * speed * elapsed;
          zPos -= Math.cos(yaw) * speed * elapsed;

          // 0.6 "fiddle factor" - makes it feel more realistic :-)
          joggingAngle += elapsed * 0.01;
          yPos = Math.sin(joggingAngle) / 100 + 0.4;
        }

        yaw += yawRate * elapsed;
        pitch += pitchRate * elapsed;

      }
      lastTime = timeNow;
    }

    function drawScene() {
      // Update Camera Position
      camera.view.id()
                      .$rotateXYZ(-pitch, -yaw, 0)
                      .$translate(-xPos, -yPos, -zPos);

      // Render all elements in the Scene
      scene.render(gl, {
        camera: camera
      });
    }

    function tick() {
      drawScene();
      animate();
      Fx.requestAnimationFrame(tick);
    }

    tick();
  }
};
