// Export node functions matched by browser-fs
import {readFile, writeFile} from 'fs';
const browserFs = {readFile, writeFile};
export {browserFs};

// Export node implementation of image io
export * from './image-io';
