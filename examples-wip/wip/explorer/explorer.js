(function() {
  
  //Utility fn to getElementById
  function $id(d) {
    return document.getElementById(d);
  }
  
  //Grid configuration
  var Grid = {
    x: {
      from: -1,
      to: 1,
      step: 0.05
    },
    y: {
      from: -1,
      to: 1,
      step: 0.05
    }
  };

  //index
  var den = 1;
  
  //Generate index array from data
  var meshIndices = (function meshIndices(grid){
    var x = grid.x,
        y = grid.y,
        xFrom = x.from,
        xTo = x.to,
        xStep = x.step,
        yFrom = y.from,
        yTo = y.to,
        yStep = y.step,
        xp = ((xTo - xFrom) / xStep) >> 0,
        yp = ((yTo - yFrom) / yStep) >> 0,
        indices = [],
        i, j, p1, p2;
    
    for (i = 0; i < xp -2; i++) {
      p1 = [i, i+1, i+1];
      p2 = [i+1, i, i];
      
      for (j = 0; j < yp -2; j++) {
        indices.push( p1[0] + j * (xp),
                      p1[1] + j * (xp),
                      p1[2] + (j +1) * (xp),

                      p2[0] + (j+1) * (xp),
                      p2[1] + (j+1) * (xp),
                      p2[2] + (j) * (xp));
      }
    }
    return indices;
  })(Grid);

  //Surface Model
  var surface = new PhiloGL.O3D.Model({
    indices: meshIndices,
    uniforms: {
      shininess: 10,
      'colorUfm': [0.5, 0.3, 0.7, 1]
    }
  });

  window.addEventListener('DOMContentLoaded', init, false);

  function init() {
    //Create App
    PhiloGL('surface-explorer-canvas', {
      program: {
        from: 'uris',
        path: './',
        vs: 'surface.vs.glsl',
        fs: 'surface.fs.glsl',
        noCache: true
      },
      camera: {
        position: {
          x: 0, y: 0, z: -3
        }
      },
      scene: {
        lights: {
          enable: true,
          ambient: {
            r: 0.6,
            g: 0.6,
            b: 0.6
          },
          points: {
            diffuse: { 
              r: 0.7, 
              g: 0.7, 
              b: 0.7 
            },
            specular: { 
              r: 0.8, 
              g: 0.8, 
              b: 0 
            },
            position: { 
              x: 3, 
              y: 3, 
              z: 3 
            }
          }
        }
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

          surface.rotation.y += -(pos.x - e.x) / 100;
          surface.rotation.x += sign * (pos.y - e.y) / 100;
          surface.update();
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

          surface.rotation.y += -(pos.x - e.x) / 100;
          surface.rotation.x += sign * (pos.y - e.y) / 100;
          surface.update();
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
        alert("There was an error while creating the WebGL application " + String(e));
      },
      onLoad: function(app) {
        var gl = app.gl,
            canvas = gl.canvas,
            scene = app.scene,
            fxy = $id('fxy'),
            t = $id('t'),
            tFrom = $id('tfrom'),
            tTo = $id('tto'),
            tLoop = $id('tloop'),
            tPlay = $id('tplay'),
            example1 = $id('example1'),
            example2 = $id('example2'),
            example3 = $id('example3'),
            box = $id('box'),
            grid = $id('grid'),
            sColorR = $id('scolorR'),
            sColorG = $id('scolorG'),
            sColorB = $id('scolorB'),
            bodyStyle = document.body.style,
            fbody = '',
            fnUpdated = true,
            currentTime = false,
            currentTimeStep = false,
            workerGroup = new PhiloGL.WorkerGroup('graph-compute.js', 1),
            fps = 70;

        //Add event listeners to controls
        t.addEventListener('click', function(e) {
          tFrom.disabled = !t.checked;
          tTo.disabled = !t.checked;
          tLoop.disabled = !t.checked;
          tPlay.disabled = !t.checked;
        }, false);
        
        tPlay.addEventListener('click', function(e) {
          if (t.checked) {
            try {
              currentTime = +tFrom.value;
              currentTimeStep = (+tTo.value - +tFrom.value) / fps;
            } catch (e) {
              currentTime = false;
              currentTimeStep = false;
            }
          }
        }, false);

        example1.onclick = example2.onclick = example3.onclick = function() {
          fxy.value = this.title;
        };
        
        //Basic gl setup
        gl.clearDepth(1.0);
        gl.clearColor(0, 0, 0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.viewport(0, 0, canvas.width, canvas.height);
        
        //run loop
        loop();

        //set properties, sample function and render
        function loop() {
          //test correctedness of function body
          if (fxy.value != fbody) {
            fbody = fxy.value;
            try {
              new Function('x, y, t', fbody);
              fxy.className = '';
              fnUpdated = true;
            } catch (e) {
              fxy.className = 'error';
              fnUpdated = false;
            }
          } else {
            fnUpdated = false;
          }
          //set timing function
          if (t.checked && currentTime !== false) {
            if (currentTime >= +tTo.value) {
              if (tLoop.checked) {
                currentTime = +tFrom.value;
              } else {
                currentTime = false;
              }
            } else {
              currentTime += currentTimeStep;
            }
          } else {
          }
          //set colors
          surface.uniforms.colorUfm = [+sColorR.value, +sColorG.value, +sColorB.value, 1.0];
          //set grid
          if (grid.checked) {
            surface.drawMode = gl.LINES;
            //delete surface.indices;
          } else {
            surface.drawMode = gl.TRIANGLES;
            surface.indices = meshIndices;
          }
          //reset buffers if the fn has been updated or a parametric fn is called.
          surface.dynamic = fnUpdated || (t.checked && (currentTime !== false));
          //sample function
          if (surface.dynamic) {
            sampleFn();
          } else {
            render();
          }
        }
        
        //Render the scene and perform a new loop
        function render() {
          if (!scene.models.length) {
            scene.add(surface);
          }
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          scene.render();
          PhiloGL.Fx.requestAnimationFrame(loop);
        }
        
        //Sample the function
        function sampleFn() {
          var x = Grid.x,
              xfrom = x.from,
              xto = x.to,
              xstep = x.step,
              nx = ((xto - xfrom) / den),
              y = Grid.y,
              yfrom = y.from,
              yto = y.to,
              ystep = y.step,
              ny = ((yto - yfrom) / den);     
          
          workerGroup.map(function(nb) { 
            var idx = nb % den,
                idy = ((nb / den) >> 0) % den;
            var o = {
              grid: {
                x: {
                  from: xfrom + idx * nx,
                  to: xfrom + idx * nx + nx,
                  step: xstep
                },
                y: {
                  from: yfrom + idy * ny,
                  to: yfrom + idy * ny + ny,
                  step: ystep
                }
              },
              t: currentTime || 0,
              f: fbody
            };
            return o;
          });

          var indexAcum = 0, initialValue = {
            vertices: [],
            normals: []
          };

          workerGroup.reduce({
            reduceFn: function (x, y) { 
              x.vertices.push.apply(x.vertices, y.vertices);
              x.normals.push.apply(x.normals, y.normals);
              return x;
            },
            initialValue: initialValue,
            onComplete: function(ans) { 
              surface.vertices = ans.vertices;
              surface.normals = ans.normals;
              render();
            }
          });
        }
      }
    });
  };

})();
