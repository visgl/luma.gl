PhiloGL.unpack();

var $ = function(d) { return document.getElementById(d); };

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

window.addEventListener('DOMContentLoaded', init, false);

function init() {
  Log.write('Loading...');

  var models = {},
      data   = {},
      tooltip = $('tooltip');

  //Create application
  PhiloGL('map', {
    program: [{
      id: 'elevation',
      from: 'uris',
      path: './shaders/',
      vs: 'elevation.vs.glsl',
      fs: 'elevation.fs.glsl',
      noCache: true
    }, {
      id: 'markers',
      from: 'uris',
      path: './shaders/',
      vs: 'markers.vs.glsl',
      fs: 'markers.fs.glsl',
      noCache: true
    }],
    camera: {
      position: {
        x: 0, y: 0, z: 0.65
      }
    },
    scene: {
      renderPickingScene: function(opt) {
        var o3dList = opt.o3dList,
            stations = models.markers,
            map = models.map;

        o3dList.push(stations);
        stations.uniforms.picking = true;
        map.uniforms.picking = true;
        //render to texture
        this.renderToTexture('$picking');
        //reset picking
        stations.uniforms.picking = false;
        map.uniforms.picking = false;
      }
    },
    textures: {
      urls: ['img/elevation_3764_2048_post_small.jpg'],
      parameters: [{
        name: 'TEXTURE_MAG_FILTER',
        value: 'LINEAR'
      }, {
        name: 'TEXTURE_MIN_FILTER',
        value: 'LINEAR_MIPMAP_NEAREST',
        generateMipmap: true
      }]
    },
    events: {
      picking: true,
      centerOrigin: false,
      cachePosition: false,
      onClick: function(e, model) {
        if (!model) {
          models.markers.selected = -1;
          return;
        }
        model.selected = model.selected == model.$pickingIndex ? -1 : model.$pickingIndex;
      },
      onMouseEnter: function(e, model) {
        if (model) {
          clearTimeout(this.timer);
          var style = tooltip.style,
              record = data.stations[model.$pickingIndex],
              bbox = this.canvas.getBoundingClientRect();

          style.top = (e.y + 20 + bbox.top) + 'px';
          style.left = (e.x + 10 + bbox.left) + 'px';
          this.tooltip.className = 'tooltip show';
          this.tooltip.innerHTML = buildHTML(record, data.weather[models.markers.index || 0][model.$pickingIndex]);
        }

        function buildHTML(rec, data) {
          var title = rec.name[0] + rec.name.slice(1).toLowerCase() + ', ' + rec.abbr,
              lat = rec.lat,
              lon = rec.long,
              elv = rec.elv,
              tmp = Math.round((data[2] - 100) - 32 * (5 / 9)),
              dir = data[0] == 8 ? 'NA' : ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'][data[0]],
              spd = data[1];

          var html = '<h1>' + title + '</h1>' +
            '<ul>' +
            '<li><b>latitude</b>: ' + lat + '</li>' +
            '<li><b>longitude</b>: ' + lon + '</li>' +
            '<li><b>elevation</b>: ' + elv + 'm</li>' +
            '<li><b>temperature</b>: ' + tmp + 'C</li>' +
            '<li><b>wind direction</b>: ' + dir + '</li>' +
            '<li><b>wind speed</b>: ' + spd + ' knots</li>' +
            '</ul>';

          return html;
        }
      },
      onMouseLeave: function(e, model) {
        this.tooltip.className = 'tooltip hide';
      },
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

        this.scene.models.forEach(function(m) {
          m.position.y += (pos.y - e.y) / 1000;
          m.position.x += (e.x - pos.x) / 1000;
          m.update();
        });

        pos.x = e.x;
        pos.y = e.y;
      },
      onMouseWheel: function(e) {
        e.stop();
        var camera = this.camera,
            position = camera.position;

        position.z -= e.wheel / 2;
        if (position.z > 1.36) {
          position.z = 1.36;
        }
        if (position.z < 0.175) {
          position.z = 0.175;
        }
        camera.update();
      }
    },
    onError: function() {
      console.log('error', arguments);
    },
    onLoad: function(app) {
      //Unpack app properties
      var hour = 0,
          gl = app.gl,
          program = app.program,
          scene = app.scene,
          canvas = app.canvas,
          camera = app.camera;

      app.tooltip = $('tooltip');

      Log.write('Fetching data...');

      //gather data and create O3D models
      getModels({
        onProgress: function(perc) {
          Log.write('Fetching data ' + perc + '%');
        },

        onComplete: function(dataAns, modelsAns) {
          $('front-layer').style.display = 'none';
          data = dataAns;
          models = modelsAns;

          //add listeners and behavior to controls.
          setupControls({
            onTimeChange: function(value) {
              var markers = models.markers;
              markers.index = value || 0;
              markers.delta = 0;
            },
            onColorChange: function(value) {
              models.map.uniforms.level = +value;
            },
            onMarkerChange: function(value) {
              models.markers.markerType = value;
            },
            onPlay: function(button) {
              var me = this;
              me.time.disabled = true;
              new Fx({
                duration: 30000,
                transition: Fx.Transition.linear,
                onCompute: function(delta) {
                  var hour = delta * 71,
                  index = hour >> 0,
                  epsi = hour - index,
                  markers = models.markers;

                  me.time.value = index;
                  markers.delta = epsi;
                  markers.index = index;
                },
                onComplete: function() {
                  var markers = models.markers;
                  me.time.value = 0;
                  me.time.disabled = false;
                  markers.index = 0;
                  markers.delta = 0;
                }
              }).start();
            }
          });

          //Basic gl setup
          gl.clearColor(0.0, 0.0, 0.0, 1.0);
          gl.clearDepth(1.0);
          gl.disable(gl.DEPTH_TEST);
          gl.depthFunc(gl.LEQUAL);
          gl.viewport(0, 0, +canvas.width, +canvas.height);

          scene.add(models.map, models.markers);

          draw();

          Log.write('Done.', true);

          //Draw the scene
          function draw() {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            //render model
            scene.render();
            Fx.requestAnimationFrame(draw);
          }
        }
      });
    }
  });
}
