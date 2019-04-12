// Ensure window is defined
global.window = global.window || global;

if (typeof window !== 'undefined') {
  window.website = true;
}

// Use a "require" wrapper to make sure that window.website is set before examples imported
module.exports = require('./example-list').default;
