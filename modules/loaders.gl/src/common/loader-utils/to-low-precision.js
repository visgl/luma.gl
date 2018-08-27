/**
 * Covert all numbers in a deep structure to a given precision, allowing
 * reliable float comparisons. Converts data in-place.
 * @param  {mixed} input      Input data
 * @param  {Number} [precision] Desired precision
 * @return {mixed}            Input data, with all numbers converted
 */
export function toLowPrecision(input, precision = 11) {
  /* eslint-disable guard-for-in */
  if (typeof input === 'number') {
    input = Number(input.toPrecision(precision));
  } else if (Array.isArray(input) || ArrayBuffer.isView(input)) {
    input = Array.from(input).map(item => toLowPrecision(item, precision));
  } else if (typeof input === 'object') {
    for (const key in input) {
      input[key] = toLowPrecision(input[key], precision);
    }
  }
  return input;
}
