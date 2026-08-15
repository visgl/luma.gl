// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  WebXRInputActionManager,
  getWebXRControllerState,
  getWebXRControllerStateByHandedness,
  getWebXRControllerStates,
  getWebXRInputActionState,
  getWebXRInputActivationState,
  getWebXRInputGrip,
  getWebXRInputRay,
  getWebXRInputRayPlaneIntersection,
  getWebXRInputSourceState
} from '../../src/webxr/webxr-input';
import type {WebXRInputState} from '../../src/webxr/webxr-manager';

test('webxr#getWebXRInputRay resolves origin and normalized target-ray direction', testCase => {
  const matrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, -3, 4, 0, 2, 5, 7, 1]);
  const inputState = makeMockWebXRInputState(matrix);
  const ray = getWebXRInputRay(inputState);

  testCase.equal(ray?.inputState, inputState, 'retains source input state');
  testCase.equal(ray?.matrix, matrix, 'retains source target-ray matrix');
  testCase.deepEqual(ray?.origin, [2, 5, 7], 'uses matrix translation as origin');
  testCase.deepEqual(ray?.direction, [0, 0.6, -0.8], 'normalizes negative local z');
  testCase.end();
});

test('webxr#getWebXRInputRay handles missing and degenerate target rays', testCase => {
  testCase.equal(
    getWebXRInputRay(makeMockWebXRInputState(null)),
    null,
    'missing target ray matrices do not produce rays'
  );

  const ray = getWebXRInputRay(
    makeMockWebXRInputState(new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 3, 4, 5, 1]))
  );
  testCase.deepEqual(ray?.origin, [3, 4, 5], 'still resolves origin');
  testCase.deepEqual(ray?.direction, [0, 0, -1], 'falls back to forward direction');
  testCase.end();
});

test('webxr#getWebXRInputGrip resolves tracked controller grip poses', testCase => {
  const matrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -0.25, 1.125, -0.75, 1]);
  const inputState = makeMockWebXRInputState(null, matrix);
  const grip = getWebXRInputGrip(inputState);

  testCase.equal(grip?.inputState, inputState, 'retains source input state');
  testCase.equal(grip?.matrix, matrix, 'retains source grip matrix');
  testCase.deepEqual(grip?.position, [-0.25, 1.125, -0.75], 'uses matrix translation as position');
  testCase.equal(
    getWebXRInputGrip(makeMockWebXRInputState(null, null)),
    null,
    'missing grip matrices do not produce grips'
  );
  testCase.end();
});

test('webxr#getWebXRInputSourceState classifies input source capabilities', testCase => {
  const targetRayMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1]);
  const gripMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 3, 2, 1, 1]);
  const controllerState = getWebXRInputSourceState(
    makeMockWebXRInputState(targetRayMatrix, gripMatrix, {
      gamepad: {} as Gamepad,
      profiles: ['oculus-touch-v3', 'generic-trigger-squeeze-thumbstick']
    })
  );

  testCase.equal(controllerState.kind, 'controller', 'tracked pointer without hand is controller');
  testCase.equal(controllerState.primaryProfile, 'oculus-touch-v3', 'keeps primary profile');
  testCase.equal(controllerState.isController, true, 'marks controllers');
  testCase.equal(controllerState.usesTrackedPointer, true, 'marks tracked pointers');
  testCase.equal(controllerState.hasTargetRay, true, 'detects target ray matrices');
  testCase.equal(controllerState.hasGrip, true, 'detects grip matrices');
  testCase.equal(controllerState.hasGamepad, true, 'detects gamepads');

  const handState = getWebXRInputSourceState(
    makeMockWebXRInputState(targetRayMatrix, null, {
      hand: {} as XRHand,
      profiles: ['generic-hand-select']
    })
  );
  testCase.equal(handState.kind, 'hand', 'hand sources take precedence over tracked pointers');
  testCase.equal(handState.isHand, true, 'marks hands');
  testCase.equal(handState.isController, false, 'hands are not classified as controllers');

  const screenState = getWebXRInputSourceState(
    makeMockWebXRInputState(null, null, {
      handedness: 'none',
      targetRayMode: 'screen',
      profiles: ['generic-touchscreen']
    })
  );
  testCase.equal(screenState.kind, 'screen', 'screen target rays classify as screen input');
  testCase.equal(screenState.isScreen, true, 'marks screen input');
  testCase.equal(screenState.hasTargetRay, false, 'missing target rays are reflected');

  const gazeState = getWebXRInputSourceState(
    makeMockWebXRInputState(null, null, {
      targetRayMode: 'gaze',
      profiles: []
    })
  );
  testCase.equal(gazeState.kind, 'gaze', 'gaze target rays classify as gaze input');
  testCase.equal(gazeState.primaryProfile, null, 'empty profile lists return null');
  testCase.equal(gazeState.isGaze, true, 'marks gaze input');
  testCase.end();
});

