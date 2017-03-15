const io = require('./dist/io');
import luma from './dist/globals';
Object.assign(luma, io);

module.exports = io;
