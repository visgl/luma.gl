import {describe, expect, test} from 'vitest';

import {scorePageTargetCandidate} from '../../dev-modules/devtools-extensions/playwright/find-target-page.mjs';

describe('scorePageTargetCandidate', () => {
  test('prefers exact URL matches', () => {
    const exactScore = scorePageTargetCandidate(
      {title: 'Persistence', url: 'http://127.0.0.1:3000/examples/showcase/persistence'},
      'http://127.0.0.1:3000/examples/showcase/persistence'
    );
    const partialScore = scorePageTargetCandidate(
      {title: 'Persistence', url: 'http://127.0.0.1:3000/examples/showcase/persistence'},
      'persistence'
    );

    expect(exactScore).toBeGreaterThan(partialScore);
  });

  test('matches title substrings when URL does not match', () => {
    const score = scorePageTargetCandidate(
      {title: 'Persistence Example', url: 'about:blank'},
      'persistence'
    );

    expect(score).toBeGreaterThan(0);
  });
});
