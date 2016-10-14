var modelLeft, modelRight, pos, completed, $ = function(d) { return document.getElementById(d); };

document.onreadystatechange = function() {
  if (document.readyState == 'complete') {
      completed = true;
      if (modelLeft) {
          init();
      }
  }
};

//load data
new PhiloGL.IO.XHR({
  url: 'surf_reg_model_both_normal.json.bin',
  responseType: 'arraybuffer',
  noCache: true,
  
  onProgress: function() {
    console.log('progress');
  },
  
  onSuccess: function(buffer) {

    var floatArray    = new Float32Array(buffer),
        uintArray     = new Uint32Array(buffer),
        n             = floatArray[0],
        vertices  = floatArray.subarray(1, n + 1),
        normals   = floatArray.subarray(n + 1, n + n + 1),
        indices       = uintArray.subarray(n + n + 1, uintArray.length),
        len = indices.length * 3,
        unpackedVerticesLeft = new Float32Array(len),
        unpackedNormalsLeft = new Float32Array(len),
        unpackedVerticesRight = new Float32Array(len),
        unpackedNormalsRight = new Float32Array(len);

    for (var i = 0, l = indices.length; i < l; ++i) {
        var j = indices[i] * 3,
            index = i * 3;

        unpackedVerticesLeft[index    ] = vertices[j    ];
        unpackedVerticesLeft[index + 1] = vertices[j + 1];
        unpackedVerticesLeft[index + 2] = vertices[j + 2];
        unpackedVerticesRight[index    ] = -vertices[j    ];
        unpackedVerticesRight[index + 1] = vertices[j + 1];
        unpackedVerticesRight[index + 2] = vertices[j + 2];
        
        unpackedNormalsLeft[index    ] = normals[j    ];
        unpackedNormalsLeft[index + 1] = normals[j + 1];
        unpackedNormalsLeft[index + 2] = normals[j + 2];
        unpackedNormalsRight[index    ] = -normals[j    ];
        unpackedNormalsRight[index + 1] = normals[j + 1];
        unpackedNormalsRight[index + 2] = normals[j + 2];
    }

    // console.log('n', n, 'vertices', verticesLeft.length, 'indices', indices.length);

    modelLeft = new PhiloGL.O3D.Model({
      vertices: unpackedVerticesLeft,
      normals: unpackedNormalsLeft,
      program: 'brain',
      shininess: 5,
      uniforms: {
          colorUfm: [230/255, 114/255, 119/255, 1]
      }
    });
    
    modelRight = new PhiloGL.O3D.Model({
      vertices: unpackedVerticesRight,
      normals: unpackedNormalsRight,
      program: 'brain',
      shininess: 20,
      uniforms: {
          colorUfm: [230/255, 114/255, 119/255, 1]
      }
    });

    
    if (completed) {
        init();
    }
  },

  onError: function(e, ...args) {
    console.log('error', e, ...args);
  }
}).send();


function init() {
  //Create application
  PhiloGL('brain-canvas', {
    program: [{
        id: 'brain',
        from: 'uris',
        vs: 'brain.vs.glsl',
        fs: 'brain.fs.glsl',
        noCache: true
    }],
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
            r: 0.8, 
            g: 0.8, 
            b: 0 
          },
          position: { 
            x: 250, 
            y: 250, 
            z: 250 
          }
        }
      }
    },
    camera: {
      position: {
        x: 0, y: 0, z: 250
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

        modelLeft.rotation.y += -(pos.x - e.x) / 100;
        modelLeft.rotation.x += sign * (pos.y - e.y) / 100;
        modelRight.rotation.y += -(pos.x - e.x) / 100;
        modelRight.rotation.x += sign * (pos.y - e.y) / 100;
        modelLeft.update();
        modelRight.update();

        pos.x = e.x;
        pos.y = e.y;
      },

      onMouseWheel: function(e) {
        e.stop();
        var camera = this.camera;
        camera.position.z -= e.wheel * 2;
        camera.update();
      }
    },
    onError: function() {
    },
    onLoad: function(app) {
      //Unpack app properties
      var gl = app.gl,
          program = app.program,
          scene = app.scene,
          canvas = app.canvas,
          camera = app.camera;

      //Basic gl setup
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clearDepth(1.0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.viewport(0, 0, +canvas.width, +canvas.height);
      //Add object to the scene
      scene.add(modelLeft, modelRight);
      //draw
      draw();

      //Draw the scene
      function draw() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //render model
        scene.render();
        PhiloGL.Fx.requestAnimationFrame(draw);
      }
    }
  });
}
