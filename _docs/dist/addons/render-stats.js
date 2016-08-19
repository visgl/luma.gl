'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// An adaptation of the THREE.js stats helpers (MIT licensed)
// https://github.com/mrdoob/stats.js
// https://github.com/jeromeetienne/threex.rendererstats

/**
 * @author mrdoob / http://mrdoob.com/
 */

/* global document, window */
var PR = Math.round(window.devicePixelRatio || 1);

var WIDTH = 80 * PR;
var HEIGHT = 48 * PR;
var TEXT_X = 3 * PR;
var TEXT_Y = 2 * PR;
var GRAPH_X = 3 * PR;
var GRAPH_Y = 15 * PR;
var GRAPH_WIDTH = 74 * PR;
var GRAPH_HEIGHT = 30 * PR;

var Panel = exports.Panel = function () {
  function Panel(name, fg, bg) {
    _classCallCheck(this, Panel);

    var canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.style.cssText = 'width:80px;height:48px';

    var context = canvas.getContext('2d');
    context.font = 'bold ' + 9 * PR + 'px Helvetica,Arial,sans-serif';
    context.textBaseline = 'top';

    context.fillStyle = bg;
    context.fillRect(0, 0, WIDTH, HEIGHT);

    context.fillStyle = fg;
    context.fillText(name, TEXT_X, TEXT_Y);
    context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

    context.fillStyle = bg;
    context.globalAlpha = 0.9;
    context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

    this.name = name;
    this.fg = fg;
    this.bg = bg;
    this.context = context;
    this.dom = canvas;
  }

  _createClass(Panel, [{
    key: 'update',
    value: function update(_ref) {
      var value = _ref.value;
      var maxValue = _ref.maxValue;

      var min = Math.min(min, value);
      var max = Math.max(max, value);

      this.context.fillStyle = this.bg;
      this.context.globalAlpha = 1;
      this.context.fillRect(0, 0, WIDTH, GRAPH_Y);
      this.context.fillStyle = this.fg;

      var round = Math.round;
      this.context.fillText(round(value) + ' ' + this.name + ' (' + round(min) + '-' + round(max) + ')', TEXT_X, TEXT_Y);

      this.context.drawImage(this.canvas, GRAPH_X + PR, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT, GRAPH_X, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT);

      this.context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT);

      this.context.fillStyle = this.bg;
      this.context.globalAlpha = 0.9;
      this.context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, Math.round((1 - value / maxValue) * GRAPH_HEIGHT));
    }
  }]);

  return Panel;
}();

var Stats = function () {
  function Stats() {
    var _this = this;

    _classCallCheck(this, Stats);

    this.performance = window.performance;

    this.mode = 0;

    var container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000';

    container.addEventListener('click', function (event) {
      event.preventDefault();
      _this.showPanel(++_this.mode % _this.container.children.length);
    }, false);

    //
    this.beginTime = (this.performance || Date).now();
    this.prevTime = this.beginTime;
    this.frames = 0;

    this.fpsPanel = this.addPanel(new Stats.Panel('FPS', '#0ff', '#002'));
    this.msPanel = this.addPanel(new Stats.Panel('MS', '#0f0', '#020'));
    if (this.performance && this.performance.memory) {
      this.memPanel = this.addPanel(new Stats.Panel('MB', '#f08', '#201'));
    }

    this.showPanel(0);

    this.dom = container;
  }

  _createClass(Stats, [{
    key: 'addPanel',
    value: function addPanel(panel) {
      this.container.appendChild(panel.dom);
      return panel;
    }

    // Shows selected panel and hides all others

  }, {
    key: 'showPanel',
    value: function showPanel(id) {
      this.container.children.forEach(function (child, i) {
        return child.display = i === id ? 'block' : 'none';
      });
      this.mode = id;
    }
  }, {
    key: 'setMode',
    value: function setMode(id) {
      this.showPanel(id);
    }
  }, {
    key: 'beginFrame',
    value: function beginFrame() {
      this.beginTime = (this.performance || Date).now();
    }
  }, {
    key: 'endFrame',
    value: function endFrame() {
      this.frames++;

      var time = (this.performance || Date).now();

      this.msPanel.update(time - this.beginTime, 200);

      var deltaTime = time - this.prevTime;
      if (deltaTime > 1000) {
        this.fpsPanel.update({
          value: this.frames * deltaTime / 1000,
          maxValue: 100
        });

        this.prevTime = time;
        this.frames = 0;

        if (this.memPanel) {
          var memory = this.performance.memory;
          this.memPanel.update({
            value: memory.usedJSHeapSize / 1048576,
            maxValue: memory.jsHeapSizeLimit / 1048576
          });
        }
      }

      return time;
    }
  }, {
    key: 'update',
    value: function update() {
      this.beginTime = this.end();
    }
  }]);

  return Stats;
}();

