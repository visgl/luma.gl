import test from 'tape-promise/tape';
<<<<<<<< HEAD:wip/modules-wip/webgl-legacy/test/transform/buffer-transform.spec.ts
import {webgl1Device, webgl2Device} from '@luma.gl/test-utils';

import {glsl} from '@luma.gl/core';
import BufferTransform from '@luma.gl/webgl-legacy/transform/buffer-transform';
import {Buffer, TransformFeedback} from '@luma.gl/webgl-legacy';
import {ClassicModel as Model} from '@luma.gl/webgl-legacy';
========
import {glsl, Device, Buffer, TransformFeedback} from '@luma.gl/api';
import {Model} from '@luma.gl/engine';
import {_BufferTransform as BufferTransform} from '@luma.gl/engine';
import {webgl2Device} from '@luma.gl/test-utils';
>>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects):modules/engine/test/transform/buffer-transform.spec.ts

const VS = glsl`\
attribute float source;
varying float feedback;

void main()
{
  feedback = 2.0 * source;
}
`;

const FS = glsl`\
void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

test('WebGL#BufferTransform construct', (t) => {
<<<<<<<< HEAD:wip/modules-wip/webgl-legacy/test/transform/buffer-transform.spec.ts
  const bt = new BufferTransform(webgl1Device, {
    sourceBuffers: {
      input: new Buffer(webgl1Device, {id: 'source-1', data: new Float32Array([0, 2.7, -45])})
========

  // @ts-expect-error
  const bt = new BufferTransform(webgl2Device, {
    sourceBuffers: {
      input: webgl2Device.createBuffer({id: 'source-1', data: new Float32Array([0, 2.7, -45])})
>>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects):modules/engine/test/transform/buffer-transform.spec.ts
    }
  });
  t.ok(bt instanceof BufferTransform, 'should construct with only sourceBuffers');

  t.end();
});

test('WebGL#BufferTransform construct with feedbackBuffer', (t) => {
<<<<<<<< HEAD:wip/modules-wip/webgl-legacy/test/transform/buffer-transform.spec.ts
  let source = new Buffer(webgl1Device, {id: 'source', data: new Float32Array([0, 2.7, -45])});
  let feedback = new Buffer(webgl1Device, {id: 'feedback', data: new Float32Array([0, 2.7, -45])});
  t.throws(
    () =>
      new BufferTransform(webgl1Device, {
========
  let source = webgl2Device.createBuffer({id: 'source', data: new Float32Array([0, 2.7, -45])});
  let feedback = webgl2Device.createBuffer({id: 'feedback', data: new Float32Array([0, 2.7, -45])});
  t.throws(
    () =>
      // @ts-expect-error
      new BufferTransform(webgl2Device, {
>>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects):modules/engine/test/transform/buffer-transform.spec.ts
        sourceBuffers: {
          source
        },
        feedbackBuffers: {
          feedback
        }
      }),
    'should throw under WebGL1'
  );

  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  source = new Buffer(webgl2Device, {id: 'source', data: new Float32Array([0, 2.7, -45])});
  feedback = new Buffer(webgl2Device, {id: 'feedback', data: new Float32Array([0, 2.7, -45])});
  const bt = new BufferTransform(webgl2Device, {
    sourceBuffers: {
      source
    },
    feedbackBuffers: {
      feedback
    },
    varyings: ['feedback']
  });
  t.ok(bt instanceof BufferTransform, 'should construct manager with feedBackBuffers');
  t.deepEqual(bt.varyings, ['feedback'], 'should set varyings');
  const {attributes} = bt.getDrawOptions();
  const buffer = bt.getBuffer('feedback');
  t.equal(attributes.source.id, 'source', 'should set up attribute buffer correctly');
  t.equal(buffer.id, 'feedback', 'should set up feedback buffer correctly');
  t.end();
});

test('WebGL#BufferTransform feedbackBuffer with referece', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
<<<<<<<< HEAD:wip/modules-wip/webgl-legacy/test/transform/buffer-transform.spec.ts
  const source = new Buffer(webgl2Device, {id: 'source', data: new Float32Array([0, 2.7, -45])});
========
  const source = webgl2Device.createBuffer({id: 'source', data: new Float32Array([0, 2.7, -45])});
>>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects):modules/engine/test/transform/buffer-transform.spec.ts
  const bt = new BufferTransform(webgl2Device, {
    sourceBuffers: {
      source
    },
    feedbackBuffers: {
      feedback: 'source'
    }
  });
  t.ok(bt instanceof BufferTransform, 'should construct manager with feedBackBuffers');
  const buffer = bt.getBuffer('feedback');
  t.ok(buffer instanceof Buffer, 'should auto create feedback buffer');

  t.end();
});

test('WebGL#BufferTransform updateModelProps', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  // const model = new Model(webgl2Device, {vs: VS, fs: FS, vertexCount: 1, varyings: ['feedback']});
<<<<<<<< HEAD:wip/modules-wip/webgl-legacy/test/transform/buffer-transform.spec.ts
  const source = new Buffer(webgl2Device, {id: 'source', data: new Float32Array([0, 2.7, -45])});
========
  const source = webgl2Device.createBuffer({id: 'source', data: new Float32Array([0, 2.7, -45])});
>>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects):modules/engine/test/transform/buffer-transform.spec.ts

  const cutomVaryings = ['a', 'b'];
  let bt = new BufferTransform(webgl2Device, {
    sourceBuffers: {
      source
    },
    feedbackBuffers: {
      feedback: source
    },
    varyings: cutomVaryings
  });
  let {varyings} = bt.updateModelProps();
  t.deepEqual(varyings, cutomVaryings, 'should use custom varyings when provided');

<<<<<<<< HEAD:wip/modules-wip/webgl-legacy/test/transform/buffer-transform.spec.ts
  bt.destroy();
========
  bt.delete();
>>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects):modules/engine/test/transform/buffer-transform.spec.ts
  bt = new BufferTransform(webgl2Device, {
    sourceBuffers: {
      source
    },
    feedbackBuffers: {
      feedback: source
    }
  });

  ({varyings} = bt.updateModelProps({}));
  t.deepEqual(
    varyings,
    ['feedback'],
    'should build varyings from feedbackBuffers when not provided'
  );

  bt.destroy();
  t.end();
});

test('WebGL#BufferTransform setupResources', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const model = new Model(webgl2Device, {vs: VS, fs: FS, vertexCount: 1, varyings: ['feedback']});
<<<<<<<< HEAD:wip/modules-wip/webgl-legacy/test/transform/buffer-transform.spec.ts
  const source = new Buffer(webgl2Device, {id: 'source', data: new Float32Array([0, 2.7, -45])});
========
  const source = webgl2Device.createBuffer({id: 'source', data: new Float32Array([0, 2.7, -45])});
>>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects):modules/engine/test/transform/buffer-transform.spec.ts
  const bt = new BufferTransform(webgl2Device, {
    sourceBuffers: {
      source
    },
    feedbackBuffers: {
      feedback: 'source'
    }
  });

  // @ts-ignore
  bt.setupResources({model});

  const {attributes, transformFeedback} = bt.getDrawOptions();
  t.ok(attributes.source instanceof Buffer, 'should return correct attributes');
  t.ok(transformFeedback instanceof TransformFeedback, 'should return TranformFeedback');

  t.end();
});

test('WebGL#BufferTransform swap', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const model = new Model(webgl2Device, {vs: VS, fs: FS, vertexCount: 1, varyings: ['feedback']});
<<<<<<<< HEAD:wip/modules-wip/webgl-legacy/test/transform/buffer-transform.spec.ts
  const source = new Buffer(webgl2Device, {id: 'source', data: new Float32Array([0, 2.7, -45])});
========
  const source = webgl2Device.createBuffer({id: 'source', data: new Float32Array([0, 2.7, -45])});
>>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects):modules/engine/test/transform/buffer-transform.spec.ts
  const bt = new BufferTransform(webgl2Device, {
    sourceBuffers: {
      source
    },
    feedbackMap: {
      source: 'feedback'
    }
  });

  // @ts-ignore
  bt.setupResources({model});

  let {attributes, transformFeedback} = bt.getDrawOptions();

  const attributeID = attributes.source.id;
  const feedbackID = transformFeedback.buffers[0].id; // there should only be one location, 0

  t.ok(attributeID !== feedbackID, 'should construct feedback buffer');

  bt.swap();
  ({attributes, transformFeedback} = bt.getDrawOptions());

  const swappedAttributeID = attributes.source.id;
  const swappedFeedbackID = transformFeedback.buffers[0].id; // there should only be one location, 0

  t.equal(attributeID, swappedFeedbackID, 'should swap attribute and feedback buffers');
  t.equal(feedbackID, swappedAttributeID, 'should swap attribute and feedback buffers');

  t.end();
});
