// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CompilerMessage} from '@luma.gl/core';
import {formatCompilerLog} from '@luma.gl/core/adapter-utils/format-compiler-log';
import {expect, it} from 'vitest';

const ERROR_LOG: CompilerMessage[] = [
  {
    type: 'warning',
    linePos: 0,
    lineNum: 264,
    message: "'/' : Zero divided by zero during constant folding generated NaN"
  },
  {
    type: 'warning',
    linePos: 0,
    lineNum: 264,
    message: "'/' : Zero divided by zero during constant folding generated NaN"
  },
  {
    type: 'warning',
    linePos: 0,
    lineNum: 294,
    message: "'/' : Divide by zero during constant folding"
  },
  {
    type: 'warning',
    linePos: 0,
    lineNum: 294,
    message: "'/' : Divide by zero during constant folding"
  },
  {
    type: 'warning',
    linePos: 0,
    lineNum: 344,
    message: "'/' : Zero divided by zero during constant folding generated NaN"
  },
  {
    type: 'warning',
    linePos: 0,
    lineNum: 344,
    message: "'/' : Zero divided by zero during constant folding generated NaN"
  },
  {
    type: 'warning',
    linePos: 0,
    lineNum: 447,
    message: "'/' : Zero divided by zero during constant folding generated NaN"
  },
  {
    type: 'warning',
    linePos: 0,
    lineNum: 447,
    message: "'/' : Zero divided by zero during constant folding generated NaN"
  },
  {
    type: 'warning',
    linePos: 0,
    lineNum: 470,
    message: "'/' : Zero divided by zero during constant folding generated NaN"
  },
  {
    type: 'warning',
    linePos: 0,
    lineNum: 470,
    message: "'/' : Zero divided by zero during constant folding generated NaN"
  },
  {
    type: 'warning',
    linePos: 0,
    lineNum: 557,
    message: "'/' : Zero divided by zero during constant folding generated NaN"
  },
  {
    type: 'warning',
    linePos: 0,
    lineNum: 557,
    message: "'/' : Zero divided by zero during constant folding generated NaN"
  },
  {
    type: 'warning',
    linePos: 0,
    lineNum: 580,
    message: "'/' : Zero divided by zero during constant folding generated NaN"
  },
  {
    type: 'warning',
    linePos: 0,
    lineNum: 580,
    message: "'/' : Zero divided by zero during constant folding generated NaN"
  },
  {
    type: 'warning',
    linePos: 0,
    lineNum: 669,
    message: "'/' : Zero divided by zero during constant folding generated NaN"
  },
  {
    type: 'warning',
    linePos: 0,
    lineNum: 669,
    message: "'/' : Zero divided by zero during constant folding generated NaN"
  },
  {
    type: 'warning',
    linePos: 0,
    lineNum: 681,
    message: "'/' : Zero divided by zero during constant folding generated NaN"
  },
  {
    type: 'warning',
    linePos: 0,
    lineNum: 681,
    message: "'/' : Zero divided by zero during constant folding generated NaN"
  },
  {
    type: 'error',
    linePos: 0,
    lineNum: 967,
    message: "'project_scale' : no matching overloaded function found"
  },
  {
    type: 'error',
    linePos: 0,
    lineNum: 994,
    message: "'project_scale' : no matching overloaded function found"
  }
];

const SHADER_SOURCE = `
#define AMD_GPU

// Defines for shader portability
#if (__VERSION__ > 120)
# define attribute in
# define varying out
#endif // __VERSION

float plainText = 1.0;
<tag attr="quoted">

void main() {
  gl_Position = vec4(plainText);
}
`;

export function registerFormatCompilerLogTests(): void {
  it('formatCompilerLog', () => {
    const formatted = formatCompilerLog(ERROR_LOG, SHADER_SOURCE);
    expect(
      formatted.includes("ERROR: 'project_scale' : no matching overloaded function found"),
      'default formatting includes error messages'
    ).toBe(true);
    expect(!formatted.includes(' 264:'), 'default formatting omits source lines').toBe(true);

    const withIssues = formatCompilerLog(
      [{type: 'error', linePos: 2, lineNum: 10, message: 'broken shader'}],
      SHADER_SOURCE,
      {showSourceCode: 'issues'}
    );
    expect(withIssues.includes('  10:'), 'issues view includes numbered source lines').toBe(true);
    expect(withIssues.includes('^^^'), 'issues view includes a position indicator').toBe(true);

    const withAllSource = formatCompilerLog(
      [{type: 'warning', linePos: 0, lineNum: 4, message: 'watch this'}],
      SHADER_SOURCE,
      {showSourceCode: 'all'}
    );
    expect(
      withAllSource.includes('#define AMD_GPU'),
      'all view includes the full source body'
    ).toBe(true);
    expect(withAllSource.includes('WARNING: watch this'), 'all view includes inline warnings').toBe(
      true
    );

    const htmlFormatted = formatCompilerLog(
      [{type: 'error', linePos: 1, lineNum: 6, message: 'html error'}],
      SHADER_SOURCE,
      {showSourceCode: 'all', html: true}
    );
    expect(
      htmlFormatted.includes('luma-compiler-log-error'),
      'html formatting renders wrapped messages'
    ).toBe(true);
    expect(
      htmlFormatted.includes('style="color:red;"'),
      'html formatting applies the error color'
    ).toBe(true);

    const trailingMessage = formatCompilerLog(
      [{type: 'error', linePos: 0, lineNum: 999, message: 'late error'}],
      'void main() {}',
      {showSourceCode: 'all'}
    );
    expect(
      trailingMessage.includes('ERROR: late error'),
      'messages after the source are still reported'
    ).toBe(true);
  });
}
