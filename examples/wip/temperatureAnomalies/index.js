function init() {
  //unpack modules
  PhiloGL.unpack();
  
  //Shortcut for getElementById
  var $ = function(d) { return document.getElementById(d); };
  
  //Get controls
  var year = $('year'),
      mapImg = $('current-map'),
      squares = document.querySelectorAll('#controls .square'),
      lis = document.querySelectorAll('#controls ul li');

  //Log singleton
  var Log = {
    elem: null,
    timer: null,
    
    getElem: function() {
      if (!this.elem) {
        return (this.elem = $('log-message'));
      }
      return this.elem;
    },
    
    write: function(text, hide) {
      if (this.timer) {
        this.timer = clearTimeout(this.timer);
      }
      
      var elem = this.getElem(),
          style = elem.parentNode.style;

      elem.innerHTML = text;
      style.display = '';

      if (hide) {
        this.timer = setTimeout(function() {
          style.display = 'none';
        }, 2000);
      }
    }
  };
  
  //Create earth
  var earth = new PhiloGL.O3D.Sphere({
    nlat: 30,
    nlong: 30,
    radius: 2,
    textures: ['img/earth.jpg'],
    uniforms: {
      shininess: 32,
      alphaUfm: 1
    }
  });

  //Create Temperature Maps
  var imageCanvas = $('image-data').getContext('2d'),
      tempMaps = [],
      currentTempMap = new PhiloGL.O3D.Sphere({
        nlat: 60,
        nlong: 60,
        radius: 2,
        uniforms: {
          shininess: 2,
          alphaUfm: 0.25
        }
      }), 
      currentMapIndex = 0;

  //Load Images
  var n = 13, imageUrls = [], width = 1024, height = 576;
  while (n--) {
    imageUrls.push('./img/' + (1880 + n * 10) + 'temperatureAnomaly.0137.jpg');
  }
  var images = new IO.Images({
    src: imageUrls.reverse(),
    onProgress: function(a) {
      Log.write('Loading... ' + a + '%');
    },
    onComplete: function() {
      Log.write('done', true);

      //Load Temperature Maps
      images.forEach(function(img, i) {
        //Paste image in canvas and get image pixel data
        imageCanvas.drawImage(img, 0, 0);
        var pixels = imageCanvas.getImageData(0, 0, width, height).data, 
            colors = [], avgColor = [0, 0, 0], color, first = true;
        
        tempMaps[i] = new O3D.Sphere({
          nlat: 60,
          nlong: 60,
          uniforms: {
            shininess: 32
          },
          radius: function(n1, n2, n3, u, v) {
            u = (u * (width -1)) >> 0;
            v = (v * (height -1)) >> 0;
            //Average surrounding points
            var delta = 0, deltaSq = (2 * delta + 1) * (2 * delta + 1);
            for (var du = -delta, avg = [0, 0, 0]; du <= delta; du++) {
              for (var dv = -delta; dv <= delta; dv++) {
                var up = (u + du) % width;
                if (up < 0) {
                  up += width;
                }
                var uv = v + dv;
                if (uv < 0) {
                  uv = 0;
                }
                if (uv >= height) {
                  uv = height -1;
                }
                var pos = up * uv * 4;
                avg[0] += pixels[pos   ];
                avg[1] += pixels[pos +1];
                avg[2] += pixels[pos +2];
              }
            }
            avg[0] /= deltaSq;
            avg[1] /= deltaSq;
            avg[2] /= deltaSq;
            //make average temp.
            color = avg.map(Math.floor);
            avgColor[0] += color[0];
            avgColor[1] += color[1];
            avgColor[2] += color[2];
            colors.push(color[0] / 255, color[1] / 255, color[2] / 255, 1);
            return (color[0] - color[2] + 255) / 510 * 3 + 1.5;
          }
        });
        tempMaps[i].colors = colors;
        
        //Set colors/events for ul li dom elements
        squares[i].style.backgroundColor = 'rgb(' + avgColor.map(function(c) { return (c / (60 * 60)) >> 0; }).join() + ')';

        lis[i].addEventListener('click', function() {
          for (var k = 0, lk = lis.length; k < lk; k++) {
            lis[k].className = '';
          }
          lis[i].className = 'selected';
          mapImg.src = images[i].src;
          var n = 1880 + i * 10;
          year.innerHTML = n + ' - ' + (n + 4);
          //start animation
          fx.start({
            from: tempMaps[currentMapIndex],
            to: tempMaps[i]
          });
          currentMapIndex = i;
        }, false);
      });
      
      //init Application
      initApp();   
    }
  });

  //Create animation object for transitioning temp maps.
  var fx = new Fx({
    transition: Fx.Transition.Quart.easeInOut,
    duration: 1500,
    onCompute: function(delta) {
      currentTempMap.dynamic = true;
      var from = this.opt.from,
          to = this.opt.to,
          lerp = Fx.compute,
          fromColors = from.colors || [],
          fromVertices = from.vertices || [],
          fromNormals = from.normals || [],
          toColors = to.colors,
          toVertices = to.vertices,
          toNormals = to.normals,

          colors = currentTempMap.colors || [],
          normals = currentTempMap.normals || [],
          vertices = currentTempMap.vertices || [];

      for (var i = 0, l = to.vertices.length / 3; i < l; ++i) {
        var vIndex = i * 3,
            cIndex = i * 4;
        colors[cIndex   ] = lerp(fromColors[cIndex]    || 0, toColors[cIndex   ], delta);
        colors[cIndex +1] = lerp(fromColors[cIndex +1] || 0, toColors[cIndex +1], delta);
        colors[cIndex +2] = lerp(fromColors[cIndex +2] || 0, toColors[cIndex +2], delta);
        colors[cIndex +3] = lerp(fromColors[cIndex +3] || 0, toColors[cIndex +3], delta);
        
        vertices[vIndex   ] = lerp(fromVertices[vIndex]    || 0, toVertices[vIndex   ], delta);
        vertices[vIndex +1] = lerp(fromVertices[vIndex +1] || 0, toVertices[vIndex +1], delta);
        vertices[vIndex +2] = lerp(fromVertices[vIndex +2] || 0, toVertices[vIndex +2], delta);
        
        normals[vIndex   ] = lerp(fromNormals[vIndex]    || 0, toNormals[vIndex   ], delta);
        normals[vIndex +1] = lerp(fromNormals[vIndex +1] || 0, toNormals[vIndex +1], delta);
        normals[vIndex +2] = lerp(fromNormals[vIndex +2] || 0, toNormals[vIndex +2], delta);
      }

      currentTempMap.colors = colors;
      currentTempMap.vertices = vertices;
      currentTempMap.normals = normals;

    },
    onComplete: function() {
      currentTempMap.dynamic = false;
    }
  });

  function initApp() {
    //Object rotation
    var theta = 0;

    //Create application
    PhiloGL('map-canvas', {
      program: {
        from: 'uris',
        path: './',
        vs: 'temp.vs.glsl',
        fs: 'temp.fs.glsl',
        noCache: true
      },
      camera: {
        position: {
          x: 0, y: 0, z: -13
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
              x: 7, 
              y: 7, 
              z: -17 
            }
          }
        }
      },
      events: {
        onTouchStart: function(e) {
          e.stop();
          this.pos = {
            x: e.x,
            y: e.y
          };
          this.dragging = true;
        },
        onTouchCancel: function() {
          this.dragging = false;
        },
        onTouchEnd: function() {
          this.dragging = false;
          theta = this.scene.models[0].rotation.y;
        },
        onTouchMove: function(e) {
          e.stop();
          var z = this.camera.position.z,
              sign = Math.abs(z) / z,
              pos = this.pos;

          this.scene.models.forEach(function(m) {
            m.rotation.y += -(pos.x - e.x) / 100;
            m.update();
          });

          pos.x = e.x;
          pos.y = e.y;
        },
        onDragStart: function(e) {
          this.pos = {
            x: e.x,
            y: e.y
          };
          this.dragging = true;
        },
        onDragCancel: function() {
          this.dragging = false;
        },
        onDragEnd: function() {
          this.dragging = false;
          theta = this.scene.models[0].rotation.y;
        },
        onDragMove: function(e) {
          var z = this.camera.position.z,
              sign = Math.abs(z) / z,
              pos = this.pos;

          this.scene.models.forEach(function(m) {
            m.rotation.y += -(pos.x - e.x) / 100;
            m.update();
          });

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
      textures: {
        urls: ['img/earth.jpg']
      },
      onError: function(e) {
        alert("There was an error creating the app. ");
      },
      onLoad: function(app) {
        //Unpack app properties
        var gl = app.gl,
            scene = app.scene,
            canvas = app.canvas;
       

        earth.onBeforeRender = function() {
          gl.disable(gl.BLEND);
          gl.enable(gl.DEPTH_TEST);
        };
        
        currentTempMap.onBeforeRender = function() {
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
          gl.enable(gl.BLEND);
          gl.disable(gl.DEPTH_TEST);
        };
        
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
      
        //Add objects to the scene
        scene.add(earth, currentTempMap);
        //First map
        fx.start({
          from: {
            vertices: new Float32Array(currentTempMap.vertices || []),
            normals: new Float32Array(currentTempMap.normals || []),
            colors: new Float32Array(currentTempMap.colors || [])
          },
          to: tempMaps[0]
        });
        draw();

        //Draw the scene
        function draw() {
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
     
          if (!app.dragging && theta == 0) {
            theta += 0.0005;
            earth.rotation.set(Math.PI, theta,  0.1);
            earth.update();
            currentTempMap.rotation.set(0, theta, 0.1);
            currentTempMap.update();
          } else if (!app.dragging) {
            theta += 0.0005;
            earth.rotation.y = theta;
            earth.update();
            currentTempMap.rotation.y = theta;
            currentTempMap.update();
          }
          //render objects
          scene.render();
          //Request Animation Frame
          Fx.requestAnimationFrame(draw);
        }
      }
    });
  }
}


