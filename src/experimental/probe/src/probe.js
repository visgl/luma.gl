/* eslint-disable no-console */
import {IS_NODE, logger, timestamp} from './env';

// TODO - this used to use d3.format(.3s)
function formatSI(value) {
  return value.toFixed(3);
}

// TODO: Currently unused, keeping in case we want it later for log formatting
export function formatTime(ms) {
  let formatted;
  if (ms < 10) {
    formatted = `${ms.toFixed(2)}ms`;
  } else if (ms < 100) {
    formatted = `${ms.toFixed(1)}ms`;
  } else if (ms < 1000) {
    formatted = `${(ms / 1000).toFixed(3)}s`;
  } else {
    formatted = `${(ms / 1000).toFixed(2)}s`;
  }
  return formatted;
}

const DEFAULT_CONFIG = {
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

function noop() {}

const TO_DISABLE = [
  '_probe', '_fps', '_externalProbe', '_log', 'run', 'getOption',
  'getIterationsPerSecond', 'logIterationsPerSecond'
];

export default class Probe {

  /**
   * @constructor
   * @param {Object} config Optional configuration args; see #configure
   */
  constructor(config = {}) {
    // Data containers
    this._logStore = [];
    this._sampleStore = {};
    this._fpsStore = {};
    this._startStore = {};
    // Timestamps - pegged to an arbitrary time in the past
    this._startTs = timestamp();
    this._deltaTs = timestamp();
    // Other systems passing in epoch info require an epoch ts to convert
    this._startEpochTs = Date.now();
    this._iterationsTs = null;
    // Configuration
    this._config = config.ignoreEnvironment ?
      Object.assign({}, DEFAULT_CONFIG) :
      this._getConfigFromEnvironment();
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
  enable() {
    // Swap in live methods
    for (const method of TO_DISABLE) {
      this[method] = Probe.prototype[method];
    }
    return this.configure({isEnabled: true});
  }

  /**
   * Turn probe off
   * @return {Probe} self, to support chaining
   */
  disable() {
    // Swap in noops for live methods
    for (const method of TO_DISABLE) {
      this[method] = noop;
    }
    return this.configure({isEnabled: false});
  }

  /**
   * Convenience function: Set probe level
   * @param {Number} level Level to set
   * @return {Probe} self, to support chaining
   */
  setLevel(level) {
    return this.configure({level});
  }

  /**
   * Configure probe with new values (can include custom key/value pairs).
   * Configuration will be persisted across browser sessions
   * @param {Object} config - named parameters
   * @param {Boolean} config.isEnabled Whether probe is enabled
   * @param {Number} config.level Logging level
   * @param {Boolean} config.isLogEnabled Whether logging prints to console
   * @param {Boolean} config.isRunEnabled Whether #run executes code
   * @return {Probe} self, to support chaining
   */
  configure(config = {}) {
    const newConfig = Object.assign({}, this._config, config);
    this._config = newConfig;
    // if (!IS_NODE) {
    //   const serialized = JSON.stringify(newConfig);
    //   cookie.set(COOKIE_NAME, serialized);
    // }
    // Support chaining
    return this;
  }

  /**
   * Get a single option from preset configuration. Useful when using Probe to
   * set developer-only switches.
   * @param  {String} key Key to get value for
   * @return {mixed}     Option value, or undefined
   */
  getOption(key) {
    return this._config[key];
  }

  /**
   * Get current log, as an array of log row objects
   * @return {Object[]} Log
   */
  getLog() {
    return this._logStore.slice();
  }

  /**
   * Whether Probe is currently enabled
   * @return {Boolean} isEnabled
   */
  isEnabled() {
    return Boolean(this._config.isEnabled);
  }

  /**
   * Reset all internal stores, dropping logs
   */
  reset() {
    // Data containers
    this._logStore = [];
    this._sampleStore = {};
    this._fpsStore = {};
    this._startStore = {};
    // Timestamps
    this._startTs = timestamp();
    this._deltaTs = timestamp();
    this._iterationsTs = null;
  }

  /**
   * Reset the long timer
   */
  resetStart() {
    this._startTs = this._deltaTs = timestamp();
  }

  /**
   * Reset the time since last probe
   */
  resetDelta() {
    this._deltaTs = timestamp();
  }

  /**
   * @return {Number} milliseconds, with fractions
   */
  getTotal() {
    return timestamp() - this._startTs;
  }

  /**
   * @return {Number} milliseconds, with fractions
   */
  getDelta() {
    return timestamp() - this._deltaTs;
  }

  _getElapsedTime() {
    const total = timestamp() - this._startTs;
    const delta = timestamp() - this._deltaTs;
    // reset delta timer
    this._deltaTs = timestamp();
    return {total, delta};
  }

  _log(level, name, meta = {}) {
    const times = this._getElapsedTime();
    const logRow = Object.assign({level, name}, times, meta);
    // duration handling
    if (meta.start) {
      this._startStore[name] = timestamp();
    } else if (meta.end) {
      // If start isn't found, take the full duration since initialization
      const start = this._startStore[name] || this._startTs;
      logRow.duration = timestamp() - start;
    }
    this._logStore.push(logRow);
    // Log to console if enabled
    if (this._config.isPrintEnabled) {
      // TODO: Nicer console logging
      logger.debug(JSON.stringify(logRow));
    }
  }

  _shouldLog(probeLevel) {
    const {isEnabled, isLogEnabled, level} = this._config;
    return isEnabled && isLogEnabled && level >= probeLevel;
  }

  /**
   * Displays a double timing (from "start time" and from last probe).
   */
  probe(...args) {
    this._probe(1, ...args);
  }

  probe1(...args) {
    this._probe(1, ...args);
  }

  probe2(...args) {
    this._probe(2, ...args);
  }

  probe3(...args) {
    this._probe(3, ...args);
  }

  _probe(level, name, meta) {
    if (this._shouldLog(level)) {
      this._log(level, name, meta);
    }
  }

  /**
   * Display an averaged value of the time since last probe.
   * Keyed on the first string argument.
   */
  sample(...args) {
    this._sample(1, ...args);
  }

  sample1(...args) {
    this._sample(1, ...args);
  }

  sample2(...args) {
    this._sample(2, ...args);
  }

  sample3(...args) {
    this._sample(3, ...args);
  }

  _sample(level, name, meta) {
    if (this._shouldLog(level)) {
      const samples = this._sampleStore;

      const probeData = samples[name] || (
        samples[name] = {timeSum: 0, count: 0, averageTime: 0}
      );
      probeData.timeSum += timestamp() - this._deltaTs;
      probeData.count += 1;
      probeData.averageTime = probeData.timeSum / probeData.count;

      this._log(level, name, Object.assign({}, meta, {averageTime: probeData.averageTime}));

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
  fps(...args) {
    this._fps(1, ...args);
  }

  fps1(...args) {
    this._fps(1, ...args);
  }

  fps2(...args) {
    this._fps(2, ...args);
  }

  fps3(...args) {
    this._fps(3, ...args);
  }

  _fps(level, name = 'default', opts = {}) {
    const {count = 10} = opts;
    if (this._shouldLog(level)) {
      const fpsLog = this._fpsStore;
      const fpsData = fpsLog[name];
      if (!fpsData) {
        fpsLog[name] = {count: 1, time: timestamp()};
      } else if (++fpsData.count >= count) {
        const fps = fpsData.count / (timestamp() - fpsData.time);
        fpsData.count = 0;
        fpsData.time = timestamp();
        this._log(level, name, Object.assign({fps}, opts));
      }
    }
  }

  /**
   * Display a measurement from an external source, such as a server,
   * inline with other local measurements in the style of Probe's output.
   */
  externalProbe(...args) {
    this._externalProbe(1, ...args);
  }

  externalProbe1(...args) {
    this._externalProbe(1, ...args);
  }

  externalProbe2(...args) {
    this._externalProbe(2, ...args);
  }

  externalProbe3(...args) {
    this._externalProbe(3, ...args);
  }

  _externalProbe(level, name, timeStart, timeSpent, meta) {
    if (this._shouldLog(level)) {
      // External probes are expected to provide epoch timestamps
      const total = timeStart - this._startEpochTs;
      const delta = timeSpent;
      this._log(level, name, Object.assign({total, delta}, meta));
    }
  }

  /* Conditionally run a function only when probe is enabled */
  run(func, arg) {
    const {isEnabled, isRunEnabled} = this._config;
    if (isEnabled && isRunEnabled) {
      func(arg);
    }
  }

  startIiterations() {
    this._iterationsTs = timestamp();
  }

  /**
   * Get config from persistent store, if available
   * @return {Object} config
   */
  _getConfigFromEnvironment() {
    let customConfig = {};
    if (!IS_NODE) {
      const serialized = {}; // cookie.get(COOKIE_NAME);
      if (serialized) {
        customConfig = JSON.parse(serialized);
      }
    }
    return Object.assign({}, DEFAULT_CONFIG, customConfig);
  }

  /* Count iterations per second. Runs the provided function a
   * specified number of times and normalizes the result to represent
   * iterations per second.
   *
   * TODO/ib Measure one iteration and auto adjust iteration count.
   */
  getIterationsPerSecond(iterations = 10000, func = null, context) {
    if (func) {
      Probe.startIiterations();
      // Keep call overhead minimal, only use Function.call if context supplied
      if (context) {
        for (let i = 0; i < iterations; i++) {
          func.call(context);
        }
      } else {
        for (let i = 0; i < iterations; i++) {
          func();
        }
      }
    }
    const elapsedMillis = timestamp() - this._iterationsTs;
    const iterationsPerSecond = formatSI(iterations * 1000 / elapsedMillis);
    return iterationsPerSecond;
  }

  /*
   * Print the number of iterations per second measured using the provided
   * function
   */
  logIterationsPerSecond(
    testName, iterations = 10000, func = null, context = null
  ) {
    const elapsedMs = this.getIterationsPerSecond(iterations, func, context);
    const iterationsPerSecond = formatSI(iterations * 1000 / elapsedMs);
    logger.log(`${testName}: ${iterationsPerSecond} iterations/s`);
  }

  /**
   * Show current log in a table, if supported by console
   * @param {Number} tail If supplied, show only the last n entries
   */
  table(tail) {
    if (typeof logger.table === 'function') {
      const rows = tail ? this._logStore.slice(-tail) : this._logStore;
      logger.table(rows);
    }
  }

}
