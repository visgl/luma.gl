'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-disable */
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

  /* eslint-disable max-statements */
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
  /* eslint-enable max-statements */

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvcmVuZGVyLXN0YXRzLmpzIl0sIm5hbWVzIjpbIlBSIiwiTWF0aCIsInJvdW5kIiwid2luZG93IiwiZGV2aWNlUGl4ZWxSYXRpbyIsIldJRFRIIiwiSEVJR0hUIiwiVEVYVF9YIiwiVEVYVF9ZIiwiR1JBUEhfWCIsIkdSQVBIX1kiLCJHUkFQSF9XSURUSCIsIkdSQVBIX0hFSUdIVCIsIlBhbmVsIiwibmFtZSIsImZnIiwiYmciLCJjYW52YXMiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJ3aWR0aCIsImhlaWdodCIsInN0eWxlIiwiY3NzVGV4dCIsImNvbnRleHQiLCJnZXRDb250ZXh0IiwiZm9udCIsInRleHRCYXNlbGluZSIsImZpbGxTdHlsZSIsImZpbGxSZWN0IiwiZmlsbFRleHQiLCJnbG9iYWxBbHBoYSIsImRvbSIsInZhbHVlIiwibWF4VmFsdWUiLCJtaW4iLCJtYXgiLCJkcmF3SW1hZ2UiLCJTdGF0cyIsInBlcmZvcm1hbmNlIiwibW9kZSIsImNvbnRhaW5lciIsImFkZEV2ZW50TGlzdGVuZXIiLCJldmVudCIsInByZXZlbnREZWZhdWx0Iiwic2hvd1BhbmVsIiwiY2hpbGRyZW4iLCJsZW5ndGgiLCJiZWdpblRpbWUiLCJEYXRlIiwibm93IiwicHJldlRpbWUiLCJmcmFtZXMiLCJmcHNQYW5lbCIsImFkZFBhbmVsIiwibXNQYW5lbCIsIm1lbW9yeSIsIm1lbVBhbmVsIiwicGFuZWwiLCJhcHBlbmRDaGlsZCIsImlkIiwiZm9yRWFjaCIsImNoaWxkIiwiaSIsImRpc3BsYXkiLCJ0aW1lIiwidXBkYXRlIiwiZGVsdGFUaW1lIiwidXNlZEpTSGVhcFNpemUiLCJqc0hlYXBTaXplTGltaXQiLCJlbmQiLCJSZW5kZXJlclN0YXRzIiwibXNEaXYiLCJtc1RleHQiLCJpbm5lckhUTUwiLCJtc1RleHRzIiwibkxpbmVzIiwibGFzdFRpbWUiLCJkb21FbGVtZW50IiwiaW5mbyIsInRleHRDb250ZW50IiwicHJvZ3JhbXMiLCJnZW9tZXRyaWVzIiwidGV4dHVyZXMiLCJyZW5kZXIiLCJjYWxscyIsInZlcnRpY2VzIiwiZmFjZXMiLCJwb2ludHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7OztBQUlBO0FBQ0EsSUFBTUEsS0FBS0MsS0FBS0MsS0FBTCxDQUFXQyxPQUFPQyxnQkFBUCxJQUEyQixDQUF0QyxDQUFYOztBQUVBLElBQU1DLFFBQVEsS0FBS0wsRUFBbkI7QUFDQSxJQUFNTSxTQUFTLEtBQUtOLEVBQXBCO0FBQ0EsSUFBTU8sU0FBUyxJQUFJUCxFQUFuQjtBQUNBLElBQU1RLFNBQVMsSUFBSVIsRUFBbkI7QUFDQSxJQUFNUyxVQUFVLElBQUlULEVBQXBCO0FBQ0EsSUFBTVUsVUFBVSxLQUFLVixFQUFyQjtBQUNBLElBQU1XLGNBQWMsS0FBS1gsRUFBekI7QUFDQSxJQUFNWSxlQUFlLEtBQUtaLEVBQTFCOztJQUVhYSxLLFdBQUFBLEs7O0FBRVg7QUFDQSxpQkFBWUMsSUFBWixFQUFrQkMsRUFBbEIsRUFBc0JDLEVBQXRCLEVBQTBCO0FBQUE7O0FBQ3hCLFFBQU1DLFNBQVNDLFNBQVNDLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBZjtBQUNBRixXQUFPRyxLQUFQLEdBQWVmLEtBQWY7QUFDQVksV0FBT0ksTUFBUCxHQUFnQmYsTUFBaEI7QUFDQVcsV0FBT0ssS0FBUCxDQUFhQyxPQUFiLEdBQXVCLHdCQUF2Qjs7QUFFQSxRQUFNQyxVQUFVUCxPQUFPUSxVQUFQLENBQWtCLElBQWxCLENBQWhCO0FBQ0FELFlBQVFFLElBQVIsYUFBdUIsSUFBSTFCLEVBQTNCO0FBQ0F3QixZQUFRRyxZQUFSLEdBQXVCLEtBQXZCOztBQUVBSCxZQUFRSSxTQUFSLEdBQW9CWixFQUFwQjtBQUNBUSxZQUFRSyxRQUFSLENBQWlCLENBQWpCLEVBQW9CLENBQXBCLEVBQXVCeEIsS0FBdkIsRUFBOEJDLE1BQTlCOztBQUVBa0IsWUFBUUksU0FBUixHQUFvQmIsRUFBcEI7QUFDQVMsWUFBUU0sUUFBUixD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QUFhWixHQUFiLEVBQWtCaUIsV0FBbEI7QUFDQSxXQUFLTCxPQUFMLENBQWFaLEdBQWIsRUFBa0JpQixXQUFsQixrQkFBNkNELEtBQUt2QixNQUFMLENBQVl5QixRQUF6RDtBQUNBLFdBQUtOLE9BQUwsQ0FBYVosR0FBYixFQUFrQmlCLFdBQWxCLG9CQUErQ0QsS0FBS3ZCLE1BQUwsQ0FBWTBCLFVBQTNEO0FBQ0EsV0FBS1AsT0FBTCxDQUFhWixHQUFiLEVBQWtCaUIsV0FBbEIsa0JBQTZDRCxLQUFLdkIsTUFBTCxDQUFZMkIsUUFBekQ7O0FBRUEsV0FBS1IsT0FBTCxDQUFhWixHQUFiLEVBQWtCaUIsV0FBbEI7QUFDQSxXQUFLTCxPQUFMLENBQWFaLEdBQWIsRUFBa0JpQixXQUFsQixlQUEwQ0QsS0FBS0ssTUFBTCxDQUFZQyxLQUF0RDtBQUNBLFdBQUtWLE9BQUwsQ0FBYVosR0FBYixFQUFrQmlCLFdBQWxCLGtCQUE2Q0QsS0FBS0ssTUFBTCxDQUFZRSxRQUF6RDtBQUNBLFdBQUtYLE9BQUwsQ0FBYVosR0FBYixFQUFrQmlCLFdBQWxCLGVBQTBDRCxLQUFLSyxNQUFMLENBQVlHLEtBQXREO0FBQ0EsV0FBS1osT0FBTCxDQUFhWixHQUFiLEVBQWtCaUIsV0FBbEIsZ0JBQTJDRCxLQUFLSyxNQUFMLENBQVlJLE1BQXZEO0FBQ0QiLCJmaWxlIjoicmVuZGVyLXN0YXRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbi8vIEFuIGFkYXB0YXRpb24gb2YgdGhlIFRIUkVFLmpzIHN0YXRzIGhlbHBlcnMgKE1JVCBsaWNlbnNlZClcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tcmRvb2Ivc3RhdHMuanNcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9qZXJvbWVldGllbm5lL3RocmVleC5yZW5kZXJlcnN0YXRzXG5cbi8qKlxuICogQGF1dGhvciBtcmRvb2IgLyBodHRwOi8vbXJkb29iLmNvbS9cbiAqL1xuXG4vKiBnbG9iYWwgZG9jdW1lbnQsIHdpbmRvdyAqL1xuY29uc3QgUFIgPSBNYXRoLnJvdW5kKHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDEpO1xuXG5jb25zdCBXSURUSCA9IDgwICogUFI7XG5jb25zdCBIRUlHSFQgPSA0OCAqIFBSO1xuY29uc3QgVEVYVF9YID0gMyAqIFBSO1xuY29uc3QgVEVYVF9ZID0gMiAqIFBSO1xuY29uc3QgR1JBUEhfWCA9IDMgKiBQUjtcbmNvbnN0IEdSQVBIX1kgPSAxNSAqIFBSO1xuY29uc3QgR1JBUEhfV0lEVEggPSA3NCAqIFBSO1xuY29uc3QgR1JBUEhfSEVJR0hUID0gMzAgKiBQUjtcblxuZXhwb3J0IGNsYXNzIFBhbmVsIHtcblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICBjb25zdHJ1Y3RvcihuYW1lLCBmZywgYmcpIHtcbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICBjYW52YXMud2lkdGggPSBXSURUSDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gSEVJR0hUO1xuICAgIGNhbnZhcy5zdHlsZS5jc3NUZXh0ID0gJ3dpZHRoOjgwcHg7aGVpZ2h0OjQ4cHgnO1xuXG4gICAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGNvbnRleHQuZm9udCA9IGBib2xkICR7OSAqIFBSfXB4IEhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmYDtcbiAgICBjb250ZXh0LnRleHRCYXNlbGluZSA9ICd0b3AnO1xuXG4gICAgY29udGV4dC5maWxsU3R5bGUgPSBiZztcbiAgICBjb250ZXh0LmZpbGxSZWN0KDAsIDAsIFdJRFRILCBIRUlHSFQpO1xuXG4gICAgY29udGV4dC5maWxsU3R5bGUgPSBmZztcbiAgICBjb250ZXh0LmZpbGxUZXh0KG5hbWUsIFRFWFRfWCwgVEVYVF9ZKTtcbiAgICBjb250ZXh0LmZpbGxSZWN0KEdSQVBIX1gsIEdSQVBIX1ksIEdSQVBIX1dJRFRILCBHUkFQSF9IRUlHSFQpO1xuXG4gICAgY29udGV4dC5maWxsU3R5bGUgPSBiZztcbiAgICBjb250ZXh0Lmdsb2JhbEFscGhhID0gMC45O1xuICAgIGNvbnRleHQuZmlsbFJlY3QoR1JBUEhfWCwgR1JBUEhfWSwgR1JBUEhfV0lEVEgsIEdSQVBIX0hFSUdIVCk7XG5cbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMuZmcgPSBmZztcbiAgICB0aGlzLmJnID0gYmc7XG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICB0aGlzLmRvbSA9IGNhbnZhcztcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1zdGF0ZW1lbnRzICovXG5cbiAgdXBkYXRlKHt2YWx1ZSwgbWF4VmFsdWV9KSB7XG4gICAgY29uc3QgbWluID0gTWF0aC5taW4obWluLCB2YWx1ZSk7XG4gICAgY29uc3QgbWF4ID0gTWF0aC5tYXgobWF4LCB2YWx1ZSk7XG5cbiAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5iZztcbiAgICB0aGlzLmNvbnRleHQuZ2xvYmFsQWxwaGEgPSAxO1xuICAgIHRoaXMuY29udGV4dC5maWxsUmVjdCgwLCAwLCBXSURUSCwgR1JBUEhfWSk7XG4gICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMuZmc7XG5cbiAgICBjb25zdCByb3VuZCA9IE1hdGgucm91bmQ7XG4gICAgdGhpcy5jb250ZXh0LmZpbGxUZXh0KFxuICAgICAgYCR7cm91bmQodmFsdWUpfSAke3RoaXMubmFtZX0gKCR7cm91bmQobWluKX0tJHtyb3VuZChtYXgpfSlgLFxuICAgICAgVEVYVF9YLFxuICAgICAgVEVYVF9ZXG4gICAgKTtcblxuICAgIHRoaXMuY29udGV4dC5kcmF3SW1hZ2UoXG4gICAgICB0aGlzLmNhbnZhcyxcbiAgICAgIEdSQVBIX1ggKyBQUiwgR1JBUEhfWSxcbiAgICAgIEdSQVBIX1dJRFRIIC0gUFIsXG4gICAgICBHUkFQSF9IRUlHSFQsXG4gICAgICBHUkFQSF9YLFxuICAgICAgR1JBUEhfWSxcbiAgICAgIEdSQVBIX1dJRFRIIC0gUFIsXG4gICAgICBHUkFQSF9IRUlHSFRcbiAgICApO1xuXG4gICAgdGhpcy5jb250ZXh0LmZpbGxSZWN0KFxuICAgICAgR1JBUEhfWCArIEdSQVBIX1dJRFRIIC0gUFIsXG4gICAgICBHUkFQSF9ZLFxuICAgICAgUFIsXG4gICAgICBHUkFQSF9IRUlHSFRcbiAgICApO1xuXG4gICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMuYmc7XG4gICAgdGhpcy5jb250ZXh0Lmdsb2JhbEFscGhhID0gMC45O1xuICAgIHRoaXMuY29udGV4dC5maWxsUmVjdChcbiAgICAgIEdSQVBIX1ggKyBHUkFQSF9XSURUSCAtIFBSLFxuICAgICAgR1JBUEhfWSxcbiAgICAgIFBSLFxuICAgICAgTWF0aC5yb3VuZCgoMSAtICh2YWx1ZSAvIG1heFZhbHVlKSkgKiBHUkFQSF9IRUlHSFQpXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTdGF0cyB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5wZXJmb3JtYW5jZSA9IHdpbmRvdy5wZXJmb3JtYW5jZTtcblxuICAgIHRoaXMubW9kZSA9IDA7XG5cbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb250YWluZXIuc3R5bGUuY3NzVGV4dCA9XG4gICAgICAncG9zaXRpb246Zml4ZWQ7dG9wOjA7bGVmdDowO2N1cnNvcjpwb2ludGVyO29wYWNpdHk6MC45O3otaW5kZXg6MTAwMDAnO1xuXG4gICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnQgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuc2hvd1BhbmVsKCsrdGhpcy5tb2RlICUgdGhpcy5jb250YWluZXIuY2hpbGRyZW4ubGVuZ3RoKTtcbiAgICB9LCBmYWxzZSk7XG5cbiAgICAvL1xuICAgIHRoaXMuYmVnaW5UaW1lID0gKHRoaXMucGVyZm9ybWFuY2UgfHwgRGF0ZSkubm93KCk7XG4gICAgdGhpcy5wcmV2VGltZSA9IHRoaXMuYmVnaW5UaW1lO1xuICAgIHRoaXMuZnJhbWVzID0gMDtcblxuICAgIHRoaXMuZnBzUGFuZWwgPSB0aGlzLmFkZFBhbmVsKG5ldyBTdGF0cy5QYW5lbCgnRlBTJywgJyMwZmYnLCAnIzAwMicpKTtcbiAgICB0aGlzLm1zUGFuZWwgPSB0aGlzLmFkZFBhbmVsKG5ldyBTdGF0cy5QYW5lbCgnTVMnLCAnIzBmMCcsICcjMDIwJykpO1xuICAgIGlmICh0aGlzLnBlcmZvcm1hbmNlICYmIHRoaXMucGVyZm9ybWFuY2UubWVtb3J5KSB7XG4gICAgICB0aGlzLm1lbVBhbmVsID0gdGhpcy5hZGRQYW5lbChuZXcgU3RhdHMuUGFuZWwoJ01CJywgJyNmMDgnLCAnIzIwMScpKTtcbiAgICB9XG5cbiAgICB0aGlzLnNob3dQYW5lbCgwKTtcblxuICAgIHRoaXMuZG9tID0gY29udGFpbmVyO1xuICB9XG5cbiAgYWRkUGFuZWwocGFuZWwpIHtcbiAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZChwYW5lbC5kb20pO1xuICAgIHJldHVybiBwYW5lbDtcblxuICB9XG5cbiAgLy8gU2hvd3Mgc2VsZWN0ZWQgcGFuZWwgYW5kIGhpZGVzIGFsbCBvdGhlcnNcbiAgc2hvd1BhbmVsKGlkKSB7XG4gICAgdGhpcy5jb250YWluZXIuY2hpbGRyZW4uZm9yRWFjaChcbiAgICAgIChjaGlsZCwgaSkgPT4gY2hpbGQuZGlzcGxheSA9IChpID09PSBpZCkgPyAnYmxvY2snIDogJ25vbmUnXG4gICAgKTtcbiAgICB0aGlzLm1vZGUgPSBpZDtcbiAgfVxuXG4gIHNldE1vZGUoaWQpIHtcbiAgICB0aGlzLnNob3dQYW5lbChpZCk7XG4gIH1cblxuICBiZWdpbkZyYW1lKCkge1xuICAgIHRoaXMuYmVnaW5UaW1lID0gKHRoaXMucGVyZm9ybWFuY2UgfHwgRGF0ZSkubm93KCk7XG4gIH1cblxuICBlbmRGcmFtZSgpIHtcbiAgICB0aGlzLmZyYW1lcysrO1xuXG4gICAgY29uc3QgdGltZSA9ICh0aGlzLnBlcmZvcm1hbmNlIHx8IERhdGUpLm5vdygpO1xuXG4gICAgdGhpcy5tc1BhbmVsLnVwZGF0ZSh0aW1lIC0gdGhpcy5iZWdpblRpbWUsIDIwMCk7XG5cbiAgICBjb25zdCBkZWx0YVRpbWUgPSB0aW1lIC0gdGhpcy5wcmV2VGltZTtcbiAgICBpZiAoZGVsdGFUaW1lID4gMTAwMCkge1xuICAgICAgdGhpcy5mcHNQYW5lbC51cGRhdGUoe1xuICAgICAgICB2YWx1ZTogdGhpcy5mcmFtZXMgKiBkZWx0YVRpbWUgLyAxMDAwLFxuICAgICAgICBtYXhWYWx1ZTogMTAwXG4gICAgICB9KTtcblxuICAgICAgdGhpcy5wcmV2VGltZSA9IHRpbWU7XG4gICAgICB0aGlzLmZyYW1lcyA9IDA7XG5cbiAgICAgIGlmICh0aGlzLm1lbVBhbmVsKSB7XG4gICAgICAgIGNvbnN0IG1lbW9yeSA9IHRoaXMucGVyZm9ybWFuY2UubWVtb3J5O1xuICAgICAgICB0aGlzLm1lbVBhbmVsLnVwZGF0ZSh7XG4gICAgICAgICAgdmFsdWU6IG1lbW9yeS51c2VkSlNIZWFwU2l6ZSAvIDEwNDg1NzYsXG4gICAgICAgICAgbWF4VmFsdWU6IG1lbW9yeS5qc0hlYXBTaXplTGltaXQgLyAxMDQ4NTc2XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIHRpbWU7XG4gIH1cblxuICB1cGRhdGUoKSB7XG4gICAgdGhpcy5iZWdpblRpbWUgPSB0aGlzLmVuZCgpO1xuICB9XG59XG5cbi8qKlxuICogQGF1dGhvciBtcmRvb2IgLyBodHRwOi8vbXJkb29iLmNvbS9cbiAqIEBhdXRob3IgamV0aWVubmUgLyBodHRwOi8vamV0aWVubmUuY29tL1xuICovXG4vKiogZ2xvYmFsIGRvY3VtZW50ICovXG5cbmV4cG9ydCBjbGFzcyBSZW5kZXJlclN0YXRzIHtcbiAgLyoqXG4gICAqIFByb3ZpZGUgaW5mbyBvbiBUSFJFRS5XZWJHTFJlbmRlcmVyXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZW5kZXJlciB0aGUgcmVuZGVyZXIgdG8gdXBkYXRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBDYW1lcmEgdGhlIGNhbWVyYSB0byB1cGRhdGVcbiAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29udGFpbmVyLnN0eWxlLmNzc1RleHQgPSAnd2lkdGg6ODBweDtvcGFjaXR5OjAuOTtjdXJzb3I6cG9pbnRlcic7XG5cbiAgICBjb25zdCBtc0RpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIG1zRGl2LnN0eWxlLmNzc1RleHQgPSAncGFkZGluZzowIDAgM3B4IDNweDt0ZXh0LWFsaWduOmxlZnQ7YmFja2dvdW5kLWNvbG9yOiMyMDA7JztcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobXNEaXYpO1xuXG4gICAgY29uc3QgbXNUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbXNUZXh0LnN0eWxlLmNzc1RleHQgPSAnY29sb3I6I2YwMDtmb250LWZhbWlseTpIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZjtmb250LXNpemU6OXB4O2ZvbnQtd2VpZ2h0OmJvbGQ7bGluZS1oZWlnaHQ6MTVweCc7XG4gICAgbXNUZXh0LmlubmVySFRNTCA9ICdSZW5kZXIgU3RhdHMnO1xuICAgIG1zRGl2LmFwcGVuZENoaWxkKG1zVGV4dCk7XG5cbiAgICB0aGlzLm1zVGV4dHMgPSBbXTtcbiAgICB0aGlzLm5MaW5lcyA9IDk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5MaW5lczsgaSsrKSB7XG4gICAgICB0aGlzLm1zVGV4dHNbaV0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHRoaXMubXNUZXh0c1tpXS5zdHlsZS5jc3NUZXh0ID0gJ2NvbG9yOiNmMDA7YmFja2dyb3VuZC1jb2xvcjojMzExO2ZvbnQtZmFtaWx5OkhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmO2ZvbnQtc2l6ZTo5cHg7Zm9udC13ZWlnaHQ6Ym9sZDtsaW5lLWhlaWdodDoxNXB4JztcbiAgICAgIHRoaXMubXNUZXh0c1tpXS5pbm5lckhUTUwgPSAnLSc7XG4gICAgICBtc0Rpdi5hcHBlbmRDaGlsZCh0aGlzLm1zVGV4dHNbaV0pO1xuICAgIH1cblxuICAgIHRoaXMubGFzdFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIHRoaXMuZG9tRWxlbWVudCA9IGNvbnRhaW5lcjtcbiAgfVxuXG4gIHVwZGF0ZShpbmZvKSB7XG4gICAgLy8gcmVmcmVzaCBvbmx5IDMwdGltZSBwZXIgc2Vjb25kXG4gICAgaWYgKERhdGUubm93KCkgLSB0aGlzLmxhc3RUaW1lIDwgMTAwMCAvIDMwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMubGFzdFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgbGV0IGkgPSAwO1xuICAgIHRoaXMubXNUZXh0c1tpKytdLnRleHRDb250ZW50ID0gYD09IE1lbW9yeSA9PT09PWA7XG4gICAgdGhpcy5tc1RleHRzW2krK10udGV4dENvbnRlbnQgPSBgUHJvZ3JhbXM6ICR7aW5mby5tZW1vcnkucHJvZ3JhbXN9YDtcbiAgICB0aGlzLm1zVGV4dHNbaSsrXS50ZXh0Q29udGVudCA9IGBHZW9tZXRyaWVzOiAke2luZm8ubWVtb3J5Lmdlb21ldHJpZXN9YDtcbiAgICB0aGlzLm1zVGV4dHNbaSsrXS50ZXh0Q29udGVudCA9IGBUZXh0dXJlczogJHtpbmZvLm1lbW9yeS50ZXh0dXJlc31gO1xuXG4gICAgdGhpcy5tc1RleHRzW2krK10udGV4dENvbnRlbnQgPSBgPT0gUmVuZGVyID09PT09YDtcbiAgICB0aGlzLm1zVGV4dHNbaSsrXS50ZXh0Q29udGVudCA9IGBDYWxsczogJHtpbmZvLnJlbmRlci5jYWxsc31gO1xuICAgIHRoaXMubXNUZXh0c1tpKytdLnRleHRDb250ZW50ID0gYFZlcnRpY2VzOiAke2luZm8ucmVuZGVyLnZlcnRpY2VzfWA7XG4gICAgdGhpcy5tc1RleHRzW2krK10udGV4dENvbnRlbnQgPSBgRmFjZXM6ICR7aW5mby5yZW5kZXIuZmFjZXN9YDtcbiAgICB0aGlzLm1zVGV4dHNbaSsrXS50ZXh0Q29udGVudCA9IGBQb2ludHM6ICR7aW5mby5yZW5kZXIucG9pbnRzfWA7XG4gIH1cbn1cbiJdfQ==