import test from 'tape-promise/tape';
import {parseShaderCompilerLog} from '@luma.gl/webgl/adapter/helpers/parse-shader-compiler-log';

test('parseShaderCompilerLog', (t) => {
  const {ERROR_LOG, EXPECTED_MESSAGES} = getFixtures();
  const messages = parseShaderCompilerLog(ERROR_LOG); // SHADER_SOURCE, SHADER_TYPE;
  t.deepEqual(messages, EXPECTED_MESSAGES, 'parseShaderCompilerLog generated correct messages');
  t.end();
});

const ERROR_LOG = `\
WARNING: 0:264: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:264: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:294: '/' : Divide by zero during constant folding
WARNING: 0:294: '/' : Divide by zero during constant folding
WARNING: 0:344: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:344: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:447: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:447: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:470: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:470: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:557: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:557: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:580: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:580: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:669: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:669: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:681: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:681: '/' : Zero divided by zero during constant folding generated NaN
ERROR: 0:967: 'project_scale' : no matching overloaded function found
ERROR: 0:994: 'project_scale' : no matching overloaded function found
`;

const EXPECTED_MESSAGES = [
  {
    message: '\'/\' : Zero divided by zero during constant folding generated NaN',
    type: 'warning',
    lineNum: 264,
    linePos: 0
  },
  {
    message: '\'/\' : Zero divided by zero during constant folding generated NaN',
    type: 'warning',
    lineNum: 264,
    linePos: 0
  },
  {
    message: '\'/\' : Divide by zero during constant folding',
    type: 'warning',
    lineNum: 294,
    linePos: 0
  },
  {
    message: '\'/\' : Divide by zero during constant folding',
    type: 'warning',
    lineNum: 294,
    linePos: 0
  },
  {
    message: '\'/\' : Zero divided by zero during constant folding generated NaN',
    type: 'warning',
    lineNum: 344,
    linePos: 0
  },
  {
    message: '\'/\' : Zero divided by zero during constant folding generated NaN',
    type: 'warning',
    lineNum: 344,
    linePos: 0
  },
  {
    message: '\'/\' : Zero divided by zero during constant folding generated NaN',
    type: 'warning',
    lineNum: 447,
    linePos: 0
  },
  {
    message: '\'/\' : Zero divided by zero during constant folding generated NaN',
    type: 'warning',
    lineNum: 447,
    linePos: 0
  },
  {
    message: '\'/\' : Zero divided by zero during constant folding generated NaN',
    type: 'warning',
    lineNum: 470,
    linePos: 0
  },
  {
    message: '\'/\' : Zero divided by zero during constant folding generated NaN',
    type: 'warning',
    lineNum: 470,
    linePos: 0
  },
  {
    message: '\'/\' : Zero divided by zero during constant folding generated NaN',
    type: 'warning',
    lineNum: 557,
    linePos: 0
  },
  {
    message: '\'/\' : Zero divided by zero during constant folding generated NaN',
    type: 'warning',
    lineNum: 557,
    linePos: 0
  },
  {
    message: '\'/\' : Zero divided by zero during constant folding generated NaN',
    type: 'warning',
    lineNum: 580,
    linePos: 0
  },
  {
    message: '\'/\' : Zero divided by zero during constant folding generated NaN',
    type: 'warning',
    lineNum: 580,
    linePos: 0
  },
  {
    message: '\'/\' : Zero divided by zero during constant folding generated NaN',
    type: 'warning',
    lineNum: 669,
    linePos: 0
  },
  {
    message: '\'/\' : Zero divided by zero during constant folding generated NaN',
    type: 'warning',
    lineNum: 669,
    linePos: 0
  },
  {
    message: '\'/\' : Zero divided by zero during constant folding generated NaN',
    type: 'warning',
    lineNum: 681,
    linePos: 0
  },
  {
    message: '\'/\' : Zero divided by zero during constant folding generated NaN',
    type: 'warning',
    lineNum: 681,
    linePos: 0
  },
  {
    message: '\'project_scale\' : no matching overloaded function found',
    type: 'error',
    lineNum: 967,
    linePos: 0
  },
  {
    message: '\'project_scale\' : no matching overloaded function found',
    type: 'error',
    lineNum: 994,
    linePos: 0
  }
];

function getFixtures() {
  return {
    ERROR_LOG,
    EXPECTED_MESSAGES
  };
}
