/* eslint-disable */
// Adapted from https://github.com/substack/cookie-cutter (under MIT license)
export default function (doc) {
  if (!doc) doc = {};
  if (typeof doc === 'string') doc = { cookie: doc };
  if (doc.cookie === undefined) doc.cookie = '';

  return {
    get(key) {
      const splat = doc.cookie.split(/;\s*/);
      for (let i = 0; i < splat.length; i++) {
        const ps = splat[i].split('=');
        const k = unescape(ps[0]);
        if (k === key) {
          return unescape(ps[1]);
        }
      }
      return undefined;
    },

    set(key, value, {expires, path, domain, secure} = {}) {
      let s = escape(key) + '=' + escape(value);
      if (expires) {
        s += `; expires=${expires}`;
      }
      if (path) {
        s += `; path=${escape(path)}`;
      }
      if (domain) {
        s += `; domain=${escape(domain)}`;
      }
      if (secure) {
        s += '; secure';
      }
      doc.cookie = s;
      return s;
    }
  };
};

if (typeof document !== 'undefined') {
  const cookie = exports(document);
  exports.get = cookie.get;
  exports.set = cookie.set;
}