import {Matrix4} from 'math.gl';

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

    this.channels.forEach(({sampler: {input, output}, target, path}) => {
      // TODO: support "interpolation"
      let index = input.findIndex(t => t > time);
      if (index === -1) {
        index = 0;
        this.startTime = absTime;
      }
      target[path] = output[index];
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

  animate(timeMs) {
    this.animations.forEach(animation => animation.animate(timeMs));
  }

  getAnimations() {
    return this.animations;
  }
}
