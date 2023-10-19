/* eslint-disable */
/* global $, Image */

// Prepare list of filter-capable shader modules
function getFilterModules(filters) {
  const modules = {};
  Object.keys(filters).forEach(key => {
    if (filters[key].passes) {
      luma.normalizeShaderModule(filters[key]);
      modules[key] = filters[key];
    }
  });
  return modules;
}

const filterModules = getFilterModules(luma.filters);
// console.log(filterModules);

let canvas;
let canvas2d;
let texture;
let selectedItem;
let selectedFilter;

function loadImage(src) {
  const image = new Image();
  image.onload = () => {
    if (selectedItem) {
      contractItem(selectedItem);
    }
    if (selectedFilter) {
      setSelectedFilter(null);
    }
    selectedItem = null;
    hideDialog();
    init(image);
  };
  image.crossOrigin = 'anonymous';
  image.src = src;
}

function showDialog() {
  $('#fade').fadeIn();
  $('#dialog').show().css({
    top: -$('#dialog').outerHeight()
  }).animate({
    top: 0
  });
}

function hideDialog() {
  $('#fade').fadeOut();
  $('#dialog').animate({
    top: -$('#dialog').outerHeight()
  }, function() {
    $('#dialog').hide();
  });
}

function contractItem(item) {
  $(item).removeClass('active').animate({ paddingTop: 0 });
  $(item).children('.contents').slideUp();
}

function expandItem(item) {
  $(item).addClass('active').animate({ paddingTop: 10 });
  $(item).children('.contents').slideDown();
}

function setSelectedFilter(filter) {
  canvas2d.getContext('2d').clearRect(0, 0, canvas2d.width, canvas2d.height);

  // Set the new filter
  $('#nubs').html('');
  selectedFilter = filter;

  // Update UI elements and draw filter
  if (filter) {
    // Reset all sliders
    for (let i = 0; i < filter.sliders.length; i++) {
      var slider = filter.sliders[i];
      $('#' + slider.id).slider('value', slider.value);
    }

    // Reset all curves
    for (let i = 0; i < filter.curves.length; i++) {
      var curves = filter.curves[i];
      filter.values[curves.name] = [[0, 0], [1, 1]];
      curves.draw();
    }

    // Reset all segmented controls
    for (let i = 0; i < filter.segmented.length; i++) {
      var segmented = filter.segmented[i];
      $('#' + segmented.id + '-' + segmented.initial).mousedown();
    }

    // Generate all nubs
    for (let i = 0; i < filter.nubs.length; i++) {
      var nub = filter.nubs[i];
      var x = nub.x * canvas.width;
      var y = nub.y * canvas.height;
      $('<div class="nub" id="nub' + i + '"></div>').appendTo('#nubs');
      var ondrag = (function(nub) { return function(event, ui) {
        var offset = $(event.target.parentNode).offset();
        var height = event.target.parentNode.clientHeight;
        filter.values[nub.name] = [
          ui.offset.left - offset.left,
          height - (ui.offset.top - offset.top)
        ];
        filter.update();
      }; })(nub);
      $('#nub' + i).draggable({
        drag: ondrag,
        containment: 'parent',
        scroll: false
      }).css({ left: x, top: y });

      filter.values[nub.name] = [x, y];
    }

    if (filter.reset) {
      filter.reset();
    }
    filter.update();
  } else {
    canvas.draw();
  }
}

function init(image) {
  // Create a texture from the image and draw it to the canvas
  if (texture) {
    texture.destroy();
  }
  canvas.setTexture(image).draw();

  // Set the bounds of the drag area so nubs can't be dragged off the image
  $('#nubs').css({
    width: image.width,
    height: image.height
  });
  canvas2d.width = image.width;
  canvas2d.height = image.height;

  // We're done loading, show the UI to the user
  if (selectedItem) contractItem(selectedItem);
  setSelectedFilter(null);
  selectedItem = null;
  $('#loading').hide();
}

