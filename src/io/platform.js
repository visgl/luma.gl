// Use require instead of import/export to dynamically export the right set
// of functions
if (typeof window !== 'undefined') {
  module.exports = require('./browser');
} else {
  module.exports = require('./node');
}
