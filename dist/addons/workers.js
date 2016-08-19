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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvd29ya2Vycy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7O0lBRXFCLFc7QUFFbkIsdUJBQVksUUFBWixFQUFzQixDQUF0QixFQUF5QjtBQUFBOztBQUN2QixRQUFNLFVBQVUsS0FBSyxPQUFMLEdBQWUsRUFBL0I7QUFDQSxXQUFPLEdBQVAsRUFBWTtBQUNWLGNBQVEsSUFBUixDQUFhLElBQUksTUFBSixDQUFXLFFBQVgsQ0FBYjtBQUNEO0FBQ0Y7Ozs7d0JBRUcsSSxFQUFNO0FBQ1IsVUFBTSxVQUFVLEtBQUssT0FBckI7QUFDQSxVQUFNLFVBQVUsS0FBSyxPQUFMLEdBQWUsRUFBL0I7O0FBRUEsV0FBSyxJQUFJLElBQUksQ0FBUixFQUFXLElBQUksUUFBUSxNQUE1QixFQUFvQyxJQUFJLENBQXhDLEVBQTJDLEdBQTNDLEVBQWdEO0FBQzlDLGdCQUFRLElBQVIsQ0FBYSxRQUFRLEtBQUssQ0FBTCxDQUFyQjtBQUNEOztBQUVELGFBQU8sSUFBUDtBQUNEOzs7MkJBRU0sRyxFQUFLO0FBQ1YsVUFBTSxLQUFLLElBQUksUUFBZjtBQUNBLFVBQU0sVUFBVSxLQUFLLE9BQXJCO0FBQ0EsVUFBTSxVQUFVLEtBQUssT0FBckI7QUFDQSxVQUFJLElBQUksUUFBUSxNQUFoQjtBQUNBLFVBQUksT0FBTyxJQUFJLFlBQWY7QUFDQSxVQUFNLFVBQVUsU0FBUyxDQUFULENBQVcsQ0FBWCxFQUFjO0FBQzVCO0FBQ0EsWUFBSSxTQUFTLFNBQWIsRUFBd0I7QUFDdEIsaUJBQU8sRUFBRSxJQUFUO0FBQ0QsU0FGRCxNQUVPO0FBQ0wsaUJBQU8sR0FBRyxJQUFILEVBQVMsRUFBRSxJQUFYLENBQVA7QUFDRDtBQUNELFlBQUksTUFBTSxDQUFWLEVBQWE7QUFDWCxjQUFJLFVBQUosQ0FBZSxJQUFmO0FBQ0Q7QUFDRixPQVZEO0FBV0EsV0FBSyxJQUFJLElBQUksQ0FBUixFQUFXLEtBQUssQ0FBckIsRUFBd0IsSUFBSSxFQUE1QixFQUFnQyxHQUFoQyxFQUFxQztBQUNuQyxZQUFNLElBQUksUUFBUSxDQUFSLENBQVY7QUFDQSxVQUFFLFNBQUYsR0FBYyxPQUFkO0FBQ0EsVUFBRSxXQUFGLENBQWMsUUFBUSxDQUFSLENBQWQ7QUFDRDs7QUFFRCxhQUFPLElBQVA7QUFDRDs7Ozs7O2tCQTVDa0IsVyIsImZpbGUiOiJ3b3JrZXJzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gd29ya2Vycy5qc1xuLy9cbi8qIGdsb2JhbCBXb3JrZXIgKi9cbi8qIGVzbGludC1kaXNhYmxlIG9uZS12YXIsIGluZGVudCAqL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBXb3JrZXJHcm91cCB7XG5cbiAgY29uc3RydWN0b3IoZmlsZU5hbWUsIG4pIHtcbiAgICBjb25zdCB3b3JrZXJzID0gdGhpcy53b3JrZXJzID0gW107XG4gICAgd2hpbGUgKG4tLSkge1xuICAgICAgd29ya2Vycy5wdXNoKG5ldyBXb3JrZXIoZmlsZU5hbWUpKTtcbiAgICB9XG4gIH1cblxuICBtYXAoZnVuYykge1xuICAgIGNvbnN0IHdvcmtlcnMgPSB0aGlzLndvcmtlcnM7XG4gICAgY29uc3QgY29uZmlncyA9IHRoaXMuY29uZmlncyA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSB3b3JrZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgY29uZmlncy5wdXNoKGZ1bmMgJiYgZnVuYyhpKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZWR1Y2Uob3B0KSB7XG4gICAgY29uc3QgZm4gPSBvcHQucmVkdWNlRm47XG4gICAgY29uc3Qgd29ya2VycyA9IHRoaXMud29ya2VycztcbiAgICBjb25zdCBjb25maWdzID0gdGhpcy5jb25maWdzO1xuICAgIGxldCBsID0gd29ya2Vycy5sZW5ndGg7XG4gICAgbGV0IGFjdW0gPSBvcHQuaW5pdGlhbFZhbHVlO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBmdW5jdGlvbiBfKGUpIHtcbiAgICAgIGwtLTtcbiAgICAgIGlmIChhY3VtID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYWN1bSA9IGUuZGF0YTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFjdW0gPSBmbihhY3VtLCBlLmRhdGEpO1xuICAgICAgfVxuICAgICAgaWYgKGwgPT09IDApIHtcbiAgICAgICAgb3B0Lm9uQ29tcGxldGUoYWN1bSk7XG4gICAgICB9XG4gICAgfTtcbiAgICBmb3IgKGxldCBpID0gMCwgbG4gPSBsOyBpIDwgbG47IGkrKykge1xuICAgICAgY29uc3QgdyA9IHdvcmtlcnNbaV07XG4gICAgICB3Lm9ubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICB3LnBvc3RNZXNzYWdlKGNvbmZpZ3NbaV0pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cbiJdfQ==