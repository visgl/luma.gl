'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /* eslint-disable max-statements */


var _probe = require('../src/probe');

var _probe2 = _interopRequireDefault(_probe);

var _tape = require('tape');

var _tape2 = _interopRequireDefault(_tape);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getInstance() {
  return new _probe2.default({
    isEnabled: true,
    isPrintEnabled: false,
    ignoreEnvironment: true
  });
}

(0, _tape2.default)('Probe#probe', function (assert) {
  var probe = getInstance();

  probe.probe('test');

  var log = probe.getLog();
  var row = log[0];

  assert.equals(log.length, 1, 'Expected row logged');
  assert.equal(row.name, 'test', 'Name logged');
  assert.equal(_typeof(row.total), 'number', 'Start is set');
  assert.equal(_typeof(row.delta), 'number', 'Delta is set');

  assert.end();
});

(0, _tape2.default)('Probe#probe - level methods', function (assert) {
  var probe = getInstance().setLevel(3);

  probe.probe('test0');
  probe.probe1('test1');
  probe.probe2('test2');
  probe.probe3('test3');

  var log = probe.getLog();

  assert.equals(log.length, 4, 'Expected rows logged');
  assert.deepEqual(log.map(function (row) {
    return row.level;
  }), [1, 1, 2, 3], 'Levels match expected');
  assert.deepEqual(log.map(function (row) {
    return row.name;
  }), ['test0', 'test1', 'test2', 'test3'], 'Names match expected');

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = log[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var row = _step.value;

      assert.equal(_typeof(row.total), 'number', 'Start is set');
      assert.equal(_typeof(row.delta), 'number', 'Delta is set');
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  assert.end();
});

(0, _tape2.default)('Probe#probe - level methods, lower level set', function (assert) {
  var probe = getInstance().setLevel(1);

  probe.probe('test0');
  probe.probe1('test1');
  probe.probe2('test2');
  probe.probe3('test3');

  var log = probe.getLog();

  assert.equals(log.length, 2, 'Expected rows logged');
  assert.deepEqual(log.map(function (row) {
    return row.level;
  }), [1, 1], 'Levels match expected');

  assert.end();
});

(0, _tape2.default)('Probe#probe - disabled', function (assert) {
  var probe = getInstance().disable();

  probe.probe('test0');
  probe.probe1('test1');
  probe.probe2('test2');
  probe.probe3('test3');

  var log = probe.getLog();

  assert.equals(log.length, 0, 'No rows logged');

  assert.end();
});

(0, _tape2.default)('Probe#sample - level methods', function (assert) {
  var probe = getInstance().setLevel(3);

  probe.sample('test0');
  probe.sample1('test1');
  probe.sample2('test2');
  probe.sample3('test3');

  var log = probe.getLog();

  assert.equals(log.length, 4, 'Expected rows logged');
  assert.deepEqual(log.map(function (row) {
    return row.level;
  }), [1, 1, 2, 3], 'Levels match expected');
  assert.deepEqual(log.map(function (row) {
    return row.name;
  }), ['test0', 'test1', 'test2', 'test3'], 'Names match expected');

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = log[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var row = _step2.value;

      assert.equal(_typeof(row.total), 'number', 'Start is set');
      assert.equal(_typeof(row.delta), 'number', 'Delta is set');
      assert.equal(_typeof(row.averageTime), 'number', 'Avg time is set');
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  assert.end();
});

(0, _tape2.default)('Probe#fps - level methods', function (assert) {
  var probe = getInstance().setLevel(3);
  var count = 3;

  for (var i = 0; i < count; i++) {
    probe.fps('test0', { count: count });
    probe.fps1('test1', { count: count });
    probe.fps2('test2', { count: count });
    probe.fps3('test3', { count: count });
  }

  var log = probe.getLog();

  assert.equals(log.length, 4, 'Expected rows logged');
  assert.deepEqual(log.map(function (row) {
    return row.level;
  }), [1, 1, 2, 3], 'Levels match expected');
  assert.deepEqual(log.map(function (row) {
    return row.name;
  }), ['test0', 'test1', 'test2', 'test3'], 'Names match expected');

  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = log[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var row = _step3.value;

      assert.equal(_typeof(row.total), 'number', 'Start is set');
      assert.equal(_typeof(row.delta), 'number', 'Delta is set');
      assert.equal(_typeof(row.fps), 'number', 'FPS is set');
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  assert.end();
});

(0, _tape2.default)('Probe#fps - log once per count', function (assert) {
  var probe = getInstance().setLevel(3);
  var count = 3;
  var cycles = 4;

  for (var i = 0; i < count * cycles; i++) {
    probe.fps('test', { count: count });
  }

  var log = probe.getLog();

  assert.equals(log.length, cycles, 'Expected rows logged');

  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = log[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var row = _step4.value;

      assert.equal(_typeof(row.total), 'number', 'Start is set');
      assert.equal(_typeof(row.delta), 'number', 'Delta is set');
      assert.equal(_typeof(row.fps), 'number', 'FPS is set');
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  assert.end();
});

(0, _tape2.default)('Probe#disable / Probe#enable', function (assert) {
  var probe = getInstance();

  assert.strictEqual(probe.isEnabled(), true, 'isEnabled matches expected');

  probe.disable();
  probe.probe('test_disabled');

  assert.strictEqual(probe.isEnabled(), false, 'isEnabled matches expected');
  assert.strictEqual(probe.getLog().length, 0, 'No row logged');

  probe.enable();
  probe.probe('test_enabled');

  assert.strictEqual(probe.isEnabled(), true, 'isEnabled matches expected');
  assert.strictEqual(probe.getLog().length, 1, 'Row logged');
  assert.strictEqual(probe.getLog()[0].name, 'test_enabled', 'Row name matches expected');

  assert.end();
});

(0, _tape2.default)('Probe#configure', function (assert) {
  var probe = getInstance().configure({
    level: 2,
    foo: 'bar'
  });

  assert.strictEqual(probe.getOption('level'), 2, 'Set known option');
  assert.strictEqual(probe.getOption('foo'), 'bar', 'Set unknown option');

  assert.end();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9wcm9iZS90ZXN0L3Byb2JlLXNwZWMuanMiXSwibmFtZXMiOlsiZ2V0SW5zdGFuY2UiLCJpc0VuYWJsZWQiLCJpc1ByaW50RW5hYmxlZCIsImlnbm9yZUVudmlyb25tZW50IiwicHJvYmUiLCJsb2ciLCJnZXRMb2ciLCJyb3ciLCJhc3NlcnQiLCJlcXVhbHMiLCJsZW5ndGgiLCJlcXVhbCIsIm5hbWUiLCJ0b3RhbCIsImRlbHRhIiwiZW5kIiwic2V0TGV2ZWwiLCJwcm9iZTEiLCJwcm9iZTIiLCJwcm9iZTMiLCJkZWVwRXF1YWwiLCJtYXAiLCJsZXZlbCIsImRpc2FibGUiLCJzYW1wbGUiLCJzYW1wbGUxIiwic2FtcGxlMiIsInNhbXBsZTMiLCJhdmVyYWdlVGltZSIsImNvdW50IiwiaSIsImZwcyIsImZwczEiLCJmcHMyIiwiZnBzMyIsImN5Y2xlcyIsInN0cmljdEVxdWFsIiwiZW5hYmxlIiwiY29uZmlndXJlIiwiZm9vIiwiZ2V0T3B0aW9uIl0sIm1hcHBpbmdzIjoiOzs4UUFBQTs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUEsU0FBU0EsV0FBVCxHQUF1QjtBQUNyQixTQUFPLG9CQUFVO0FBQ2ZDLGVBQVcsSUFESTtBQUVmQyxvQkFBZ0IsS0FGRDtBQUdmQyx1QkFBbUI7QUFISixHQUFWLENBQVA7QUFLRDs7QUFFRCxvQkFBSyxhQUFMLEVBQW9CLGtCQUFVO0FBQzVCLE1BQU1DLFFBQVFKLGFBQWQ7O0FBRUFJLFFBQU1BLEtBQU4sQ0FBWSxNQUFaOztBQUVBLE1BQU1DLE1BQU1ELE1BQU1FLE1BQU4sRUFBWjtBQUNBLE1BQU1DLE1BQU1GLElBQUksQ0FBSixDQUFaOztBQUVBRyxTQUFPQyxNQUFQLENBQWNKLElBQUlLLE1BQWxCLEVBQTBCLENBQTFCLEVBQ0UscUJBREY7QUFFQUYsU0FBT0csS0FBUCxDQUFhSixJQUFJSyxJQUFqQixFQUF1QixNQUF2QixFQUNFLGFBREY7QUFFQUosU0FBT0csS0FBUCxTQUFvQkosSUFBSU0sS0FB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aXNhYmxlIG1heC1zdGF0ZW1lbnRzICovXG5pbXBvcnQgUHJvYmUgZnJvbSAnLi4vc3JjL3Byb2JlJztcbmltcG9ydCB0ZXN0IGZyb20gJ3RhcGUnO1xuXG5mdW5jdGlvbiBnZXRJbnN0YW5jZSgpIHtcbiAgcmV0dXJuIG5ldyBQcm9iZSh7XG4gICAgaXNFbmFibGVkOiB0cnVlLFxuICAgIGlzUHJpbnRFbmFibGVkOiBmYWxzZSxcbiAgICBpZ25vcmVFbnZpcm9ubWVudDogdHJ1ZVxuICB9KTtcbn1cblxudGVzdCgnUHJvYmUjcHJvYmUnLCBhc3NlcnQgPT4ge1xuICBjb25zdCBwcm9iZSA9IGdldEluc3RhbmNlKCk7XG5cbiAgcHJvYmUucHJvYmUoJ3Rlc3QnKTtcblxuICBjb25zdCBsb2cgPSBwcm9iZS5nZXRMb2coKTtcbiAgY29uc3Qgcm93ID0gbG9nWzBdO1xuXG4gIGFzc2VydC5lcXVhbHMobG9nLmxlbmd0aCwgMSxcbiAgICAnRXhwZWN0ZWQgcm93IGxvZ2dlZCcpO1xuICBhc3NlcnQuZXF1YWwocm93Lm5hbWUsICd0ZXN0JyxcbiAgICAnTmFtZSBsb2dnZWQnKTtcbiAgYXNzZXJ0LmVxdWFsKHR5cGVvZiByb3cudG90YWwsICdudW1iZXInLCAnU3RhcnQgaXMgc2V0Jyk7XG4gIGFzc2VydC5lcXVhbCh0eXBlb2Ygcm93LmRlbHRhLCAnbnVtYmVyJywgJ0RlbHRhIGlzIHNldCcpO1xuXG4gIGFzc2VydC5lbmQoKTtcbn0pO1xuXG50ZXN0KCdQcm9iZSNwcm9iZSAtIGxldmVsIG1ldGhvZHMnLCBhc3NlcnQgPT4ge1xuICBjb25zdCBwcm9iZSA9IGdldEluc3RhbmNlKCkuc2V0TGV2ZWwoMyk7XG5cbiAgcHJvYmUucHJvYmUoJ3Rlc3QwJyk7XG4gIHByb2JlLnByb2JlMSgndGVzdDEnKTtcbiAgcHJvYmUucHJvYmUyKCd0ZXN0MicpO1xuICBwcm9iZS5wcm9iZTMoJ3Rlc3QzJyk7XG5cbiAgY29uc3QgbG9nID0gcHJvYmUuZ2V0TG9nKCk7XG5cbiAgYXNzZXJ0LmVxdWFscyhsb2cubGVuZ3RoLCA0LFxuICAgICdFeHBlY3RlZCByb3dzIGxvZ2dlZCcpO1xuICBhc3NlcnQuZGVlcEVxdWFsKFxuICAgIGxvZy5tYXAocm93ID0+IHJvdy5sZXZlbCksXG4gICAgWzEsIDEsIDIsIDNdLFxuICAgICdMZXZlbHMgbWF0Y2ggZXhwZWN0ZWQnKTtcbiAgYXNzZXJ0LmRlZXBFcXVhbChcbiAgICBsb2cubWFwKHJvdyA9PiByb3cubmFtZSksXG4gICAgWyd0ZXN0MCcsICd0ZXN0MScsICd0ZXN0MicsICd0ZXN0MyddLFxuICAgICdOYW1lcyBtYXRjaCBleHBlY3RlZCcpO1xuXG4gIGZvciAoY29uc3Qgcm93IG9mIGxvZykge1xuICAgIGFzc2VydC5lcXVhbCh0eXBlb2Ygcm93LnRvdGFsLCAnbnVtYmVyJywgJ1N0YXJ0IGlzIHNldCcpO1xuICAgIGFzc2VydC5lcXVhbCh0eXBlb2Ygcm93LmRlbHRhLCAnbnVtYmVyJywgJ0RlbHRhIGlzIHNldCcpO1xuICB9XG5cbiAgYXNzZXJ0LmVuZCgpO1xufSk7XG5cbnRlc3QoJ1Byb2JlI3Byb2JlIC0gbGV2ZWwgbWV0aG9kcywgbG93ZXIgbGV2ZWwgc2V0JywgYXNzZXJ0ID0+IHtcbiAgY29uc3QgcHJvYmUgPSBnZXRJbnN0YW5jZSgpLnNldExldmVsKDEpO1xuXG4gIHByb2JlLnByb2JlKCd0ZXN0MCcpO1xuICBwcm9iZS5wcm9iZTEoJ3Rlc3QxJyk7XG4gIHByb2JlLnByb2JlMigndGVzdDInKTtcbiAgcHJvYmUucHJvYmUzKCd0ZXN0MycpO1xuXG4gIGNvbnN0IGxvZyA9IHByb2JlLmdldExvZygpO1xuXG4gIGFzc2VydC5lcXVhbHMobG9nLmxlbmd0aCwgMixcbiAgICAnRXhwZWN0ZWQgcm93cyBsb2dnZWQnKTtcbiAgYXNzZXJ0LmRlZXBFcXVhbChcbiAgICBsb2cubWFwKHJvdyA9PiByb3cubGV2ZWwpLFxuICAgIFsxLCAxXSxcbiAgICAnTGV2ZWxzIG1hdGNoIGV4cGVjdGVkJyk7XG5cbiAgYXNzZXJ0LmVuZCgpO1xufSk7XG5cbnRlc3QoJ1Byb2JlI3Byb2JlIC0gZGlzYWJsZWQnLCBhc3NlcnQgPT4ge1xuICBjb25zdCBwcm9iZSA9IGdldEluc3RhbmNlKCkuZGlzYWJsZSgpO1xuXG4gIHByb2JlLnByb2JlKCd0ZXN0MCcpO1xuICBwcm9iZS5wcm9iZTEoJ3Rlc3QxJyk7XG4gIHByb2JlLnByb2JlMigndGVzdDInKTtcbiAgcHJvYmUucHJvYmUzKCd0ZXN0MycpO1xuXG4gIGNvbnN0IGxvZyA9IHByb2JlLmdldExvZygpO1xuXG4gIGFzc2VydC5lcXVhbHMobG9nLmxlbmd0aCwgMCxcbiAgICAnTm8gcm93cyBsb2dnZWQnKTtcblxuICBhc3NlcnQuZW5kKCk7XG59KTtcblxudGVzdCgnUHJvYmUjc2FtcGxlIC0gbGV2ZWwgbWV0aG9kcycsIGFzc2VydCA9PiB7XG4gIGNvbnN0IHByb2JlID0gZ2V0SW5zdGFuY2UoKS5zZXRMZXZlbCgzKTtcblxuICBwcm9iZS5zYW1wbGUoJ3Rlc3QwJyk7XG4gIHByb2JlLnNhbXBsZTEoJ3Rlc3QxJyk7XG4gIHByb2JlLnNhbXBsZTIoJ3Rlc3QyJyk7XG4gIHByb2JlLnNhbXBsZTMoJ3Rlc3QzJyk7XG5cbiAgY29uc3QgbG9nID0gcHJvYmUuZ2V0TG9nKCk7XG5cbiAgYXNzZXJ0LmVxdWFscyhsb2cubGVuZ3RoLCA0LFxuICAgICdFeHBlY3RlZCByb3dzIGxvZ2dlZCcpO1xuICBhc3NlcnQuZGVlcEVxdWFsKFxuICAgIGxvZy5tYXAocm93ID0+IHJvdy5sZXZlbCksXG4gICAgWzEsIDEsIDIsIDNdLFxuICAgICdMZXZlbHMgbWF0Y2ggZXhwZWN0ZWQnKTtcbiAgYXNzZXJ0LmRlZXBFcXVhbChcbiAgICBsb2cubWFwKHJvdyA9PiByb3cubmFtZSksXG4gICAgWyd0ZXN0MCcsICd0ZXN0MScsICd0ZXN0MicsICd0ZXN0MyddLFxuICAgICdOYW1lcyBtYXRjaCBleHBlY3RlZCcpO1xuXG4gIGZvciAoY29uc3Qgcm93IG9mIGxvZykge1xuICAgIGFzc2VydC5lcXVhbCh0eXBlb2Ygcm93LnRvdGFsLCAnbnVtYmVyJywgJ1N0YXJ0IGlzIHNldCcpO1xuICAgIGFzc2VydC5lcXVhbCh0eXBlb2Ygcm93LmRlbHRhLCAnbnVtYmVyJywgJ0RlbHRhIGlzIHNldCcpO1xuICAgIGFzc2VydC5lcXVhbCh0eXBlb2Ygcm93LmF2ZXJhZ2VUaW1lLCAnbnVtYmVyJywgJ0F2ZyB0aW1lIGlzIHNldCcpO1xuICB9XG5cbiAgYXNzZXJ0LmVuZCgpO1xufSk7XG5cbnRlc3QoJ1Byb2JlI2ZwcyAtIGxldmVsIG1ldGhvZHMnLCBhc3NlcnQgPT4ge1xuICBjb25zdCBwcm9iZSA9IGdldEluc3RhbmNlKCkuc2V0TGV2ZWwoMyk7XG4gIGNvbnN0IGNvdW50ID0gMztcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICBwcm9iZS5mcHMoJ3Rlc3QwJywge2NvdW50fSk7XG4gICAgcHJvYmUuZnBzMSgndGVzdDEnLCB7Y291bnR9KTtcbiAgICBwcm9iZS5mcHMyKCd0ZXN0MicsIHtjb3VudH0pO1xuICAgIHByb2JlLmZwczMoJ3Rlc3QzJywge2NvdW50fSk7XG4gIH1cblxuICBjb25zdCBsb2cgPSBwcm9iZS5nZXRMb2coKTtcblxuICBhc3NlcnQuZXF1YWxzKGxvZy5sZW5ndGgsIDQsXG4gICAgJ0V4cGVjdGVkIHJvd3MgbG9nZ2VkJyk7XG4gIGFzc2VydC5kZWVwRXF1YWwoXG4gICAgbG9nLm1hcChyb3cgPT4gcm93LmxldmVsKSxcbiAgICBbMSwgMSwgMiwgM10sXG4gICAgJ0xldmVscyBtYXRjaCBleHBlY3RlZCcpO1xuICBhc3NlcnQuZGVlcEVxdWFsKFxuICAgIGxvZy5tYXAocm93ID0+IHJvdy5uYW1lKSxcbiAgICBbJ3Rlc3QwJywgJ3Rlc3QxJywgJ3Rlc3QyJywgJ3Rlc3QzJ10sXG4gICAgJ05hbWVzIG1hdGNoIGV4cGVjdGVkJyk7XG5cbiAgZm9yIChjb25zdCByb3cgb2YgbG9nKSB7XG4gICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiByb3cudG90YWwsICdudW1iZXInLCAnU3RhcnQgaXMgc2V0Jyk7XG4gICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiByb3cuZGVsdGEsICdudW1iZXInLCAnRGVsdGEgaXMgc2V0Jyk7XG4gICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiByb3cuZnBzLCAnbnVtYmVyJywgJ0ZQUyBpcyBzZXQnKTtcbiAgfVxuXG4gIGFzc2VydC5lbmQoKTtcbn0pO1xuXG50ZXN0KCdQcm9iZSNmcHMgLSBsb2cgb25jZSBwZXIgY291bnQnLCBhc3NlcnQgPT4ge1xuICBjb25zdCBwcm9iZSA9IGdldEluc3RhbmNlKCkuc2V0TGV2ZWwoMyk7XG4gIGNvbnN0IGNvdW50ID0gMztcbiAgY29uc3QgY3ljbGVzID0gNDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50ICogY3ljbGVzOyBpKyspIHtcbiAgICBwcm9iZS5mcHMoJ3Rlc3QnLCB7Y291bnR9KTtcbiAgfVxuXG4gIGNvbnN0IGxvZyA9IHByb2JlLmdldExvZygpO1xuXG4gIGFzc2VydC5lcXVhbHMobG9nLmxlbmd0aCwgY3ljbGVzLFxuICAgICdFeHBlY3RlZCByb3dzIGxvZ2dlZCcpO1xuXG4gIGZvciAoY29uc3Qgcm93IG9mIGxvZykge1xuICAgIGFzc2VydC5lcXVhbCh0eXBlb2Ygcm93LnRvdGFsLCAnbnVtYmVyJywgJ1N0YXJ0IGlzIHNldCcpO1xuICAgIGFzc2VydC5lcXVhbCh0eXBlb2Ygcm93LmRlbHRhLCAnbnVtYmVyJywgJ0RlbHRhIGlzIHNldCcpO1xuICAgIGFzc2VydC5lcXVhbCh0eXBlb2Ygcm93LmZwcywgJ251bWJlcicsICdGUFMgaXMgc2V0Jyk7XG4gIH1cblxuICBhc3NlcnQuZW5kKCk7XG59KTtcblxudGVzdCgnUHJvYmUjZGlzYWJsZSAvIFByb2JlI2VuYWJsZScsIGFzc2VydCA9PiB7XG4gIGNvbnN0IHByb2JlID0gZ2V0SW5zdGFuY2UoKTtcblxuICBhc3NlcnQuc3RyaWN0RXF1YWwocHJvYmUuaXNFbmFibGVkKCksIHRydWUsXG4gICAgJ2lzRW5hYmxlZCBtYXRjaGVzIGV4cGVjdGVkJyk7XG5cbiAgcHJvYmUuZGlzYWJsZSgpO1xuICBwcm9iZS5wcm9iZSgndGVzdF9kaXNhYmxlZCcpO1xuXG4gIGFzc2VydC5zdHJpY3RFcXVhbChwcm9iZS5pc0VuYWJsZWQoKSwgZmFsc2UsXG4gICAgJ2lzRW5hYmxlZCBtYXRjaGVzIGV4cGVjdGVkJyk7XG4gIGFzc2VydC5zdHJpY3RFcXVhbChwcm9iZS5nZXRMb2coKS5sZW5ndGgsIDAsXG4gICAgJ05vIHJvdyBsb2dnZWQnKTtcblxuICBwcm9iZS5lbmFibGUoKTtcbiAgcHJvYmUucHJvYmUoJ3Rlc3RfZW5hYmxlZCcpO1xuXG4gIGFzc2VydC5zdHJpY3RFcXVhbChwcm9iZS5pc0VuYWJsZWQoKSwgdHJ1ZSxcbiAgICAnaXNFbmFibGVkIG1hdGNoZXMgZXhwZWN0ZWQnKTtcbiAgYXNzZXJ0LnN0cmljdEVxdWFsKHByb2JlLmdldExvZygpLmxlbmd0aCwgMSxcbiAgICAnUm93IGxvZ2dlZCcpO1xuICBhc3NlcnQuc3RyaWN0RXF1YWwocHJvYmUuZ2V0TG9nKClbMF0ubmFtZSwgJ3Rlc3RfZW5hYmxlZCcsXG4gICAgJ1JvdyBuYW1lIG1hdGNoZXMgZXhwZWN0ZWQnKTtcblxuICBhc3NlcnQuZW5kKCk7XG59KTtcblxudGVzdCgnUHJvYmUjY29uZmlndXJlJywgYXNzZXJ0ID0+IHtcbiAgY29uc3QgcHJvYmUgPSBnZXRJbnN0YW5jZSgpXG4gICAgLmNvbmZpZ3VyZSh7XG4gICAgICBsZXZlbDogMixcbiAgICAgIGZvbzogJ2JhcidcbiAgICB9KTtcblxuICBhc3NlcnQuc3RyaWN0RXF1YWwocHJvYmUuZ2V0T3B0aW9uKCdsZXZlbCcpLCAyLFxuICAgICdTZXQga25vd24gb3B0aW9uJyk7XG4gIGFzc2VydC5zdHJpY3RFcXVhbChwcm9iZS5nZXRPcHRpb24oJ2ZvbycpLCAnYmFyJyxcbiAgICAnU2V0IHVua25vd24gb3B0aW9uJyk7XG5cbiAgYXNzZXJ0LmVuZCgpO1xufSk7XG4iXX0=