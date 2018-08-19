function isEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a)) {
    // Special treatment for arrays: compare 1-level deep
    // This is to support equality of matrix/coordinate props
    const len = a.length;
    if (!b || b.length !== len) {
      return false;
    }

    for (let i = 0; i < len; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
  return false;
}

/**
 * Speed up consecutive function calls by caching the result of calls with identical input
 * https://en.wikipedia.org/wiki/Memoization
 * @param {function} compute - the function to be memoized
 */
export default function memoize(compute) {
  let cachedArgs = null;
  let cachedResult = null;

  return (...args) => {
    const needsRecompute =
      !cachedArgs ||
      args.length !== cachedArgs.length ||
      args.some((a, i) => !isEqual(a, cachedArgs[i]));

    if (needsRecompute) {
      cachedResult = compute(...args);
      cachedArgs = args;
    }
    return cachedResult;
  };
}
