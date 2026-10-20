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

  it('fills omitted event inputs with fresh declared and type-default values', () => {
    const notifications: Record<string, unknown[]>[] = [];
    const extension: ConstructorParameters<typeof GLTFInteractivity>[0] = {
      graphs: [
        {
          types: [
            {signature: 'bool'},
            {signature: 'int'},
            {signature: 'float3'},
            {signature: 'ref'}
          ],
          events: [
            {
              id: 'test/defaults',
              values: {
                passed: {type: 0, value: [true]},
                count: {type: 1, value: [3]},
                direction: {type: 2},
                reference: {type: 3}
              }
            }
          ],
          declarations: [{op: 'event/onStart'}, {op: 'event/send'}],
          nodes: [
            {declaration: 0, flows: {out: {node: 1}}},
            {declaration: 1, configuration: {event: {value: [0]}}, flows: {out: {node: 2}}},
            {
              declaration: 1,
              configuration: {event: {value: [0]}},
              values: {passed: {value: [false]}, count: {value: [11]}}
            }
          ]
        }
      ]
    };
    new GLTFInteractivity(extension, {
      onEvent: (_eventId, values) => notifications.push(values)
    }).start();
    expect(notifications).toEqual([
      {passed: [true], count: [3], direction: [NaN, NaN, NaN], reference: [null]},
      {passed: [false], count: [11], direction: [NaN, NaN, NaN], reference: [null]}
    ]);
    notifications[0].passed[0] = false;
    expect(extension.graphs[0].events?.[0].values?.['passed'].value).toEqual([true]);
  });

  it('uses a declared type default for an explicit input without a value', () => {
    const runtime = new GLTFInteractivity({
      graphs: [
        {
          types: [{signature: 'bool'}],
          declarations: [{op: 'math/and'}],
          nodes: [{declaration: 0, values: {a: {type: 0}, b: {value: [true]}}}]
        }
      ]
    });
    expect(runtime.evaluate(0)).toEqual([false]);
  });
});

it.each([
  {cases: undefined},
  {cases: [0.5, 5]},
  {cases: [-2147483649, 5]},
  {cases: [2147483648, 5]}
])('routes flow/switch to default with omitted or invalid cases: $cases', ({cases}) => {
  const runtime = new GLTFInteractivity({
    graphs: [
      {
        types: [{signature: 'int'}],
        variables: [{type: 0, value: [0]}],
        declarations: [{op: 'event/onStart'}, {op: 'flow/switch'}, {op: 'variable/set'}],
        nodes: [
          {declaration: 0, flows: {out: {node: 1}}},
          {
            declaration: 1,
            configuration: cases ? {cases: {value: cases}} : undefined,
            values: {selection: {type: 0, value: [5]}},
            flows: {default: {node: 2}}
          },
          {
            declaration: 2,
            configuration: {variables: {value: [0]}},
            values: {'0': {type: 0, value: [42]}}
          }
        ]
      }
    ]
  });
  runtime.start();
  expect(runtime.variables[0]).toEqual([42]);
});

it('uses the math/switch default input when the cases configuration is omitted', () => {
  const runtime = new GLTFInteractivity({
    graphs: [
      {
        types: [{signature: 'int'}],
        variables: [{type: 0, value: [0]}],
        declarations: [{op: 'event/onStart'}, {op: 'variable/set'}, {op: 'math/switch'}],
        nodes: [
          {declaration: 0, flows: {out: {node: 1}}},
          {
            declaration: 1,
            configuration: {variables: {value: [0]}},
            values: {'0': {node: 2, socket: 'value'}}
          },
          {
            declaration: 2,
            values: {selection: {type: 0, value: [5]}, default: {type: 0, value: [42]}}
          }
        ]
      }
    ]
  });
  runtime.start();
  expect(runtime.variables[0]).toEqual([42]);
});

