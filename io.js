const io = require('./dist/io');
import {luma} from './dist/utils';
Object.assign(luma, io);

module.exports = io;
