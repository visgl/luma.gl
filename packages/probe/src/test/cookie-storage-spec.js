/* eslint-disable max-statements */
import CookieStorage from '../cookie-storage';
import test from 'tape';

const KEY = 'test';

test('CookieStorage#constructor', assert => {
  const storage = new CookieStorage();
  assert.ok(storage instanceof CookieStorage, 'CookieStorage construction successful');
  assert.end();
});

test('CookieStorage#set and get', assert => {
  const storage = new CookieStorage();
  assert.ok(storage instanceof CookieStorage, 'CookieStorage construction successful');

  storage.set(KEY, 'works');
  const value = storage.get(KEY);
  assert.equal(value, 'works', 'Set and then get value successful');
  assert.end();
});
