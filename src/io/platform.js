// Use require instead of import/export to dynamically export the right set
// of functions
import {isBrowser} from '../utils';

module.exports = isBrowser() ? require('./browser') : require('./node');
