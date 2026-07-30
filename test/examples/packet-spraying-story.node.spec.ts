// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {SWITCH_POSITIONS} from '../../examples/showcase/packet-spraying/network';
import {
  getNetworkStoryChapter,
  getWrappedStoryChapterIndex,
  GUIDED_STORY_SWITCH_INDEX,
  NETWORK_STORY_CHAPTERS
} from '../../examples/showcase/packet-spraying/story';

test('packet-spraying guided tour tells the complete MRC recovery story', testCase => {
  testCase.deepEqual(
    NETWORK_STORY_CHAPTERS.map(chapter => chapter.id),
    ['conversations', 'packet-spraying', 'congestion', 'failure', 'recovery'],
    'chapters progress from independent conversations through confirmed recovery'
  );
  testCase.deepEqual(
    NETWORK_STORY_CHAPTERS.map(chapter => chapter.networkState),
    ['healthy', 'healthy', 'congested', 'failed', 'recovering'],
    'each chapter requests the corresponding switch state'
  );
  testCase.ok(
    NETWORK_STORY_CHAPTERS.every(chapter => chapter.duration >= 7),
    'each chapter leaves enough time to observe the network behavior'
  );
  testCase.ok(
    SWITCH_POSITIONS[GUIDED_STORY_SWITCH_INDEX],
    'the scripted story targets a real physical spine switch'
  );
  testCase.end();
});

test('packet-spraying guided tour wraps forward and backward between chapters', testCase => {
  testCase.equal(getWrappedStoryChapterIndex(-1), NETWORK_STORY_CHAPTERS.length - 1);
  testCase.equal(getWrappedStoryChapterIndex(NETWORK_STORY_CHAPTERS.length), 0);
  testCase.equal(getNetworkStoryChapter(-1).id, 'recovery');
  testCase.equal(getNetworkStoryChapter(NETWORK_STORY_CHAPTERS.length).id, 'conversations');
  testCase.end();
});
