/* eslint-disable max-len */
import isOldIE from '../../src/utils/is-old-ie';
import test from 'tape-catch';

test('isOldIE', t => {
  t.equal(
    isOldIE({userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)'}),
    true,
    'should return true for IE 10'
  );

  t.equal(
    isOldIE({userAgent: 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko'}),
    true,
    'should return true for IE 11'
  );

  t.equal(
    isOldIE({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0'
    }),
    false,
    'should return false for IE 12'
  );

  t.equal(
    isOldIE({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36'
    }),
    false,
    'should return false for Chrome'
  );

  t.end();
});
