// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {AnimationBinding} from './animation-track';
import type {GroupNode} from '../scenegraph/group-node';
import {setMorphWeights} from '../scenegraph/controllers/morph-controller';

export type NodeAnimationProperty = 'translation' | 'rotation' | 'scale' | 'weights' | 'visibility';

/** Bind a property once to a node reference; playback does not resolve asset IDs. */
export function makeNodeAnimationBinding(
  node: GroupNode,
  property: NodeAnimationProperty,
  options: {id?: string; onVisibilityChange?: () => void} = {}
): AnimationBinding {
  return {
    id: options.id,
    getValue: () => {
      switch (property) {
        case 'translation':
          return Array.from(node.position);
        case 'rotation':
          return Array.from(node.rotation);
        case 'scale':
          return Array.from(node.scale);
        case 'weights':
          return Array.from((node.userData['morphWeights'] as readonly number[] | undefined) ?? []);
        case 'visibility':
          return [node.display ? 1 : 0];
      }
    },
    setValue: value => {
      switch (property) {
        case 'translation':
          node.setPosition(value).updateMatrix();
          break;
        case 'rotation':
          node.setRotation(value).updateMatrix();
          break;
        case 'scale':
          node.setScale(value).updateMatrix();
          break;
        case 'weights':
          setMorphWeights(node, value);
          break;
        case 'visibility':
          node.setProps({display: value[0] !== 0});
          options.onVisibilityChange?.();
          break;
      }
    }
  };
}
