import loadFile from './browser-request';
import imageIO from './image-io';
import browserFS from './browser-fs';

export default Object.assign(loadFile, {
  loadFile,
  ...browserFS,
  ...imageIO
});
