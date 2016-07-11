// This function is needed in initialization stages,
// make sure it can be imported in isolation
/* global process */
function isBrowser() {
  const isNode =
    typeof process === 'object' &&
    String(process) === '[object process]' &&
    !process.browser;
  return !isNode;
};

function getGlobal() {
  return isBrowser() ? window : global;
}

module.exports = {
  isBrowser: isBrowser,
  getGlobal: getGlobal
};
