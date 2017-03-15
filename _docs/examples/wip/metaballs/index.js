(function() {
  //Unpack PhiloGL modules
  PhiloGL.unpack();

  //paralelization index
  var n = 1,
  //number of workers
      nWorkers = Math.pow(8, n), 
  //ratio to divide the grid
      den = n + 1,
  //number of particles
      nBalls = 10,
  //initialize balls
      balls = new Balls(nBalls, Grid),
  //initialize workers
      workerGroup = new WorkerGroup('WorkerMarchingCube.js', nWorkers),
  //cubemap images
      images,
  //application
      app,
  //current texture
      currentTexture = 'interstellar';

  var model;
  
  var len = 2, offset = 1.00001;
  
  //create cube plane
  var plane1 = new O3D.Plane({
      type: 'x,y',
      xlen: len,
      ylen: len,
      offset: offset,
      program: 'cubemap',
      textures: [currentTexture + '-cubemap'],
      uniforms: {
        useReflection: false
      }
    }),
    plane2 = new O3D.Plane({
      type: 'x,z',
      xlen: len,
      zlen: len,
      offset: -offset,
      program: 'cubemap',
      textures: [currentTexture + '-cubemap'],
      uniforms: {
        useReflection: false
      }
    }),
    plane3 = new O3D.Plane({
      type: 'x,z',
      xlen: len,
      zlen: len,
      offset: offset,
      program: 'cubemap',
      textures: [currentTexture + '-cubemap'],
      uniforms: {
        useReflection: false
      }
    }),
    plane4 = new O3D.Plane({
      type: 'y,z',
      ylen: len,
      zlen: len,
      offset: -offset,
      program: 'cubemap',
      textures: [currentTexture + '-cubemap'],
      uniforms: {
        useReflection: false
      }
    }),
    plane5 = new O3D.Plane({
      type: 'y,z',
      ylen: len,
      zlen: len,
      offset: offset,
      program: 'cubemap',
      textures: [currentTexture + '-cubemap'],
      uniforms: {
        useReflection: false
      }
    }),
    planes = [plane1, plane2, plane3, plane4, plane5];

  //create a generic animation object
  var fx = new Fx({
    duration: 2000,
    transition: Fx.Transition.Quint.easeOut,
    onCompute: function(delta) {
      for (var i = 0; i < 5; ++i) {
        planes[i].uniforms = { delta: delta };
      }
      if (model) {
        model.uniforms = { delta: delta };
      }
    }
  });

  function animate(toTexture) {
    var env = [currentTexture, toTexture],
        planeEnv = env.map(function(n) { return n + '-cubemap'; }),
        modelEnv = env.map(function(n) { return n + '-cube'; });

    for (var i = 0; i < 5; ++i) {
      planes[i].textures = planeEnv;
      planes[i].uniforms = { delta: 0 };
    }

    if (model) {
      model.textures = modelEnv;
      model.uniforms = { delta: 0 };
    }
    currentTexture = toTexture;
    fx.start();
  }

  //load images
  function loadImages(callback) {
    var srcs = [];
    ['interstellar', 'grimmnight', 'miramar', 'stormydays', 'violentdays'].forEach(function(name) {
      srcs.push.apply(srcs, ['px', 'nx', 'py', 'ny', 'pz', 'nz'].map(function(n) { 
        return name + '/' + n + '.jpg'; 
      }));
    });
    
    return IO.Images({
      src: srcs,
      onComplete: callback
    });
  }
  
  //handle for when the page has loaded.
  window.init = function() {
    //load images
    images = loadImages(initApp);
    //add events
    Array.prototype.slice.call(document.querySelectorAll('ul li img')).forEach(function(img) {
      img.addEventListener('click', function() {
        animate(img.title.toLowerCase());
      }, false);
    });
  };

  //init a WebGL application.
  function initApp() {
    //Create App
    PhiloGL('canvas', {
      program: [{
        id: 'default',
        from: 'uris',
        vs: 'box.vs.glsl',
        fs: 'box.fs.glsl',
        noCache: true
      }, {
        id: 'cubemap',
        from: 'uris',
        vs: 'box2.vs.glsl',
        fs: 'box2.fs.glsl',
        noCache: true
      }],
      camera: {
        fov: 80,
        position: {
          x: 0, y: 0, z: -1.35
        },
        target: {
          x: 0, y: 0, z: 1
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
              x: -1, 
              y: -1, 
              z: -1 
            }
          }
        }
      },
      onError: function() {
        alert("There was an error while creating the WebGL application");
      },
      onLoad: application
    });
  }

  //create textures
  function createTextures(images) {
    var gl = app.gl;

    ['interstellar', 'grimmnight', 'miramar', 'stormydays', 'violentdays'].forEach(function(name, idx) {
      idx *= 6;
      //cubemap for sphere
      app.setTexture(name + '-cube', {
        textureType: gl.TEXTURE_CUBE_MAP,
        textureTarget: [gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                        gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z],
        pixelStore: [{
          name: gl.UNPACK_FLIP_Y_WEBGL,
          value: false
        }],
        data: {
          value: images.slice(idx, idx + 6)
        }
      });
      //cubemap for cube
      app.setTexture(name + '-cubemap', {
        textureType: gl.TEXTURE_CUBE_MAP,
        textureTarget: [gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z],
        pixelStore: [{
          name: gl.UNPACK_FLIP_Y_WEBGL,
          value: true
        }],
        data: {
          value: images.slice(idx, idx + 6)
        }
      });
    });
  }
  
  //Render the scene and perform a new loop
  function render() {
    var gl = app.gl;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    app.scene.render();
    balls.update();
    Fx.requestAnimationFrame(mapReduce);
  }

  //paralelize marching cubes.
  function mapReduce() {
    var x = Grid.x,
        xfrom = x.from,
        xto = x.to,
        xstep = x.step,
        nx = ((xto - xfrom) / den),
        y = Grid.y,
        yfrom = y.from,
        yto = y.to,
        ystep = y.step,
        ny = ((yto - yfrom) / den),
        z = Grid.z,
        zfrom = z.from,
        zto = z.to,
        zstep = z.step,
        nz = ((zto - zfrom) / den);

    workerGroup.map(function(nb) {
      var idx = nb % den,
          idy = ((nb / den) >> 0) % den,
          idz = ((nb / den / den) >> 0) % den;
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
          },
          z: {
            from: zfrom + idz * nz,
            to: zfrom + idz * nz + nz,
            step: zstep
          }
        },
        isolevel: 10,
        balls: balls.ballsArray
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
      onComplete: updateModel
    });
  }

  //create and update the metaballs model.
  function updateModel(data) {
    if (!model) {
      model = new O3D.Model({
        // drawMode: 'DYNAMIC_DRAW',
        vertices: data.vertices,
        normals: data.normals,
        dynamic: true,
        textures: [currentTexture + '-cube'],
        program: 'default',
        uniforms: {
          useReflection: true,
          reflection: 0.8,
          refraction: 0
        }
      });
      model.position.set(0, 0, -0.6);
      model.update();
      app.scene.add(model);
    } else {
      model.vertices = data.vertices;
      model.normals = data.normals;
      model.dynamic = true;
    }
    render();
  }
      
  //application callback
  function application(appParam) {
      app = appParam;

      var gl = appParam.gl,
          canvas = gl.canvas,
          scene = appParam.scene,
          camera = appParam.camera;
      
      gl.viewport(0, 0, canvas.width, canvas.height);
      //Basic gl setup
      gl.clearDepth(1.0);
      gl.clearColor(0.5, 0.5, 0.5, 1.0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      //create textures
      createTextures(images);
      //Add balls
      scene.add(plane1, plane2, plane3, plane4, plane5);
      //run loop
      mapReduce();
    }
})();
