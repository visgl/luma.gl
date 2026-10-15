// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GLTFInteractivity} from './gltf-interactivity';

describe('GLTFInteractivity', () => {
  it('executes start event, arithmetic, and variable/set', () => {
    const extension = {graphs: [{
      types: [{signature: 'float'}],
      variables: [{type: 0, value: [1]}],
      declarations: [
        {op: 'event/onStart'}, {op: 'variable/set'}, {op: 'math/add'}, {op: 'variable/get'}
      ],
      nodes: [
        {declaration: 0, flows: {out: {node: 1}}},
        {declaration: 1, configuration: {variables: {value: [0]}},
          values: {'0': {node: 2, socket: 'value'}}},
        {declaration: 2, values: {a: {node: 3, socket: 'value'}, b: {type: 0, value: [2]}}},
        {declaration: 3, configuration: {variable: {value: [0]}}}
      ]
    }]};
    const runtime = new GLTFInteractivity(extension);
    runtime.start();
    expect(runtime.variables[0]).toEqual([3]);
    runtime.start();
    expect(runtime.variables[0]).toEqual([3]);
  });

  it('ticks with the specified first-tick delta', () => {
    const extension = {graphs: [{
      declarations: [{op: 'event/onTick'}, {op: 'variable/set'}],
      types: [{signature: 'float'}],
      variables: [{type: 0, value: [0]}],
      nodes: [
        {declaration: 0, flows: {out: {node: 1}}},
        {declaration: 1, configuration: {variables: {value: [0]}},
          values: {'0': {node: 0, socket: 'timeSinceStart'}}}
      ]
    }]};
    const runtime = new GLTFInteractivity(extension);
    runtime.tick(10);
    expect(runtime.variables[0]).toEqual([0]);
    runtime.tick(12.5);
    expect(runtime.variables[0]).toEqual([2.5]);
  });

  it('rejects unsupported operations before execution', () => {
    expect(() => new GLTFInteractivity({graphs: [{
      declarations: [{op: 'animation/start'}], nodes: [{declaration: 0}]
    }]})).toThrow(/unsupported operation/);
  });

  it('limits cyclic flow execution', () => {
    const runtime = new GLTFInteractivity({graphs: [{
      declarations: [{op: 'event/onStart'}, {op: 'flow/sequence'}],
      nodes: [
        {declaration: 0, flows: {out: {node: 1}}},
        {declaration: 1, flows: {next: {node: 1}}}
      ]
    }]}, {maxSteps: 5});
    expect(() => runtime.start()).toThrow(/step limit/);
  });
});