test('webxr#getWebXRControllerState consolidates tracked-pointer controller state', testCase => {
  const targetRayMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, -3, 4, 0, 2, 5, 7, 1]);
  const gripMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -0.25, 1.125, -0.75, 1]);
  const inputState = makeMockWebXRInputState(targetRayMatrix, gripMatrix, {
    handedness: 'left',
    gamepad: makeMockXRStandardGamepad([
      {value: 0.4, pressed: true, touched: true},
      {value: 0.8, pressed: true, touched: true}
    ]),
    profiles: ['oculus-touch-v3']
  });
  const controllerState = getWebXRControllerState(inputState);

  testCase.equal(controllerState?.inputState, inputState, 'retains source input state');
  testCase.equal(controllerState?.inputSource, inputState.inputSource, 'retains input source');
  testCase.equal(controllerState?.primaryProfile, 'oculus-touch-v3', 'keeps primary profile');
  testCase.equal(controllerState?.handedness, 'left', 'keeps handedness');
  testCase.equal(controllerState?.sourceState.isController, true, 'includes input source state');
  testCase.equal(controllerState?.activationState.triggerValue, 0.4, 'includes activation state');
  testCase.equal(controllerState?.primaryAction, 0.4, 'aliases primary action');
  testCase.equal(controllerState?.squeezeAction, 0.8, 'aliases squeeze action');
  testCase.deepEqual(controllerState?.ray?.origin, [2, 5, 7], 'includes target ray state');
  testCase.deepEqual(controllerState?.grip?.position, [-0.25, 1.125, -0.75], 'includes grip state');

  const partialControllerState = getWebXRControllerState(
    makeMockWebXRInputState(null, null, {
      profiles: ['generic-trigger-squeeze-thumbstick']
    })
  );
  testCase.equal(partialControllerState?.ray, null, 'allows controller state without target ray');
  testCase.equal(partialControllerState?.grip, null, 'allows controller state without grip pose');

  testCase.equal(
    getWebXRControllerState(
      makeMockWebXRInputState(targetRayMatrix, null, {
        hand: {} as XRHand,
        profiles: ['generic-hand-select']
      })
    ),
    null,
    'hands are not controller states'
  );
  testCase.equal(
    getWebXRControllerState(
      makeMockWebXRInputState(null, null, {
        targetRayMode: 'screen',
        profiles: ['generic-touchscreen']
      })
    ),
    null,
    'screen input is not a controller state'
  );
  testCase.end();
});

