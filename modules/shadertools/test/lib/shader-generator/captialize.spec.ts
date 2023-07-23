import test from 'tape-promise/tape';
import {capitalize} from '@luma.gl/shadertools';

test('shadertools#capitalize', t => {
  t.equal(capitalize('hello world'), 'Hello world', 'should capitalize string');
  t.equal(capitalize('Hello world'), 'Hello world', 'should return already capitalized string');
  t.equal(capitalize('1'), '1', 'should ignore non-alphabetic string');
  t.end();
});
