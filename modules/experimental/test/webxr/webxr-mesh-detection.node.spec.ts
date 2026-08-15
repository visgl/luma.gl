// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  getWebXRMeshDetectionSessionInit,
  WebXRMeshDetectionManager
} from '../../src/webxr/webxr-mesh-detection';

test('webxr#WebXRMeshDetectionManager resolves mesh poses, buffers, and frame diffs', testCase => {
  const referenceSpace = {} as XRReferenceSpace;
  const firstMesh = makeMockXRMesh({
    vertices: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    indices: new Uint32Array([0, 1, 2]),
    lastChangedTime: 1,
    semanticLabel: 'floor'
  });
  const secondMesh = makeMockXRMesh({
    vertices: new Float32Array([0, 0, 0, 0, 1, 0, 0, 0, 1]),
    indices: new Uint32Array([0, 1, 2]),
    lastChangedTime: 2,
    semanticLabel: 'wall'
  });
  const firstPose = makeMockXRPose([1, 0, 0, 0]);
  const secondPose = makeMockXRPose([2, 0, 0, 0]);
  const session = makeMockXRSession();
  const frame = makeMockXRFrame(
    session,
    new Set([firstMesh, secondMesh]),
    new Map([
      [firstMesh.meshSpace, firstPose],
      [secondMesh.meshSpace, secondPose]
    ])
  );
  const updatedFirstMesh = makeMockXRMesh({
    meshSpace: firstMesh.meshSpace,
    vertices: new Float32Array([0, 0, 0, 2, 0, 0, 0, 2, 0]),
    indices: new Uint32Array([0, 1, 2]),
    lastChangedTime: 3,
    semanticLabel: 'floor'
  });
  const nextFrame = makeMockXRFrame(
    session,
    new Set([updatedFirstMesh]),
    new Map([[updatedFirstMesh.meshSpace, firstPose]])
  );
  const manager = new WebXRMeshDetectionManager();

  manager.setSession(session, referenceSpace);
  const meshState = manager.getMeshDetectionState(frame);
  const nextMeshState = manager.getMeshDetectionState(nextFrame);

  testCase.equal(manager.session, session, 'retains active session');
  testCase.equal(manager.referenceSpace, referenceSpace, 'retains app reference space');
  testCase.equal(meshState?.xrFrame, frame, 'retains source frame');
  testCase.equal(meshState?.session, session, 'retains source session');
  testCase.equal(meshState?.meshes.length, 2, 'resolves all detected meshes with poses');
  testCase.equal(meshState?.added.length, 2, 'initial meshes are added');
  testCase.equal(meshState?.updated.length, 0, 'initial meshes are not updated');
  testCase.equal(meshState?.removed.length, 0, 'initial meshes are not removed');
  testCase.equal(meshState?.meshes[0]?.xrMesh, firstMesh, 'retains raw mesh');
  testCase.equal(meshState?.meshes[0]?.pose, firstPose, 'retains mesh pose');
  testCase.equal(meshState?.meshes[0]?.matrix, firstPose.transform.matrix, 'exposes pose matrix');
  testCase.equal(meshState?.meshes[0]?.vertices, firstMesh.vertices, 'exposes vertices');
  testCase.equal(meshState?.meshes[0]?.indices, firstMesh.indices, 'exposes indices');
  testCase.equal(meshState?.meshes[0]?.vertexCount, 3, 'computes vertex count');
  testCase.equal(meshState?.meshes[0]?.triangleCount, 1, 'computes triangle count');
  testCase.equal(meshState?.meshes[0]?.semanticLabel, 'floor', 'exposes semantic label');
  testCase.equal(meshState?.meshes[0]?.lastChangedTime, 1, 'exposes changed time');
  testCase.equal(nextMeshState?.meshes.length, 1, 'tracks next frame meshes');
  testCase.equal(nextMeshState?.added.length, 1, 'changed object identity is added');
  testCase.equal(nextMeshState?.updated.length, 0, 'new object identity is not updated');
  testCase.equal(nextMeshState?.removed.length, 2, 'previous mesh identities are removed');

  session.dispatchEvent(new Event('end'));
  testCase.equal(manager.getMeshDetectionState(frame), null, 'ended sessions expose no meshes');
  testCase.end();
});

