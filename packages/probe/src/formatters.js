const d3Format = require('d3-format');

export const formatSI = d3Format.format('.3s');

// TODO: Currently unused, keeping in case we want it later for log formatting
export function formatTime(ms) {
  let formatted;
  if (ms < 10) {
    formatted = `${ms.toFixed(2)}ms`;
  } else if (ms < 100) {
    formatted = `${ms.toFixed(1)}ms`;
  } else if (ms < 1000) {
    formatted = `${ms.toFixed(0)}ms`;
  } else {
    formatted = `${(ms / 1000).toFixed(2)}s`;
  }
  return formatted;
}

export function leftPad(string, length = 8) {
  while (string.length < length) {
    string = ` ${string}`;
  }
  return string;
}
