import {getBrowser} from '@probe.gl/env';

// opts allows user agent to be overridden for testing
export default function isOldIE(opts: {userAgent?}): boolean {
  return getBrowser(opts.userAgent) === 'IE';
}
