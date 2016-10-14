PhiloGL.unpack();
window.addEventListener('DOMContentLoaded', webGLStart, false);
var width, height;
function resize() {
  var canvas = document.getElementById('wave'),
      style = window.getComputedStyle(canvas);
  height = parseFloat(style.getPropertyValue('height'));
  canvas.height = height;
  width = parseFloat(style.getPropertyValue('width'));
  canvas.width = width;
}

window.addEventListener('resize', resize);

/**
 * starting point
 */
function webGLStart() {
  resize();
  var
      cameraControl,
      RESOLUTIONX = 256.,
      RESOLUTIONY = 256.,
      SIZEX = 1,
      SIZEY = 1,

  // Scene objects
      shore,
      backgroundSphere,
      waterSurface,

  // Frame buffers,
      surfaceBuffer,

      matStart = new Mat4(),
      lastDrop = 0,
      dt = 1,
      drops = 5,
      IOR = 1.3330, // Water
      N = 5;

  matStart.id();

  PhiloGL('wave', {
    program: [
      {
        id: 'shore',
        from: 'uris',
        vs: 'shaders/shore.vs.glsl',
        fs: 'shaders/shore.fs.glsl',
        noCache: true
      },
      {
        id: 'calc',
        from: 'uris',
        vs: 'shaders/plain.vs.glsl',
        fs: 'shaders/calc.fs.glsl',
        noCache: true
      },
      {
        id: 'back',
        from: 'uris',
        vs: 'shaders/back.vs.glsl',
        fs: 'shaders/back.fs.glsl',
        noCache: true
      },
      {
        id: 'drop',
        from: 'uris',
        vs: 'shaders/plain.vs.glsl',
        fs: 'shaders/drop.fs.glsl',
        noCache: true
      },
      {
        id: 'wave',
        from: 'uris',
        vs: 'shaders/wave.vs.glsl',
        fs: 'shaders/wave.fs.glsl',
        noCache: true
      }
    ],

    camera: {
      position: {
        x: 0.16908077347793982,
        y: -0.4663435831751707,
        z: 0.06273240367979076
      },
      up: {
        x: 0,
        y: 0,
        z: 1
      }
    },

    scene: {
      lights: {
        enable: false
      }
    },

    textures: {
      urls: ['StepSky/Normal.jpg', 'StepSky/Reduce1.png', 'StepSky/Reduce2.png', 'StepSky/Reduce3.png', 'rocks.jpg'],
      id: ['SKY0', 'SKY1', 'SKY2', 'SKY3', 'rocks'],
      textureType: 'TEXTURE_2D',
      parameters: [
        {
          name: 'TEXTURE_MAG_FILTER',
          value: 'LINEAR'
        },
        {
          name: 'TEXTURE_MIN_FILTER',
          value: 'LINEAR_MIPMAP_NEAREST',
          generateMipmap: true
        }
      ],
      pixelStore: [
        {
          name: 'UNPACK_FLIP_Y_WEBGL',
          value: false
        }
      ],
      data: {
        width: 1024,
        height: 512
      },
      bindToRenderBuffer: false
    },

    events: {
      cachePosition: false,
      onClick: function(e) {
        if (!this.calculatePosition) {
          return;
        }
        var position = this.calculatePosition(e);
        if (Math.abs(position[0]) > 0.5 * SIZEX || Math.abs(position[1]) > 0.5 * SIZEY) {
          return;
        }
        e.event.preventDefault();
        this.drop(position, .1);
        e.event.preventDefault();
        e.event.stopPropagation();
      },

      onMouseMove: function(e) {
        if (!this.calculatePosition) {
          return;
        }
        var position = this.calculatePosition(e);
        if (Math.abs(position[0]) > 0.5 * SIZEX || Math.abs(position[1]) > 0.5 * SIZEY) {
          return;
        }
        e.event.preventDefault();
        this.drop(position, .05);
        e.event.preventDefault();
        e.event.stopPropagation();
      },

      onMouseWheel: function(e) {
        cameraControl.onMouseWheel(e);
      },

      onDragStart: function(e) {
        cameraControl.onDragStart(e);
      },
      onDragMove: function(e) {
        cameraControl.onDragMove(e);
      }
    },

    onError: function(e) {
      alert(e);
    },

    onLoad: function(app) {
      PhiloGL.unpack();
      window.app = app;
      var start = +new Date();
      // Install controls
      cameraControl = new CameraControl(app.camera);

      var speedControl = document.getElementById('speed');
      speedControl.addEventListener('change', function() {
        dt = +speedControl.value;
      }, false);

      var dropsControl = document.getElementById('drops');
      dropsControl.addEventListener('change', function() {
        drops = +dropsControl.value;
      }, false);

      var iorControl = document.getElementById('ior');
      iorControl.addEventListener('change', function() {
        IOR = Math.pow(1.3330, +iorControl.value);
        waterSurface.uniforms.n2 = IOR;
      }, false);


      // Create framebuffer
      surfaceBuffer = new SwapTexture({width: RESOLUTIONX, height: RESOLUTIONY}, 2);

      // Utility functions
      app.initScene = function() {
        //Create scene
        shore = new O3D.Plane({
          type: 'x,y',
          xlen: 1,
          ylen: 1,
          nx: 10,
          ny: 10,
          program: 'shore',
          textures: ['rocks']
        });
        shore.rotation.x = 15 / 180 * Math.PI;
        shore.position.z = -0.1;
        shore.update();
        var
            u = new Vec3(0.5, 0, 0),
            v = new Vec3(0, 0.5, 0),
            c = new Vec3(0, 0, 0);
        u = shore.matrix.mulVec3(u);
        v = shore.matrix.mulVec3(v);
        c = shore.matrix.mulVec3(c);
        u = u.sub(c);
        v = v.sub(c);

        waterSurface = new O3D.Plane({
          type: 'x,y',
          xlen: SIZEX,
          ylen: SIZEY,
          nx: 128,
          ny: 128,
          offset: 0,
          program: 'wave',
          textures: [surfaceBuffer.from[0] + '-texture', 'SKY0', 'SKY1', 'SKY2', 'SKY3', 'rocks'],
          uniforms: {
            shininess: 3,
            RESOLUTIONX: RESOLUTIONX,
            RESOLUTIONY: RESOLUTIONY,
            n1: 1,
            n2: IOR,
            plainU: u,
            plainV: v,
            plainC: c
          }
        });
        backgroundSphere = new O3D.Sphere({
          nlat: 5,
          nlong: 5,
          radius: 1500,
          program: 'back',
          textures: ['SKY0', 'SKY1', 'SKY2', 'SKY3']
        });
        var scene = this.scene,
            camera = this.camera;
        scene.add(backgroundSphere);
        scene.add(waterSurface);
        camera.fov = 37.8; // 35mm
        camera.far = 1e40;
        camera.update();
      };

      app.update = function() {
        for (var i = 0; i < N; i++) {
          surfaceBuffer.process({
            program: 'calc',
            uniforms: {
              dt: dt / N,
              RESOLUTIONX: RESOLUTIONX,
              RESOLUTIONY: RESOLUTIONY,
              isElevation: true
            }
          }, 0, true);
          surfaceBuffer.process({
            program: 'calc',
            uniforms: {
              dt: dt / N,
              RESOLUTIONX: RESOLUTIONX,
              RESOLUTIONY: RESOLUTIONY,
              isElevation: false
            }
          }, 1);
        }
      };

      app.animate = function() {
        app.update();

        var time = (+new Date() - start) / 1000;

        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, width, height);
        waterSurface.textures = [surfaceBuffer.from[0] + '-texture', 'SKY0', 'SKY1', 'SKY2', 'SKY3', 'rocks'];
        this.scene.render();
        if (lastDrop < time - 300) {
          lastDrop = time - 300;
        }
        if (dt > 0 && drops > 0) {
          while (time > lastDrop + 1 / drops / dt) {
            app.drop([(Math.random() - 0.5) * SIZEX, (Math.random() - 0.5) * SIZEY], 0.3);
            lastDrop += 1 / drops / dt;
          }
        }
        setTimeout(function() {return app.animate.apply(app, arguments);}, 15);
      };

      app.drop = function(position, elevation) {
        surfaceBuffer.process({
          width: RESOLUTIONX,
          height: RESOLUTIONY,
          program: 'drop',
          uniforms: {
            RESOLUTIONX: RESOLUTIONX,
            RESOLUTIONY: RESOLUTIONY,
            cursor: [position[0] / SIZEX, position[1] / SIZEY],
            elevation: elevation
          }
        }, 0);
      };

      app.calculatePosition = function(e) {
        var camera = this.camera,
            x = e.x / width,
            y = e.y / height,
            proj = camera.projection,
            view = camera.view,
            projView = proj.mulMat4(view),
            invView = projView.invert(),
            camPos = camera.position,
            vec = invView.mulVec3(new Vec3(x * 2., y * 2., 100));
        var k = camPos.z / (camPos.z - vec.z);
        return [camPos.x + (vec.x - camPos.x) * k, camPos.y + (vec.y - camPos.y) * k];
      };

      app.initScene();

      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      setTimeout(function() {return app.animate.apply(app, arguments);}, 15);
    }
  });
}
