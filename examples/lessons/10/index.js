
var webGLStart = function() {

  var createGLContext = PhiloGL.createGLContext;
  var IO = PhiloGL.IO;
  var loadTextures = PhiloGL.loadTextures;
  var Program = PhiloGL.Program;
  var Model = PhiloGL.Model;
  var PerspectiveCamera = PhiloGL.PerspectiveCamera;
  var Scene = PhiloGL.Scene;
  var Events = PhiloGL.Events;
  var Fx = PhiloGL.Fx;

  var pitch = 0,
      pitchRate = 0,
      yaw = 0,
      yawRate = 0,
      xPos = 0,
      yPos = 0.4,
      zPos = 0,
      speed = 0,
      joggingAngle = 0;

  //Model
  var world;

  var canvas = document.getElementById('lesson10-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext(canvas);

  //load world
  new IO.XHR({
    url: 'world.txt',
    onSuccess: function(data) {
      var lines = data.split("\n");
      var vertexCount = 0;
      var vertexPositions = [];
      var vertexTextureCoords = [];
      for (var i in lines) {
        var vals = lines[i].replace(/^\s+/, "").split(/\s+/);
        if (vals.length == 5 && vals[0] != "//") {
          // It is a line describing a vertex; get X, Y and Z first
          vertexPositions.push(parseFloat(vals[0]));
          vertexPositions.push(parseFloat(vals[1]));
          vertexPositions.push(parseFloat(vals[2]));

          // And then the texture coords
          vertexTextureCoords.push(parseFloat(vals[3]));
          vertexTextureCoords.push(parseFloat(vals[4]));

          vertexCount += 1;
        }
      }

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
        world = new Model({
          vertices: vertexPositions,
          texCoords: vertexTextureCoords,
          textures: textures[0]
        });
        startApp();
      });

    },
    onError: function() {
      console.log("There was something wrong with loading the world.");
    }
  }).send();

  function startApp() {

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    var program = Program.fromDefaultShaders(gl);
    program.use();

    var camera = new PerspectiveCamera({
      aspect: canvas.width/canvas.height,
    });

    var scene = new Scene(gl, program, camera);

    Events.create(canvas, {
      onKeyDown: function(e) {
        switch(e.key) {
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
        if (e.code == 33) {
          pichRate = 0.001;
        } else if (e.code == 34) {
          pichRate = -0.001;
        }
      },
      onKeyUp: function() {
        speed = 0;
        pitchRate = 0;
        yawRate = 0;
      }
    })

    scene.add(world);

    var lastTime = 0;
    function animate() {
      var timeNow = Date.now();
      if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        if (speed != 0) {
          xPos -= Math.sin(yaw) * speed * elapsed;
          zPos -= Math.cos(yaw) * speed * elapsed;

          joggingAngle += elapsed * 0.01;  // 0.6 "fiddle factor" - makes it feel more realistic :-)
          yPos = Math.sin(joggingAngle) / 100 + 0.4
        }

        yaw += yawRate * elapsed;
        pitch += pitchRate * elapsed;

      }
      lastTime = timeNow;
    }

    function drawScene() {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      //Update Camera Position
      camera.view.id()
                      .$rotateXYZ(-pitch, -yaw, 0)
                      .$translate(-xPos, -yPos, -zPos);

      //Render all elements in the Scene
      scene.render();
    }

    function tick() {
      drawScene();
      animate();
      Fx.requestAnimationFrame(tick);
    }

    tick();
  }
}
