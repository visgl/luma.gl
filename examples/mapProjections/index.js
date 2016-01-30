//Unpack modules
PhiloGL.unpack();

var Types = {
  SHADOW: 0,
  EARTH: 1
};
//Create earth
var earth = new O3D.Sphere({
  nlat: 50,
  nlong: 50,
  radius: 1,
  shininess: 32,
  textures: ['img/earth1.jpg', 'img/clouds.jpg'],
  program: 'earth'
});

//Solids
var solids = {};
//Load solids from worker
var loadingPanel, percLoaded, mapManager, pos,
    modelWorker = new Worker('solids.js');

modelWorker.onmessage = function(e) {
  var data = e.data,
      type = typeof data;

  if (data.length == 6) {
    console.log('wPhi phi phi0 wLambda lambda lambda0');
    console.log(data);
    return;
  }

  if (data.length == 4) {
    console.log('maxPhi', 'minPhi', 'maxLambda', 'minLambda');
    console.log(data);
    return;
  }

  if (type == 'number') {
    percLoaded.innerHTML = data + '%';
  } else {
    for (var name in data) {
      var solid = solids[name] = new O3D.Model(data[name]);
      solid.rotation.set(Math.PI / 2, 0,  0);
      solid.update();
      solid.display = false;
      //Need to be Float32Arrays
      for (var att in solid.attributes) {
        var descriptor = solid.attributes[att];
        descriptor.value = new Float32Array(descriptor.value);
      }
    }
    console.log(solids);
    createApp();
  }
};

//current model in scenes
var currentSolid;

function init() {
  //Shortcut for getElementById
  var $ = function(d) { return document.getElementById(d); };
  
  loadingPanel = $('loading-panel');
  percLoaded = $('perc-loaded');

  ['tetra', 'hexa', 'octa', 'dode', 'ico'].forEach(function(name) {
    $(name + '-link').addEventListener('click', function(e) {
      e.preventDefault();
      mapManager.select(name);
      return false;
    }, false);
  });

  modelWorker.postMessage();
  loadingPanel.className = 'show';
}

