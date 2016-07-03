// Use require instead of import/export to dynamically export the right set
// of functions
import {isBrowser} from '../utils';

if (isBrowser()) {
  module.exports = require('./browser');
} else {
  module.exports = require('./node');
}
