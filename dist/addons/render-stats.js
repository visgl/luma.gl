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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvcmVuZGVyLXN0YXRzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFTQSxJQUFNLEtBQUssS0FBSyxLQUFMLENBQVcsT0FBTyxnQkFBUCxJQUEyQixDQUF0QyxDQUFYOztBQUVBLElBQU0sUUFBUSxLQUFLLEVBQW5CO0FBQ0EsSUFBTSxTQUFTLEtBQUssRUFBcEI7QUFDQSxJQUFNLFNBQVMsSUFBSSxFQUFuQjtBQUNBLElBQU0sU0FBUyxJQUFJLEVBQW5CO0FBQ0EsSUFBTSxVQUFVLElBQUksRUFBcEI7QUFDQSxJQUFNLFVBQVUsS0FBSyxFQUFyQjtBQUNBLElBQU0sY0FBYyxLQUFLLEVBQXpCO0FBQ0EsSUFBTSxlQUFlLEtBQUssRUFBMUI7O0lBRWEsSyxXQUFBLEs7QUFFWCxpQkFBWSxJQUFaLEVBQWtCLEVBQWxCLEVBQXNCLEVBQXRCLEVBQTBCO0FBQUE7O0FBQ3hCLFFBQU0sU0FBUyxTQUFTLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBZjtBQUNBLFdBQU8sS0FBUCxHQUFlLEtBQWY7QUFDQSxXQUFPLE1BQVAsR0FBZ0IsTUFBaEI7QUFDQSxXQUFPLEtBQVAsQ0FBYSxPQUFiLEdBQXVCLHdCQUF2Qjs7QUFFQSxRQUFNLFVBQVUsT0FBTyxVQUFQLENBQWtCLElBQWxCLENBQWhCO0FBQ0EsWUFBUSxJQUFSLGFBQXVCLElBQUksRUFBM0I7QUFDQSxZQUFRLFlBQVIsR0FBdUIsS0FBdkI7O0FBRUEsWUFBUSxTQUFSLEdBQW9CLEVBQXBCO0FBQ0EsWUFBUSxRQUFSLENBQWlCLENBQWpCLEVBQW9CLENBQXBCLEVBQXVCLEtBQXZCLEVBQThCLE1BQTlCOztBQUVBLFlBQVEsU0FBUixHQUFvQixFQUFwQjtBQUNBLFlBQVEsUUFBUixDQUFpQixJQUFqQixFQUF1QixNQUF2QixFQUErQixNQUEvQjtBQUNBLFlBQVEsUUFBUixDQUFpQixPQUFqQixFQUEwQixPQUExQixFQUFtQyxXQUFuQyxFQUFnRCxZ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SyxNQUFMLENBQVksTUFBdkQ7QUFDRCIsImZpbGUiOiJyZW5kZXItc3RhdHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBBbiBhZGFwdGF0aW9uIG9mIHRoZSBUSFJFRS5qcyBzdGF0cyBoZWxwZXJzIChNSVQgbGljZW5zZWQpXG4vLyBodHRwczovL2dpdGh1Yi5jb20vbXJkb29iL3N0YXRzLmpzXG4vLyBodHRwczovL2dpdGh1Yi5jb20vamVyb21lZXRpZW5uZS90aHJlZXgucmVuZGVyZXJzdGF0c1xuXG4vKipcbiAqIEBhdXRob3IgbXJkb29iIC8gaHR0cDovL21yZG9vYi5jb20vXG4gKi9cblxuLyogZ2xvYmFsIGRvY3VtZW50LCB3aW5kb3cgKi9cbmNvbnN0IFBSID0gTWF0aC5yb3VuZCh3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxKTtcblxuY29uc3QgV0lEVEggPSA4MCAqIFBSO1xuY29uc3QgSEVJR0hUID0gNDggKiBQUjtcbmNvbnN0IFRFWFRfWCA9IDMgKiBQUjtcbmNvbnN0IFRFWFRfWSA9IDIgKiBQUjtcbmNvbnN0IEdSQVBIX1ggPSAzICogUFI7XG5jb25zdCBHUkFQSF9ZID0gMTUgKiBQUjtcbmNvbnN0IEdSQVBIX1dJRFRIID0gNzQgKiBQUjtcbmNvbnN0IEdSQVBIX0hFSUdIVCA9IDMwICogUFI7XG5cbmV4cG9ydCBjbGFzcyBQYW5lbCB7XG5cbiAgY29uc3RydWN0b3IobmFtZSwgZmcsIGJnKSB7XG4gICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgY2FudmFzLndpZHRoID0gV0lEVEg7XG4gICAgY2FudmFzLmhlaWdodCA9IEhFSUdIVDtcbiAgICBjYW52YXMuc3R5bGUuY3NzVGV4dCA9ICd3aWR0aDo4MHB4O2hlaWdodDo0OHB4JztcblxuICAgIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBjb250ZXh0LmZvbnQgPSBgYm9sZCAkezkgKiBQUn1weCBIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZmA7XG4gICAgY29udGV4dC50ZXh0QmFzZWxpbmUgPSAndG9wJztcblxuICAgIGNvbnRleHQuZmlsbFN0eWxlID0gYmc7XG4gICAgY29udGV4dC5maWxsUmVjdCgwLCAwLCBXSURUSCwgSEVJR0hUKTtcblxuICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZmc7XG4gICAgY29udGV4dC5maWxsVGV4dChuYW1lLCBURVhUX1gsIFRFWFRfWSk7XG4gICAgY29udGV4dC5maWxsUmVjdChHUkFQSF9YLCBHUkFQSF9ZLCBHUkFQSF9XSURUSCwgR1JBUEhfSEVJR0hUKTtcblxuICAgIGNvbnRleHQuZmlsbFN0eWxlID0gYmc7XG4gICAgY29udGV4dC5nbG9iYWxBbHBoYSA9IDAuOTtcbiAgICBjb250ZXh0LmZpbGxSZWN0KEdSQVBIX1gsIEdSQVBIX1ksIEdSQVBIX1dJRFRILCBHUkFQSF9IRUlHSFQpO1xuXG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLmZnID0gZmc7XG4gICAgdGhpcy5iZyA9IGJnO1xuICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgdGhpcy5kb20gPSBjYW52YXM7XG4gIH1cblxuICB1cGRhdGUoe3ZhbHVlLCBtYXhWYWx1ZX0pIHtcbiAgICBjb25zdCBtaW4gPSBNYXRoLm1pbihtaW4sIHZhbHVlKTtcbiAgICBjb25zdCBtYXggPSBNYXRoLm1heChtYXgsIHZhbHVlKTtcblxuICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSB0aGlzLmJnO1xuICAgIHRoaXMuY29udGV4dC5nbG9iYWxBbHBoYSA9IDE7XG4gICAgdGhpcy5jb250ZXh0LmZpbGxSZWN0KDAsIDAsIFdJRFRILCBHUkFQSF9ZKTtcbiAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5mZztcblxuICAgIGNvbnN0IHJvdW5kID0gTWF0aC5yb3VuZDtcbiAgICB0aGlzLmNvbnRleHQuZmlsbFRleHQoXG4gICAgICBgJHtyb3VuZCh2YWx1ZSl9ICR7dGhpcy5uYW1lfSAoJHtyb3VuZChtaW4pfS0ke3JvdW5kKG1heCl9KWAsXG4gICAgICBURVhUX1gsXG4gICAgICBURVhUX1lcbiAgICApO1xuXG4gICAgdGhpcy5jb250ZXh0LmRyYXdJbWFnZShcbiAgICAgIHRoaXMuY2FudmFzLFxuICAgICAgR1JBUEhfWCArIFBSLCBHUkFQSF9ZLFxuICAgICAgR1JBUEhfV0lEVEggLSBQUixcbiAgICAgIEdSQVBIX0hFSUdIVCxcbiAgICAgIEdSQVBIX1gsXG4gICAgICBHUkFQSF9ZLFxuICAgICAgR1JBUEhfV0lEVEggLSBQUixcbiAgICAgIEdSQVBIX0hFSUdIVFxuICAgICk7XG5cbiAgICB0aGlzLmNvbnRleHQuZmlsbFJlY3QoXG4gICAgICBHUkFQSF9YICsgR1JBUEhfV0lEVEggLSBQUixcbiAgICAgIEdSQVBIX1ksXG4gICAgICBQUixcbiAgICAgIEdSQVBIX0hFSUdIVFxuICAgICk7XG5cbiAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5iZztcbiAgICB0aGlzLmNvbnRleHQuZ2xvYmFsQWxwaGEgPSAwLjk7XG4gICAgdGhpcy5jb250ZXh0LmZpbGxSZWN0KFxuICAgICAgR1JBUEhfWCArIEdSQVBIX1dJRFRIIC0gUFIsXG4gICAgICBHUkFQSF9ZLFxuICAgICAgUFIsXG4gICAgICBNYXRoLnJvdW5kKCgxIC0gKHZhbHVlIC8gbWF4VmFsdWUpKSAqIEdSQVBIX0hFSUdIVClcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFN0YXRzIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnBlcmZvcm1hbmNlID0gd2luZG93LnBlcmZvcm1hbmNlO1xuXG4gICAgdGhpcy5tb2RlID0gMDtcblxuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGNvbnRhaW5lci5zdHlsZS5jc3NUZXh0ID1cbiAgICAgICdwb3NpdGlvbjpmaXhlZDt0b3A6MDtsZWZ0OjA7Y3Vyc29yOnBvaW50ZXI7b3BhY2l0eTowLjk7ei1pbmRleDoxMDAwMCc7XG5cbiAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5zaG93UGFuZWwoKyt0aGlzLm1vZGUgJSB0aGlzLmNvbnRhaW5lci5jaGlsZHJlbi5sZW5ndGgpO1xuICAgIH0sIGZhbHNlKTtcblxuICAgIC8vXG4gICAgdGhpcy5iZWdpblRpbWUgPSAodGhpcy5wZXJmb3JtYW5jZSB8fCBEYXRlKS5ub3coKTtcbiAgICB0aGlzLnByZXZUaW1lID0gdGhpcy5iZWdpblRpbWU7XG4gICAgdGhpcy5mcmFtZXMgPSAwO1xuXG4gICAgdGhpcy5mcHNQYW5lbCA9IHRoaXMuYWRkUGFuZWwobmV3IFN0YXRzLlBhbmVsKCdGUFMnLCAnIzBmZicsICcjMDAyJykpO1xuICAgIHRoaXMubXNQYW5lbCA9IHRoaXMuYWRkUGFuZWwobmV3IFN0YXRzLlBhbmVsKCdNUycsICcjMGYwJywgJyMwMjAnKSk7XG4gICAgaWYgKHRoaXMucGVyZm9ybWFuY2UgJiYgdGhpcy5wZXJmb3JtYW5jZS5tZW1vcnkpIHtcbiAgICAgIHRoaXMubWVtUGFuZWwgPSB0aGlzLmFkZFBhbmVsKG5ldyBTdGF0cy5QYW5lbCgnTUInLCAnI2YwOCcsICcjMjAxJykpO1xuICAgIH1cblxuICAgIHRoaXMuc2hvd1BhbmVsKDApO1xuXG4gICAgdGhpcy5kb20gPSBjb250YWluZXI7XG4gIH1cblxuICBhZGRQYW5lbChwYW5lbCkge1xuICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHBhbmVsLmRvbSk7XG4gICAgcmV0dXJuIHBhbmVsO1xuXG4gIH1cblxuICAvLyBTaG93cyBzZWxlY3RlZCBwYW5lbCBhbmQgaGlkZXMgYWxsIG90aGVyc1xuICBzaG93UGFuZWwoaWQpIHtcbiAgICB0aGlzLmNvbnRhaW5lci5jaGlsZHJlbi5mb3JFYWNoKFxuICAgICAgKGNoaWxkLCBpKSA9PiBjaGlsZC5kaXNwbGF5ID0gKGkgPT09IGlkKSA/ICdibG9jaycgOiAnbm9uZSdcbiAgICApO1xuICAgIHRoaXMubW9kZSA9IGlkO1xuICB9XG5cbiAgc2V0TW9kZShpZCkge1xuICAgIHRoaXMuc2hvd1BhbmVsKGlkKTtcbiAgfVxuXG4gIGJlZ2luRnJhbWUoKSB7XG4gICAgdGhpcy5iZWdpblRpbWUgPSAodGhpcy5wZXJmb3JtYW5jZSB8fCBEYXRlKS5ub3coKTtcbiAgfVxuXG4gIGVuZEZyYW1lKCkge1xuICAgIHRoaXMuZnJhbWVzKys7XG5cbiAgICBjb25zdCB0aW1lID0gKHRoaXMucGVyZm9ybWFuY2UgfHwgRGF0ZSkubm93KCk7XG5cbiAgICB0aGlzLm1zUGFuZWwudXBkYXRlKHRpbWUgLSB0aGlzLmJlZ2luVGltZSwgMjAwKTtcblxuICAgIGNvbnN0IGRlbHRhVGltZSA9IHRpbWUgLSB0aGlzLnByZXZUaW1lO1xuICAgIGlmIChkZWx0YVRpbWUgPiAxMDAwKSB7XG4gICAgICB0aGlzLmZwc1BhbmVsLnVwZGF0ZSh7XG4gICAgICAgIHZhbHVlOiB0aGlzLmZyYW1lcyAqIGRlbHRhVGltZSAvIDEwMDAsXG4gICAgICAgIG1heFZhbHVlOiAxMDBcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnByZXZUaW1lID0gdGltZTtcbiAgICAgIHRoaXMuZnJhbWVzID0gMDtcblxuICAgICAgaWYgKHRoaXMubWVtUGFuZWwpIHtcbiAgICAgICAgY29uc3QgbWVtb3J5ID0gdGhpcy5wZXJmb3JtYW5jZS5tZW1vcnk7XG4gICAgICAgIHRoaXMubWVtUGFuZWwudXBkYXRlKHtcbiAgICAgICAgICB2YWx1ZTogbWVtb3J5LnVzZWRKU0hlYXBTaXplIC8gMTA0ODU3NixcbiAgICAgICAgICBtYXhWYWx1ZTogbWVtb3J5LmpzSGVhcFNpemVMaW1pdCAvIDEwNDg1NzZcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICByZXR1cm4gdGltZTtcbiAgfVxuXG4gIHVwZGF0ZSgpIHtcbiAgICB0aGlzLmJlZ2luVGltZSA9IHRoaXMuZW5kKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBAYXV0aG9yIG1yZG9vYiAvIGh0dHA6Ly9tcmRvb2IuY29tL1xuICogQGF1dGhvciBqZXRpZW5uZSAvIGh0dHA6Ly9qZXRpZW5uZS5jb20vXG4gKi9cbi8qKiBnbG9iYWwgZG9jdW1lbnQgKi9cblxuZXhwb3J0IGNsYXNzIFJlbmRlcmVyU3RhdHMge1xuICAvKipcbiAgICogUHJvdmlkZSBpbmZvIG9uIFRIUkVFLldlYkdMUmVuZGVyZXJcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHJlbmRlcmVyIHRoZSByZW5kZXJlciB0byB1cGRhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IENhbWVyYSB0aGUgY2FtZXJhIHRvIHVwZGF0ZVxuICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb250YWluZXIuc3R5bGUuY3NzVGV4dCA9ICd3aWR0aDo4MHB4O29wYWNpdHk6MC45O2N1cnNvcjpwb2ludGVyJztcblxuICAgIGNvbnN0IG1zRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbXNEaXYuc3R5bGUuY3NzVGV4dCA9ICdwYWRkaW5nOjAgMCAzcHggM3B4O3RleHQtYWxpZ246bGVmdDtiYWNrZ291bmQtY29sb3I6IzIwMDsnO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChtc0Rpdik7XG5cbiAgICBjb25zdCBtc1RleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBtc1RleHQuc3R5bGUuY3NzVGV4dCA9ICdjb2xvcjojZjAwO2ZvbnQtZmFtaWx5OkhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmO2ZvbnQtc2l6ZTo5cHg7Zm9udC13ZWlnaHQ6Ym9sZDtsaW5lLWhlaWdodDoxNXB4JztcbiAgICBtc1RleHQuaW5uZXJIVE1MID0gJ1JlbmRlciBTdGF0cyc7XG4gICAgbXNEaXYuYXBwZW5kQ2hpbGQobXNUZXh0KTtcblxuICAgIHRoaXMubXNUZXh0cyA9IFtdO1xuICAgIHRoaXMubkxpbmVzID0gOTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubkxpbmVzOyBpKyspIHtcbiAgICAgIHRoaXMubXNUZXh0c1tpXSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgdGhpcy5tc1RleHRzW2ldLnN0eWxlLmNzc1RleHQgPSAnY29sb3I6I2YwMDtiYWNrZ3JvdW5kLWNvbG9yOiMzMTE7Zm9udC1mYW1pbHk6SGVsdmV0aWNhLEFyaWFsLHNhbnMtc2VyaWY7Zm9udC1zaXplOjlweDtmb250LXdlaWdodDpib2xkO2xpbmUtaGVpZ2h0OjE1cHgnO1xuICAgICAgdGhpcy5tc1RleHRzW2ldLmlubmVySFRNTCA9ICctJztcbiAgICAgIG1zRGl2LmFwcGVuZENoaWxkKHRoaXMubXNUZXh0c1tpXSk7XG4gICAgfVxuXG4gICAgdGhpcy5sYXN0VGltZSA9IERhdGUubm93KCk7XG4gICAgdGhpcy5kb21FbGVtZW50ID0gY29udGFpbmVyO1xuICB9XG5cbiAgdXBkYXRlKGluZm8pIHtcbiAgICAvLyByZWZyZXNoIG9ubHkgMzB0aW1lIHBlciBzZWNvbmRcbiAgICBpZiAoRGF0ZS5ub3coKSAtIHRoaXMubGFzdFRpbWUgPCAxMDAwIC8gMzApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5sYXN0VGltZSA9IERhdGUubm93KCk7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgdGhpcy5tc1RleHRzW2krK10udGV4dENvbnRlbnQgPSBgPT0gTWVtb3J5ID09PT09YDtcbiAgICB0aGlzLm1zVGV4dHNbaSsrXS50ZXh0Q29udGVudCA9IGBQcm9ncmFtczogJHtpbmZvLm1lbW9yeS5wcm9ncmFtc31gO1xuICAgIHRoaXMubXNUZXh0c1tpKytdLnRleHRDb250ZW50ID0gYEdlb21ldHJpZXM6ICR7aW5mby5tZW1vcnkuZ2VvbWV0cmllc31gO1xuICAgIHRoaXMubXNUZXh0c1tpKytdLnRleHRDb250ZW50ID0gYFRleHR1cmVzOiAke2luZm8ubWVtb3J5LnRleHR1cmVzfWA7XG5cbiAgICB0aGlzLm1zVGV4dHNbaSsrXS50ZXh0Q29udGVudCA9IGA9PSBSZW5kZXIgPT09PT1gO1xuICAgIHRoaXMubXNUZXh0c1tpKytdLnRleHRDb250ZW50ID0gYENhbGxzOiAke2luZm8ucmVuZGVyLmNhbGxzfWA7XG4gICAgdGhpcy5tc1RleHRzW2krK10udGV4dENvbnRlbnQgPSBgVmVydGljZXM6ICR7aW5mby5yZW5kZXIudmVydGljZXN9YDtcbiAgICB0aGlzLm1zVGV4dHNbaSsrXS50ZXh0Q29udGVudCA9IGBGYWNlczogJHtpbmZvLnJlbmRlci5mYWNlc31gO1xuICAgIHRoaXMubXNUZXh0c1tpKytdLnRleHRDb250ZW50ID0gYFBvaW50czogJHtpbmZvLnJlbmRlci5wb2ludHN9YDtcbiAgfVxufVxuIl19