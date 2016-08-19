'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint-disable no-console */


exports.formatTime = formatTime;

var _cookieCutter = require('cookie-cutter');

var _cookieCutter2 = _interopRequireDefault(_cookieCutter);

var _env = require('./env');

var _d3Format = require('d3-format');

var _d3Format2 = _interopRequireDefault(_d3Format);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var formatSI = _d3Format2.default.format('.3s');

// TODO: Currently unused, keeping in case we want it later for log formatting
function formatTime(ms) {
  var formatted = void 0;
  if (ms < 10) {
    formatted = ms.toFixed(2) + 'ms';
  } else if (ms < 100) {
    formatted = ms.toFixed(1) + 'ms';
  } else if (ms < 1000) {
    formatted = (ms / 1000).toFixed(3) + 's';
  } else {
    formatted = (ms / 1000).toFixed(2) + 's';
  }
  return formatted;
}

var DEFAULT_CONFIG = {
  // off by default
  isEnabled: false,
  // logging level
  level: 1,
  // Whether logging is turned on
  isLogEnabled: true,
  // Whether logging prints to console
  isPrintEnabled: true,
  // Whether Probe#run executes code
  isRunEnabled: true
};

var COOKIE_NAME = '__probe__';

function noop() {}

var TO_DISABLE = ['_probe', '_fps', '_externalProbe', '_log', 'run', 'getOption', 'getIterationsPerSecond', 'logIterationsPerSecond'];