$(window).load(function() {
  // Try to get a WebGL canvas
  if (!window.luma) {
    $('#loading')
      .css('visibility', 'visible')
      .html('Could not load luma.gl, please check your internet connection');
    return;
  }

  try {
    canvas = new luma._Canvas().replace($('#placeholder')[0]);
  } catch (error) {
    const message = `\
<div class="sadface">:(</div>Sorry, but this browser doesn\'t support WebGL.<br>Please see
 <a href="http://www.khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">
   Getting a WebGL implementation
</a>. </br></br> ${error}`;
    $('#loading')
      .css('visibility', 'visible')
      .html(message);
    return;
  }
  canvas2d = $('#canvas2d')[0];

  // Generate the HTML for the sidebar
  var nextID = 0;
  for (var category in filters) {
    $('<div class="header">' + category + '</div>').appendTo('#sidebar');
    for (let i = 0; i < filters[category].length; i++) {
      var filter = filters[category][i];

      // Generate the HTML for the controls
      var html = '<div class="item"><div class="title">' + filter.name + '</div><div class="contents"><table>';
      for (var j = 0; j < filter.sliders.length; j++) {
        var slider = filter.sliders[j];
        slider.id = 'control' + nextID++;
        html += '<tr><td>' + slider.label + ':</td><td><div class="slider" id="' + slider.id + '"></div></td></tr>';
      }
      for (var j = 0; j < filter.segmented.length; j++) {
        var segmented = filter.segmented[j];
        segmented.id = 'control' + nextID++;
        html += '<tr><td>' + segmented.label + ':</td><td><div class="segmented">';
        for (var k = 0; k < segmented.labels.length; k++) {
          html += '<div class="segment' + (k == segmented.initial ? ' selected' : '') + '" id="' + segmented.id + '-' + k + '">' + segmented.labels[k] + '</div>';
        }
        html += '</div></td></tr>';
      }
      html += '</table>';
      for (var j = 0; j < filter.curves.length; j++) {
        var curves = filter.curves[j];
        curves.id = 'control' + nextID++;
        html += '<canvas class="curves" id="' + curves.id + '"></canvas>';
      }
      html += '<div class="button accept">Accept</div><div class="reset">Reset</div></div></div>';
      var item = $(html).appendTo('#sidebar')[0];
      item.filter = filter;

      // Add reset button
      (function(filter) {
        $(item).find('.reset').click(function() {
          setSelectedFilter(filter);
        });
      })(filter);

      // Make segmented controls
      for (var j = 0; j < filter.segmented.length; j++) {
        var segmented = filter.segmented[j];
        filter[segmented.name] = segmented.initial;
        for (var k = 0; k < segmented.labels.length; k++) {
          $('#' + segmented.id + '-' + k).mousedown((function(filter, segmented, index) { return function() {
            filter[segmented.name] = index;
            for (var k = 0; k < segmented.labels.length; k++) {
              $('#' + segmented.id + '-' + k)[index == k ? 'addClass' : 'removeClass']('selected');
            }
            filter.update();
          }; })(filter, segmented, k));
        }
      }

      // Set all initial nub values
      for (var j = 0; j < filter.nubs.length; j++) {
        var nub = filter.nubs[j];
        var x = nub.x * canvas.width;
        var y = nub.y * canvas.height;
        filter.values[nub.name] = [x, y];
      }

      // Set up curves
      for (var j = 0; j < filter.curves.length; j++) {
        var curves = filter.curves[j];
        (function(curves, filter) {
          var canvas = $('#' + curves.id)[0];
          var c = canvas.getContext('2d');
          var w = canvas.width = $(canvas).width();
          var h = canvas.height = $(canvas).height();
          var start = 0;
          var end = 1;

          // Make sure there's always a start and end node
          function fixCurves() {
            if (point[0] == 0) start = point[1];
            if (point[0] == 1) end = point[1];
            var points = filter.values[curves.name];
            var foundStart = false;
            var foundEnd = false;
            for (let i = 0; i < points.length; i++) {
              var p = points[i];
              if (p[0] == 0) {
                foundStart = true;
                if (point[0] == 0 && p != point) points.splice(i--, 1);
              } else if (p[0] == 1) {
                foundEnd = true;
                if (point[0] == 1 && p != point) points.splice(i--, 1);
              }
            }
            if (!foundStart) points.push([0, start]);
            if (!foundEnd) points.push([1, end]);
          };

          // Render the curves to the canvas
          curves.draw = function() {
            var points = filter.values[curves.name];
            var map = luma.filters.splineInterpolate(points);
            c.clearRect(0, 0, w, h);
            c.strokeStyle = '#4B4947';
            c.beginPath();
            for (let i = 0; i < map.length; i++) {
              c.lineTo(i / map.length * w, (1 - map[i] / 255) * h);
            }
            c.stroke();
            c.fillStyle = 'white';
            for (let i = 0; i < points.length; i++) {
              var p = points[i];
              c.beginPath();
              c.arc(p[0] * w, (1 - p[1]) * h, 3, 0, Math.PI * 2, false);
              c.fill();
            }
          };

          // Allow the curves to be manipulated using the mouse
          var dragging = false;
          var point;
          function getMouse(e) {
            var offset = $(canvas).offset();
            var x = Math.max(0, Math.min(1, (e.pageX - offset.left) / w));
            var y = Math.max(0, Math.min(1, 1 - (e.pageY - offset.top) / h));
            return [x, y];
          }

          $(canvas).mousedown(function(e) {
            var points = filter.values[curves.name];
            point = getMouse(e);
            for (let i = 0; i < points.length; i++) {
              var p = points[i];
              var x = (p[0] - point[0]) * w;
              var y = (p[1] - point[1]) * h;
              if (x * x + y * y < 5 * 5) {
                point = p;
                break;
              }
            }
            if (i == points.length) {
              points.push(point);
            }
            dragging = true;
            fixCurves();
            curves.draw();
            filter.update();
          });

          $(document).mousemove(function(e) {
            if (dragging) {
              var p = getMouse(e);
              point[0] = p[0];
              point[1] = p[1];
              fixCurves();
              curves.draw();
              filter.update();
            }
          });
          $(document).mouseup(function() {
            dragging = false;
          });

          // Set the initial curves
          filter.values[curves.name] = [[0, 0], [1, 1]];
          curves.draw();
        })(curves, filter);
      }

      // Make jQuery UI sliders
      for (var j = 0; j < filter.sliders.length; j++) {
        var slider = filter.sliders[j];
        filter.values[slider.name] = slider.value;
        var onchange = (function(filter, slider) { return function(event, ui) {
          filter.values[slider.name] = ui.value;
          if (selectedFilter == filter) filter.update();
        }; })(filter, slider);
        $('#' + slider.id).slider({
          slide: onchange,
          change: onchange,
          min: slider.min,
          max: slider.max,
          value: slider.value,
          step: slider.step
        });
      }
    }
  }

  // Change the filter when a sidebar item is clicked
  $('#sidebar .item .title').live('mousedown', function(e) {
    var item = e.target.parentNode;
    if (selectedItem) contractItem(selectedItem);
    if (selectedItem != item) {
      expandItem(item);
      selectedItem = item;
      setSelectedFilter(item.filter);
    } else {
      setSelectedFilter(null);
      selectedItem = null;
    }
  });

  // Update texture with canvas contents when a filter is accepted
  $('.accept').live('click', function() {
    contractItem(selectedItem);
    texture.destroy();
    texture = canvas.contents();
    setSelectedFilter(null);
    selectedItem = null;
  });

  // Hook up toolbar buttons
  $('#load').click(function() {
    $('#dialog').html('<div class="contents">Pick one of the sample images below or upload an image of your own:<div class="images">' +
      '<img class="loader" src="https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/mountain.jpg" height="100">' +
      '<img class="loader" src="https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/smoke.jpg" height="100">' +
      '<img class="loader" src="https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/face.jpg" height="100">' +
      '<img class="loader" src="https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/cat.jpg" height="100">' +
      '<img class="loader" src="https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/greyhound.jpg" height="100">' +
      '<img class="loader" src="https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/sunset.jpg" height="100">' +
      '<img class="loader" src="https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/leaf.jpg" height="100">' +
      '<img class="loader" src="https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/perspective.jpg" height="100">' +
      '</div><div class="credits">Flickr image credits in order: ' +
      '<a href="http://www.flickr.com/photos/matthigh/2125630879/">matthigh</a>, ' +
      '<a href="http://www.flickr.com/photos/delosj/5816379127/">delosj</a>, ' +
      '<a href="http://www.flickr.com/photos/stuckincustoms/219537913/">stuckincustoms</a>, ' +
      '<a href="http://www.flickr.com/photos/pasma/580401331/">pasma</a>, ' +
      '<a href="http://www.flickr.com/photos/delosj/5546225759/">delosj</a>, ' +
      '<a href="http://www.flickr.com/photos/seriousbri/3736154699/">seriousbri</a>, ' +
      '<a href="http://www.flickr.com/photos/melisande-origami/157818928/">melisande-origami</a>, and ' +
      '<a href="http://www.flickr.com/photos/stuckincustoms/4669163231/">stuckincustoms</a>' +
      '</div></div>' +
      '<div class="button"><input type="file" class="upload">Upload File...</div>' +
      '<div class="button closedialog">Cancel</div>');
    showDialog();
  });
  $('#dialog input.upload').live('change', function(e) {
    var reader = new FileReader();
    reader.onload = function(e) {
      loadImage(e.target.result);
    };
    reader.readAsDataURL(e.target.files[0]);
  });
  $('#dialog img.loader').live('mousedown', function(e) {
    loadImage(e.target.src);
  });
  $('#save').click(function() {
    window.open(canvas.toDataURL('image/png'));
  });
  $('#about').click(function() {
    $('#dialog').html('<div class="contents">Copyright 2011 <a href="http://madebyevan.com">Evan Wallace</a>' +
    '<br><br>This application is powered by <a href="http://evanw.github.com/glfx.js/">glfx.js</a>, an ' +
    'open-source image effect library that uses WebGL.&nbsp; The source code for this application is ' +
    'also <a href="http://github.com/evanw/webgl-filter/">available on GitHub</a>.</div><div class="button ' +
    'closedialog">Close</div>');
    showDialog();
  });
  $('.closedialog').live('click', function() {
    hideDialog();
  });

  // Start loading the first image
  loadImage('https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/mountain.jpg');
});

