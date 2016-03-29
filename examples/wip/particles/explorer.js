/*global Float32Array, PhiloGL, O3D, Media*/

(function() {
  //Unpack PhiloGL modules
  PhiloGL.unpack();

  //Utility fn to getElementById
  function $id(d) {
    return document.getElementById(d);
  }

  //index
  var size = 1024,
      plane = new Float32Array(size * size * 3),
      shape = new Float32Array(size * size * 4),
      i, l, i3, i4;

  for (i = 0, l = size * size; i < l; i++) {
    i3 = i * 3;
    i4 = i * 4;
    plane[i3    ] = (i % size) / size;
    plane[i3 + 1] = Math.floor(i / size) / size;

    shape[i4    ] = (i % size) / size - 0.5;
    shape[i4 + 1] = -0.4;
    shape[i4 + 2] = Math.floor(i / size) / size;
  }

  //Surface Mesh
  window.addEventListener('DOMContentLoaded', init, false);

  function init() {
    var object;
    //Create App
    PhiloGL('surface-explorer-canvas', {
      program: [{
        id: 'surface',
        from: 'uris',
        path: './',
        vs: 'surface.vs',
        fs: 'surface.fs',
        noCache: true
      },{
        id: 'simulation',
        from: 'uris',
        path: './',
        vs: 'simulation.vs',
        fs: 'simulation.fs',
        noCache: true
      },{
        id: 'copy',
        from: 'uris',
        path: './',
        vs: 'copy.vs',
        fs: 'copy.fs',
        noCache: true
      }],
      camera: {
        position: {
          x: 0, y: 0, z: -1
        },
        near: 0.05,
        far: 3000,
        fov: 45
      },
      events: {
        onDragStart: function(e) {
          this.pos = {
            x: e.x,
            y: e.y
          };
        },
        onDragMove: function(e) {
          var z = this.camera.position.z,
              sign = Math.abs(z) / z,
              pos = this.pos;

          object.rotation.y += -(pos.x - e.x) / 100;
          object.rotation.x += sign * (pos.y - e.y) / 100;
          object.update();
          pos.x = e.x;
          pos.y = e.y;
        },
        onTouchStart: function(e) {
          e.stop();
          this.pos = {
            x: e.x,
            y: e.y
          };
        },
        onTouchMove: function(e) {
          e.stop();
          var z = this.camera.position.z,
              sign = Math.abs(z) / z,
              pos = this.pos;

          object.rotation.y += -(pos.x - e.x) / 100;
          object.rotation.x += sign * (pos.y - e.y) / 100;
          object.update();
          pos.x = e.x;
          pos.y = e.y;
        },
        onMouseWheel: function(e) {
          e.stop();
          var camera = this.camera;
          camera.position.z += e.wheel;
          camera.update();
        }
      },
      onError: function(e) {
        console.warn(e);
      },
      onLoad: function(app) {
        var gl = app.gl,
            canvas = gl.canvas,
            scene = app.scene,
            program = app.program,
            start = Date.now();

        canvas.width = window.innerWidth - 20;
        canvas.height = window.innerHeight - 130;

        window.addEventListener('resize', function() {
          canvas.width = window.innerWidth - 20;
          canvas.height = window.innerHeight - 130;
        });

        //program.surface.setBuffer('position', {
          //value: plane,
          //size: 3
        //});

        //program.simulation.setBuffer('position', {
          //value: plane,
          //size: 3
        //});

        app.setFrameBuffer('f1', {
              width: size,
              height: size,
              bindToTexture: {
                data: {
                  type: gl.FLOAT,
                  width: size,
                  height: size,
                  value: shape
                }
              }
            })
           .setFrameBuffer('f2', {
              width: size,
              height: size,
              bindToTexture: {
                data: {
                  type: gl.FLOAT,
                  width: size,
                  height: size,
                  value: shape
                }
              }
            });

        object = new O3D.Model({
          vertices: plane,
          program: 'surface',
          drawMode: "POINTS",
          //drawMode: gl.LINE_LOOP,
          //drawMode: gl.TRIANGLES,
          textures: ['f1-texture'],
          uniforms: {
            //timer: 0,
            size: 1024,
            pointColor: [1, 0, 0],
            opacity: 1,
            pointSize: 1
          }
        });
        scene.add(object);

        //Basic gl setup
        gl.clearColor(0, 0, 0, 0);
        //gl.clearDepth(1.0);
        //gl.enable(gl.DEPTH_TEST);
        //gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.SRC_ALPHA);
        //run loop
        loop();

        //set properties, sample function and render
        function loop() {
          //app.setFrameBuffer('f2', true);
          //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          //gl.viewport(0, 0, size, size);
          //object.program = 'simulation';
          //object.uniforms.textures = ['f1-texture'];

          //scene.renderToTexture('f2');
          //app.setFrameBuffer('f2', false);

          Media.Image.postProcess({
            width: size,
            height: size,
            fromTexture: 'f1-texture',
            toFrameBuffer: 'f2',
            program: 'simulation',
            uniforms: {
              timer: (Date.now() - start) / 100,
              waves: [0.3, 120, 0.5, 0,
                      0.5, 50, 0.2, 0],
              points: [0.5, 0.8, 60 / 2, 0,
                       0.2, 0.8, 20 / 2, 0,
                       0.3, 0.6, 30 / 2, 0,
                       0.5, 0.1, 10 / 2, 0,
                       0.5, 0.5, 15 / 2, 0,
                       0.2, 0.8, 80 / 2, 0,
                       0.4, 0.8, 60 / 2, 0,
                       0.6, 0.8, 20 / 2, 0,
                       0.7, 0.6, 30 / 2, 0,
                       0.8, 0.6, 10 / 2, 0,
                       0.9, 0.7, 15 / 2, 0,
                       0.0, 0.2, 80 / 2, 0]

            }
            //aspectRatio: 1,
            //toScreen: true
          })
          .postProcess({
            width: size,
            height: size,
            fromTexture: 'f2-texture',
            toFrameBuffer: 'f1',
            program: 'copy',
            //aspectRatio: 1,
            //toScreen: true
          });

          //object.uniforms.timer = (Date.now() - start) / 100;
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          gl.viewport(0, 0, canvas.width, canvas.height);

          scene.render();
          Fx.requestAnimationFrame(loop);
        }
      }
    });
  };

})();
