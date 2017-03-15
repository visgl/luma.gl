import test from 'tape-catch';
import {addEvents} from '../../index.js';

class MockDomElement {
  _listenersByType = {}

  addEventListener(type, listener) {
    this._listenersByType[type] = listener;
  }
}

test('Experimental#addEvents with no user handlers', t => {
  const element = new MockDomElement();

  addEvents(element, {});
  t.pass('addEvents did not throw');

  t.end();
});
