import {assert, log} from '@luma.gl/core';
import {Matrix4, Quaternion} from 'math.gl';

// TODO: import from loaders.gl?
export const ATTRIBUTE_TYPE_TO_COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

export const ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
};
//

function accessorToJsArray(accessor) {
  if (!accessor._animation) {
    const ArrayType = ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY[accessor.componentType];
    const components = ATTRIBUTE_TYPE_TO_COMPONENTS[accessor.type];
    const length = components * accessor.count;
    const {buffer, byteOffset} = accessor.bufferView.data;

    const array = new ArrayType(buffer, byteOffset + (accessor.byteOffset || 0), length);

    if (components === 1) {
      accessor._animation = Array.from(array);
    } else {
      // Slice array
      const slicedArray = [];
      for (let i = 0; i < array.length; i += components) {
        slicedArray.push(Array.from(array.slice(i, i + components)));
      }
      accessor._animation = slicedArray;
    }
  }

  return accessor._animation;
}

// TODO: share with GLTFInstantiator
const helperMatrix = new Matrix4();
function applyTranslationRotationScale(gltfNode, node) {
  node.matrix.identity();

  if (gltfNode.translation) {
    node.matrix.translate(gltfNode.translation);
  }

  if (gltfNode.rotation) {
    const rotationMatrix = helperMatrix.fromQuaternion(gltfNode.rotation);
    node.matrix.multiplyRight(rotationMatrix);
  }

  if (gltfNode.scale) {
    node.matrix.scale(gltfNode.scale);
  }
}

const quaternion = new Quaternion();
function linearInterpolate(target, path, start, stop, ratio) {
  if (path === 'rotation') {
    // SLERP when path is rotation
    quaternion.slerp({start, target: stop, ratio});
    for (let i = 0; i < quaternion.length; i++) {
      target[path][i] = quaternion[i];
    }
  } else {
    // regular interpolation
    for (let i = 0; i < start.length; i++) {
      target[path][i] = ratio * stop[i] + (1 - ratio) * start[i];
    }
  }
}

function cubicsplineInterpolate(target, path, {p0, outTangent0, inTangent1, p1, tDiff, ratio: t}) {
  // TODO: Quaternion might need normalization
  for (let i = 0; i < target[path].length; i++) {
    const m0 = outTangent0[i] * tDiff;
    const m1 = inTangent1[i] * tDiff;
    target[path][i] =
      (2 * Math.pow(t, 3) - 3 * Math.pow(t, 2) + 1) * p0[i] +
      (Math.pow(t, 3) - 2 * Math.pow(t, 2) + t) * m0 +
      (-2 * Math.pow(t, 3) + 3 * Math.pow(t, 2)) * p1[i] +
      (Math.pow(t, 3) - Math.pow(t, 2)) * m1;
  }
}

function stepInterpolate(target, path, value) {
  for (let i = 0; i < value.length; i++) {
    target[path][i] = value[i];
  }
}

function interpolate(time, {input, interpolation, output}, target, path) {
  const maxTime = input[input.length - 1];
  const animationTime = time % maxTime;

  const nextIndex = input.findIndex(t => t >= animationTime);
  const previousIndex = Math.max(0, nextIndex - 1);

  if (!Array.isArray(target[path])) {
    switch (path) {
      case 'translation':
        target[path] = [0, 0, 0];
        break;

      case 'rotation':
        target[path] = [0, 0, 0, 1];
        break;

      case 'scale':
        target[path] = [1, 1, 1];
        break;

      default:
        log.warn(`Bad animation path ${path}`)();
    }
  }

  assert(target[path].length === output[previousIndex].length);
  const previousTime = input[previousIndex];
  const nextTime = input[nextIndex];

  switch (interpolation) {
    case 'STEP':
      stepInterpolate(target, path, output[previousIndex]);
      break;

    case 'LINEAR':
      if (nextTime > previousTime) {
        const ratio = (animationTime - previousTime) / (nextTime - previousTime);
        linearInterpolate(target, path, output[previousIndex], output[nextIndex], ratio);
      }
      break;

    case 'CUBICSPLINE':
      if (nextTime > previousTime) {
        const ratio = (animationTime - previousTime) / (nextTime - previousTime);
        const tDiff = nextTime - previousTime;

        const p0 = output[3 * previousIndex + 1];
        const outTangent0 = output[3 * previousIndex + 2];
        const inTangent1 = output[3 * nextIndex + 0];
        const p1 = output[3 * nextIndex + 1];

        cubicsplineInterpolate(target, path, {p0, outTangent0, inTangent1, p1, tDiff, ratio});
      }
      break;

    default:
      log.warn(`Interpolation ${interpolation} not supported`)();
      break;
  }
}

class GLTFAnimation {
  constructor(props) {
    this.startTime = 0;
    this.playing = true;
    this.speed = 1;

    Object.assign(this, props);
  }

  animate(timeMs) {
    if (!this.playing) {
      return;
    }

    const absTime = timeMs / 1000;
    const time = (absTime - this.startTime) * this.speed;

    this.channels.forEach(({sampler, target, path}) => {
      interpolate(time, sampler, target, path);
      applyTranslationRotationScale(target, target._node);
    });
  }
}

export default class GLTFAnimator {
  constructor(gltf) {
    this.animations = gltf.animations.map((animation, index) => {
      const name = animation.name || `Animation-${index}`;
      const samplers = animation.samplers.map(({input, interpolation = 'LINEAR', output}) => ({
        input: accessorToJsArray(gltf.accessors[input]),
        interpolation,
        output: accessorToJsArray(gltf.accessors[output])
      }));
      const channels = animation.channels.map(({sampler, target}) => ({
        sampler: samplers[sampler],
        target: gltf.nodes[target.node],
        path: target.path
      }));
      return new GLTFAnimation({name, channels});
    });
  }

  // TODO(Tarek): This should be removed? (deck.gl is using this)
  animate(time) {
    this.setTime(time);
  }

  setTime(time) {
    this.animations.forEach(animation => animation.animate(time));
  }

  getAnimations() {
    return this.animations;
  }
}
