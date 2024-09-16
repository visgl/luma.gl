/* global GPUAdapter */
// eslint-disable-next-line strict
"use strict";

function makePromise() {
  const info = {};
  const promise = new Promise((resolve, reject) => {
    Object.assign(info, {resolve, reject});
  });
  info.promise = promise;
  return info;
}

window.testsPromiseInfo = makePromise();

window.addEventListener('error', (event) => {
  console.error(event);
  window.testsPromiseInfo.reject(1);
});

// eslint-disable-next-line no-lone-blocks
{
  GPUAdapter.prototype.requestDevice = (function (origFn) {
    return async function (...args) {
      const device = await origFn.call(this, args);
      if (device) {
        device.addEventListener('uncapturederror', function (e) {
          console.error(e.error.message);
          window.testsPromiseInfo.reject(1);
        });
      }
      return device;
    };
  })(GPUAdapter.prototype.requestDevice);
}
