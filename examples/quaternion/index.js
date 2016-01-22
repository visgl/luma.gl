(function() {
  //Unpack LumaGL modules
  LumaGL.unpack();

  var plane = new O3D.Plane({
      type: 'x,y',
      xlen: 2,
      ylen: 1,
      offset: 1,
      program: 'quat',
      colors: [0.2, 0.3, 0.4, 1, 
               0.8, 0.5, 0.2, 1, 
               0.4, 0.8, 1,   1, 
               0.1, 0.4, 0.8, 1]
  });

  var $ = function(d) {
    return document.getElementById(d);
  };

  window.init = function() {
    var pos;

    //Create App
    LumaGL('canvas', {
      program: [{
        id: 'quat',
        from: 'uris',
        vs: 'surface.vs.glsl',
        fs: 'surface.fs.glsl',
        noCache: true
      }],
      camera: {
        position: {
          fov: 45,
          x: 0, y: 0, z: 1.95
        }
      },
      events: {
        translateToCenter: true,
        onMouseMove: function(e) {
          var camera = this.camera,
              pos = camera.position;
          pos.x = e.x * 0.0001;
          this.program.setUniform('rO', pos.toFloat32Array());
        }
      },
      onError: function() {
        alert("There was an error while creating the WebGL application");
      },
      onLoad:function application(app) {
        var gl = app.gl,
            canvas = gl.canvas,
            scene = app.scene,
            camera = app.camera,
            program = app.program,
            t = Fx.animationTime(),
            animate = $('animate'),
            shadows = $('shadows'),
            backgroundR = $('scolorR'),
            backgroundG = $('scolorG'),
            backgroundB = $('scolorB'),
            maxIterations = $('maxIterations'),
            epsilon = $('epsilon'),
            colorArray = [0, 0, 0, 1],
            panel1 = $('panel1'),
            region1,
            panel2 = $('panel2'),
            region2,
            pointer1 = $('pointer1'),
            pointer2 = $('pointer2'),
            movingPointer1 = false,
            movingPointer2 = false;

        //Add control listeners.
        shadows.addEventListener('change', function() {
          program.setUniform('renderShadows', !!shadows.checked);
        }, false);

        maxIterations.addEventListener('change', function() {
          program.setUniform('maxIterations', +maxIterations.value);
        }, false);

        epsilon.addEventListener('change', function() {
          program.setUniform('epsilon', +epsilon.value);
        }, false);

        animate.addEventListener('change', function() {
          panel1.style.display = animate.checked ? 'none' : '';
          region1 = panel1.getBoundingClientRect();
          panel2.style.display = animate.checked ? 'none' : '';
          region2 = panel2.getBoundingClientRect();
          
          if (!animate.checked) {
            var delta = (Fx.animationTime() - t) / 5000,
                style1 = pointer1.style,
                style2 = pointer2.style,
                correct = function(n) { return ((n + 1) / 2 * 100) >> 0; };

            style1.left = correct(Math.sin(delta)) + 'px';
            style1.top = correct(Math.cos(delta) / 2) + 'px';
            style2.left = correct(Math.sin(2 * delta) / 2) + 'px';
            style2.top = correct(Math.cos(4 * delta) / 2) + 'px';
          }
        }, false);
       
        //DnD stuff begins...
        panel1.addEventListener('mousedown', function(e) {
          var x = e.clientX || e.pageX,
              y = e.clientY || e.pageY,
              xp = x - region1.left,
              yp = y - region1.top,
              style = pointer1.style;

          movingPointer1 = true;
          
          style.left = (xp - 3) + 'px';
          style.top = (yp- 3) + 'px';

          updateMu();
        }, false);
        
        panel2.addEventListener('mousedown', function(e) {
          var x = e.clientX || e.pageX,
              y = e.clientY || e.pageY,
              xp = x - region2.left,
              yp = y - region2.top,
              style = pointer2.style;

          movingPointer2 = true;
          
          style.left = (xp - 3) + 'px';
          style.top = (yp - 3) + 'px';

          updateMu();
        }, false);

        panel1.addEventListener('mouseup', function() {
          movingPointer1 = false;
        }, false);

        panel2.addEventListener('mouseup', function() {
          movingPointer2 = false;
        }, false);

        panel1.addEventListener('mousemove', function(e) {
          if (movingPointer1) {
            var x = e.clientX || e.pageX,
                y = e.clientY || e.pageY,
                xp = x - region1.left,
                yp = y - region1.top,
                style = pointer1.style;

            style.left = xp + 'px';
            style.top = yp + 'px';

            updateMu();
          }
        }, false);

        panel2.addEventListener('mousemove', function(e) {
          if (movingPointer2) {
            var x = e.clientX || e.pageX,
                y = e.clientY || e.pageY,
                xp = x - region2.left,
                yp = y - region2.top,
                style = pointer2.style;

            style.left = xp + 'px';
            style.top = yp + 'px';

            updateMu();
          }
        }, false);

        function updateMu() {
          program.setUniform('mu', [parseInt(pointer1.style.left, 10) / 50 - 1,
                                    parseInt(pointer1.style.top, 10)  / 50 - 1,
                                    parseInt(pointer2.style.left, 10) / 50 - 1,
                                    parseInt(pointer2.style.top, 10)  / 50 - 1]);
        }
        //...DnD stuff ends

        var fn = function() {
          colorArray = [+backgroundR.value, +backgroundG.value, +backgroundB.value, 1];
          program.setUniform('backgroundColor', colorArray);
        };

        [backgroundR, backgroundG, backgroundB].forEach(function(n) { n.addEventListener('change', fn, false); });

        gl.viewport(0, 0, canvas.width, canvas.height);
        //Add balls
        scene.add(plane);
        //set default params.
        program.setUniforms({
          renderShadows: true,
          mu: [-1, 0.2, 0, 0],
          maxIterations: 8,
          epsilon: 0.006,
          rO: camera.position.toFloat32Array(),
          light: [10, 10, 10],
          backgroundColor: [0, 0, 0, 1]
        });
        //run loop
        render();
        //Render the scene and perform a new loop
        function render() {
          var delta = (Fx.animationTime() - t) / 5000;
          
          gl.clearColor(colorArray[0], colorArray[1], colorArray[2], colorArray[3]);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          
          if (animate.checked) {
            program.setUniforms({
              mu: [Math.sin(delta), Math.cos(delta)/2, Math.sin(2 * delta)/2, Math.cos(4 * delta)/2]
            });
          }
          
          scene.render();
          Fx.requestAnimationFrame(render); 
        }
      }
    });
  };
})();

