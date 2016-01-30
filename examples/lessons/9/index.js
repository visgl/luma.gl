
var webGLStart = function() {

  var $id = function(d) { return document.getElementById(d); };

  var createGLContext = PhiloGL.createGLContext;
  var loadTextures = PhiloGL.loadTextures;
  var Program = PhiloGL.Program;
  var PerspectiveCamera = PhiloGL.PerspectiveCamera;
  var Scene = PhiloGL.Scene;
  var Events = PhiloGL.Events;
  var Fx = PhiloGL.Fx;
  var Model = PhiloGL.Model;
  var Shaders = PhiloGL.Shaders;

  var canvas = document.getElementById('lesson09-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  
  var gl = createGLContext(canvas);

  var tStar;

  var Star = function(startingDistance, rotationSpeed) {
    Model.call(this, {
      vertices: [
        -1.0, -1.0,  0.0,
        1.0, -1.0,  0.0,
        -1.0,  1.0,  0.0,
        1.0,  1.0,  0.0
      ],

      texCoords: [
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0
      ],

      textures: tStar,

      indices: [0, 1, 3, 3, 2, 0],

      onBeforeRender: function(program, camera) {
        var min = Math.min,
            isTwinkle = twinkle.checked,
            r = isTwinkle? min(1, this.r + this.twinklerR) : this.r,
            g = isTwinkle? min(1, this.g + this.twinklerG) : this.g,
            b = isTwinkle? min(1, this.b + this.twinklerB) : this.b;
        program.setUniform('uColor', [r, g, b]);
      }

  });

    this.angle = 0;
    this.dist = startingDistance;
    this.rotationSpeed = rotationSpeed;
    this.spin = 0;

    this.randomiseColors();
  };

  Star.prototype = Object.create(Model.prototype, {

    randomiseColors: {
      value: function() {
        var rd = Math.random;

        this.r = rd();
        this.g = rd();
        this.b = rd();

        this.twinklerR = rd();
        this.twinklerG = rd();
        this.twinklerB = rd();
      }
    },

    animate: {
      value: function(elapsedTime, twinkle) {
        this.angle += this.rotationSpeed / 10;

        this.dist -= 0.001;

        if (this.dist < 0) {
          this.dist += 5;
          this.randomiseColors();
        }

        //update position
        this.position.set(Math.cos(this.angle) * this.dist, Math.sin(this.angle) * this.dist, 0);
        this.rotation.set(0, 0, this.spin);
        this.spin += 0.1;
        this.update();
      }
    }

  });

  var zoom = -15,
      tilt = 90,
      spin = 0,
      twinkle = $id('twinkle');

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.enable(gl.BLEND);

  colorUniformFS = [

      "#ifdef GL_ES",
      "precision highp float;",
      "#endif",

      "varying vec4 vColor;",
      "varying vec2 vTexCoord;",
      "varying vec3 lightWeighting;",

      "uniform bool hasTexture1;",
      "uniform sampler2D sampler1;",
      "uniform vec3 uColor;",

      "void main(){",

        "if (hasTexture1) {",

          "gl_FragColor = vec4(texture2D(sampler1, vec2(vTexCoord.s, vTexCoord.t)).rgb * lightWeighting, 1.0) * vec4(uColor, 1.0);",

        "}",

      "}"

  ].join("\n");

  var program = new Program(gl, Shaders.Vertex.Default, colorUniformFS);
  program.use();

  var camera = new PerspectiveCamera({
    aspect: canvas.width/canvas.height,
  });

  var scene = new Scene(gl, program, camera);

  Events.create(canvas, {
    onKeyDown: function(e) {
      switch(e.key) {
        case 'up':
          tilt -= 1.5;
          break;
        case 'down':
          tilt += 1.5;
          break;
        //handle page up/down
        default:
          if (e.code == 33) {
            zoom -= 0.1;
          } else if (e.code == 34) {
            zoom += 0.1;
          }
      }
    }
  });

  loadTextures(gl, {
    src: ['star.gif'],
    parameters: [{
      magFilter: gl.LINEAR,
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    }]
  }).then(function(textures) {
    tStar = textures[0];
    //Load all world objects
    var numStars = 50;
    for (var i = 0; i < numStars; i++) {
      scene.add(new Star(i / numStars * 5.0, i / numStars));
    }

    function animate() {
      scene.models.forEach(function(star) {
        star.animate();
      });
    }

    function drawScene() {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      //Update Camera Position
      var radTilt = tilt / 180 * Math.PI;
      camera.position.set(0, Math.cos(radTilt) * zoom,
                             Math.sin(radTilt) * zoom);
      camera.update();
      //Render all elements in the Scene
      scene.render();
    }

    function tick() {
      drawScene();
      animate();
      Fx.requestAnimationFrame(tick);
    }

    tick();
  });

}
