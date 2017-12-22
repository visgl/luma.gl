/* eslint-disable no-console */
/* global console, window, Image */

console.debug = console.debug || console.log;

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
      cache[arg] = true;
    }
  },
  warn(arg, ...args) {
    if (!cache[arg]) {
      console.warn(`luma.gl: ${arg}`, ...args);
      cache[arg] = true;
    }
  },
  error(arg, ...args) {
    console.error(`luma.gl: ${arg}`, ...args);
  },
  image({priority, image, message = '', scale = 1}) {
    if (priority > log.priority) {
      return;
    }
    if (typeof window === 'undefined') { // Let's not try this under node
      return;
    }
    if (typeof image === 'string') {
      const img = new Image();
      img.onload = logImage.bind(null, img, message, scale);
      img.src = image;
    }
    const element = image.nodeName || '';
    if (element.toLowerCase() === 'img') {
      logImage(image, message, scale);
    }
    if (element.toLowerCase() === 'canvas') {
      const img = new Image();
      img.onload = logImage.bind(null, img, message, scale);
      img.src = image.toDataURL();
    }
  },
  deprecated(oldUsage, newUsage) {
    log.warn(`luma.gl: \`${oldUsage}\` is deprecated and will be removed \
in a later version. Use \`${newUsage}\` instead`);
  },
  removed(oldUsage, newUsage) {
    log.error(`\`${oldUsage}\` is no longer supported. Use \`${newUsage}\` instead,\
   check our Upgrade Guide for more details`);
  },
  group(priority, arg, {collapsed = false} = {}) {
    if (priority <= log.priority) {
      if (collapsed) {
        console.groupCollapsed(`luma.gl: ${arg}`);
      } else {
        console.group(`luma.gl: ${arg}`);
      }
    }
  },
  groupEnd(priority, arg) {
    if (priority <= log.priority) {
      console.groupEnd(`luma.gl: ${arg}`);
    }
  },
  time(priority, label) {
    if (priority <= log.priority) {
      // In case the platform doesn't have console.time
      if (console.time) {
        console.time(label);
      } else {
        console.info(label);
      }
    }
  },
  timeEnd(priority, label) {
    if (priority <= log.priority) {
      // In case the platform doesn't have console.timeEnd
      if (console.timeEnd) {
        console.timeEnd(label);
      } else {
        console.info(label);
      }
    }
  }
};

// Inspired by https://github.com/hughsk/console-image (MIT license)
function logImage(image, message, scale) {
  const width = image.width * scale;
  const height = image.height * scale;
  const imageUrl = image.src.replace(/\(/g, '%28').replace(/\)/g, '%29');

  console.log(`${message} %c+`, [
    'font-size:1px;',
    `padding:${Math.floor(height / 2)}px ${Math.floor(width / 2)}px;`,
    `line-height:${height}px;`,
    `background:url(${imageUrl});`,
    `background-size:${width}px ${height}px;`,
    'color:transparent;'
  ].join(''));
}

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
  const EPSILON = 1e-16;
  const {isInteger = false} = opts;
  if (Array.isArray(v) || ArrayBuffer.isView(v)) {
    return formatArrayValue(v, opts);
  }
  if (!Number.isFinite(v)) {
    return String(v);
  }
  if (Math.abs(v) < EPSILON) {
    return isInteger ? '0' : '0.';
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
