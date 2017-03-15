PhiloGL.unpack();
var time;
var t;
var mouseX = 0.5;
var mouseY = 0.5;
var viewX = 600;
var viewY = 600;
var c;
var $ = function(d) { return document.getElementById(d); };

function load() {

  if (!PhiloGL.hasWebGL()) {
    alert("Your browser does not support WebGL");
    return;
  }

  var range = $('range');

  $('fullscreen').addEventListener('click', function(e) {
    var width = window.innerWidth,
        height = window.innerHeight,
        canvas = $('c'),
        style = canvas.style;

    canvas.width = viewX = width;
    canvas.height = viewY = height;

    style.position = 'absolute';
    style.top = '0px';
    style.left = '0px';

    document.body.appendChild(canvas);

    var anchor = document.createElement('a'),
        astyle = anchor.style;
    astyle.position = 'absolute';
    astyle.top = astyle.left = '0px';
    astyle.color = '#fff';
    astyle.display = 'block';
    astyle.backgroundColor = 'black';
    anchor.innerHTML = 'Click here to leave fullscreen';
    anchor.href = '#';
    document.body.appendChild(anchor);

    anchor.addEventListener('click', function() {
      canvas.width = canvas.height = viewX = viewY = 600;
      canvas.style.position = 'static';
      $('container').appendChild(canvas);
      anchor.parentNode.removeChild(anchor);
    }, false);

  });

  PhiloGL('c', {
    program: [{
      id: 'quasip',
      from: 'ids',
      vs: 'shader-vs',
      fs: 'shader-fs'
    }],
    onError: function(e) {
      console.log(e);
    },
    onLoad: function(app) {
      time = Date.now();
      
      draw();

      function draw() {
        t = ((Date.now() - time) / 600) % (Math.PI * 2);
        // advance
        Media.Image.postProcess({
          width: viewX,
          height: viewY,
          toScreen: true,
          aspectRatio: 1,
          program: 'quasip',
          uniforms: {
            t: t,
            ratio: +range.value
          }
        });

        Fx.requestAnimationFrame(draw);
      }
    }
  });
}

