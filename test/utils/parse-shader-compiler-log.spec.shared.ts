import {expect, test} from 'vitest';
import { parseShaderCompilerLog } from '@luma.gl/webgl/adapter/helpers/parse-shader-compiler-log';
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
const EXPECTED_MESSAGES = [{
  message: "'/' : Zero divided by zero during constant folding generated NaN",
  type: 'warning',
  lineNum: 264,
  linePos: 0
}, {
  message: "'/' : Zero divided by zero during constant folding generated NaN",
  type: 'warning',
  lineNum: 264,
  linePos: 0
}, {
  message: "'/' : Divide by zero during constant folding",
  type: 'warning',
  lineNum: 294,
  linePos: 0
}, {
  message: "'/' : Divide by zero during constant folding",
  type: 'warning',
  lineNum: 294,
  linePos: 0
}, {
  message: "'/' : Zero divided by zero during constant folding generated NaN",
  type: 'warning',
  lineNum: 344,
  linePos: 0
}, {
  message: "'/' : Zero divided by zero during constant folding generated NaN",
  type: 'warning',
  lineNum: 344,
  linePos: 0
}, {
  message: "'/' : Zero divided by zero during constant folding generated NaN",
  type: 'warning',
  lineNum: 447,
  linePos: 0
}, {
  message: "'/' : Zero divided by zero during constant folding generated NaN",
  type: 'warning',
  lineNum: 447,
  linePos: 0
}, {
  message: "'/' : Zero divided by zero during constant folding generated NaN",
  type: 'warning',
  lineNum: 470,
  linePos: 0
}, {
  message: "'/' : Zero divided by zero during constant folding generated NaN",
  type: 'warning',
  lineNum: 470,
  linePos: 0
}, {
  message: "'/' : Zero divided by zero during constant folding generated NaN",
  type: 'warning',
  lineNum: 557,
  linePos: 0
}, {
  message: "'/' : Zero divided by zero during constant folding generated NaN",
  type: 'warning',
  lineNum: 557,
  linePos: 0
}, {
  message: "'/' : Zero divided by zero during constant folding generated NaN",
  type: 'warning',
  lineNum: 580,
  linePos: 0
}, {
  message: "'/' : Zero divided by zero during constant folding generated NaN",
  type: 'warning',
  lineNum: 580,
  linePos: 0
}, {
  message: "'/' : Zero divided by zero during constant folding generated NaN",
  type: 'warning',
  lineNum: 669,
  linePos: 0
}, {
  message: "'/' : Zero divided by zero during constant folding generated NaN",
  type: 'warning',
  lineNum: 669,
  linePos: 0
}, {
  message: "'/' : Zero divided by zero during constant folding generated NaN",
  type: 'warning',
  lineNum: 681,
  linePos: 0
}, {
  message: "'/' : Zero divided by zero during constant folding generated NaN",
  type: 'warning',
  lineNum: 681,
  linePos: 0
}, {
  message: "'project_scale' : no matching overloaded function found",
  type: 'error',
  lineNum: 967,
  linePos: 0
}, {
  message: "'project_scale' : no matching overloaded function found",
  type: 'error',
  lineNum: 994,
  linePos: 0
}];
export function registerParseShaderCompilerLogTests(): void {
  test('parseShaderCompilerLog', () => {
    const messages = parseShaderCompilerLog(ERROR_LOG);
    expect(messages, 'parseShaderCompilerLog generated correct messages').toEqual(EXPECTED_MESSAGES);
    expect(parseShaderCompilerLog('ERROR: unsupported shader version'), 'two-segment messages are parsed without line info').toEqual([{
      message: 'unsupported shader version',
      type: 'error',
      lineNum: 0,
      linePos: 0
    }]);
    expect(parseShaderCompilerLog('INFO::invalid'), 'malformed segmented messages fall back to line 0').toEqual([{
      message: ':invalid',
      type: 'info',
      lineNum: 0,
      linePos: 0
    }]);
    expect(parseShaderCompilerLog('\nWARNING: 2:NaN: malformed position'), 'blank lines are ignored and NaN line numbers are normalized').toEqual([{
      message: 'malformed position',
      type: 'warning',
      lineNum: 0,
      linePos: 2
    }]);
  });
}
