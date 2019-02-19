import test from 'tape-catch';
import {TestRenderer} from '@luma.gl/test-utils';

import EXAMPLE_TEST_CASES from './example-test-cases';

const testCaseCount = EXAMPLE_TEST_CASES.length;

test('RenderTest', t => {
  // tape's default timeout is 500ms
  t.timeoutAfter(testCaseCount * 2000);

  new TestRenderer({width: 600, height: 400})
    .add(EXAMPLE_TEST_CASES)
    .run({
      onTestStart: testCase => t.comment(testCase.name),
      onTestPass: (testCase, result) => t.pass(`match: ${result.matchPercentage}`),
      onTestFail: (testCase, result) => t.fail(result.error || `match: ${result.matchPercentage}`),

      imageDiffOptions: {
        // uncomment to save screenshot to disk
        saveOnFail: true,
        saveAs: '[name].png'
      }
    })
    .then(t.end);
});