var Probe = function () {

  /**
   * @constructor
   * @param {Object} config Optional configuration args; see #configure
   */

  function Probe() {
    var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Probe);

    // Data containers
    this._logStore = [];
    this._sampleStore = {};
    this._fpsStore = {};
    this._startStore = {};
    // Timestamps - pegged to an arbitrary time in the past
    this._startTs = (0, _env.timestamp)();
    this._deltaTs = (0, _env.timestamp)();
    // Other systems passing in epoch info require an epoch ts to convert
    this._startEpochTs = Date.now();
    this._iterationsTs = null;
    // Configuration
    this._config = config.ignoreEnvironment ? _extends({}, DEFAULT_CONFIG) : this._getConfigFromEnvironment();
    // Override with new configuration, if any
    this.configure(config);
    // Disable methods if necessary
    if (!this._config.isEnabled) {
      this.disable();
    }
  }

  /**
   * Turn probe on
   * @return {Probe} self, to support chaining
   */


  _createClass(Probe, [{
    key: 'enable',
    value: function enable() {
      // Swap in live methods
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = TO_DISABLE[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var method = _step.value;

          this[method] = Probe.prototype[method];
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

      return this.configure({ isEnabled: true });
    }

    /**
     * Turn probe off
     * @return {Probe} self, to support chaining
     */

  }, {
    key: 'disable',
    value: function disable() {
      // Swap in noops for live methods
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = TO_DISABLE[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var method = _step2.value;

          this[method] = noop;
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

      return this.configure({ isEnabled: false });
    }

    /**
     * Convenience function: Set probe level
     * @param {Number} level Level to set
     * @return {Probe} self, to support chaining
     */

  }, {
    key: 'setLevel',
    value: function setLevel(level) {
      return this.configure({ level: level });
    }

    /**
     * Configure probe with new values (can include custom key/value pairs).
     * Configuration will be persisted across browser sessions
     * @param {Boolean} config.isEnabled Whether probe is enabled
     * @param {Number} config.level Logging level
     * @param {Boolean} config.isLogEnabled Whether logging prints to console
     * @param {Boolean} config.isRunEnabled Whether #run executes code
     * @return {Probe} self, to support chaining
     */

  }, {
    key: 'configure',
    value: function configure() {
      var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var newConfig = _extends({}, this._config, config);
      this._config = newConfig;
      if (!_env.IS_NODE) {
        var serialized = JSON.stringify(newConfig);
        _cookieCutter2.default.set(COOKIE_NAME, serialized);
      }
      // Support chaining
      return this;
    }

    /**
     * Get a single option from preset configuration. Useful when using Probe to
     * set developer-only switches.
     * @param  {String} key Key to get value for
     * @return {mixed}     Option value, or undefined
     */

  }, {
    key: 'getOption',
    value: function getOption(key) {
      return this._config[key];
    }

    /**
     * Get current log, as an array of log row objects
     * @return {Object[]} Log
     */

  }, {
    key: 'getLog',
    value: function getLog() {
      return this._logStore.slice();
    }

    /**
     * Whether Probe is currently enabled
     * @return {Boolean} isEnabled
     */

  }, {
    key: 'isEnabled',
    value: function isEnabled() {
      return Boolean(this._config.isEnabled);
    }

    /**
     * Reset all internal stores, dropping logs
     */

  }, {
    key: 'reset',
    value: function reset() {
      // Data containers
      this._logStore = [];
      this._sampleStore = {};
      this._fpsStore = {};
      this._startStore = {};
      // Timestamps
      this._startTs = (0, _env.timestamp)();
      this._deltaTs = (0, _env.timestamp)();
      this._iterationsTs = null;
    }

    /**
     * Reset the long timer
     */

  }, {
    key: 'resetStart',
    value: function resetStart() {
      this._startTs = this._deltaTs = (0, _env.timestamp)();
    }

    /**
     * Reset the time since last probe
     */

  }, {
    key: 'resetDelta',
    value: function resetDelta() {
      this._deltaTs = (0, _env.timestamp)();
    }

    /**
     * @return {Number} milliseconds, with fractions
     */

  }, {
    key: 'getTotal',
    value: function getTotal() {
      return (0, _env.timestamp)() - this._startTs;
    }

    /**
     * @return {Number} milliseconds, with fractions
     */

  }, {
    key: 'getDelta',
    value: function getDelta() {
      return (0, _env.timestamp)() - this._deltaTs;
    }
  }, {
    key: '_getElapsedTime',
    value: function _getElapsedTime() {
      var total = (0, _env.timestamp)() - this._startTs;
      var delta = (0, _env.timestamp)() - this._deltaTs;
      // reset delta timer
      this._deltaTs = (0, _env.timestamp)();
      return { total: total, delta: delta };
    }
  }, {
    key: '_log',
    value: function _log(level, name) {
      var meta = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      var times = this._getElapsedTime();
      var logRow = _extends({ level: level, name: name }, times, meta);
      // duration handling
      if (meta.start) {
        this._startStore[name] = (0, _env.timestamp)();
      } else if (meta.end) {
        // If start isn't found, take the full duration since initialization
        var start = this._startStore[name] || this._startTs;
        logRow.duration = (0, _env.timestamp)() - start;
      }
      this._logStore.push(logRow);
      // Log to console if enabled
      if (this._config.isPrintEnabled) {
        // TODO: Nicer console logging
        _env.logger.debug(JSON.stringify(logRow));
      }
    }
  }, {
    key: '_shouldLog',
    value: function _shouldLog(probeLevel) {
      var _config = this._config;
      var isEnabled = _config.isEnabled;
      var isLogEnabled = _config.isLogEnabled;
      var level = _config.level;

      return isEnabled && isLogEnabled && level >= probeLevel;
    }

    /**
     * Displays a double timing (from "start time" and from last probe).
     */

  }, {
    key: 'probe',
    value: function probe() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      this._probe.apply(this, [1].concat(args));
    }
  }, {
    key: 'probe1',
    value: function probe1() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      this._probe.apply(this, [1].concat(args));
    }
  }, {
    key: 'probe2',
    value: function probe2() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      this._probe.apply(this, [2].concat(args));
    }
  }, {
    key: 'probe3',
    value: function probe3() {
      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      this._probe.apply(this, [3].concat(args));
    }
  }, {
    key: '_probe',
    value: function _probe(level, name, meta) {
      if (this._shouldLog(level)) {
        this._log(level, name, meta);
      }
    }

    /**
     * Display an averaged value of the time since last probe.
     * Keyed on the first string argument.
     */

  }, {
    key: 'sample',
    value: function sample() {
      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }

      this._sample.apply(this, [1].concat(args));
    }
  }, {
    key: 'sample1',
    value: function sample1() {
      for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
        args[_key6] = arguments[_key6];
      }

      this._sample.apply(this, [1].concat(args));
    }
  }, {
    key: 'sample2',
    value: function sample2() {
      for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
        args[_key7] = arguments[_key7];
      }

      this._sample.apply(this, [2].concat(args));
    }
  }, {
    key: 'sample3',
    value: function sample3() {
      for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
        args[_key8] = arguments[_key8];
      }

      this._sample.apply(this, [3].concat(args));
    }
  }, {
    key: '_sample',
    value: function _sample(level, name, meta) {
      if (this._shouldLog(level)) {
        var samples = this._sampleStore;

        var probeData = samples[name] || (samples[name] = { timeSum: 0, count: 0, averageTime: 0 });
        probeData.timeSum += (0, _env.timestamp)() - this._deltaTs;
        probeData.count += 1;
        probeData.averageTime = probeData.timeSum / probeData.count;

        this._log(level, name, _extends({}, meta, { averageTime: probeData.averageTime }));

        // Weight more heavily on later samples. Otherwise it gets almost
        // impossible to see outliers after a while.
        if (probeData.count === 10) {
          probeData.count = 5;
          probeData.timeSum /= 2;
        }
      }
    }

    /**
     * These functions will average the time between calls and log that value
     * every couple of calls, in effect showing a times per second this
     * function is called - sometimes representing a "frames per second" count.
     */

  }, {
    key: 'fps',
    value: function fps() {
      for (var _len9 = arguments.length, args = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
        args[_key9] = arguments[_key9];
      }

      this._fps.apply(this, [1].concat(args));
    }
  }, {
    key: 'fps1',
    value: function fps1() {
      for (var _len10 = arguments.length, args = Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
        args[_key10] = arguments[_key10];
      }

      this._fps.apply(this, [1].concat(args));
    }
  }, {
    key: 'fps2',
    value: function fps2() {
      for (var _len11 = arguments.length, args = Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
        args[_key11] = arguments[_key11];
      }

      this._fps.apply(this, [2].concat(args));
    }
  }, {
    key: 'fps3',
    value: function fps3() {
      for (var _len12 = arguments.length, args = Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {
        args[_key12] = arguments[_key12];
      }

      this._fps.apply(this, [3].concat(args));
    }
  }, {
    key: '_fps',
    value: function _fps(level) {
      var name = arguments.length <= 1 || arguments[1] === undefined ? 'default' : arguments[1];

      var _ref = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      var _ref$count = _ref.count;
      var count = _ref$count === undefined ? 10 : _ref$count;

      var meta = _objectWithoutProperties(_ref, ['count']);

      if (this._shouldLog(level)) {
        var fpsLog = this._fpsStore;
        var fpsData = fpsLog[name];
        if (!fpsData) {
          fpsLog[name] = { count: 1, time: (0, _env.timestamp)() };
        } else if (++fpsData.count >= count) {
          var fps = fpsData.count / ((0, _env.timestamp)() - fpsData.time);
          fpsData.count = 0;
          fpsData.time = (0, _env.timestamp)();
          this._log(level, name, _extends({}, meta, { fps: fps }));
        }
      }
    }

    /**
     * Display a measurement from an external source, such as a server,
     * inline with other local measurements in the style of Probe's output.
     */

  }, {
    key: 'externalProbe',
    value: function externalProbe() {
      for (var _len13 = arguments.length, args = Array(_len13), _key13 = 0; _key13 < _len13; _key13++) {
        args[_key13] = arguments[_key13];
      }

      this._externalProbe.apply(this, [1].concat(args));
    }
  }, {
    key: 'externalProbe1',
    value: function externalProbe1() {
      for (var _len14 = arguments.length, args = Array(_len14), _key14 = 0; _key14 < _len14; _key14++) {
        args[_key14] = arguments[_key14];
      }

      this._externalProbe.apply(this, [1].concat(args));
    }
  }, {
    key: 'externalProbe2',
    value: function externalProbe2() {
      for (var _len15 = arguments.length, args = Array(_len15), _key15 = 0; _key15 < _len15; _key15++) {
        args[_key15] = arguments[_key15];
      }

      this._externalProbe.apply(this, [2].concat(args));
    }
  }, {
    key: 'externalProbe3',
    value: function externalProbe3() {
      for (var _len16 = arguments.length, args = Array(_len16), _key16 = 0; _key16 < _len16; _key16++) {
        args[_key16] = arguments[_key16];
      }

      this._externalProbe.apply(this, [3].concat(args));
    }
  }, {
    key: '_externalProbe',
    value: function _externalProbe(level, name, timeStart, timeSpent, meta) {
      if (this._shouldLog(level)) {
        // External probes are expected to provide epoch timestamps
        var total = timeStart - this._startEpochTs;
        var delta = timeSpent;
        this._log(level, name, _extends({ total: total, delta: delta }, meta));
      }
    }

    /* Conditionally run a function only when probe is enabled */

  }, {
    key: 'run',
    value: function run(func, arg) {
      var _config2 = this._config;
      var isEnabled = _config2.isEnabled;
      var isRunEnabled = _config2.isRunEnabled;

      if (isEnabled && isRunEnabled) {
        func(arg);
      }
    }
  }, {
    key: 'startIiterations',
    value: function startIiterations() {
      this._iterationsTs = (0, _env.timestamp)();
    }

    /**
     * Get config from persistent store, if available
     * @return {Object} config
     */

  }, {
    key: '_getConfigFromEnvironment',
    value: function _getConfigFromEnvironment() {
      var customConfig = {};
      if (!_env.IS_NODE) {
        var serialized = _cookieCutter2.default.get(COOKIE_NAME);
        if (serialized) {
          customConfig = JSON.parse(serialized);
        }
      }
      return _extends({}, DEFAULT_CONFIG, customConfig);
    }

    /* Count iterations per second. Runs the provided function a
     * specified number of times and normalizes the result to represent
     * iterations per second.
     *
     * TODO/ib Measure one iteration and auto adjust iteration count.
     */

  }, {
    key: 'getIterationsPerSecond',
    value: function getIterationsPerSecond() {
      var iterations = arguments.length <= 0 || arguments[0] === undefined ? 10000 : arguments[0];
      var func = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
      var context = arguments[2];

      if (func) {
        Probe.startIiterations();
        // Keep call overhead minimal, only use Function.call if context supplied
        if (context) {
          for (var i = 0; i < iterations; i++) {
            func.call(context);
          }
        } else {
          for (var _i = 0; _i < iterations; _i++) {
            func();
          }
        }
      }
      var elapsedMillis = (0, _env.timestamp)() - this._iterationsTs;
      var iterationsPerSecond = formatSI(iterations * 1000 / elapsedMillis);
      return iterationsPerSecond;
    }

    /*
     * Print the number of iterations per second measured using the provided
     * function
     */

  }, {
    key: 'logIterationsPerSecond',
    value: function logIterationsPerSecond(testName) {
      var iterations = arguments.length <= 1 || arguments[1] === undefined ? 10000 : arguments[1];
      var func = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];
      var context = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

      var elapsedMs = this.getIterationsPerSecond(iterations, func, context);
      var iterationsPerSecond = formatSI(iterations * 1000 / elapsedMs);
      _env.logger.log(testName + ': ' + iterationsPerSecond + ' iterations/s');
    }

    /**
     * Show current log in a table, if supported by console
     * @param {Number} tail If supplied, show only the last n entries
     */

  }, {
    key: 'table',
    value: function table(tail) {
      if (typeof _env.logger.table === 'function') {
        var rows = tail ? this._logStore.slice(-tail) : this._logStore;
        _env.logger.table(rows);
      }
    }
  }]);

  return Probe;
}();