test('webxr#WebXRMeshDetectionManager filters meshes and tracks updates by identity', testCase => {
  const referenceSpace = {} as XRReferenceSpace;
  const mesh = makeMockXRMesh({semanticLabel: 'table', lastChangedTime: 4});
  const wallMesh = makeMockXRMesh({semanticLabel: 'wall', lastChangedTime: 4});
  const pose = makeMockXRPose([1, 0, 0, 0]);
  const session = makeMockXRSession();
  const frame = makeMockXRFrame(
    session,
    new Set([mesh, wallMesh]),
    new Map([
      [mesh.meshSpace, pose],
      [wallMesh.meshSpace, pose]
    ])
  );
  const manager = new WebXRMeshDetectionManager({semanticLabels: ['table']});

  manager.setSession(session, referenceSpace);
  const meshState = manager.getMeshDetectionState(frame);
  (mesh as {lastChangedTime: number}).lastChangedTime = 5;
  const updatedMeshState = manager.getMeshDetectionState(frame);

  testCase.equal(meshState?.meshes.length, 1, 'keeps matching meshes');
  testCase.equal(meshState?.meshes[0]?.xrMesh, mesh, 'keeps requested mesh');
  testCase.equal(updatedMeshState?.updated.length, 1, 'same mesh identity can be updated');
  testCase.equal(updatedMeshState?.updated[0]?.lastChangedTime, 5, 'captures updated timestamp');
  testCase.end();
});

test('webxr#WebXRMeshDetectionManager handles unsupported and invalid frames', testCase => {
  const referenceSpace = {} as XRReferenceSpace;
  const session = makeMockXRSession();
  const otherSession = makeMockXRSession();
  const manager = new WebXRMeshDetectionManager();

  try {
    manager.setSession(session, null);
    testCase.fail('missing reference space should reject');
  } catch (error) {
    testCase.match(
      error instanceof Error ? error.message : '',
      /reference space/,
      'reports missing reference space'
    );
  }

  manager.setSession(session, referenceSpace);
  testCase.equal(
    manager.getMeshDetectionState({session} as XRFrame),
    null,
    'frames without detected meshes expose no state'
  );
  testCase.throws(
    () =>
      manager.getMeshDetectionState({
        session: otherSession,
        detectedMeshes: new Set()
      } as XRFrame),
    /different XRSession/,
    'rejects foreign frames'
  );
  testCase.deepEqual(
    getWebXRMeshDetectionSessionInit({required: true}),
    {requiredFeatures: ['mesh-detection']},
    'builds required mesh-detection session init'
  );
  testCase.deepEqual(
    getWebXRMeshDetectionSessionInit(),
    {optionalFeatures: ['mesh-detection']},
    'builds optional mesh-detection session init'
  );

  manager.clearSession();
  manager.clearSession();
  testCase.equal(manager.session, null, 'clearSession is idempotent');
  testCase.end();
});

function makeMockXRSession(): XRSession {
  return Object.assign(new EventTarget(), {
    enabledFeatures: ['mesh-detection'],
    inputSources: []
  }) as XRSession;
}

function makeMockXRFrame(
  session: XRSession,
  detectedMeshes: XRMeshSet,
  poses: Map<XRSpace, XRPose>
): XRFrame {
  return {
    session,
    detectedMeshes,
    getPose(space: XRSpace): XRPose | undefined {
      return poses.get(space);
    }
  } as XRFrame;
}

function makeMockXRMesh(props: Partial<XRMesh>): XRMesh {
  return {
    meshSpace: props.meshSpace || ({} as XRSpace),
    vertices: props.vertices || new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    indices: props.indices || new Uint32Array([0, 1, 2]),
    semanticLabel: props.semanticLabel,
    lastChangedTime: props.lastChangedTime ?? 1
  } as XRMesh;
}

function makeMockXRPose(matrix: number[]): XRPose {
  return {
    transform: {
      matrix: new Float32Array(matrix),
      inverse: {matrix: new Float32Array(matrix)}
    } as XRRigidTransform
  } as XRPose;
}
