/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements */
window.webGLStart = function() {

  var createGLContext = LumaGL.createGLContext;
  var getShadersFromHTML = LumaGL.addons.getShadersFromHTML;
  var Buffer = LumaGL.Buffer;
  var Program = LumaGL.Program;

  var positions = [
    -1, -1,
     1, -1,
     1,  1,
    -1, -1,
     1,  1,
    -1,  1
  ];

  function doContext(canvasID, fsID) {
    var canvas = document.getElementById(canvasID);
    var gl = createGLContext(canvas);
    gl.clearColor(1, 0, 1, 1);

    var quad = new Buffer(gl, {
      attribute: 'aPosition',
      data: new Float32Array(positions),
      size: 2
    });

    var program = new Program(gl, getShadersFromHTML({
      vs: 'quad-vs',
      fs: fsID
    }));

    var time = 0;

    function render() {
      time += 0.01;
      canvas.width = canvas.clientWidth;
      canvas.style.height = canvas.width + 'px';
      canvas.height = canvas.width;
      gl.viewport(0, 0, canvas.width, canvas.height);
      program.use();
      program.setBuffer(quad);
      program.setUniform('uTime', time);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      Fx.requestAnimationFrame(render);
    }

    render();
  }

  doContext('canvas-0', 'c0-fs');
  doContext('canvas-1', 'c1-fs');
};