exports.default = Probe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9wcm9iZS9zcmMvcHJvYmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7UUFRZ0IsVSxHQUFBLFU7O0FBUGhCOzs7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7QUFFQSxJQUFNLFdBQVcsbUJBQUcsTUFBSCxDQUFVLEtBQVYsQ0FBakI7OztBQUdPLFNBQVMsVUFBVCxDQUFvQixFQUFwQixFQUF3QjtBQUM3QixNQUFJLGtCQUFKO0FBQ0EsTUFBSSxLQUFLLEVBQVQsRUFBYTtBQUNYLGdCQUFlLEdBQUcsT0FBSCxDQUFXLENBQVgsQ0FBZjtBQUNELEdBRkQsTUFFTyxJQUFJLEtBQUssR0FBVCxFQUFjO0FBQ25CLGdCQUFlLEdBQUcsT0FBSCxDQUFXLENBQVgsQ0FBZjtBQUNELEdBRk0sTUFFQSxJQUFJLEtBQUssSUFBVCxFQUFlO0FBQ3BCLGdCQUFlLENBQUMsS0FBSyxJQUFOLEVBQVksT0FBWixDQUFvQixDQUFwQixDQUFmO0FBQ0QsR0FGTSxNQUVBO0FBQ0wsZ0JBQWUsQ0FBQyxLQUFLLElBQU4sRUFBWSxPQUFaLENBQW9CLENBQXBCLENBQWY7QUFDRDtBQUNELFNBQU8sU0FBUDtBQUNEOztBQUVELElBQU0saUJBQWlCOztBQUVyQixhQUFXLEtBRlU7O0FBSXJCLFNBQU8sQ0FKYzs7QUFNckIsZ0JBQWMsSUFOTzs7QUFRckIsa0JBQWdCLElBUks7O0FBVXJCLGdCQUFjO0FBVk8sQ0FBdkI7O0FBYUEsSUFBTSxjQUFjLFdBQXBCOztBQUVBLFNBQVMsSUFBVCxHQUFnQixDQUFFOztBQUVsQixJQUFNLGFBQWEsQ0FDakIsUUFEaUIsRUFDUCxNQURPLEVBQ0MsZ0JBREQsRUFDbUIsTUFEbkIsRUFDMkIsS0FEM0IsRUFDa0MsV0FEbEMsRUFFakIsd0JBRmlCLEVBRVMsd0JBRlQsQ0FBbkI7O0lBS3FCLEs7Ozs7Ozs7QUFNbkIsbUJBQXlCO0FBQUEsUUFBYixNQUFhLHlEQUFKLEVBQUk7O0FBQUE7OztBQUV2QixTQUFLLFNB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RUFBd0MsSUFBeEMsRUFBOEMsT0FBOUMsQ0FBbEI7QUFDQSxVQUFNLHNCQUFzQixTQUFTLGFBQWEsSUFBYixHQUFvQixTQUE3QixDQUE1QjtBQUNBLGtCQUFPLEdBQVAsQ0FBYyxRQUFkLFVBQTJCLG1CQUEzQjtBQUNEOzs7Ozs7Ozs7MEJBTUssSSxFQUFNO0FBQ1YsVUFBSSxPQUFPLFlBQU8sS0FBZCxLQUF3QixVQUE1QixFQUF3QztBQUN0QyxZQUFNLE9BQU8sT0FBTyxLQUFLLFNBQUwsQ0FBZSxLQUFmLENBQXFCLENBQUMsSUFBdEIsQ0FBUCxHQUFxQyxLQUFLLFNBQXZEO0FBQ0Esb0JBQU8sS0FBUCxDQUFhLElBQWI7QUFDRDtBQUNGOzs7Ozs7a0JBcllrQixLIiwiZmlsZSI6InByb2JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuaW1wb3J0IGNvb2tpZSBmcm9tICdjb29raWUtY3V0dGVyJztcbmltcG9ydCB7SVNfTk9ERSwgbG9nZ2VyLCB0aW1lc3RhbXB9IGZyb20gJy4vZW52JztcbmltcG9ydCBkMyBmcm9tICdkMy1mb3JtYXQnO1xuXG5jb25zdCBmb3JtYXRTSSA9IGQzLmZvcm1hdCgnLjNzJyk7XG5cbi8vIFRPRE86IEN1cnJlbnRseSB1bnVzZWQsIGtlZXBpbmcgaW4gY2FzZSB3ZSB3YW50IGl0IGxhdGVyIGZvciBsb2cgZm9ybWF0dGluZ1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFRpbWUobXMpIHtcbiAgbGV0IGZvcm1hdHRlZDtcbiAgaWYgKG1zIDwgMTApIHtcbiAgICBmb3JtYXR0ZWQgPSBgJHttcy50b0ZpeGVkKDIpfW1zYDtcbiAgfSBlbHNlIGlmIChtcyA8IDEwMCkge1xuICAgIGZvcm1hdHRlZCA9IGAke21zLnRvRml4ZWQoMSl9bXNgO1xuICB9IGVsc2UgaWYgKG1zIDwgMTAwMCkge1xuICAgIGZvcm1hdHRlZCA9IGAkeyhtcyAvIDEwMDApLnRvRml4ZWQoMyl9c2A7XG4gIH0gZWxzZSB7XG4gICAgZm9ybWF0dGVkID0gYCR7KG1zIC8gMTAwMCkudG9GaXhlZCgyKX1zYDtcbiAgfVxuICByZXR1cm4gZm9ybWF0dGVkO1xufVxuXG5jb25zdCBERUZBVUxUX0NPTkZJRyA9IHtcbiAgLy8gb2ZmIGJ5IGRlZmF1bHRcbiAgaXNFbmFibGVkOiBmYWxzZSxcbiAgLy8gbG9nZ2luZyBsZXZlbFxuICBsZXZlbDogMSxcbiAgLy8gV2hldGhlciBsb2dnaW5nIGlzIHR1cm5lZCBvblxuICBpc0xvZ0VuYWJsZWQ6IHRydWUsXG4gIC8vIFdoZXRoZXIgbG9nZ2luZyBwcmludHMgdG8gY29uc29sZVxuICBpc1ByaW50RW5hYmxlZDogdHJ1ZSxcbiAgLy8gV2hldGhlciBQcm9iZSNydW4gZXhlY3V0ZXMgY29kZVxuICBpc1J1bkVuYWJsZWQ6IHRydWVcbn07XG5cbmNvbnN0IENPT0tJRV9OQU1FID0gJ19fcHJvYmVfXyc7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5jb25zdCBUT19ESVNBQkxFID0gW1xuICAnX3Byb2JlJywgJ19mcHMnLCAnX2V4dGVybmFsUHJvYmUnLCAnX2xvZycsICdydW4nLCAnZ2V0T3B0aW9uJyxcbiAgJ2dldEl0ZXJhdGlvbnNQZXJTZWNvbmQnLCAnbG9nSXRlcmF0aW9uc1BlclNlY29uZCdcbl07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByb2JlIHtcblxuICAvKipcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgT3B0aW9uYWwgY29uZmlndXJhdGlvbiBhcmdzOyBzZWUgI2NvbmZpZ3VyZVxuICAgKi9cbiAgY29uc3RydWN0b3IoY29uZmlnID0ge30pIHtcbiAgICAvLyBEYXRhIGNvbnRhaW5lcnNcbiAgICB0aGlzLl9sb2dTdG9yZSA9IFtdO1xuICAgIHRoaXMuX3NhbXBsZVN0b3JlID0ge307XG4gICAgdGhpcy5fZnBzU3RvcmUgPSB7fTtcbiAgICB0aGlzLl9zdGFydFN0b3JlID0ge307XG4gICAgLy8gVGltZXN0YW1wcyAtIHBlZ2dlZCB0byBhbiBhcmJpdHJhcnkgdGltZSBpbiB0aGUgcGFzdFxuICAgIHRoaXMuX3N0YXJ0VHMgPSB0aW1lc3RhbXAoKTtcbiAgICB0aGlzLl9kZWx0YVRzID0gdGltZXN0YW1wKCk7XG4gICAgLy8gT3RoZXIgc3lzdGVtcyBwYXNzaW5nIGluIGVwb2NoIGluZm8gcmVxdWlyZSBhbiBlcG9jaCB0cyB0byBjb252ZXJ0XG4gICAgdGhpcy5fc3RhcnRFcG9jaFRzID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLl9pdGVyYXRpb25zVHMgPSBudWxsO1xuICAgIC8vIENvbmZpZ3VyYXRpb25cbiAgICB0aGlzLl9jb25maWcgPSBjb25maWcuaWdub3JlRW52aXJvbm1lbnQgP1xuICAgICAgey4uLkRFRkFVTFRfQ09ORklHfSA6XG4gICAgICB0aGlzLl9nZXRDb25maWdGcm9tRW52aXJvbm1lbnQoKTtcbiAgICAvLyBPdmVycmlkZSB3aXRoIG5ldyBjb25maWd1cmF0aW9uLCBpZiBhbnlcbiAgICB0aGlzLmNvbmZpZ3VyZShjb25maWcpO1xuICAgIC8vIERpc2FibGUgbWV0aG9kcyBpZiBuZWNlc3NhcnlcbiAgICBpZiAoIXRoaXMuX2NvbmZpZy5pc0VuYWJsZWQpIHtcbiAgICAgIHRoaXMuZGlzYWJsZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJuIHByb2JlIG9uXG4gICAqIEByZXR1cm4ge1Byb2JlfSBzZWxmLCB0byBzdXBwb3J0IGNoYWluaW5nXG4gICAqL1xuICBlbmFibGUoKSB7XG4gICAgLy8gU3dhcCBpbiBsaXZlIG1ldGhvZHNcbiAgICBmb3IgKGNvbnN0IG1ldGhvZCBvZiBUT19ESVNBQkxFKSB7XG4gICAgICB0aGlzW21ldGhvZF0gPSBQcm9iZS5wcm90b3R5cGVbbWV0aG9kXTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY29uZmlndXJlKHtpc0VuYWJsZWQ6IHRydWV9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJuIHByb2JlIG9mZlxuICAgKiBAcmV0dXJuIHtQcm9iZX0gc2VsZiwgdG8gc3VwcG9ydCBjaGFpbmluZ1xuICAgKi9cbiAgZGlzYWJsZSgpIHtcbiAgICAvLyBTd2FwIGluIG5vb3BzIGZvciBsaXZlIG1ldGhvZHNcbiAgICBmb3IgKGNvbnN0IG1ldGhvZCBvZiBUT19ESVNBQkxFKSB7XG4gICAgICB0aGlzW21ldGhvZF0gPSBub29wO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jb25maWd1cmUoe2lzRW5hYmxlZDogZmFsc2V9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZW5pZW5jZSBmdW5jdGlvbjogU2V0IHByb2JlIGxldmVsXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsZXZlbCBMZXZlbCB0byBzZXRcbiAgICogQHJldHVybiB7UHJvYmV9IHNlbGYsIHRvIHN1cHBvcnQgY2hhaW5pbmdcbiAgICovXG4gIHNldExldmVsKGxldmVsKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlndXJlKHtsZXZlbH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZSBwcm9iZSB3aXRoIG5ldyB2YWx1ZXMgKGNhbiBpbmNsdWRlIGN1c3RvbSBrZXkvdmFsdWUgcGFpcnMpLlxuICAgKiBDb25maWd1cmF0aW9uIHdpbGwgYmUgcGVyc2lzdGVkIGFjcm9zcyBicm93c2VyIHNlc3Npb25zXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gY29uZmlnLmlzRW5hYmxlZCBXaGV0aGVyIHByb2JlIGlzIGVuYWJsZWRcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGNvbmZpZy5sZXZlbCBMb2dnaW5nIGxldmVsXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gY29uZmlnLmlzTG9nRW5hYmxlZCBXaGV0aGVyIGxvZ2dpbmcgcHJpbnRzIHRvIGNvbnNvbGVcbiAgICogQHBhcmFtIHtCb29sZWFufSBjb25maWcuaXNSdW5FbmFibGVkIFdoZXRoZXIgI3J1biBleGVjdXRlcyBjb2RlXG4gICAqIEByZXR1cm4ge1Byb2JlfSBzZWxmLCB0byBzdXBwb3J0IGNoYWluaW5nXG4gICAqL1xuICBjb25maWd1cmUoY29uZmlnID0ge30pIHtcbiAgICBjb25zdCBuZXdDb25maWcgPSB7Li4udGhpcy5fY29uZmlnLCAuLi5jb25maWd9O1xuICAgIHRoaXMuX2NvbmZpZyA9IG5ld0NvbmZpZztcbiAgICBpZiAoIUlTX05PREUpIHtcbiAgICAgIGNvbnN0IHNlcmlhbGl6ZWQgPSBKU09OLnN0cmluZ2lmeShuZXdDb25maWcpO1xuICAgICAgY29va2llLnNldChDT09LSUVfTkFNRSwgc2VyaWFsaXplZCk7XG4gICAgfVxuICAgIC8vIFN1cHBvcnQgY2hhaW5pbmdcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBzaW5nbGUgb3B0aW9uIGZyb20gcHJlc2V0IGNvbmZpZ3VyYXRpb24uIFVzZWZ1bCB3aGVuIHVzaW5nIFByb2JlIHRvXG4gICAqIHNldCBkZXZlbG9wZXItb25seSBzd2l0Y2hlcy5cbiAgICogQHBhcmFtICB7U3RyaW5nfSBrZXkgS2V5IHRvIGdldCB2YWx1ZSBmb3JcbiAgICogQHJldHVybiB7bWl4ZWR9ICAgICBPcHRpb24gdmFsdWUsIG9yIHVuZGVmaW5lZFxuICAgKi9cbiAgZ2V0T3B0aW9uKGtleSkge1xuICAgIHJldHVybiB0aGlzLl9jb25maWdba2V5XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY3VycmVudCBsb2csIGFzIGFuIGFycmF5IG9mIGxvZyByb3cgb2JqZWN0c1xuICAgKiBAcmV0dXJuIHtPYmplY3RbXX0gTG9nXG4gICAqL1xuICBnZXRMb2coKSB7XG4gICAgcmV0dXJuIHRoaXMuX2xvZ1N0b3JlLnNsaWNlKCk7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciBQcm9iZSBpcyBjdXJyZW50bHkgZW5hYmxlZFxuICAgKiBAcmV0dXJuIHtCb29sZWFufSBpc0VuYWJsZWRcbiAgICovXG4gIGlzRW5hYmxlZCgpIHtcbiAgICByZXR1cm4gQm9vbGVhbih0aGlzLl9jb25maWcuaXNFbmFibGVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCBhbGwgaW50ZXJuYWwgc3RvcmVzLCBkcm9wcGluZyBsb2dzXG4gICAqL1xuICByZXNldCgpIHtcbiAgICAvLyBEYXRhIGNvbnRhaW5lcnNcbiAgICB0aGlzLl9sb2dTdG9yZSA9IFtdO1xuICAgIHRoaXMuX3NhbXBsZVN0b3JlID0ge307XG4gICAgdGhpcy5fZnBzU3RvcmUgPSB7fTtcbiAgICB0aGlzLl9zdGFydFN0b3JlID0ge307XG4gICAgLy8gVGltZXN0YW1wc1xuICAgIHRoaXMuX3N0YXJ0VHMgPSB0aW1lc3RhbXAoKTtcbiAgICB0aGlzLl9kZWx0YVRzID0gdGltZXN0YW1wKCk7XG4gICAgdGhpcy5faXRlcmF0aW9uc1RzID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgbG9uZyB0aW1lclxuICAgKi9cbiAgcmVzZXRTdGFydCgpIHtcbiAgICB0aGlzLl9zdGFydFRzID0gdGhpcy5fZGVsdGFUcyA9IHRpbWVzdGFtcCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSB0aW1lIHNpbmNlIGxhc3QgcHJvYmVcbiAgICovXG4gIHJlc2V0RGVsdGEoKSB7XG4gICAgdGhpcy5fZGVsdGFUcyA9IHRpbWVzdGFtcCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge051bWJlcn0gbWlsbGlzZWNvbmRzLCB3aXRoIGZyYWN0aW9uc1xuICAgKi9cbiAgZ2V0VG90YWwoKSB7XG4gICAgcmV0dXJuIHRpbWVzdGFtcCgpIC0gdGhpcy5fc3RhcnRUcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtOdW1iZXJ9IG1pbGxpc2Vjb25kcywgd2l0aCBmcmFjdGlvbnNcbiAgICovXG4gIGdldERlbHRhKCkge1xuICAgIHJldHVybiB0aW1lc3RhbXAoKSAtIHRoaXMuX2RlbHRhVHM7XG4gIH1cblxuICBfZ2V0RWxhcHNlZFRpbWUoKSB7XG4gICAgY29uc3QgdG90YWwgPSB0aW1lc3RhbXAoKSAtIHRoaXMuX3N0YXJ0VHM7XG4gICAgY29uc3QgZGVsdGEgPSB0aW1lc3RhbXAoKSAtIHRoaXMuX2RlbHRhVHM7XG4gICAgLy8gcmVzZXQgZGVsdGEgdGltZXJcbiAgICB0aGlzLl9kZWx0YVRzID0gdGltZXN0YW1wKCk7XG4gICAgcmV0dXJuIHt0b3RhbCwgZGVsdGF9O1xuICB9XG5cbiAgX2xvZyhsZXZlbCwgbmFtZSwgbWV0YSA9IHt9KSB7XG4gICAgY29uc3QgdGltZXMgPSB0aGlzLl9nZXRFbGFwc2VkVGltZSgpO1xuICAgIGNvbnN0IGxvZ1JvdyA9IHtsZXZlbCwgbmFtZSwgLi4udGltZXMsIC4uLm1ldGF9O1xuICAgIC8vIGR1cmF0aW9uIGhhbmRsaW5nXG4gICAgaWYgKG1ldGEuc3RhcnQpIHtcbiAgICAgIHRoaXMuX3N0YXJ0U3RvcmVbbmFtZV0gPSB0aW1lc3RhbXAoKTtcbiAgICB9IGVsc2UgaWYgKG1ldGEuZW5kKSB7XG4gICAgICAvLyBJZiBzdGFydCBpc24ndCBmb3VuZCwgdGFrZSB0aGUgZnVsbCBkdXJhdGlvbiBzaW5jZSBpbml0aWFsaXphdGlvblxuICAgICAgY29uc3Qgc3RhcnQgPSB0aGlzLl9zdGFydFN0b3JlW25hbWVdIHx8IHRoaXMuX3N0YXJ0VHM7XG4gICAgICBsb2dSb3cuZHVyYXRpb24gPSB0aW1lc3RhbXAoKSAtIHN0YXJ0O1xuICAgIH1cbiAgICB0aGlzLl9sb2dTdG9yZS5wdXNoKGxvZ1Jvdyk7XG4gICAgLy8gTG9nIHRvIGNvbnNvbGUgaWYgZW5hYmxlZFxuICAgIGlmICh0aGlzLl9jb25maWcuaXNQcmludEVuYWJsZWQpIHtcbiAgICAgIC8vIFRPRE86IE5pY2VyIGNvbnNvbGUgbG9nZ2luZ1xuICAgICAgbG9nZ2VyLmRlYnVnKEpTT04uc3RyaW5naWZ5KGxvZ1JvdykpO1xuICAgIH1cbiAgfVxuXG4gIF9zaG91bGRMb2cocHJvYmVMZXZlbCkge1xuICAgIGNvbnN0IHtpc0VuYWJsZWQsIGlzTG9nRW5hYmxlZCwgbGV2ZWx9ID0gdGhpcy5fY29uZmlnO1xuICAgIHJldHVybiBpc0VuYWJsZWQgJiYgaXNMb2dFbmFibGVkICYmIGxldmVsID49IHByb2JlTGV2ZWw7XG4gIH1cblxuICAvKipcbiAgICogRGlzcGxheXMgYSBkb3VibGUgdGltaW5nIChmcm9tIFwic3RhcnQgdGltZVwiIGFuZCBmcm9tIGxhc3QgcHJvYmUpLlxuICAgKi9cbiAgcHJvYmUoLi4uYXJncykge1xuICAgIHRoaXMuX3Byb2JlKDEsIC4uLmFyZ3MpO1xuICB9XG5cbiAgcHJvYmUxKC4uLmFyZ3MpIHtcbiAgICB0aGlzLl9wcm9iZSgxLCAuLi5hcmdzKTtcbiAgfVxuXG4gIHByb2JlMiguLi5hcmdzKSB7XG4gICAgdGhpcy5fcHJvYmUoMiwgLi4uYXJncyk7XG4gIH1cblxuICBwcm9iZTMoLi4uYXJncykge1xuICAgIHRoaXMuX3Byb2JlKDMsIC4uLmFyZ3MpO1xuICB9XG5cbiAgX3Byb2JlKGxldmVsLCBuYW1lLCBtZXRhKSB7XG4gICAgaWYgKHRoaXMuX3Nob3VsZExvZyhsZXZlbCkpIHtcbiAgICAgIHRoaXMuX2xvZyhsZXZlbCwgbmFtZSwgbWV0YSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERpc3BsYXkgYW4gYXZlcmFnZWQgdmFsdWUgb2YgdGhlIHRpbWUgc2luY2UgbGFzdCBwcm9iZS5cbiAgICogS2V5ZWQgb24gdGhlIGZpcnN0IHN0cmluZyBhcmd1bWVudC5cbiAgICovXG4gIHNhbXBsZSguLi5hcmdzKSB7XG4gICAgdGhpcy5fc2FtcGxlKDEsIC4uLmFyZ3MpO1xuICB9XG5cbiAgc2FtcGxlMSguLi5hcmdzKSB7XG4gICAgdGhpcy5fc2FtcGxlKDEsIC4uLmFyZ3MpO1xuICB9XG5cbiAgc2FtcGxlMiguLi5hcmdzKSB7XG4gICAgdGhpcy5fc2FtcGxlKDIsIC4uLmFyZ3MpO1xuICB9XG5cbiAgc2FtcGxlMyguLi5hcmdzKSB7XG4gICAgdGhpcy5fc2FtcGxlKDMsIC4uLmFyZ3MpO1xuICB9XG5cbiAgX3NhbXBsZShsZXZlbCwgbmFtZSwgbWV0YSkge1xuICAgIGlmICh0aGlzLl9zaG91bGRMb2cobGV2ZWwpKSB7XG4gICAgICBjb25zdCBzYW1wbGVzID0gdGhpcy5fc2FtcGxlU3RvcmU7XG5cbiAgICAgIGNvbnN0IHByb2JlRGF0YSA9IHNhbXBsZXNbbmFtZV0gfHwgKFxuICAgICAgICBzYW1wbGVzW25hbWVdID0ge3RpbWVTdW06IDAsIGNvdW50OiAwLCBhdmVyYWdlVGltZTogMH1cbiAgICAgICk7XG4gICAgICBwcm9iZURhdGEudGltZVN1bSArPSB0aW1lc3RhbXAoKSAtIHRoaXMuX2RlbHRhVHM7XG4gICAgICBwcm9iZURhdGEuY291bnQgKz0gMTtcbiAgICAgIHByb2JlRGF0YS5hdmVyYWdlVGltZSA9IHByb2JlRGF0YS50aW1lU3VtIC8gcHJvYmVEYXRhLmNvdW50O1xuXG4gICAgICB0aGlzLl9sb2cobGV2ZWwsIG5hbWUsIHsuLi5tZXRhLCBhdmVyYWdlVGltZTogcHJvYmVEYXRhLmF2ZXJhZ2VUaW1lfSk7XG5cbiAgICAgIC8vIFdlaWdodCBtb3JlIGhlYXZpbHkgb24gbGF0ZXIgc2FtcGxlcy4gT3RoZXJ3aXNlIGl0IGdldHMgYWxtb3N0XG4gICAgICAvLyBpbXBvc3NpYmxlIHRvIHNlZSBvdXRsaWVycyBhZnRlciBhIHdoaWxlLlxuICAgICAgaWYgKHByb2JlRGF0YS5jb3VudCA9PT0gMTApIHtcbiAgICAgICAgcHJvYmVEYXRhLmNvdW50ID0gNTtcbiAgICAgICAgcHJvYmVEYXRhLnRpbWVTdW0gLz0gMjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhlc2UgZnVuY3Rpb25zIHdpbGwgYXZlcmFnZSB0aGUgdGltZSBiZXR3ZWVuIGNhbGxzIGFuZCBsb2cgdGhhdCB2YWx1ZVxuICAgKiBldmVyeSBjb3VwbGUgb2YgY2FsbHMsIGluIGVmZmVjdCBzaG93aW5nIGEgdGltZXMgcGVyIHNlY29uZCB0aGlzXG4gICAqIGZ1bmN0aW9uIGlzIGNhbGxlZCAtIHNvbWV0aW1lcyByZXByZXNlbnRpbmcgYSBcImZyYW1lcyBwZXIgc2Vjb25kXCIgY291bnQuXG4gICAqL1xuICBmcHMoLi4uYXJncykge1xuICAgIHRoaXMuX2ZwcygxLCAuLi5hcmdzKTtcbiAgfVxuXG4gIGZwczEoLi4uYXJncykge1xuICAgIHRoaXMuX2ZwcygxLCAuLi5hcmdzKTtcbiAgfVxuXG4gIGZwczIoLi4uYXJncykge1xuICAgIHRoaXMuX2ZwcygyLCAuLi5hcmdzKTtcbiAgfVxuXG4gIGZwczMoLi4uYXJncykge1xuICAgIHRoaXMuX2ZwcygzLCAuLi5hcmdzKTtcbiAgfVxuXG4gIF9mcHMobGV2ZWwsIG5hbWUgPSAnZGVmYXVsdCcsIHtjb3VudCA9IDEwLCAuLi5tZXRhfSA9IHt9KSB7XG4gICAgaWYgKHRoaXMuX3Nob3VsZExvZyhsZXZlbCkpIHtcbiAgICAgIGNvbnN0IGZwc0xvZyA9IHRoaXMuX2Zwc1N0b3JlO1xuICAgICAgY29uc3QgZnBzRGF0YSA9IGZwc0xvZ1tuYW1lXTtcbiAgICAgIGlmICghZnBzRGF0YSkge1xuICAgICAgICBmcHNMb2dbbmFtZV0gPSB7Y291bnQ6IDEsIHRpbWU6IHRpbWVzdGFtcCgpfTtcbiAgICAgIH0gZWxzZSBpZiAoKytmcHNEYXRhLmNvdW50ID49IGNvdW50KSB7XG4gICAgICAgIGNvbnN0IGZwcyA9IGZwc0RhdGEuY291bnQgLyAodGltZXN0YW1wKCkgLSBmcHNEYXRhLnRpbWUpO1xuICAgICAgICBmcHNEYXRhLmNvdW50ID0gMDtcbiAgICAgICAgZnBzRGF0YS50aW1lID0gdGltZXN0YW1wKCk7XG4gICAgICAgIHRoaXMuX2xvZyhsZXZlbCwgbmFtZSwgey4uLm1ldGEsIGZwc30pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNwbGF5IGEgbWVhc3VyZW1lbnQgZnJvbSBhbiBleHRlcm5hbCBzb3VyY2UsIHN1Y2ggYXMgYSBzZXJ2ZXIsXG4gICAqIGlubGluZSB3aXRoIG90aGVyIGxvY2FsIG1lYXN1cmVtZW50cyBpbiB0aGUgc3R5bGUgb2YgUHJvYmUncyBvdXRwdXQuXG4gICAqL1xuICBleHRlcm5hbFByb2JlKC4uLmFyZ3MpIHtcbiAgICB0aGlzLl9leHRlcm5hbFByb2JlKDEsIC4uLmFyZ3MpO1xuICB9XG5cbiAgZXh0ZXJuYWxQcm9iZTEoLi4uYXJncykge1xuICAgIHRoaXMuX2V4dGVybmFsUHJvYmUoMSwgLi4uYXJncyk7XG4gIH1cblxuICBleHRlcm5hbFByb2JlMiguLi5hcmdzKSB7XG4gICAgdGhpcy5fZXh0ZXJuYWxQcm9iZSgyLCAuLi5hcmdzKTtcbiAgfVxuXG4gIGV4dGVybmFsUHJvYmUzKC4uLmFyZ3MpIHtcbiAgICB0aGlzLl9leHRlcm5hbFByb2JlKDMsIC4uLmFyZ3MpO1xuICB9XG5cbiAgX2V4dGVybmFsUHJvYmUobGV2ZWwsIG5hbWUsIHRpbWVTdGFydCwgdGltZVNwZW50LCBtZXRhKSB7XG4gICAgaWYgKHRoaXMuX3Nob3VsZExvZyhsZXZlbCkpIHtcbiAgICAgIC8vIEV4dGVybmFsIHByb2JlcyBhcmUgZXhwZWN0ZWQgdG8gcHJvdmlkZSBlcG9jaCB0aW1lc3RhbXBzXG4gICAgICBjb25zdCB0b3RhbCA9IHRpbWVTdGFydCAtIHRoaXMuX3N0YXJ0RXBvY2hUcztcbiAgICAgIGNvbnN0IGRlbHRhID0gdGltZVNwZW50O1xuICAgICAgdGhpcy5fbG9nKGxldmVsLCBuYW1lLCB7dG90YWwsIGRlbHRhLCAuLi5tZXRhfSk7XG4gICAgfVxuICB9XG5cbiAgLyogQ29uZGl0aW9uYWxseSBydW4gYSBmdW5jdGlvbiBvbmx5IHdoZW4gcHJvYmUgaXMgZW5hYmxlZCAqL1xuICBydW4oZnVuYywgYXJnKSB7XG4gICAgY29uc3Qge2lzRW5hYmxlZCwgaXNSdW5FbmFibGVkfSA9IHRoaXMuX2NvbmZpZztcbiAgICBpZiAoaXNFbmFibGVkICYmIGlzUnVuRW5hYmxlZCkge1xuICAgICAgZnVuYyhhcmcpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXJ0SWl0ZXJhdGlvbnMoKSB7XG4gICAgdGhpcy5faXRlcmF0aW9uc1RzID0gdGltZXN0YW1wKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNvbmZpZyBmcm9tIHBlcnNpc3RlbnQgc3RvcmUsIGlmIGF2YWlsYWJsZVxuICAgKiBAcmV0dXJuIHtPYmplY3R9IGNvbmZpZ1xuICAgKi9cbiAgX2dldENvbmZpZ0Zyb21FbnZpcm9ubWVudCgpIHtcbiAgICBsZXQgY3VzdG9tQ29uZmlnID0ge307XG4gICAgaWYgKCFJU19OT0RFKSB7XG4gICAgICBjb25zdCBzZXJpYWxpemVkID0gY29va2llLmdldChDT09LSUVfTkFNRSk7XG4gICAgICBpZiAoc2VyaWFsaXplZCkge1xuICAgICAgICBjdXN0b21Db25maWcgPSBKU09OLnBhcnNlKHNlcmlhbGl6ZWQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gey4uLkRFRkFVTFRfQ09ORklHLCAuLi5jdXN0b21Db25maWd9O1xuICB9XG5cbiAgLyogQ291bnQgaXRlcmF0aW9ucyBwZXIgc2Vjb25kLiBSdW5zIHRoZSBwcm92aWRlZCBmdW5jdGlvbiBhXG4gICAqIHNwZWNpZmllZCBudW1iZXIgb2YgdGltZXMgYW5kIG5vcm1hbGl6ZXMgdGhlIHJlc3VsdCB0byByZXByZXNlbnRcbiAgICogaXRlcmF0aW9ucyBwZXIgc2Vjb25kLlxuICAgKlxuICAgKiBUT0RPL2liIE1lYXN1cmUgb25lIGl0ZXJhdGlvbiBhbmQgYXV0byBhZGp1c3QgaXRlcmF0aW9uIGNvdW50LlxuICAgKi9cbiAgZ2V0SXRlcmF0aW9uc1BlclNlY29uZChpdGVyYXRpb25zID0gMTAwMDAsIGZ1bmMgPSBudWxsLCBjb250ZXh0KSB7XG4gICAgaWYgKGZ1bmMpIHtcbiAgICAgIFByb2JlLnN0YXJ0SWl0ZXJhdGlvbnMoKTtcbiAgICAgIC8vIEtlZXAgY2FsbCBvdmVyaGVhZCBtaW5pbWFsLCBvbmx5IHVzZSBGdW5jdGlvbi5jYWxsIGlmIGNvbnRleHQgc3VwcGxpZWRcbiAgICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlcmF0aW9uczsgaSsrKSB7XG4gICAgICAgICAgZnVuYy5jYWxsKGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZXJhdGlvbnM7IGkrKykge1xuICAgICAgICAgIGZ1bmMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBlbGFwc2VkTWlsbGlzID0gdGltZXN0YW1wKCkgLSB0aGlzLl9pdGVyYXRpb25zVHM7XG4gICAgY29uc3QgaXRlcmF0aW9uc1BlclNlY29uZCA9IGZvcm1hdFNJKGl0ZXJhdGlvbnMgKiAxMDAwIC8gZWxhcHNlZE1pbGxpcyk7XG4gICAgcmV0dXJuIGl0ZXJhdGlvbnNQZXJTZWNvbmQ7XG4gIH1cblxuICAvKlxuICAgKiBQcmludCB0aGUgbnVtYmVyIG9mIGl0ZXJhdGlvbnMgcGVyIHNlY29uZCBtZWFzdXJlZCB1c2luZyB0aGUgcHJvdmlkZWRcbiAgICogZnVuY3Rpb25cbiAgICovXG4gIGxvZ0l0ZXJhdGlvbnNQZXJTZWNvbmQoXG4gICAgdGVzdE5hbWUsIGl0ZXJhdGlvbnMgPSAxMDAwMCwgZnVuYyA9IG51bGwsIGNvbnRleHQgPSBudWxsXG4gICkge1xuICAgIGNvbnN0IGVsYXBzZWRNcyA9IHRoaXMuZ2V0SXRlcmF0aW9uc1BlclNlY29uZChpdGVyYXRpb25zLCBmdW5jLCBjb250ZXh0KTtcbiAgICBjb25zdCBpdGVyYXRpb25zUGVyU2Vjb25kID0gZm9ybWF0U0koaXRlcmF0aW9ucyAqIDEwMDAgLyBlbGFwc2VkTXMpO1xuICAgIGxvZ2dlci5sb2coYCR7dGVzdE5hbWV9OiAke2l0ZXJhdGlvbnNQZXJTZWNvbmR9IGl0ZXJhdGlvbnMvc2ApO1xuICB9XG5cbiAgLyoqXG4gICAqIFNob3cgY3VycmVudCBsb2cgaW4gYSB0YWJsZSwgaWYgc3VwcG9ydGVkIGJ5IGNvbnNvbGVcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHRhaWwgSWYgc3VwcGxpZWQsIHNob3cgb25seSB0aGUgbGFzdCBuIGVudHJpZXNcbiAgICovXG4gIHRhYmxlKHRhaWwpIHtcbiAgICBpZiAodHlwZW9mIGxvZ2dlci50YWJsZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29uc3Qgcm93cyA9IHRhaWwgPyB0aGlzLl9sb2dTdG9yZS5zbGljZSgtdGFpbCkgOiB0aGlzLl9sb2dTdG9yZTtcbiAgICAgIGxvZ2dlci50YWJsZShyb3dzKTtcbiAgICB9XG4gIH1cblxufVxuIl19