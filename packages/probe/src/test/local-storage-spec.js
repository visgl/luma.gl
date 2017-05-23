/* eslint-disable max-statements */
import LocalStorage from '../local-storage';
import {isBrowser} from '../env';
import test from 'tape';

const KEY = 'test';

test('LocalStorage#constructor', assert => {
  if (isBrowser) {
    const storage = new LocalStorage();
    assert.ok(storage instanceof LocalStorage, 'LocalStorage construction successful');
  } else {
    assert.throws(
      () => new LocalStorage(),
      'LocalStorage constructor throws under node'
    );
  }
  assert.end();
});

test('LocalStorage#set and get', assert => {
  if (isBrowser) {
    const storage = new LocalStorage();
    assert.ok(storage instanceof LocalStorage, 'LocalStorage construction successful');

    storage.set(KEY, 'works');
    const value = storage.get(KEY);
    assert.equal(value, 'works', 'Set and then get value successful');
  } else {
    assert.comment('LocalStorage: Skipping tests under node');
  }
  assert.end();
});
