(function () {

var $ = function(d) { return document.getElementById(d); },
    $$ = function(d) { return document.querySelectorAll(d); },
    $1 = function(d) { return document.querySelector(d); };

var width = 128,
    height = 128,
    cos = Math.cos,
    sin = Math.sin,
    PI = Math.PI,
    descriptions;

window.initGroupOptions = function(options) {
  var canvas = $('canvas'),
      ctx = canvas.getContext('2d'),
      currentGroup = $('current-group'),
      scale = $('scale'),
      rotate = $('rotate'),
      aura = $('aura'),
      offset = $('offset'),
      hyperbole = $('hyperbole'),
      descriptions = $$('#group-descriptions > div'),
      descriptionContainer = $1('.options-body.details'),
      buttonChange = $1('button.pattern-change'),
      buttonSave = $1('button.pattern-save');

  currentGroup.addEventListener('change', function() {
    options.currentGroupIndex = this.selectedIndex;
    setGroupDescription(this.selectedIndex);
    updateCanvas(ctx, canvas, options);
  }, false);

  scale.addEventListener('mousemove', function() {
    options.scale = +this.value;
  }, false);

  rotate.addEventListener('mousemove', function() {
    options.rotate = +this.value * Math.PI / 180;
  }, false);

  aura.addEventListener('mousemove', function() {
    options.radialFactor = +this.value;
  }, false);

  offset.addEventListener('mousemove', function() {
    options.offset = +this.value;
    updateCanvas(ctx, canvas, options);
  }, false);

  hyperbole.addEventListener('mousemove', function() {
    options.hyperbole = +this.value;
  }, false);

  //set first group description
  setGroupDescription(options.currentGroupIndex);

  function setGroupDescription(index) {
    var node = descriptionContainer.firstChild;
    if (node) {
      node.parentNode.removeChild(node);
    }
    node = descriptions[index].cloneNode(true);
    descriptionContainer.appendChild(node);
  }
};

window.initDrawOptions = function(canvas, options) {
  var ctx = canvas.getContext('2d'),
      surface = $('surface'),
      background = $('background-color'),
      pencil = $('pencil'),
      strokeColor = $('stroke-color'),
      strokeWidth = $('stroke-width'),
      shadowColor = $('shadow-color'),
      shadowX = $('shadow-x'),
      shadowY = $('shadow-y'),
      shadowBlur = $('shadow-blur'),
      size = $('size'),
      clear = $('clear'),
      save = $('save'),
      mode = 0,
      radius,
      down = false,
      first = true,
      pos;

  function press() {
    down = first = true;
    //ctx.save();
    //makeClipping(ctx, canvas, options);
  }

  function release() {
    down = first = false;
    //ctx.restore();
  }

  size.addEventListener('change', function() {
    radius = +size.value;
  }, false);
  radius = +size.value;


  pencil.addEventListener('change', function() {
    mode = pencil.selectedIndex;
  }, false);

  function handleBackground() {
    canvas.style.backgroundColor = surface.style.backgroundColor = background.value;
    updateCanvas(ctx, canvas, options);
  }
  background.addEventListener('change', handleBackground, false);
  handleBackground();

  function handleStroke() {
    ctx.strokeStyle = strokeColor.value;
  }
  strokeColor.addEventListener('change', handleStroke, false);
  handleStroke();

  function handleStrokeWidth() {
    ctx.lineWidth = strokeWidth.value;
  }
  strokeWidth.addEventListener('change', handleStrokeWidth, false);
  handleStrokeWidth();

  //function handleShadowColor() {
    //ctx.shadowColor = shadowColor.value;
  //}
  //shadowColor.addEventListener('change', handleShadowColor, false);
  //handleShadowColor();

  //function handleShadowX() {
    //ctx.shadowOffsetX = +shadowX.value;
  //}
  //shadowX.addEventListener('change', handleShadowX, false);
  //handleShadowX();

  //function handleShadowY() {
    //ctx.shadowOffsetY = +shadowY.value;
  //}
  //shadowY.addEventListener('change', handleShadowY, false);
  //handleShadowY();

  //function handleShadowBlur() {
    //ctx.shadowBlur = +shadowBlur.value;
  //}
  //shadowBlur.addEventListener('change', handleShadowBlur, false);
  //handleShadowBlur();

  clear.addEventListener('click', function(e) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, false);

  save.addEventListener('click', function(e) {
    window.location.href = surface.toDataURL();
  }, false);

 function draw(e) {
    var bbox = canvas.getBoundingClientRect(),
        x = (e.x || e.pageX) - bbox.left,
        y = (e.y || e.pageY) - bbox.top;

    switch (mode) {
      case 0:
        if (first) {
          pos = [x, y];
          ctx.beginPath();
          ctx.moveTo(pos[0], pos[1]);
          first = false;
          return;
        }
        ctx.lineTo(x, y);
        pos = [x, y];
        ctx.stroke();
        break;

      case 1:
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2, false);
        ctx.stroke();
        ctx.closePath();
        break;

      case 2:
        ctx.strokeRect(x - radius / 2, y - radius / 2, radius, radius);
        break;

      case 3:
        if (first) {
          pos = [x, y];
          first = false;
          return;
        }
        ctx.beginPath();
        ctx.moveTo(pos[0], pos[1]);
        ctx.lineTo(x, y);
        pos = [x, y];
        ctx.closePath();
        ctx.stroke();
        break;

      default:
        break;
    }
  }

  canvas.addEventListener('mousedown', press, false);

  canvas.addEventListener('mousemove', function(e) {
    if (!down) return;
    draw(e);
  }, false);

  canvas.addEventListener('click', draw);

  canvas.addEventListener('mouseup', release, false);

  canvas.addEventListener('mouseout', release, false);

  ctx.save();
  makeClipping(ctx, canvas, options);
  renderToCanvas(ctx, canvas);
  ctx.restore();
}

function updateCanvas(ctx, canvas, options) {
  //ctx.save();
  makeClipping(ctx, canvas, options);
  //renderToCanvas(ctx, canvas);
  //ctx.restore();
}


function renderToCanvas(ctx) {
  var l = 128,
      step = 20;

  for (var i = 0; i < l; i += step) {
    for (var j = 0; j < l; j += step) {
      ctx.save();
      ctx.translate(i, j);
      ctx.rotate(i  + j);
      ctx.fillStyle = 'rgb(' + [(i / l * 255) >> 0, (j / l * 255) >> 0, (i / l * 255) >> 0].join(',') + ')';
      if ((i / step) % 2) {
        ctx.fillRect(0, 0, 20, 20);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2, false);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

function makeClipping(ctx, canvas, options) {
  var groups = ['p1', 'p2', 'pm', 'pg', 'cm', 'pmm', 'pmg', 'pgg', 'cmm', 'p4', 'p4m', 'p4g', 'p3', 'p3m1', 'p31m', 'p6', 'p6m'],
      backgroundCanvas = $('bck-canvas'),
      bctx = backgroundCanvas.getContext('2d');

  backgroundCanvas.width = canvas.width;
  backgroundCanvas.height = canvas.height;

  bctx.save();
  var curFillStyle = canvas.style.backgroundColor;
  bctx.fillStyle = '#ccc';
  bctx.fillRect(0, 0, canvas.width, canvas.height);
  bctx.fillStyle = curFillStyle;

  switch (groups[options.currentGroupIndex]) {
    case 'p1':
    case 'p2':
      bctx.beginPath();
      bctx.moveTo(options.offset, 0);
      bctx.lineTo(width, 0);
      bctx.lineTo(width - options.offset, height);
      bctx.lineTo(0, height);
      bctx.lineTo(options.offset, 0);
      bctx.fill();
      break;

    case 'pm':
    case 'pg':
    case 'pmm':
    case 'pmg':
      bctx.beginPath();
      bctx.moveTo(0, options.offset);
      bctx.lineTo(width, options.offset);
      bctx.lineTo(width, height - options.offset);
      bctx.lineTo(0, height - options.offset);
      bctx.lineTo(0, options.offset);
      bctx.fill();
      break;

    case 'cm':
    case 'pgg':
      bctx.beginPath();
      bctx.moveTo(0, options.offset);
      bctx.lineTo(width / 2, height - options.offset);
      bctx.lineTo(width, options.offset);
      bctx.lineTo(0, options.offset);
      bctx.fill();
      break;

    case 'cmm':
      bctx.beginPath();
      bctx.moveTo(0, options.offset);
      bctx.lineTo(width, options.offset);
      bctx.lineTo(width, height - options.offset);
      bctx.lineTo(0, options.offset);
      bctx.fill();
      break;

    //square based.
    case 'p4':
      break;

    //square based.
    case 'p4m':
      bctx.beginPath();
      bctx.moveTo(width, 0);
      bctx.lineTo(width, height);
      bctx.lineTo(0, height);
      bctx.lineTo(width, 0);
      bctx.fill();
      break;

    //square based.
    case 'p4g':
      bctx.beginPath();
      bctx.moveTo(0, 0);
      bctx.lineTo(width, 0);
      bctx.lineTo(width, height);
      bctx.lineTo(0, 0);
      bctx.fill();
      break;

    //equilateral triangle based.
    case 'p3':
      var h = height * 2 / 3,
          w = cos(PI / 6) * h,
          offsetWidth = width - w,
          offsetWidthDiv2 = offsetWidth / 2;

      bctx.beginPath();
      bctx.moveTo(offsetWidthDiv2, 0);
      bctx.lineTo(offsetWidthDiv2, h);
      bctx.lineTo(offsetWidthDiv2 + w, h + sin(PI / 6) * h );
      bctx.lineTo(offsetWidthDiv2 + w, height / 3 );
      bctx.lineTo(offsetWidthDiv2, 0);
      bctx.fill();
      break;

    case 'p3m1':
      var len = cos(PI / 6) * height,
          offset = (width - len) / 2;

      bctx.beginPath();
      bctx.moveTo(offset, 0);
      bctx.lineTo(offset, height);
      bctx.lineTo(offset + len, height / 2);
      bctx.lineTo(offset, 0);
      bctx.fill();
      break;

    case 'p31m': case 'p6':
      var h = (sin(PI / 3) * width) / 3,
          offset = (height - h) / 2;

      bctx.beginPath();
      bctx.moveTo(0, offset + h);
      bctx.lineTo(width, offset + h);
      bctx.lineTo(width / 2, offset);
      bctx.lineTo(0, offset + h);
      bctx.fill();
      break;

    case 'p6m':
      var h = (sin(PI / 3) * width) / 3 * 2,
          offset = (height - h) / 2;

      bctx.beginPath();
      bctx.moveTo(0, offset + h);
      bctx.lineTo(width, offset + h);
      bctx.lineTo(width, offset);
      bctx.lineTo(0, offset + h);
      bctx.fill();
      break;
  }

  bctx.restore();
  canvas.style.backgroundImage = 'url(' + backgroundCanvas.toDataURL('image/jpg') + ')';
};

}());
