(function() {

var $ = function(d) { return document.getElementById(d); },
    $$ = function(d) { return document.querySelectorAll(d); },
    $1 = function(d) { return document.querySelector(d); };
    hexToRgb = function(hex) {
      if (hex.length != 7) {
        hex = hex.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
        hex.shift();
        if (hex.length != 3)
          return null;
        var rgb = [];
        for ( var i = 0; i < 3; i++) {
          var value = hex[i];
          if (value.length == 1)
            value += value;
          rgb.push(parseInt(value, 16));
        }
        return rgb;
      } else {
        hex = parseInt(hex.slice(1), 16);
        return [ hex >> 16, hex >> 8 & 0xff, hex & 0xff ];
      }
    };

var width = 128,
    height = 128,
    cos = Math.cos,
    sin = Math.sin,
    PI = Math.PI,
    descriptions;

var options = {
  currentGroupIndex: 0,
  scale: 1,
  rotate: 0,
  radialFactor: 0.1,
  offset: 20,
  hyperbole: 0
};

document.addEventListener('DOMContentLoaded', function() {
  if (!PhiloGL.hasWebGL()) {
    alert("Your browser does not support WebGL");
    return;
  }

  //some checks...
  (function () {
    var keys = Object.getOwnPropertyNames(window), k, l;
    if(navigator.userAgent.match(/.*WebKit.*/)) {
      document.body.className = 'webkit';
    }
  }());
  initGroupOptions(options);
  initDrawOptions($('canvas'), options);

  PhiloGL('surface', {
    context: {
      preserveDrawingBuffer: true
    },
    program: [{
      id: 'surface',
      from: 'uris',
      vs: 'surface.vs.glsl',
      fs: 'surface.fs.glsl',
      noCache: true
    }],
    events: {
      onMouseWheel: function(e) {
        e.stop();
        options.scale += e.wheel / (10 * (window.opera ? 50 : 1));
        if (options.scale < 1) {
          options.scale = 1;
        }
        if (options.scale > 10) {
          options.scale = 10;
        }
      }
    },
    onError: function(e) {
      console.log(e, e.message);
    },
    onLoad: function(app) {
      var gl = app.gl,
          glCanvas = app.canvas,
          glStyle = glCanvas.style,
          drawCanvas = $('canvas'),
          ctx = drawCanvas.getContext('2d'),
          rgb;

      gl.disable(gl.DEPTH_TEST);

      draw();

      function draw() {
        glCanvas.width = window.innerWidth;
        glCanvas.height = window.innerHeight;

        rgb = glStyle.backgroundColor.match(/rgb\((.+),(.+),(.+)\)/);
        gl.clearColor(rgb[1] / 255, rgb[2] / 255, rgb[3] / 255, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        app.program.setUniforms(
          background: [rgb[1] / 255, rgb[2] / 255, rgb[3] / 255, 1]
        });

        app.setTexture('pattern', {
          data: {
            value: drawCanvas
          }
        });

        // advance
        PhiloGL.Media.Image.postProcess({
          width: glCanvas.width,
          height: glCanvas.height,
          toScreen: true,
          aspectRatio: 1,
          program: 'surface',
          fromTexture: 'pattern',
          uniforms: {
            group: options.currentGroupIndex,
            offset: options.offset,
            rotation: options.rotate,
            scaling: [options.scale, options.scale],
            resolution: [glCanvas.width, glCanvas.height],
            radialFactor: options.radialFactor,
            hyperbolic: options.hyperbole
          }
        });

        PhiloGL.Fx.requestAnimationFrame(draw);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        // app.setTexture('pattern', false);
      }
    }
  });
}, false);

}());