/**
 * @author mrdoob / http://mrdoob.com/
 * @author jetienne / http://jetienne.com/
 */
/** global document */

exports.default = Stats;

var RendererStats = exports.RendererStats = function () {
  /**
   * Provide info on THREE.WebGLRenderer
   *
   * @param {Object} renderer the renderer to update
   * @param {Object} Camera the camera to update
  */
  function RendererStats() {
    _classCallCheck(this, RendererStats);

    var container = document.createElement('div');
    container.style.cssText = 'width:80px;opacity:0.9;cursor:pointer';

    var msDiv = document.createElement('div');
    msDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;backgound-color:#200;';
    container.appendChild(msDiv);

    var msText = document.createElement('div');
    msText.style.cssText = 'color:#f00;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
    msText.innerHTML = 'Render Stats';
    msDiv.appendChild(msText);

    this.msTexts = [];
    this.nLines = 9;
    for (var i = 0; i < this.nLines; i++) {
      this.msTexts[i] = document.createElement('div');
      this.msTexts[i].style.cssText = 'color:#f00;background-color:#311;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
      this.msTexts[i].innerHTML = '-';
      msDiv.appendChild(this.msTexts[i]);
    }

    this.lastTime = Date.now();
    this.domElement = container;
  }

  _createClass(RendererStats, [{
    key: 'update',
    value: function update(info) {
      // refresh only 30time per second
      if (Date.now() - this.lastTime < 1000 / 30) {
        return;
      }
      this.lastTime = Date.now();

      var i = 0;
      this.msTexts[i++].textContent = '== Memory =====';
      this.msTexts[i++].textContent = 'Programs: ' + info.memory.programs;
      this.msTexts[i++].textContent = 'Geometries: ' + info.memory.geometries;
      this.msTexts[i++].textContent = 'Textures: ' + info.memory.textures;

      this.msTexts[i++].textContent = '== Render =====';
      this.msTexts[i++].textContent = 'Calls: ' + info.render.calls;
      this.msTexts[i++].textContent = 'Vertices: ' + info.render.vertices;
      this.msTexts[i++].textContent = 'Faces: ' + info.render.faces;
      this.msTexts[i++].textContent = 'Points: ' + info.render.points;
    }
  }]);

  return RendererStats;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvcmVuZGVyLXN0YXRzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7O0FBRUE7Ozs7QUFJQTtBQUNBLElBQU0sS0FBSyxLQUFLLEtBQUwsQ0FBVyxPQUFPLGdCQUFQLElBQTJCLENBQXRDLENBQVg7O0FBRUEsSUFBTSxRQUFRLEtBQUssRUFBbkI7QUFDQSxJQUFNLFNBQVMsS0FBSyxFQUFwQjtBQUNBLElBQU0sU0FBUyxJQUFJLEVBQW5CO0FBQ0EsSUFBTSxTQUFTLElBQUksRUFBbkI7QUFDQSxJQUFNLFVBQVUsSUFBSSxFQUFwQjtBQUNBLElBQU0sVUFBVSxLQUFLLEVBQXJCO0FBQ0EsSUFBTSxjQUFjLEtBQUssRUFBekI7QUFDQSxJQUFNLGVBQWUsS0FBSyxFQUExQjs7SUFFYSxLLFdBQUEsSztBQUVYLGlCQUFZLElBQVosRUFBa0IsRUFBbEIsRUFBc0IsRUFBdEIsRUFBMEI7QUFBQTs7QUFDeEIsUUFBTSxTQUFTLFNBQVMsYUFBVCxDQUF1QixRQUF2QixDQUFmO0FBQ0EsV0FBTyxLQUFQLEdBQWUsS0FBZjtBQUNBLFdBQU8sTUFBUCxHQUFnQixNQUFoQjtBQUNBLFdBQU8sS0FBUCxDQUFhLE9BQWIsR0FBdUIsd0JBQXZCOztBQUVBLFFBQU0sVUFBVSxPQUFPLFVBQVAsQ0FBa0IsSUFBbEIsQ0FBaEI7QUFDQSxZQUFRLElBQVIsYUFBdUIsSUFBSSxFQUEzQjtBQUNBLFlBQVEsWUFBUixHQUF1QixLQUF2Qjs7QUFFQSxZQUFRLFNBQVIsR0FBb0IsRUFBcEI7QUFDQSxZQUFRLFFBQVIsQ0FBaUIsQ0FBakIsRUFBb0IsQ0FBcEIsRUFBdUIsS0FBdkIsRUFBOEIsTUFBOUI7O0FBRUEsWUFBUSxTQUFSLEdBQW9CLEVBQXBCO0FBQ0EsWUFBUSxRQUFSLENBQWlCLElBQWpCLEVBQXVCLE1BQXZCLEVBQStCLE1BQS9CO0FBQ0EsWUFBUSxRQUFSLENBQWlCLE9BQWpCLEVBQTBCLE9BQTFC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LFdBQUssT0FBTCxDQUFhLEdBQWIsRUFBa0IsV0FBbEIsZ0JBQTJDLEtBQUssTUFBTCxDQUFZLE1BQXZEO0FBQ0QiLCJmaWxlIjoicmVuZGVyLXN0YXRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQW4gYWRhcHRhdGlvbiBvZiB0aGUgVEhSRUUuanMgc3RhdHMgaGVscGVycyAoTUlUIGxpY2Vuc2VkKVxuLy8gaHR0cHM6Ly9naXRodWIuY29tL21yZG9vYi9zdGF0cy5qc1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL2plcm9tZWV0aWVubmUvdGhyZWV4LnJlbmRlcmVyc3RhdHNcblxuLyoqXG4gKiBAYXV0aG9yIG1yZG9vYiAvIGh0dHA6Ly9tcmRvb2IuY29tL1xuICovXG5cbi8qIGdsb2JhbCBkb2N1bWVudCwgd2luZG93ICovXG5jb25zdCBQUiA9IE1hdGgucm91bmQod2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgMSk7XG5cbmNvbnN0IFdJRFRIID0gODAgKiBQUjtcbmNvbnN0IEhFSUdIVCA9IDQ4ICogUFI7XG5jb25zdCBURVhUX1ggPSAzICogUFI7XG5jb25zdCBURVhUX1kgPSAyICogUFI7XG5jb25zdCBHUkFQSF9YID0gMyAqIFBSO1xuY29uc3QgR1JBUEhfWSA9IDE1ICogUFI7XG5jb25zdCBHUkFQSF9XSURUSCA9IDc0ICogUFI7XG5jb25zdCBHUkFQSF9IRUlHSFQgPSAzMCAqIFBSO1xuXG5leHBvcnQgY2xhc3MgUGFuZWwge1xuXG4gIGNvbnN0cnVjdG9yKG5hbWUsIGZnLCBiZykge1xuICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIGNhbnZhcy53aWR0aCA9IFdJRFRIO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBIRUlHSFQ7XG4gICAgY2FudmFzLnN0eWxlLmNzc1RleHQgPSAnd2lkdGg6ODBweDtoZWlnaHQ6NDhweCc7XG5cbiAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgY29udGV4dC5mb250ID0gYGJvbGQgJHs5ICogUFJ9cHggSGVsdmV0aWNhLEFyaWFsLHNhbnMtc2VyaWZgO1xuICAgIGNvbnRleHQudGV4dEJhc2VsaW5lID0gJ3RvcCc7XG5cbiAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGJnO1xuICAgIGNvbnRleHQuZmlsbFJlY3QoMCwgMCwgV0lEVEgsIEhFSUdIVCk7XG5cbiAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGZnO1xuICAgIGNvbnRleHQuZmlsbFRleHQobmFtZSwgVEVYVF9YLCBURVhUX1kpO1xuICAgIGNvbnRleHQuZmlsbFJlY3QoR1JBUEhfWCwgR1JBUEhfWSwgR1JBUEhfV0lEVEgsIEdSQVBIX0hFSUdIVCk7XG5cbiAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGJnO1xuICAgIGNvbnRleHQuZ2xvYmFsQWxwaGEgPSAwLjk7XG4gICAgY29udGV4dC5maWxsUmVjdChHUkFQSF9YLCBHUkFQSF9ZLCBHUkFQSF9XSURUSCwgR1JBUEhfSEVJR0hUKTtcblxuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5mZyA9IGZnO1xuICAgIHRoaXMuYmcgPSBiZztcbiAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgIHRoaXMuZG9tID0gY2FudmFzO1xuICB9XG5cbiAgdXBkYXRlKHt2YWx1ZSwgbWF4VmFsdWV9KSB7XG4gICAgY29uc3QgbWluID0gTWF0aC5taW4obWluLCB2YWx1ZSk7XG4gICAgY29uc3QgbWF4ID0gTWF0aC5tYXgobWF4LCB2YWx1ZSk7XG5cbiAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5iZztcbiAgICB0aGlzLmNvbnRleHQuZ2xvYmFsQWxwaGEgPSAxO1xuICAgIHRoaXMuY29udGV4dC5maWxsUmVjdCgwLCAwLCBXSURUSCwgR1JBUEhfWSk7XG4gICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMuZmc7XG5cbiAgICBjb25zdCByb3VuZCA9IE1hdGgucm91bmQ7XG4gICAgdGhpcy5jb250ZXh0LmZpbGxUZXh0KFxuICAgICAgYCR7cm91bmQodmFsdWUpfSAke3RoaXMubmFtZX0gKCR7cm91bmQobWluKX0tJHtyb3VuZChtYXgpfSlgLFxuICAgICAgVEVYVF9YLFxuICAgICAgVEVYVF9ZXG4gICAgKTtcblxuICAgIHRoaXMuY29udGV4dC5kcmF3SW1hZ2UoXG4gICAgICB0aGlzLmNhbnZhcyxcbiAgICAgIEdSQVBIX1ggKyBQUiwgR1JBUEhfWSxcbiAgICAgIEdSQVBIX1dJRFRIIC0gUFIsXG4gICAgICBHUkFQSF9IRUlHSFQsXG4gICAgICBHUkFQSF9YLFxuICAgICAgR1JBUEhfWSxcbiAgICAgIEdSQVBIX1dJRFRIIC0gUFIsXG4gICAgICBHUkFQSF9IRUlHSFRcbiAgICApO1xuXG4gICAgdGhpcy5jb250ZXh0LmZpbGxSZWN0KFxuICAgICAgR1JBUEhfWCArIEdSQVBIX1dJRFRIIC0gUFIsXG4gICAgICBHUkFQSF9ZLFxuICAgICAgUFIsXG4gICAgICBHUkFQSF9IRUlHSFRcbiAgICApO1xuXG4gICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMuYmc7XG4gICAgdGhpcy5jb250ZXh0Lmdsb2JhbEFscGhhID0gMC45O1xuICAgIHRoaXMuY29udGV4dC5maWxsUmVjdChcbiAgICAgIEdSQVBIX1ggKyBHUkFQSF9XSURUSCAtIFBSLFxuICAgICAgR1JBUEhfWSxcbiAgICAgIFBSLFxuICAgICAgTWF0aC5yb3VuZCgoMSAtICh2YWx1ZSAvIG1heFZhbHVlKSkgKiBHUkFQSF9IRUlHSFQpXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTdGF0cyB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5wZXJmb3JtYW5jZSA9IHdpbmRvdy5wZXJmb3JtYW5jZTtcblxuICAgIHRoaXMubW9kZSA9IDA7XG5cbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb250YWluZXIuc3R5bGUuY3NzVGV4dCA9XG4gICAgICAncG9zaXRpb246Zml4ZWQ7dG9wOjA7bGVmdDowO2N1cnNvcjpwb2ludGVyO29wYWNpdHk6MC45O3otaW5kZXg6MTAwMDAnO1xuXG4gICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnQgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuc2hvd1BhbmVsKCsrdGhpcy5tb2RlICUgdGhpcy5jb250YWluZXIuY2hpbGRyZW4ubGVuZ3RoKTtcbiAgICB9LCBmYWxzZSk7XG5cbiAgICAvL1xuICAgIHRoaXMuYmVnaW5UaW1lID0gKHRoaXMucGVyZm9ybWFuY2UgfHwgRGF0ZSkubm93KCk7XG4gICAgdGhpcy5wcmV2VGltZSA9IHRoaXMuYmVnaW5UaW1lO1xuICAgIHRoaXMuZnJhbWVzID0gMDtcblxuICAgIHRoaXMuZnBzUGFuZWwgPSB0aGlzLmFkZFBhbmVsKG5ldyBTdGF0cy5QYW5lbCgnRlBTJywgJyMwZmYnLCAnIzAwMicpKTtcbiAgICB0aGlzLm1zUGFuZWwgPSB0aGlzLmFkZFBhbmVsKG5ldyBTdGF0cy5QYW5lbCgnTVMnLCAnIzBmMCcsICcjMDIwJykpO1xuICAgIGlmICh0aGlzLnBlcmZvcm1hbmNlICYmIHRoaXMucGVyZm9ybWFuY2UubWVtb3J5KSB7XG4gICAgICB0aGlzLm1lbVBhbmVsID0gdGhpcy5hZGRQYW5lbChuZXcgU3RhdHMuUGFuZWwoJ01CJywgJyNmMDgnLCAnIzIwMScpKTtcbiAgICB9XG5cbiAgICB0aGlzLnNob3dQYW5lbCgwKTtcblxuICAgIHRoaXMuZG9tID0gY29udGFpbmVyO1xuICB9XG5cbiAgYWRkUGFuZWwocGFuZWwpIHtcbiAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZChwYW5lbC5kb20pO1xuICAgIHJldHVybiBwYW5lbDtcblxuICB9XG5cbiAgLy8gU2hvd3Mgc2VsZWN0ZWQgcGFuZWwgYW5kIGhpZGVzIGFsbCBvdGhlcnNcbiAgc2hvd1BhbmVsKGlkKSB7XG4gICAgdGhpcy5jb250YWluZXIuY2hpbGRyZW4uZm9yRWFjaChcbiAgICAgIChjaGlsZCwgaSkgPT4gY2hpbGQuZGlzcGxheSA9IChpID09PSBpZCkgPyAnYmxvY2snIDogJ25vbmUnXG4gICAgKTtcbiAgICB0aGlzLm1vZGUgPSBpZDtcbiAgfVxuXG4gIHNldE1vZGUoaWQpIHtcbiAgICB0aGlzLnNob3dQYW5lbChpZCk7XG4gIH1cblxuICBiZWdpbkZyYW1lKCkge1xuICAgIHRoaXMuYmVnaW5UaW1lID0gKHRoaXMucGVyZm9ybWFuY2UgfHwgRGF0ZSkubm93KCk7XG4gIH1cblxuICBlbmRGcmFtZSgpIHtcbiAgICB0aGlzLmZyYW1lcysrO1xuXG4gICAgY29uc3QgdGltZSA9ICh0aGlzLnBlcmZvcm1hbmNlIHx8IERhdGUpLm5vdygpO1xuXG4gICAgdGhpcy5tc1BhbmVsLnVwZGF0ZSh0aW1lIC0gdGhpcy5iZWdpblRpbWUsIDIwMCk7XG5cbiAgICBjb25zdCBkZWx0YVRpbWUgPSB0aW1lIC0gdGhpcy5wcmV2VGltZTtcbiAgICBpZiAoZGVsdGFUaW1lID4gMTAwMCkge1xuICAgICAgdGhpcy5mcHNQYW5lbC51cGRhdGUoe1xuICAgICAgICB2YWx1ZTogdGhpcy5mcmFtZXMgKiBkZWx0YVRpbWUgLyAxMDAwLFxuICAgICAgICBtYXhWYWx1ZTogMTAwXG4gICAgICB9KTtcblxuICAgICAgdGhpcy5wcmV2VGltZSA9IHRpbWU7XG4gICAgICB0aGlzLmZyYW1lcyA9IDA7XG5cbiAgICAgIGlmICh0aGlzLm1lbVBhbmVsKSB7XG4gICAgICAgIGNvbnN0IG1lbW9yeSA9IHRoaXMucGVyZm9ybWFuY2UubWVtb3J5O1xuICAgICAgICB0aGlzLm1lbVBhbmVsLnVwZGF0ZSh7XG4gICAgICAgICAgdmFsdWU6IG1lbW9yeS51c2VkSlNIZWFwU2l6ZSAvIDEwNDg1NzYsXG4gICAgICAgICAgbWF4VmFsdWU6IG1lbW9yeS5qc0hlYXBTaXplTGltaXQgLyAxMDQ4NTc2XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIHRpbWU7XG4gIH1cblxuICB1cGRhdGUoKSB7XG4gICAgdGhpcy5iZWdpblRpbWUgPSB0aGlzLmVuZCgpO1xuICB9XG59XG5cbi8qKlxuICogQGF1dGhvciBtcmRvb2IgLyBodHRwOi8vbXJkb29iLmNvbS9cbiAqIEBhdXRob3IgamV0aWVubmUgLyBodHRwOi8vamV0aWVubmUuY29tL1xuICovXG4vKiogZ2xvYmFsIGRvY3VtZW50ICovXG5cbmV4cG9ydCBjbGFzcyBSZW5kZXJlclN0YXRzIHtcbiAgLyoqXG4gICAqIFByb3ZpZGUgaW5mbyBvbiBUSFJFRS5XZWJHTFJlbmRlcmVyXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZW5kZXJlciB0aGUgcmVuZGVyZXIgdG8gdXBkYXRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBDYW1lcmEgdGhlIGNhbWVyYSB0byB1cGRhdGVcbiAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29udGFpbmVyLnN0eWxlLmNzc1RleHQgPSAnd2lkdGg6ODBweDtvcGFjaXR5OjAuOTtjdXJzb3I6cG9pbnRlcic7XG5cbiAgICBjb25zdCBtc0RpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIG1zRGl2LnN0eWxlLmNzc1RleHQgPSAncGFkZGluZzowIDAgM3B4IDNweDt0ZXh0LWFsaWduOmxlZnQ7YmFja2dvdW5kLWNvbG9yOiMyMDA7JztcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobXNEaXYpO1xuXG4gICAgY29uc3QgbXNUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbXNUZXh0LnN0eWxlLmNzc1RleHQgPSAnY29sb3I6I2YwMDtmb250LWZhbWlseTpIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZjtmb250LXNpemU6OXB4O2ZvbnQtd2VpZ2h0OmJvbGQ7bGluZS1oZWlnaHQ6MTVweCc7XG4gICAgbXNUZXh0LmlubmVySFRNTCA9ICdSZW5kZXIgU3RhdHMnO1xuICAgIG1zRGl2LmFwcGVuZENoaWxkKG1zVGV4dCk7XG5cbiAgICB0aGlzLm1zVGV4dHMgPSBbXTtcbiAgICB0aGlzLm5MaW5lcyA9IDk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5MaW5lczsgaSsrKSB7XG4gICAgICB0aGlzLm1zVGV4dHNbaV0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHRoaXMubXNUZXh0c1tpXS5zdHlsZS5jc3NUZXh0ID0gJ2NvbG9yOiNmMDA7YmFja2dyb3VuZC1jb2xvcjojMzExO2ZvbnQtZmFtaWx5OkhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmO2ZvbnQtc2l6ZTo5cHg7Zm9udC13ZWlnaHQ6Ym9sZDtsaW5lLWhlaWdodDoxNXB4JztcbiAgICAgIHRoaXMubXNUZXh0c1tpXS5pbm5lckhUTUwgPSAnLSc7XG4gICAgICBtc0Rpdi5hcHBlbmRDaGlsZCh0aGlzLm1zVGV4dHNbaV0pO1xuICAgIH1cblxuICAgIHRoaXMubGFzdFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIHRoaXMuZG9tRWxlbWVudCA9IGNvbnRhaW5lcjtcbiAgfVxuXG4gIHVwZGF0ZShpbmZvKSB7XG4gICAgLy8gcmVmcmVzaCBvbmx5IDMwdGltZSBwZXIgc2Vjb25kXG4gICAgaWYgKERhdGUubm93KCkgLSB0aGlzLmxhc3RUaW1lIDwgMTAwMCAvIDMwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMubGFzdFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgbGV0IGkgPSAwO1xuICAgIHRoaXMubXNUZXh0c1tpKytdLnRleHRDb250ZW50ID0gYD09IE1lbW9yeSA9PT09PWA7XG4gICAgdGhpcy5tc1RleHRzW2krK10udGV4dENvbnRlbnQgPSBgUHJvZ3JhbXM6ICR7aW5mby5tZW1vcnkucHJvZ3JhbXN9YDtcbiAgICB0aGlzLm1zVGV4dHNbaSsrXS50ZXh0Q29udGVudCA9IGBHZW9tZXRyaWVzOiAke2luZm8ubWVtb3J5Lmdlb21ldHJpZXN9YDtcbiAgICB0aGlzLm1zVGV4dHNbaSsrXS50ZXh0Q29udGVudCA9IGBUZXh0dXJlczogJHtpbmZvLm1lbW9yeS50ZXh0dXJlc31gO1xuXG4gICAgdGhpcy5tc1RleHRzW2krK10udGV4dENvbnRlbnQgPSBgPT0gUmVuZGVyID09PT09YDtcbiAgICB0aGlzLm1zVGV4dHNbaSsrXS50ZXh0Q29udGVudCA9IGBDYWxsczogJHtpbmZvLnJlbmRlci5jYWxsc31gO1xuICAgIHRoaXMubXNUZXh0c1tpKytdLnRleHRDb250ZW50ID0gYFZlcnRpY2VzOiAke2luZm8ucmVuZGVyLnZlcnRpY2VzfWA7XG4gICAgdGhpcy5tc1RleHRzW2krK10udGV4dENvbnRlbnQgPSBgRmFjZXM6ICR7aW5mby5yZW5kZXIuZmFjZXN9YDtcbiAgICB0aGlzLm1zVGV4dHNbaSsrXS50ZXh0Q29udGVudCA9IGBQb2ludHM6ICR7aW5mby5yZW5kZXIucG9pbnRzfWA7XG4gIH1cbn1cbiJdfQ==