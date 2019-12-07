import {getBrowser} from 'probe.gl/env';

// opts allows user agent to be overridden for testing
export default function isOldIE(opts = {}) {
  return getBrowser(opts.userAgent) === 'IE';
}
