function getModels(callback) {
  //MODELS

  //us surface
  var surface = new O3D.Plane({
    type: 'x,y',
    xlen: 1,
    ylen: 0.5,
    nx: 100,
    ny: 50,
    offset: 0,
    textures: ['img/elevation_3764_2048_post_small.jpg'],
    program: 'elevation',
    uniforms: {
      level: 3
    }
  });
  
  //markers in map
  function MapMarkers(data) {
    var stations = data.stations,
        l = stations.length;

    O3D.Plane.call(this, {
      type: 'x,y',
      pickable: true,
      xlen: 1,
      ylen: 1,
      offset: 0,
      program: 'markers',

      pick: function(pixel) {
        //if the color is not the background color...
        if (pixel[0] !== 0 || pixel[1] !== 0 || pixel[2] !== 0) {
          var r = pixel[0],
              g = pixel[1],
              b = pixel[2];

          return r + g * 255 + b * 255 * 255;
        }

        return false;
      },

      render: function(gl, program, camera) {
        //enable blend if I'm not picking
        if (!this.uniforms.picking) {
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          gl.enable(gl.BLEND);
          gl.disable(gl.DEPTH_TEST);
        }
        
        var TRIANGLES = gl.TRIANGLES, 
            indicesLength = this.$indicesLength, 
            UNSIGNED_SHORT = gl.UNSIGNED_SHORT,
            selected = this.selected,
            weather = data.weather,
            index = this.index || 0,
            delta = this.delta || 0,
            weatherFrom = weather[index],
            weatherTo = weather[index + 1],
            markerType = this.markerType;

        for (var i = 0; i < l; i++) {
             var station = stations[i],
                 suc = i,
                 r = suc % 255,
                 g = (suc / 255 >> 0) % 255,
                 b = (suc / 255 / 255 >> 0) % 255;

             program.setUniforms({
               lat: station.lat,
               lon: station.long,
               dataFrom: weatherFrom[i],
               dataTo: weatherTo ? weatherTo[i] : weatherFrom[i],
               delta: delta,
               pickColor: [r / 255, g / 255, b / 255],
               selected: selected === suc,
               markerType: markerType
             });

             gl.drawElements(TRIANGLES, indicesLength, UNSIGNED_SHORT, 0);
           }

           //disable blend
           gl.disable(gl.BLEND);
           gl.enable(gl.DEPTH_TEST);
      }
    });
  }

  MapMarkers.prototype = Object.create(O3D.Plane.prototype);

  
  //DATASETS

  //get data for stations
  function getStations(callback) {
    new IO.XHR({
      url: 'data/stations.json',
      onError: function() {
        console.log('there was an error while making the XHR request');
      },
      onSuccess: function(text) {
        callback(JSON.parse(text));
      }
    }).send();
  }

  //get weather station data
  function getWeatherData(callbackProgress, callback) {
    new IO.XHR({
      url: 'data/weather.bin',
      responseType: 'arraybuffer',
      onError: function() {
        console.log('there was an error while making the XHR request');
      },
      onProgress: function(e, perc) {
        callbackProgress(perc);
      },
      onSuccess: function(buffer) {
        var bufferData = new Uint16Array(buffer),
        hours = 72,
        components = 3,
        l = bufferData.length / (hours * components),
        hourlyData = Array(hours);

        for (var i = 0; i < hours; ++i) {
          hourlyData[i] = createHourlyData(bufferData, i, l, hours, components);
        }
        callback(hourlyData);
      }
    }).send();

    function createHourlyData(bufferData, i, l, hours, components) {
      var len = bufferData.length,
      array = Array(l);

      for (var j = i * components, count = 0; count < l; j += (hours * components)) {
        array[count++] = new Float32Array([bufferData[j    ],
                                          bufferData[j + 1],
                                          bufferData[j + 2]]);
      }

      return array;
    }
  }

  //get data and create models.
  getWeatherData(callback.onProgress, function(weather) {
    getStations(function(stations) {
      var data = {
        stations: stations,
        weather: weather
      };
      var models = {
        map: surface,
        markers: new MapMarkers(data)
      };
      callback.onComplete(data, models);
    });
  });
}
