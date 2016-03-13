
window.webGLStart = function() {

  var createGLContext = LumaGL.createGLContext;
  var makeProgramFromHTMLTemplates = LumaGL.addons.makeProgramFromHTMLTemplates;
  var Buffer = LumaGL.Buffer;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var TextureCube = LumaGL.TextureCube;
  var Cube = LumaGL.Cube;
  var Mat4 = LumaGL.Mat4;
  var Vec3 = LumaGL.Vec3;
  var Fx = LumaGL.Fx;

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
    gl.clearColor(1,0,1,1);

    var quad = new Buffer(gl, {
      attribute: 'aPosition',
      data: new Float32Array(positions),
      size: 2
    });

    var program = makeProgramFromHTMLTemplates(gl, 'quad-vs', fsID);

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