// Filter object

class Filter {
  constructor(name, module, init, update, reset) {
    this.name = name;
    this._update = update;
    this.reset = reset;

    this.sliders = [];
    this.curves = [];
    this.segmented = [];
    this.nubs = [];

    this.values = {};

    this._initShaderModule(module);

    if (init) {
      init.call(this, this);
    }
  }

  update() {
    this._update(this.values);
  }

  addSlider(name, label, min, max, value, step) {
    this.sliders.push({ name: name, label: label, min: min, max: max, value: value, step: step });
    this.values[name] = value;
  }

  addNub(name, value) {
    this.nubs.push({ name: name, x: value[0], y: value[1] });
    this.values[name] = value;
  }

  addCurves(name) {
    this.curves.push({ name: name });
  }

  addSegmented(name, label, labels, initial) {
    this.segmented.push({ name: name, label: label, labels: labels, initial: initial });
  }

  _initShaderModule(module) {
    if (module.uniforms) {
      for (const uniformName in module.uniforms) {
        const uniform = module.uniforms[uniformName];

        if (!uniform.private) {
          switch (uniform.type) {
          case 'number':
            const min = uniform.softMin || uniform.min || 0;
            const max = uniform.softMax || uniform.max || 1;
            const step = (max - min) / 100;
            this.addSlider(uniformName, uniformName, min, max, uniform.value, step);
            break;
          default:
            if (Array.isArray(uniform.value)) {
              // Assume texCoords
              this.addNub(uniformName, uniform.value);
            } else {
              console.log(uniform);
            }
          }
        }
      }
    }

    this._update = values => {
      canvas.filter(module, values)
    }
  }
}