test('webxr#getWebXRControllerStates filters controller snapshots', testCase => {
  const firstInputSource = {} as XRInputSource;
  const secondInputSource = {} as XRInputSource;
  const controllerInputState = makeMockWebXRInputState(null, null, {
    inputSource: firstInputSource,
    gamepad: makeMockXRStandardGamepad([{value: 0.04, pressed: false, touched: false}])
  });
  const handInputState = makeMockWebXRInputState(null, null, {
    hand: {} as XRHand,
    profiles: ['generic-hand-select']
  });
  const screenInputState = makeMockWebXRInputState(null, null, {
    targetRayMode: 'screen',
    profiles: ['generic-touchscreen']
  });
  const secondControllerInputState = makeMockWebXRInputState(null, null, {
    inputSource: secondInputSource,
    profiles: ['generic-trigger-squeeze-thumbstick'],
    selectActive: true
  });
  const controllerStates = getWebXRControllerStates(
    [controllerInputState, handInputState, screenInputState, secondControllerInputState],
    {activationThreshold: 0.05}
  );

  testCase.deepEqual(getWebXRControllerStates(null), [], 'null input snapshots become empty list');
  testCase.equal(controllerStates.length, 2, 'filters out hands and screen input');
  testCase.equal(controllerStates[0]?.inputSource, firstInputSource, 'preserves controller order');
  testCase.equal(
    controllerStates[0]?.isPrimaryActive,
    false,
    'passes activation props to each controller'
  );
  testCase.equal(
    controllerStates[1]?.inputSource,
    secondInputSource,
    'keeps later controller input source'
  );
  testCase.equal(controllerStates[1]?.primaryAction, 1, 'keeps controller activation state');
  testCase.end();
});

test('webxr#getWebXRControllerStateByHandedness selects controller hands', testCase => {
  const leftInputSource = {} as XRInputSource;
  const rightInputSource = {} as XRInputSource;
  const noneInputSource = {} as XRInputSource;
  const controllerStates = getWebXRControllerStates([
    makeMockWebXRInputState(null, null, {
      inputSource: leftInputSource,
      handedness: 'left',
      profiles: ['generic-trigger-squeeze-thumbstick']
    }),
    makeMockWebXRInputState(null, null, {
      inputSource: rightInputSource,
      handedness: 'right',
      profiles: ['generic-trigger-squeeze-thumbstick']
    }),
    makeMockWebXRInputState(null, null, {
      inputSource: noneInputSource,
      handedness: 'none',
      profiles: ['generic-trigger-squeeze-thumbstick']
    })
  ]);

  testCase.equal(
    getWebXRControllerStateByHandedness(controllerStates)?.inputSource,
    leftInputSource,
    'default any returns first controller'
  );
  testCase.equal(
    getWebXRControllerStateByHandedness(controllerStates, 'right')?.inputSource,
    rightInputSource,
    'selects right-hand controllers'
  );
  testCase.equal(
    getWebXRControllerStateByHandedness(controllerStates, 'none')?.inputSource,
    noneInputSource,
    'selects unhanded controllers'
  );
  testCase.equal(
    getWebXRControllerStateByHandedness(controllerStates, 'left')?.inputSource,
    leftInputSource,
    'selects left-hand controllers'
  );
  testCase.equal(
    getWebXRControllerStateByHandedness([], 'right'),
    null,
    'empty controller lists return null'
  );
  testCase.equal(
    getWebXRControllerStateByHandedness(null, 'right'),
    null,
    'null controller lists return null'
  );
  testCase.end();
});

