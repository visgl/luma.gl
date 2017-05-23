/* eslint-disable max-statements */
import {formatTime, leftPad} from '../formatters';
import test from 'tape';

test('formatTime', assert => {
  assert.ok(formatTime(300), 'formatTime completed successfully');
  assert.end();
});

test('leftPad', assert => {
  assert.ok(leftPad('abc'), 'leftPad completed successfully');
  assert.end();
});
