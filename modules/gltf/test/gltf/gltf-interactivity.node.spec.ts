// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {GLTFInteractivity} from '../../src/gltf/gltf-interactivity';

describe('GLTFInteractivity', () => {
  it('executes start event, arithmetic, and variable/set', () => {
    const extension = {
      graphs: [
        {
          types: [{signature: 'float'}],
          variables: [{type: 0, value: [1]}],
          declarations: [
            {op: 'event/onStart'},
            {op: 'variable/set'},
            {op: 'math/add'},
            {op: 'variable/get'}
          ],
          nodes: [
            {declaration: 0, flows: {out: {node: 1}}},
            {
              declaration: 1,
              configuration: {variables: {value: [0]}},
              values: {'0': {node: 2, socket: 'value'}}
            },
            {declaration: 2, values: {a: {node: 3, socket: 'value'}, b: {type: 0, value: [2]}}},
            {declaration: 3, configuration: {variable: {value: [0]}}}
          ]
        }
      ]
    };
    const runtime = new GLTFInteractivity(extension);
    runtime.start();
    expect(runtime.variables[0]).toEqual([3]);
    runtime.start();
    expect(runtime.variables[0]).toEqual([3]);
  });

  it('ticks with the specified first-tick delta', () => {
    const extension = {
      graphs: [
        {
          declarations: [{op: 'event/onTick'}, {op: 'variable/set'}],
          types: [{signature: 'float'}],
          variables: [{type: 0, value: [0]}],
          nodes: [
            {declaration: 0, flows: {out: {node: 1}}},
            {
              declaration: 1,
              configuration: {variables: {value: [0]}},
              values: {'0': {node: 0, socket: 'timeSinceStart'}}
            }
          ]
        }
      ]
    };
    const runtime = new GLTFInteractivity(extension);
    runtime.tick(10);
    expect(runtime.variables[0]).toEqual([0]);
    runtime.tick(12.5);
    expect(runtime.variables[0]).toEqual([2.5]);
  });

  it('rejects unsupported operations before execution', () => {
    expect(
      () =>
        new GLTFInteractivity({
          graphs: [
            {
              declarations: [{op: 'animation/start'}],
              nodes: [{declaration: 0}]
            }
          ]
        })
    ).toThrow(/unsupported operation/);
  });

  it('limits cyclic flow execution', () => {
    const runtime = new GLTFInteractivity(
      {
        graphs: [
          {
            declarations: [{op: 'event/onStart'}, {op: 'flow/sequence'}],
            nodes: [
              {declaration: 0, flows: {out: {node: 1}}},
              {declaration: 1, flows: {next: {node: 1}}}
            ]
          }
        ]
      },
      {maxSteps: 5}
    );
    expect(() => runtime.start()).toThrow(/step limit/);
  });

  it('evaluates boolean and integer AND without short-circuiting inputs', () => {
    const runtime = new GLTFInteractivity({
      graphs: [
        {
          declarations: [{op: 'math/and'}, {op: 'variable/get'}],
          nodes: [
            {declaration: 0, values: {a: {value: [true]}, b: {value: [false]}}},
            {declaration: 0, values: {a: {value: [6]}, b: {value: [3]}}},
            {declaration: 0, values: {a: {value: [false]}, b: {node: 3, socket: 'value'}}},
            {declaration: 1, configuration: {variable: {value: [0]}}}
          ]
        }
      ]
    });
    expect(runtime.evaluate(0)).toEqual([false]);
    expect(runtime.evaluate(1)).toEqual([2]);
    expect(() => runtime.evaluate(2)).toThrow(/invalid variable index/);
  });

  it('formats diagnostics and sends custom events before continuing flow', () => {
    const messages: string[] = [];
    const runtime = new GLTFInteractivity(
      {
        graphs: [
          {
            events: [{id: 'test/onSuccess', values: {passed: {type: 0}}}],
            types: [{signature: 'bool'}],
            declarations: [{op: 'event/onStart'}, {op: 'debug/log'}, {op: 'event/send'}],
            nodes: [
              {declaration: 0, flows: {out: {node: 1}}},
              {
                declaration: 1,
                configuration: {
                  message: {value: ['Result {{ok}}: {value}']},
                  severity: {value: [2]}
                },
                values: {value: {value: [true]}},
                flows: {out: {node: 2}}
              },
              {
                declaration: 2,
                configuration: {event: {value: [0]}},
                values: {passed: {value: [true]}}
              }
            ]
          }
        ]
      },
      {
        onLog: (message, severity) => messages.push(`${severity}: ${message}`),
        onEvent: (eventId, values) => messages.push(`${eventId}: ${JSON.stringify(values)}`)
      }
    );
    runtime.start();
    expect(messages).toEqual(['2: Result {ok}: [true]', 'test/onSuccess: {"passed":[true]}']);
  });

  it('rejects invalid custom event indices before graph execution', () => {
    expect(
      () =>
        new GLTFInteractivity({
          graphs: [
            {
              declarations: [{op: 'event/send'}],
              nodes: [{declaration: 0, configuration: {event: {value: [-1]}}}]
            }
          ]
        })
    ).toThrow(/invalid custom event index/);
  });
});
