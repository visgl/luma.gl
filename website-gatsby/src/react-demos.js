// Use a "require" wrapper to make sure that window.website is set before examples imported
if (typeof window !== 'undefined') {
  window.website = true;
}
module.exports = require('./react-demo-list');
