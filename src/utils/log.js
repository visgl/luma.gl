/* eslint-disable no-console */
/* global console */
const cache = {};

const log = {
  priority: 0,
  table(priority, table) {
    if (priority <= log.priority && table) {
      console.table(table);
    }
  },
  log(priority, arg, ...args) {
    if (priority <= log.priority) {
      console.debug(`luma.gl: ${arg}`, ...args);
    }
  },
  info(priority, arg, ...args) {
    if (priority <= log.priority) {
      console.log(`luma.gl: ${arg}`, ...args);
    }
  },
  once(priority, arg, ...args) {
    if (!cache[arg]) {
      log.log(priority, arg, ...args);
    }
    cache[arg] = true;
  },
  warn(priority, arg, ...args) {
    if (priority <= log.priority && !cache[arg]) {
      console.warn(`luma.gl: ${arg}`, ...args);
    }
    cache[arg] = true;
  },
  error(priority, arg, ...args) {
    console.error(`luma.gl: ${arg}`, ...args);
  },
  deprecated(oldUsage, newUsage) {
    log.warn(0, `luma.gl: \`${oldUsage}\` is deprecated and will be removed \
in a later version. Use \`${newUsage}\` instead`);
  }
};

function formatArrayValue(v, opts) {
  const {maxElts = 16, size = 1} = opts;
  let string = '[';
  for (let i = 0; i < v.length && i < maxElts; ++i) {
    if (i > 0) {
      string += `,${(i % size === 0) ? ' ' : ''}`;
    }
    string += formatValue(v[i], opts);
  }
  const terminator = v.length > maxElts ? '...' : ']';
  return `${string}${terminator}`;
}

export function formatValue(v, opts = {}) {
  const {isInteger = false} = opts;
  if (Array.isArray(v) || ArrayBuffer.isView(v)) {
    return formatArrayValue(v, opts);
  }
  if (!Number.isFinite(v)) {
    return String(v);
  }
  if (isInteger) {
    return v.toFixed(0);
  }
  if (Math.abs(v) > 100 && Math.abs(v) < 10000) {
    return v.toFixed(0);
  }
  const string = v.toPrecision(2);
  const decimal = string.indexOf('.0');
  return decimal === string.length - 2 ? string.slice(0, -1) : string;
}

export default log;
