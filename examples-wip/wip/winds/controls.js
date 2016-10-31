var $ = function(d) { document.getElementById(d); };

function setupControls(callback) {
  var time = $('time'),
      elevation = $('elevation'),
      play = $('play'),
      r1 = $('r1'),
      r2 = $('r2'),
      r3 = $('r3');

  callback.time = time;
  callback.play = play;
  callback.elevation = elevation;

  time.addEventListener('mousemove', function() {
    callback.onTimeChange(+time.value, time);
  }, false);

  elevation.addEventListener('change', function() {
    callback.onColorChange(+elevation.value, elevation);
  }, false);

  play.addEventListener('click', function() {
    callback.onPlay(play);
  }, false);

  function markerHandler(e) {
    if (this.checked) {
      callback.onMarkerChange({ r1: 0, r2: 1, r3: 2 }[this.id]);
    }
  }

  r1.addEventListener('change', markerHandler, false);
  r2.addEventListener('change', markerHandler, false);
  r3.addEventListener('change', markerHandler, false);
}