const filters = {
  'Adjust': [
    new Filter('Brightness / Contrast', filterModules.brightnessContrast),
    new Filter('Hue / Saturation', filterModules.hueSaturation),
    new Filter('Sepia', filterModules.sepia),
    new Filter('Denoise', filterModules.denoise),
    // this.addSlider('strength', 'Strength', 0, 1, 0.5, 0.01);
    // strength: 3 + 200 * Math.pow(1 - this.strength, 4)
    new Filter('Noise', filterModules.noise),
    new Filter('Unsharp Mask', filterModules.unsharpMask),
    //   this.addSlider('radius', 'Radius', 0, 200, 20, 1);
    //   this.addSlider('strength', 'Strength', 0, 5, 2, 0.01);
    new Filter('Vibrance', filterModules.vibrance),
    new Filter('Vignette', filterModules.vignette),
    new Filter('Curves', filterModules.curves,
      filter => {
        filter.addCurves('points');
      },
      values => ({
        map: new Texture2D(gl, {
          width: 256,
          height: 1,
          format: gl.RGBA,
          type: gl.UNSIGNED_BYTE
        })
      })
    )
  ],
  'Blur': [
    new Filter('Triangle Blur', filterModules.triangleBlur),
    new Filter('Zoom Blur', filterModules.zoomBlur),
    // new Filter('Lens Blur', filterModules.lensBlur),
    // this.addSlider('radius', 'Radius', 0, 50, 10, 1);
    // this.addSlider('brightness', 'Brightness', -1, 1, 0.75, 0.01);
    // this.addSlider('angle', 'Angle', 0, Math.PI, 0, 0.01);
    // new Filter('Tilt Shift', function() {
    //   this.addNub('start', 0.15, 0.75);
    //   this.addNub('end', 0.75, 0.6);
    //   this.addSlider('blurRadius', 'Radius', 0, 50, 15, 1);
    //   this.addSlider('gradientRadius', 'Thickness', 0, 400, 200, 1);
    // }, function() {
    //   canvas.filter('tiltShift', this.values)
    // })
  ],
  'Fun': [
    new Filter('Ink', filterModules.ink),
    new Filter('Edge Work', filterModules.edgeWork),
    new Filter('Hexagonal Pixelate', filterModules.hexagonalPixelate),
    new Filter('Dot Screen', filterModules.dotScreen),
    new Filter('Color Halftone', filterModules.colorHalftone),
  ],
  'Warp': [
    new Filter('Swirl', filterModules.swirl),
    new Filter('Bulge / Pinch', filterModules.bulgePinch),
    /*
    new Filter('Perspective', function() {
      this.addSegmented('showAfter', 'Edit point set', ['Before', 'After'], 1);
      this.addNub('a', [0.25, 0.25]);
      this.addNub('b', [0.75, 0.25]);
      this.addNub('c', [0.25, 0.75]);
      this.addNub('d', [0.75, 0.75]);
      var update = this.update;
      this.update = function() {
        update.call(this);

        // Draw a white rectangle connecting the four control points
        var c = canvas2d.getContext('2d');
        c.clearRect(0, 0, canvas2d.width, canvas2d.height);
        for (let i = 0; i < 2; i++) {
          c.beginPath();
          c.lineTo(this.a.x, this.a.y);
          c.lineTo(this.b.x, this.b.y);
          c.lineTo(this.d.x, this.d.y);
          c.lineTo(this.c.x, this.c.y);
          c.closePath();
          c.lineWidth = i ? 2 : 4;
          c.strokeStyle = i ? 'white' : 'black';
          c.stroke();
        }
      };
    }, function() {
      var points = [this.a.x, this.a.y, this.b.x, this.b.y, this.c.x, this.c.y, this.d.x, this.d.y];
      if (this.showAfter) {
        this.after = points;
        canvas.filter('perspective', this.before, this.after).update();
      } else {
        this.before = points;
        canvas.filter('update', );
      }
    }, function() {
      var w = canvas.width, h = canvas.height;
      this.before = [0, 0, w, 0, 0, h, w, h];
      this.after = [this.a.x, this.a.y, this.b.x, this.b.y, this.c.x, this.c.y, this.d.x, this.d.y];
    })
    */
  ]
};
