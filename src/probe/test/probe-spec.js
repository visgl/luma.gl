/* eslint-disable max-statements */
import Probe from '../src/probe';
import test from 'tape';

function getInstance() {
  return new Probe({
    isEnabled: true,
    isPrintEnabled: false,
    ignoreEnvironment: true
  });
}

test('Probe#probe', assert => {
  const probe = getInstance();

  probe.probe('test');

  const log = probe.getLog();
  const row = log[0];

  assert.equals(log.length, 1,
    'Expected row logged');
  assert.equal(row.name, 'test',
    'Name logged');
  assert.equal(typeof row.total, 'number', 'Start is set');
  assert.equal(typeof row.delta, 'number', 'Delta is set');

  assert.end();
});

test('Probe#probe - level methods', assert => {
  const probe = getInstance().setLevel(3);

  probe.probe('test0');
  probe.probe1('test1');
  probe.probe2('test2');
  probe.probe3('test3');

  const log = probe.getLog();

  assert.equals(log.length, 4,
    'Expected rows logged');
  assert.deepEqual(
    log.map(row => row.level),
    [1, 1, 2, 3],
    'Levels match expected');
  assert.deepEqual(
    log.map(row => row.name),
    ['test0', 'test1', 'test2', 'test3'],
    'Names match expected');

  for (const row of log) {
    assert.equal(typeof row.total, 'number', 'Start is set');
    assert.equal(typeof row.delta, 'number', 'Delta is set');
  }

  assert.end();
});

test('Probe#probe - level methods, lower level set', assert => {
  const probe = getInstance().setLevel(1);

  probe.probe('test0');
  probe.probe1('test1');
  probe.probe2('test2');
  probe.probe3('test3');

  const log = probe.getLog();

  assert.equals(log.length, 2,
    'Expected rows logged');
  assert.deepEqual(
    log.map(row => row.level),
    [1, 1],
    'Levels match expected');

  assert.end();
});

test('Probe#probe - disabled', assert => {
  const probe = getInstance().disable();

  probe.probe('test0');
  probe.probe1('test1');
  probe.probe2('test2');
  probe.probe3('test3');

  const log = probe.getLog();

  assert.equals(log.length, 0,
    'No rows logged');

  assert.end();
});

test('Probe#sample - level methods', assert => {
  const probe = getInstance().setLevel(3);

  probe.sample('test0');
  probe.sample1('test1');
  probe.sample2('test2');
  probe.sample3('test3');

  const log = probe.getLog();

  assert.equals(log.length, 4,
    'Expected rows logged');
  assert.deepEqual(
    log.map(row => row.level),
    [1, 1, 2, 3],
    'Levels match expected');
  assert.deepEqual(
    log.map(row => row.name),
    ['test0', 'test1', 'test2', 'test3'],
    'Names match expected');

  for (const row of log) {
    assert.equal(typeof row.total, 'number', 'Start is set');
    assert.equal(typeof row.delta, 'number', 'Delta is set');
    assert.equal(typeof row.averageTime, 'number', 'Avg time is set');
  }

  assert.end();
});

test('Probe#fps - level methods', assert => {
  const probe = getInstance().setLevel(3);
  const count = 3;

  for (let i = 0; i < count; i++) {
    probe.fps('test0', {count});
    probe.fps1('test1', {count});
    probe.fps2('test2', {count});
    probe.fps3('test3', {count});
  }

  const log = probe.getLog();

  assert.equals(log.length, 4,
    'Expected rows logged');
  assert.deepEqual(
    log.map(row => row.level),
    [1, 1, 2, 3],
    'Levels match expected');
  assert.deepEqual(
    log.map(row => row.name),
    ['test0', 'test1', 'test2', 'test3'],
    'Names match expected');

  for (const row of log) {
    assert.equal(typeof row.total, 'number', 'Start is set');
    assert.equal(typeof row.delta, 'number', 'Delta is set');
    assert.equal(typeof row.fps, 'number', 'FPS is set');
  }

  assert.end();
});

test('Probe#fps - log once per count', assert => {
  const probe = getInstance().setLevel(3);
  const count = 3;
  const cycles = 4;

  for (let i = 0; i < count * cycles; i++) {
    probe.fps('test', {count});
  }

  const log = probe.getLog();

  assert.equals(log.length, cycles,
    'Expected rows logged');

  for (const row of log) {
    assert.equal(typeof row.total, 'number', 'Start is set');
    assert.equal(typeof row.delta, 'number', 'Delta is set');
    assert.equal(typeof row.fps, 'number', 'FPS is set');
  }

  assert.end();
});

test('Probe#disable / Probe#enable', assert => {
  const probe = getInstance();

  assert.strictEqual(probe.isEnabled(), true,
    'isEnabled matches expected');

  probe.disable();
  probe.probe('test_disabled');

  assert.strictEqual(probe.isEnabled(), false,
    'isEnabled matches expected');
  assert.strictEqual(probe.getLog().length, 0,
    'No row logged');

  probe.enable();
  probe.probe('test_enabled');

  assert.strictEqual(probe.isEnabled(), true,
    'isEnabled matches expected');
  assert.strictEqual(probe.getLog().length, 1,
    'Row logged');
  assert.strictEqual(probe.getLog()[0].name, 'test_enabled',
    'Row name matches expected');

  assert.end();
});

test('Probe#configure', assert => {
  const probe = getInstance()
    .configure({
      level: 2,
      foo: 'bar'
    });

  assert.strictEqual(probe.getOption('level'), 2,
    'Set known option');
  assert.strictEqual(probe.getOption('foo'), 'bar',
    'Set unknown option');

  assert.end();
});