test('webxr#getWebXRInputActivationState normalizes events and gamepad buttons', testCase => {
  const eventInputState = makeMockWebXRInputState(null, null, {
    selectActive: true,
    squeezeActive: true
  });
  const eventActivationState = getWebXRInputActivationState(eventInputState);

  testCase.equal(eventActivationState.inputState, eventInputState, 'retains source input state');
  testCase.equal(
    eventActivationState.inputSource,
    eventInputState.inputSource,
    'keeps input source'
  );
  testCase.equal(eventActivationState.primaryAction, 1, 'select events drive primary action');
  testCase.equal(eventActivationState.squeezeAction, 1, 'squeeze events drive squeeze action');
  testCase.equal(eventActivationState.isPrimaryActive, true, 'marks primary action active');
  testCase.equal(eventActivationState.isSqueezeActive, true, 'marks squeeze action active');

  const gamepadInputState = makeMockWebXRInputState(null, null, {
    gamepad: makeMockXRStandardGamepad([
      {value: 0.42, pressed: false, touched: true},
      {value: 0.7, pressed: true, touched: true}
    ])
  });
  const gamepadActivationState = getWebXRInputActivationState(gamepadInputState);

  testCase.equal(gamepadActivationState.selectActive, false, 'keeps select event state');
  testCase.equal(gamepadActivationState.triggerValue, 0.42, 'uses xr-standard trigger value');
  testCase.equal(gamepadActivationState.squeezeValue, 0.7, 'uses xr-standard squeeze value');
  testCase.equal(
    gamepadActivationState.primaryAction,
    0.42,
    'gamepad triggers drive primary action'
  );
  testCase.equal(
    gamepadActivationState.squeezeAction,
    0.7,
    'gamepad squeeze drives squeeze action'
  );

  const clampedActivationState = getWebXRInputActivationState(
    makeMockWebXRInputState(null, null, {
      gamepad: makeMockXRStandardGamepad([
        {value: 1.5, pressed: true, touched: true},
        {value: -0.2, pressed: false, touched: false}
      ])
    })
  );

  testCase.equal(clampedActivationState.triggerValue, 1, 'clamps trigger values to one');
  testCase.equal(clampedActivationState.squeezeValue, 0, 'clamps squeeze values to zero');
  testCase.equal(
    getWebXRInputActivationState(
      makeMockWebXRInputState(null, null, {
        gamepad: makeMockXRStandardGamepad([{value: 0.04, pressed: false, touched: false}])
      }),
      {activationThreshold: 0.05}
    ).isPrimaryActive,
    false,
    'optional threshold filters low activation values'
  );
  testCase.end();
});

test('webxr#WebXRInputActionManager reports action transitions', testCase => {
  const inputSource = {} as XRInputSource;
  const manager = new WebXRInputActionManager();

  testCase.deepEqual(manager.update(null), [], 'null input snapshots become empty actions');

  const inactiveActionStates = manager.update([makeMockWebXRInputState(null, null, {inputSource})]);
  testCase.equal(
    inactiveActionStates[0]?.primaryActionStarted,
    false,
    'inactive sources do not start'
  );

  const activeActionStates = manager.update([
    makeMockWebXRInputState(null, null, {
      inputSource,
      gamepad: makeMockXRStandardGamepad([{value: 0.35, pressed: true, touched: true}])
    })
  ]);
  testCase.equal(
    activeActionStates[0]?.primaryActionStarted,
    true,
    'trigger press starts primary action'
  );
  testCase.equal(
    activeActionStates[0]?.primaryActionEnded,
    false,
    'trigger press does not end action'
  );
  testCase.equal(activeActionStates[0]?.previousPrimaryAction, 0, 'keeps previous primary action');
  testCase.equal(activeActionStates[0]?.primaryActionDelta, 0.35, 'reports primary action delta');

  const heldActionStates = manager.update([
    makeMockWebXRInputState(null, null, {
      inputSource,
      gamepad: makeMockXRStandardGamepad([{value: 0.7, pressed: true, touched: true}])
    })
  ]);
  testCase.equal(heldActionStates[0]?.primaryActionStarted, false, 'held action does not restart');
  testCase.equal(heldActionStates[0]?.wasPrimaryActive, true, 'keeps previous active flag');
  testCase.equal(heldActionStates[0]?.primaryActionDelta, 0.35, 'reports held action delta');

  const endedActionStates = manager.update([makeMockWebXRInputState(null, null, {inputSource})]);
  testCase.equal(endedActionStates[0]?.primaryActionEnded, true, 'release ends primary action');
  testCase.equal(endedActionStates[0]?.previousPrimaryAction, 0.7, 'keeps previous release value');

  const squeezeAction = getWebXRInputActionState(
    makeMockWebXRInputState(null, null, {
      inputSource,
      squeezeActive: true
    }),
    {
      previousAction: {
        primaryAction: 0,
        squeezeAction: 0,
        isPrimaryActive: false,
        isSqueezeActive: false
      }
    }
  );
  testCase.equal(
    squeezeAction.squeezeActionStarted,
    true,
    'standalone helper tracks squeeze starts'
  );
  testCase.equal(
    squeezeAction.activationThreshold,
    0.05,
    'standalone helper uses default threshold'
  );

  manager.update([]);
  const newActionStates = manager.update([
    makeMockWebXRInputState(null, null, {
      inputSource,
      gamepad: makeMockXRStandardGamepad([{value: 0.35, pressed: true, touched: true}])
    })
  ]);
  testCase.equal(
    newActionStates[0]?.wasPrimaryActive,
    false,
    'missing sources trim previous state'
  );

  manager.reset(inputSource);
  const resetActionStates = manager.update([
    makeMockWebXRInputState(null, null, {
      inputSource,
      gamepad: makeMockXRStandardGamepad([{value: 0.35, pressed: true, touched: true}])
    })
  ]);
  testCase.equal(resetActionStates[0]?.wasPrimaryActive, false, 'reset clears previous state');
  testCase.end();
});

