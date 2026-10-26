// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  AnimationClip,
  AnimationMixer,
  AnimationTrack,
  GroupNode,
  MixerAnimationClip,
  ScenegraphAnimator,
  makeNodeAnimationBinding,
  makePropertyAnimationBinding,
  getTextureTransformDeltaMatrix
} from '@luma.gl/engine';

it('plays and switches programmatic scene clips without an asset adapter', () => {
  const node = new GroupNode({id: 'moving-node'});
  const mixer = new AnimationMixer();
  const binding = makeNodeAnimationBinding(node, 'translation', {id: 'moving.translation'});
  const clips = [1, 2].map(
    distance =>
      new MixerAnimationClip(
        new AnimationClip({
          name: `travel-${distance}`,
          tracks: [
            new AnimationTrack({
              times: [0, 2],
              values: [
                [0, 0, 0],
                [distance * 2, 0, 0]
              ],
              binding
            })
          ]
        }),
        mixer
      )
  );
  let updates = 0;
  const animator = new ScenegraphAnimator(clips, mixer, {
    autoplay: 'first',
    onUpdate: () => {
      updates++;
    }
  });
  animator.update(0.5);
  expect(node.position[0]).toBeCloseTo(0.5);
  expect(node.matrix[12]).toBeCloseTo(0.5);
  animator.selectClip('travel-2');
  animator.update(0.5);
  expect(node.position[0]).toBeCloseTo(1);
  expect(clips[0].playing).toBe(false);
  expect(updates).toBe(2);
});

it('binds camera and light state by reference and preserves unanimated components', () => {
  const projection = {yfov: 1};
  const light = {color: [0.2, 0.4, 0.6]};
  let updates = 0;
  const fieldOfView = makePropertyAnimationBinding(projection, 'yfov');
  const green = makePropertyAnimationBinding(light, 'color', {
    component: 1,
    onChange: () => {
      updates++;
    }
  });
  fieldOfView.setValue([0.7]);
  green.setValue([0.9]);
  expect(projection.yfov).toBe(0.7);
  expect(light.color).toEqual([0.2, 0.9, 0.6]);
  expect(green.getValue?.()).toEqual([0.9]);
  expect(updates).toBe(1);
});

it('preserves authored texture transforms when the animated transform is unchanged', () => {
  const transform = {
    offset: [0.2, 0.4] as [number, number],
    rotation: 0.8,
    scale: [2, 3] as [number, number]
  };
  const matrix = getTextureTransformDeltaMatrix(transform, transform);
  for (let index = 0; index < 9; index++)
    expect(matrix[index]).toBeCloseTo(index % 4 === 0 ? 1 : 0);
});
