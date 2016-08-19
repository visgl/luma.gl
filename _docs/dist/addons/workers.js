"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// workers.js
//
/* global Worker */
/* eslint-disable one-var, indent */

var WorkerGroup = function () {
  function WorkerGroup(fileName, n) {
    _classCallCheck(this, WorkerGroup);

    var workers = this.workers = [];
    while (n--) {
      workers.push(new Worker(fileName));
    }
  }

  _createClass(WorkerGroup, [{
    key: "map",
    value: function map(func) {
      var workers = this.workers;
      var configs = this.configs = [];

      for (var i = 0, l = workers.length; i < l; i++) {
        configs.push(func && func(i));
      }

      return this;
    }
  }, {
    key: "reduce",
    value: function reduce(opt) {
      var fn = opt.reduceFn;
      var workers = this.workers;
      var configs = this.configs;
      var l = workers.length;
      var acum = opt.initialValue;
      var message = function _(e) {
        l--;
        if (acum === undefined) {
          acum = e.data;
        } else {
          acum = fn(acum, e.data);
        }
        if (l === 0) {
          opt.onComplete(acum);
        }
      };
      for (var i = 0, ln = l; i < ln; i++) {
        var w = workers[i];
        w.onmessage = message;
        w.postMessage(configs[i]);
      }

      return this;
    }
  }]);

  return WorkerGroup;
}();

exports.default = WorkerGroup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvd29ya2Vycy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7SUFLcUIsVztBQUVuQix1QkFBWSxRQUFaLEVBQXNCLENBQXRCLEVBQXlCO0FBQUE7O0FBQ3ZCLFFBQU0sVUFBVSxLQUFLLE9BQUwsR0FBZSxFQUEvQjtBQUNBLFdBQU8sR0FBUCxFQUFZO0FBQ1YsY0FBUSxJQUFSLENBQWEsSUFBSSxNQUFKLENBQVcsUUFBWCxDQUFiO0FBQ0Q7QUFDRjs7Ozt3QkFFRyxJLEVBQU07QUFDUixVQUFNLFVBQVUsS0FBSyxPQUFyQjtBQUNBLFVBQU0sVUFBVSxLQUFLLE9BQUwsR0FBZSxFQUEvQjs7QUFFQSxXQUFLLElBQUksSUFBSSxDQUFSLEVBQVcsSUFBSSxRQUFRLE1BQTVCLEVBQW9DLElBQUksQ0FBeEMsRUFBMkMsR0FBM0MsRUFBZ0Q7QUFDOUMsZ0JBQVEsSUFBUixDQUFhLFFBQVEsS0FBSyxDQUFMLENBQXJCO0FBQ0Q7O0FBRUQsYUFBTyxJQUFQO0FBQ0Q7OzsyQkFFTSxHLEVBQUs7QUFDVixVQUFNLEtBQUssSUFBSSxRQUFmO0FBQ0EsVUFBTSxVQUFVLEtBQUssT0FBckI7QUFDQSxVQUFNLFVBQVUsS0FBSyxPQUFyQjtBQUNBLFVBQUksSUFBSSxRQUFRLE1BQWhCO0FBQ0EsVUFBSSxPQUFPLElBQUksWUFBZjtBQUNBLFVBQU0sVUFBVSxTQUFTLENBQVQsQ0FBVyxDQUFYLEVBQWM7QUFDNUI7QUFDQSxZQUFJLFNBQVMsU0FBYixFQUF3QjtBQUN0QixpQkFBTyxFQUFFLElBQVQ7QUFDRCxTQUZELE1BRU87QUFDTCxpQkFBTyxHQUFHLElBQUgsRUFBUyxFQUFFLElBQVgsQ0FBUDtBQUNEO0FBQ0QsWUFBSSxNQUFNLENBQVYsRUFBYTtBQUNYLGNBQUksVUFBSixDQUFlLElBQWY7QUFDRDtBQUNGLE9BVkQ7QUFXQSxXQUFLLElBQUksSUFBSSxDQUFSLEVBQVcsS0FBSyxDQUFyQixFQUF3QixJQUFJLEVBQTVCLEVBQWdDLEdBQWhDLEVBQXFDO0FBQ25DLFlBQU0sSUFBSSxRQUFRLENBQVIsQ0FBVjtBQUNBLFVBQUUsU0FBRixHQUFjLE9BQWQ7QUFDQSxVQUFFLFdBQUYsQ0FBYyxRQUFRLENBQVIsQ0FBZDtBQUNEOztBQUVELGFBQU8sSUFBUDtBQUNEOzs7Ozs7a0JBNUNrQixXIiwiZmlsZSI6IndvcmtlcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB3b3JrZXJzLmpzXG4vL1xuLyogZ2xvYmFsIFdvcmtlciAqL1xuLyogZXNsaW50LWRpc2FibGUgb25lLXZhciwgaW5kZW50ICovXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdvcmtlckdyb3VwIHtcblxuICBjb25zdHJ1Y3RvcihmaWxlTmFtZSwgbikge1xuICAgIGNvbnN0IHdvcmtlcnMgPSB0aGlzLndvcmtlcnMgPSBbXTtcbiAgICB3aGlsZSAobi0tKSB7XG4gICAgICB3b3JrZXJzLnB1c2gobmV3IFdvcmtlcihmaWxlTmFtZSkpO1xuICAgIH1cbiAgfVxuXG4gIG1hcChmdW5jKSB7XG4gICAgY29uc3Qgd29ya2VycyA9IHRoaXMud29ya2VycztcbiAgICBjb25zdCBjb25maWdzID0gdGhpcy5jb25maWdzID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMCwgbCA9IHdvcmtlcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBjb25maWdzLnB1c2goZnVuYyAmJiBmdW5jKGkpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlZHVjZShvcHQpIHtcbiAgICBjb25zdCBmbiA9IG9wdC5yZWR1Y2VGbjtcbiAgICBjb25zdCB3b3JrZXJzID0gdGhpcy53b3JrZXJzO1xuICAgIGNvbnN0IGNvbmZpZ3MgPSB0aGlzLmNvbmZpZ3M7XG4gICAgbGV0IGwgPSB3b3JrZXJzLmxlbmd0aDtcbiAgICBsZXQgYWN1bSA9IG9wdC5pbml0aWFsVmFsdWU7XG4gICAgY29uc3QgbWVzc2FnZSA9IGZ1bmN0aW9uIF8oZSkge1xuICAgICAgbC0tO1xuICAgICAgaWYgKGFjdW0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhY3VtID0gZS5kYXRhO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWN1bSA9IGZuKGFjdW0sIGUuZGF0YSk7XG4gICAgICB9XG4gICAgICBpZiAobCA9PT0gMCkge1xuICAgICAgICBvcHQub25Db21wbGV0ZShhY3VtKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGZvciAobGV0IGkgPSAwLCBsbiA9IGw7IGkgPCBsbjsgaSsrKSB7XG4gICAgICBjb25zdCB3ID0gd29ya2Vyc1tpXTtcbiAgICAgIHcub25tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgIHcucG9zdE1lc3NhZ2UoY29uZmlnc1tpXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufVxuIl19