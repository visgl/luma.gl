// LASER (LAS) FILE FORMAT

import {parseLAZ} from './parse-laz';

export default {
  name: 'LAZ',
  extension: 'laz',
  format: 'text',
  parser: parseLAZ
};