it('dispatches selection only to the selected source node and advances authored delays on ticks', () => {
  const writes: {pointer: string; value: unknown[]}[] = [];
  const runtime = new GLTFInteractivity(
    {
      graphs: [
        {
          types: [{signature: 'float4'}, {signature: 'ref'}, {signature: 'float'}],
          declarations: [
            {op: 'event/onSelect', extension: 'KHR_node_selectability'},
            {op: 'pointer/set'},
            {op: 'flow/setDelay'}
          ],
          nodes: [
            {declaration: 0, configuration: {nodeIndex: {value: [5]}}, flows: {out: {node: 2}}},
            {declaration: 0, configuration: {nodeIndex: {value: [10]}}, flows: {out: {node: 4}}},
            {
              declaration: 1,
              configuration: {
                pointer: {value: ['/materials/{material}/pbrMetallicRoughness/baseColorFactor']}
              },
              values: {
                material: {type: 1, value: ['/materials/3']},
                value: {type: 0, value: [1, 0, 0, 1]}
              },
              flows: {out: {node: 3}}
            },
            {declaration: 2, values: {duration: {type: 2, value: [1]}}, flows: {done: {node: 4}}},
            {
              declaration: 1,
              configuration: {
                pointer: {value: ['/materials/4/pbrMetallicRoughness/baseColorFactor']}
              },
              values: {value: {type: 0, value: [0, 1, 0, 1]}}
            }
          ]
        }
      ]
    },
    {
      properties: {
        get: () => undefined,
        set: (pointer, value) => {
          writes.push({pointer, value});
          return true;
        }
      }
    }
  );
  runtime.tick(10);
  runtime.selectNode(99);
  expect(writes).toHaveLength(0);
  runtime.selectNode(5);
  expect(writes).toEqual([
    {pointer: '/materials/3/pbrMetallicRoughness/baseColorFactor', value: [1, 0, 0, 1]}
  ]);
  runtime.tick(10.99);
  expect(writes).toHaveLength(1);
  runtime.tick(11);
  expect(writes[1]).toEqual({
    pointer: '/materials/4/pbrMetallicRoughness/baseColorFactor',
    value: [0, 1, 0, 1]
  });
  runtime.tick(12);
  expect(writes).toHaveLength(2);
  runtime.selectNode(10);
  expect(writes).toHaveLength(3);
});

it('uses a tick clock for start delays and cancels pending activations', () => {
  const runtime = new GLTFInteractivity({
    graphs: [
      {
        types: [{signature: 'float'}],
        variables: [{type: 0, value: [0]}],
        declarations: [
          {op: 'event/onStart'},
          {op: 'flow/setDelay'},
          {op: 'variable/set'},
          {op: 'event/onSelect', extension: 'KHR_node_selectability'}
        ],
        nodes: [
          {declaration: 0, flows: {out: {node: 1}}},
          {declaration: 1, values: {duration: {type: 0, value: [1]}}, flows: {done: {node: 2}}},
          {
            declaration: 2,
            configuration: {variables: {value: [0]}},
            values: {'0': {type: 0, value: [42]}}
          },
          {
            declaration: 3,
            configuration: {nodeIndex: {value: [5]}},
            flows: {out: {node: 1, socket: 'cancel'}}
          }
        ]
      }
    ]
  });
  runtime.start();
  runtime.tick(100);
  expect(runtime.variables[0]).toEqual([0]);
  runtime.selectNode(5);
  runtime.tick(102);
  expect(runtime.variables[0]).toEqual([0]);
  expect(runtime.evaluate(1, 'lastDelay')).toEqual([null]);
});

it('evaluates the numeric conversions and clamp used by Traffic Light', () => {
  const runtime = new GLTFInteractivity({
    graphs: [
      {
        declarations: [{op: 'math/clamp'}, {op: 'type/intToFloat'}, {op: 'type/floatToInt'}],
        nodes: [
          {declaration: 0, values: {a: {value: [6]}, b: {value: [0]}, c: {value: [4]}}},
          {declaration: 1, values: {a: {value: [3, 16777217, 2147483647, -2147483648]}}},
          {declaration: 2, values: {a: {value: [-2.7, Infinity]}}}
        ]
      }
    ]
  });
  expect(runtime.evaluate(0)).toEqual([4]);
  expect(runtime.evaluate(1)).toEqual([3, 16777217, 2147483647, -2147483648]);
  expect(runtime.evaluate(2)).toEqual([-2, 0]);
});

it('activates elapsed delays in chronological order, once per activation', () => {
  const messages: string[] = [];
  const runtime = new GLTFInteractivity(
    {
      graphs: [
        {
          declarations: [
            {op: 'event/onStart'},
            {op: 'flow/sequence'},
            {op: 'flow/setDelay'},
            {op: 'debug/log'}
          ],
          nodes: [
            {declaration: 0, flows: {out: {node: 1}}},
            {declaration: 1, flows: {a: {node: 2}, b: {node: 3}}},
            {declaration: 2, values: {duration: {value: [2]}}, flows: {done: {node: 4}}},
            {declaration: 2, values: {duration: {value: [1]}}, flows: {done: {node: 5}}},
            {declaration: 3, configuration: {message: {value: ['later']}}},
            {declaration: 3, configuration: {message: {value: ['earlier']}}}
          ]
        }
      ]
    },
    {onLog: message => messages.push(message)}
  );
  runtime.tick(0);
  expect(runtime.evaluate(2, 'lastDelay')).not.toEqual(runtime.evaluate(3, 'lastDelay'));
  runtime.tick(3);
  expect(messages).toEqual(['earlier', 'later']);
  runtime.tick(4);
  expect(messages).toHaveLength(2);
});