test('webxr#getWebXRInputRayPlaneIntersection resolves floor hits and custom planes', testCase => {
  const floorRay = {
    inputState: makeMockWebXRInputState(null),
    origin: [0, 1.6, 0],
    direction: [0, -0.8, -0.6],
    matrix: new Float32Array(16)
  };
  const floorHit = getWebXRInputRayPlaneIntersection(floorRay);

  testCase.equal(floorHit?.ray, floorRay, 'retains source ray');
  testCase.equal(floorHit?.distance, 2, 'returns normalized ray distance');
  testCase.deepEqual(floorHit?.point, [0, 0, -1.2], 'intersects default y=0 floor plane');

  const wallRay = {
    inputState: makeMockWebXRInputState(null),
    origin: [1, 2, 3],
    direction: [0, 0, -1],
    matrix: new Float32Array(16)
  };
  const wallHit = getWebXRInputRayPlaneIntersection(wallRay, {
    planePoint: [0, 0, 1],
    planeNormal: [0, 0, 2]
  });

  testCase.equal(wallHit?.distance, 2, 'normalizes custom plane normals');
  testCase.deepEqual(wallHit?.point, [1, 2, 1], 'intersects custom plane');
  testCase.end();
});

test('webxr#getWebXRInputRayPlaneIntersection rejects unusable hits', testCase => {
  const ray = {
    inputState: makeMockWebXRInputState(null),
    origin: [0, 1, 0],
    direction: [0, -1, 0],
    matrix: new Float32Array(16)
  };

  testCase.equal(
    getWebXRInputRayPlaneIntersection(ray, {minDistance: 1.5}),
    null,
    'rejects hits before minDistance'
  );
  testCase.equal(
    getWebXRInputRayPlaneIntersection(ray, {maxDistance: 0.5}),
    null,
    'rejects hits after maxDistance'
  );
  testCase.equal(
    getWebXRInputRayPlaneIntersection({...ray, direction: [0, 1, 0]}),
    null,
    'rejects intersections behind the ray origin'
  );
  testCase.equal(
    getWebXRInputRayPlaneIntersection({...ray, direction: [1, 0, 0]}),
    null,
    'rejects rays parallel to the plane'
  );
  testCase.equal(
    getWebXRInputRayPlaneIntersection(ray, {planeNormal: [0, 0, 0]}),
    null,
    'rejects degenerate plane normals'
  );
  testCase.end();
});

function makeMockWebXRInputState(
  targetRayMatrix: Float32Array | null,
  gripMatrix: Float32Array | null = null,
  props: Partial<WebXRInputState> = {}
): WebXRInputState {
  return {
    inputSource: props.inputSource ?? ({} as XRInputSource),
    index: 0,
    handedness: props.handedness ?? 'right',
    targetRayMode: props.targetRayMode ?? 'tracked-pointer',
    profiles: props.profiles ?? [],
    gamepad: props.gamepad ?? null,
    hand: props.hand ?? null,
    targetRayPose: null,
    targetRayMatrix,
    gripPose: null,
    gripMatrix,
    selectActive: props.selectActive ?? false,
    squeezeActive: props.squeezeActive ?? false
  };
}

function makeMockXRStandardGamepad(
  buttons: {value: number; pressed: boolean; touched: boolean}[]
): Gamepad {
  return {
    mapping: 'xr-standard',
    buttons: buttons as GamepadButton[],
    axes: []
  } as Gamepad;
}