function createApp() {
  //Create application
  PhiloGL('map-canvas', {
    program: [{
      id: 'earth',
      from: 'uris',
      path: './',
      vs: 'earth.vs.glsl',
      fs: 'earth.fs.glsl',
      noCache: true
    }, {
      id: 'plane',
      from: 'uris',
      path: './',
      vs: 'plane.vs.glsl',
      fs: 'plane.fs.glsl',
      noCache: true
    }],
    camera: {
      position: {
        x: 0, y: 0, z: -5.5
      }
    },
    scene: {
      lights: {
        enable: true,
        ambient: {
          r: 0.4,
          g: 0.4,
          b: 0.4
        },
        points: {
          diffuse: { 
            r: 0.7, 
            g: 0.7, 
            b: 0.7 
          },
          specular: { 
            r: 0.5, 
            g: 0.5, 
            b: 0.8 
          },
          position: { 
            x: 3, 
            y: 3, 
            z: -5 
          }
        }
      }
    },
    events: {
      onDragStart: function(e) {
        pos = {
          x: e.x,
          y: e.y
        };
      },
      onDragMove: function(e) {
        var z = this.camera.position.z,
            sign = Math.abs(z) / z;

        for (var name in solids) {
          var solid = solids[name];
          solid.rotation.y += -(pos.x - e.x) / 100;
          solid.rotation.x += sign * (pos.y - e.y) / 100;
          solid.update();
        }
        
        earth.rotation.y += -(pos.x - e.x) / 100;
        earth.rotation.x += sign * (pos.y - e.y) / 100;
        earth.update();

        pos.x = e.x;
        pos.y = e.y;
      },
      /*
      onMouseMove: function(e) {
        var z = this.camera.position.z,
            sign = Math.abs(z) / z,
            pos = this.pos;

        this.scene.models.forEach(function(m) {
          m.rotation.y += -(pos.x - e.x) / 100;
          m.update();
        });

        pos.x = e.x;
        pos.y = e.y;
      },*/
      onMouseWheel: function(e) {
        e.stop();
        var camera = this.camera,
            position = camera.position;
        position.z += e.wheel;
        if (false && position.z > -6) {
          position.z = -6;
        }
        if (false && position.z < -13) {
          position.z = -13;
        }
        camera.update();
      }
    },
    textures: {
      src: ['img/earth1.jpg', 'img/clouds.jpg'],
      parameters: [{
        name: 'TEXTURE_MAG_FILTER',
        value: 'LINEAR'
      }, {
        name: 'TEXTURE_MIN_FILTER',
        value: 'LINEAR_MIPMAP_NEAREST',
        generateMipmap: true
      }]
    },
    onError: function() {
      alert("There was an error creating the app.");
    },
    onLoad: function(app) {
      //Unpack app properties
      var gl = app.gl,
          scene = app.scene,
          camera = app.camera,
          canvas = app.canvas,
          width = canvas.width,
          height = canvas.height,
          program = app.program,
          shadowScene = new Scene(program.earth, camera),
          clearOpt = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT,
          theta = 0;

      //Map manager
      mapManager = {
        busy: false,
        busyClose: false,
        busyOpen: false,
        fx: new Fx,
        mapOpened: false,
        select: function(name, callback) {
          if (this.busy) return;
          this.busy = true;
          callback = callback || function() {};
          var that = this;
          if (this.mapOpened) {
            this.close(function() {
              if (name != currentSolid) {
                that.open(name, function() {
                  that.busy = false;
                  callback();
                });
              } else {
                that.busy = false;
                callback();
              }
            });
          } else {
            this.open(name, function() {
              that.busy = false;
              callback();
            });
          }
        },
        close: function(callback) {
          if (this.mapOpened && !this.busyClose) {
            this.busyClose = true;
            var that = this,
                earthProgram = program.earth;
            //start animation
            this.fx.start({
              onCompute: function(delta) {
                earthProgram.setUniform('action', 1);
                earthProgram.setUniform('delta', delta);
              },
              onComplete: function() {
                that.busyClose = false;
                that.mapOpened = false;
                //show UVSphere and hide solid
                earth.display = true;
                if (currentSolid) {
                  solids[currentSolid].display = false;
                }
                callback();
              },
              transition: Fx.Transition.Cubic.easeInOut,
              duration: 2000,
            });
          } else {
            this.busyClose = false;
            this.mapOpened = false;
            //show UVSphere and hide solid 
            earth.display = true;
            if (currentSolid) {
              solids[currentSolid].display = false;
            }
            callback();
          }
        },
        open: function(name, callback) {
          if (!this.mapOpened && !this.busyOpen) {
            this.busyOpen = true;
            var that = this,
                earthProgram = program.earth;
            //set current solid
            currentSolid = name;
            //hide earth
            earth.display = false;
            //show solid
            solids[name].display = true;
            //start animation
            this.fx.start({
              onCompute: function(delta) {
                earthProgram.setUniform('action', 0);
                earthProgram.setUniform('delta', delta);
              },
              onComplete: function() {
                that.busyOpen = false;
                that.mapOpened = true;
                callback();
              },      
              transition: Fx.Transition.Cubic.easeInOut,
              duration: 2000,
            });
          } else {
            this.busyOpen = false;
            this.mapOpened = true;
            callback();
          }
        }
      };
                  
      //Create plane
      var plane = new O3D.PlaneXZ({
        width: width / 100,
        nwidth: 5,
        height: -2.6,
        depth: height / 100,
        ndepth: 5,
        textures: 'shadow-texture',
        program: 'plane'
      });

      //Create animation object for transitioning temp maps.
      var fx = new Fx({
        transition: Fx.Transition.Cubic.easeInOut,
        duration: 4000,
        onCompute: function(delta) {
          camera.position.z = Fx.compute(this.opt.from, this.opt.to, delta);
          camera.update();
        }
      });

      fx.start({
        from: -2,
        to: -8
      });
     
      gl.viewport(0, 0, width, height);
      gl.clearColor(1, 1, 1, 1);
      gl.clearDepth(1);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
        
      //create framebuffer
      app.setFrameBuffer('shadow', {
        width: width,
        height: height,
        bindToTexture: {
          parameters: [{
            name: 'TEXTURE_MAG_FILTER',
            value: 'LINEAR'
          }, {
            name: 'TEXTURE_MIN_FILTER',
            value: 'LINEAR_MIPMAP_NEAREST',
            generateMipmap: false
          }]
        },
        bindToRenderBuffer: true
      });    

      //Add objects to the scenes
      scene.add(earth, plane);
      shadowScene.add(earth);
      //add solids
      for (var name in solids) {
        scene.add(solids[name]);
        shadowScene.add(solids[name]);
      }
      
      draw();

      function draw() {
        fx.step();
        mapManager.fx.step();
        drawShadow();
        drawEarth();
      }

      function drawShadow() {
        program.earth.use();
        app.setFrameBuffer('shadow', true);
        gl.clear(clearOpt);
        program.earth.setUniform('renderType', Types.SHADOW);
        shadowScene.renderToTexture('shadow');
        app.setFrameBuffer('shadow', false);
      }

      //Draw the scene
      function drawEarth() {
        gl.clear(clearOpt);
        //Update position
        if (!app.dragging && theta == 0) {
          earth.rotation.set(Math.PI, 0,  0);
          earth.update();
        } 
        theta += 0.0001;
        //render objects
        gl.clear(clearOpt);
        scene.render({
          onBeforeRender: function(elem) {
            var p = program[elem.program];
            if (elem.program == 'earth') {
              p.setUniform('renderType', Types.EARTH);
              p.setUniform('cloudOffset', theta);
              p.setUniform('alphaAngle', 0);
            } else if (elem.program == 'plane') {
              p.setUniform('width', width);
              p.setUniform('height', height);
            }
          }
        });
        //Request Animation Frame
        Fx.requestAnimationFrame(draw);
      }
    }
  });
}


