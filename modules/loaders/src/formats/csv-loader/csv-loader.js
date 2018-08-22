import {csvParseRows} from 'd3-dsv';

export default {
  name: 'CSV',
  extension: 'csv',
  testText: null,
  parseText: csvParseRows
};
