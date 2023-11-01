// luma.gl, MIT license
// Copyright (c) vis.gl contributors

// opts allows user agent to be overridden for testing
export function isOldIE(opts = {}) {
  const navigator = typeof window !== 'undefined' ? window.navigator || {} : {};
  // @ts-expect-error
  const userAgent = opts.userAgent || navigator.userAgent || '';
  // We only care about older versions of IE (IE 11 and below). Newer versions of IE (Edge)
  // have much better web standards support.
  const isMSIE = userAgent.indexOf('MSIE ') !== -1;
  const isTrident = userAgent.indexOf('Trident/') !== -1;
  return isMSIE || isTrident;
}
