import browser from './browser';
import node from './node';

const io = typeof window !== undefined ? browser : node;
export default io;
