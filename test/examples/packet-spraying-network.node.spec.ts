// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  AGGREGATION_POSITIONS,
  AGGREGATION_SWITCH_RADIUS,
  FAILURE_DETECTION_DELAY,
  CONVERSATIONS,
  HOST_POSITIONS,
  LEAF_SWITCH_RADIUS,
  LEAF_POSITIONS,
  PACKET_TRAVEL_SPEED,
  SPINE_POSITIONS,
  SWITCH_CONFIRMATION_DURATION,
  SWITCH_POSITIONS,
  SWITCH_TRANSITION_WAVE_DURATION,
  getActivePlaneCount,
  getDistance,
  getHealthyConversationRoutes,
  isFailedSwitchPosition,
  makeConversationRoutes,
  makeLinks,
  makeLinkPulses,
  makeLinkTraffic,
  makePackets,
  makePickableNetworkNodes,
  makeSwitchPacketEvents,
  makeSwitchProbeConfirmationEvent,
  makeSwitchProbeEvent,
  makeSwitchGroups,
  makeSwitchArrivals,
  makeSwitchTransitionWave,
  makeLinkKey,
  reroutePackets
} from '../../examples/showcase/packet-spraying/network';

test('packet-spraying network defines an independent four-plane topology', testCase => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);

  testCase.equal(HOST_POSITIONS.length, 16, 'the server layer contains a four-by-four grid');
  testCase.equal(LEAF_POSITIONS.length, 8, 'the access layer contains two rows of four switches');
  testCase.equal(
    AGGREGATION_POSITIONS.length,
    8,
    'the plane layer contains two rows of four switches'
  );
  testCase.equal(SPINE_POSITIONS.length, 4, 'the backbone contains four independent spines');
  testCase.equal(SWITCH_POSITIONS.length, 20, 'all switch positions have stable picking indices');
  testCase.equal(routes.length, 8, 'two conversations each have four independent routes');
  testCase.equal(getActivePlaneCount(routes), 4, 'all four planes start available');
  testCase.equal(packets.length, 48, 'each conversation contributes one 24-packet burst');
  testCase.equal(makeLinks(routes).length, 80, 'network links preserve the complete fabric');
  testCase.equal(
    makePickableNetworkNodes().length,
    HOST_POSITIONS.length + SWITCH_POSITIONS.length,
    'every server and switch has an explanatory picking record'
  );
  testCase.equal(
    makeSwitchArrivals(packets).length,
    packets.length * 5,
    'each packet produces arrivals at its five intermediate switches'
  );

  const redPacket = packets.find(packet => packet.conversationIndex === 0)!;
  const greenPacket = packets.find(packet => packet.conversationIndex === 1)!;
  const redAccessArrival =
    redPacket.launchTime +
    getDistance(redPacket.route.points[0], redPacket.route.points[1]) / PACKET_TRAVEL_SPEED;
  const greenAccessArrival =
    greenPacket.launchTime +
    getDistance(greenPacket.route.points[0], greenPacket.route.points[1]) / PACKET_TRAVEL_SPEED;
  testCase.ok(
    Math.abs(greenAccessArrival - redAccessArrival - 0.07) < 0.00001,
    'red and green conversations arrive half a packet interval apart'
  );
  testCase.end();
});

test('packet-spraying switches form spine and two complete physical-plane groups', testCase => {
  const groups = makeSwitchGroups();

  testCase.deepEqual(
    groups.map(group => group.id),
    ['spine', 'plane-1', 'plane-2'],
    'semantic switch groups identify the spine and both planes'
  );
  testCase.deepEqual(
    groups.map(group => group.switchIndices.length),
    [4, 8, 8],
    'spines contain four switches and each plane contains its access and aggregation switches'
  );
  testCase.deepEqual(
    groups.flatMap(group => group.switchIndices).sort((first, second) => first - second),
    SWITCH_POSITIONS.map((_, switchIndex) => switchIndex),
    'every pickable switch belongs to exactly one rendering group'
  );
  testCase.ok(
    groups[1].switchIndices.every(switchIndex => SWITCH_POSITIONS[switchIndex][2] > 0),
    'the first physical plane keeps its positive-depth switch row together'
  );
  testCase.ok(
    groups[2].switchIndices.every(switchIndex => SWITCH_POSITIONS[switchIndex][2] < 0),
    'the second physical plane keeps its negative-depth switch row together'
  );
  testCase.end();
});

test('packet-spraying link traffic follows visible red and green packets', testCase => {
  const packets = makePackets(makeConversationRoutes());
  const firstRedPacket = packets.find(packet => packet.conversationIndex === 0)!;
  const firstGreenPacket = packets.find(packet => packet.conversationIndex === 1)!;
  const sharedLinkKey = makeLinkKey(firstRedPacket.route.points[1], firstRedPacket.route.points[2]);
  const timeOnSharedLink =
    firstRedPacket.launchTime +
    (firstRedPacket.route.cumulativeLengths[1] + 0.5) / PACKET_TRAVEL_SPEED;
  const traffic = makeLinkTraffic(packets, timeOnSharedLink);

  testCase.deepEqual(
    traffic.get(sharedLinkKey),
    {red: 1, green: 1},
    'shared switch links report interleaved red and green packets'
  );

  firstRedPacket.enabled = false;
  testCase.deepEqual(
    makeLinkTraffic(packets, timeOnSharedLink).get(sharedLinkKey),
    {red: 0, green: 1},
    'disabled or rerouted packets stop illuminating their former link'
  );

  firstGreenPacket.enabled = false;
  testCase.equal(
    makeLinkTraffic(packets, timeOnSharedLink).get(sharedLinkKey),
    undefined,
    'an empty link has no traffic illumination'
  );

  testCase.end();
});

test('packet-spraying link pulses follow alternating packets inside physical links', testCase => {
  const packets = makePackets(makeConversationRoutes());
  const firstRedPacket = packets.find(packet => packet.conversationIndex === 0)!;
  const firstGreenPacket = packets.find(packet => packet.conversationIndex === 1)!;
  const linkStart = firstRedPacket.route.points[1];
  const linkEnd = firstRedPacket.route.points[2];
  const sharedLinkKey = makeLinkKey(linkStart, linkEnd);
  const animationTime =
    firstRedPacket.launchTime +
    (firstRedPacket.route.cumulativeLengths[1] + 0.8) / PACKET_TRAVEL_SPEED;
  const pulseLength = 0.31;
  const pulses = makeLinkPulses(packets, animationTime, pulseLength).filter(
    pulse => pulse.linkKey === sharedLinkKey
  );

  testCase.deepEqual(
    pulses.map(pulse => pulse.conversationIndex).sort(),
    [0, 1],
    'the shared link contains one red wake and one green wake'
  );
  testCase.ok(
    pulses.every(pulse => getDistance(pulse.start, pulse.end) <= pulseLength + 0.00001),
    'each directional wake stays within its configured physical length'
  );
  testCase.ok(
    pulses.every(pulse =>
      [pulse.start, pulse.end].every(
        position =>
          Math.abs(
            getDistance(linkStart, position) +
              getDistance(position, linkEnd) -
              getDistance(linkStart, linkEnd)
          ) < 0.00001
      )
    ),
    'wake endpoints remain inside the current physical link'
  );
  testCase.ok(
    pulses.every(pulse => getDistance(linkStart, pulse.start) >= LEAF_SWITCH_RADIUS - 0.00001),
    'link wakes begin outside the access-switch glass surface'
  );
  testCase.ok(
    pulses.every(pulse => getDistance(pulse.end, linkEnd) >= AGGREGATION_SWITCH_RADIUS - 0.00001),
    'link wakes stop before the aggregation-switch glass surface'
  );

  firstRedPacket.enabled = false;
  testCase.deepEqual(
    makeLinkPulses(packets, animationTime, pulseLength)
      .filter(pulse => pulse.linkKey === sharedLinkKey)
      .map(pulse => pulse.conversationIndex),
    [1],
    'disabling a packet removes its optical wake'
  );

  firstGreenPacket.enabled = false;
  testCase.equal(
    makeLinkPulses(packets, animationTime, pulseLength).filter(
      pulse => pulse.linkKey === sharedLinkKey
    ).length,
    0,
    'idle links do not receive packet wakes'
  );
  testCase.deepEqual(
    makeLinkPulses(packets, animationTime, 0),
    [],
    'zero pulse length disables directional wakes'
  );
  testCase.end();
});

test('packet-spraying traffic immediately avoids and restores failed planes', testCase => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);
  const failedSpineIndex = LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length;
  const failedSwitches = new Set([failedSpineIndex]);
  const healthyRoutes = getHealthyConversationRoutes(routes, failedSwitches);

  testCase.equal(healthyRoutes.length, 6, 'one failed spine removes one route per conversation');
  testCase.equal(getActivePlaneCount(healthyRoutes), 3, 'three healthy planes remain online');
  testCase.ok(
    isFailedSwitchPosition(SPINE_POSITIONS[0], failedSwitches),
    'the failed spine is recognized from its world-space position'
  );

  reroutePackets(packets, healthyRoutes);
  testCase.ok(
    packets.every(packet => packet.enabled),
    'both conversations remain active'
  );
  testCase.ok(
    packets.every(packet =>
      packet.route.points.every(position => !isFailedSwitchPosition(position, failedSwitches))
    ),
    'no packet continues through the failed switch'
  );
  for (let conversationIndex = 0; conversationIndex < CONVERSATIONS.length; conversationIndex++) {
    const packetsByPlane = new Map<string, number>();
    for (const packet of packets.filter(packet => packet.conversationIndex === conversationIndex)) {
      const planeKey = packet.route.points[3].join(',');
      packetsByPlane.set(planeKey, (packetsByPlane.get(planeKey) || 0) + 1);
    }
    testCase.deepEqual(
      [...packetsByPlane.values()],
      [8, 8, 8],
      `conversation ${conversationIndex + 1} balances traffic across the remaining planes`
    );
  }

  failedSwitches.clear();
  const restoredRoutes = getHealthyConversationRoutes(routes, failedSwitches);
  reroutePackets(packets, restoredRoutes);
  testCase.equal(getActivePlaneCount(restoredRoutes), 4, 'restoring the switch restores its plane');
  testCase.equal(
    new Set(packets.map(packet => packet.route.points[3].join(','))).size,
    4,
    'packets resume using all four paths'
  );
  testCase.end();
});

test('packet-spraying keeps repaired planes offline until a recovery probe confirms them', testCase => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);
  const recoveringSpineIndex = LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length;
  const recoveringSwitches = new Set([recoveringSpineIndex]);
  const recoveringRoutes = getHealthyConversationRoutes(routes, new Set(), recoveringSwitches);

  testCase.equal(getActivePlaneCount(recoveringRoutes), 3, 'a repaired plane remains unavailable');
  reroutePackets(packets, recoveringRoutes);
  testCase.ok(
    packets.every(packet => packet.route.points.every(position => position !== SPINE_POSITIONS[0])),
    'ordinary traffic cannot enter a recovering switch'
  );

  const recoveryProbe = makeSwitchProbeEvent(routes, recoveringSpineIndex, 15, recoveringSwitches);
  testCase.equal(recoveryProbe?.kind, 'probe', 'a blue control packet verifies the repaired path');
  testCase.ok(
    recoveryProbe?.route.points.includes(SPINE_POSITIONS[0]),
    'the recovery probe reaches the repaired switch'
  );

  const alternateProbe = makeSwitchProbeEvent(routes, recoveringSpineIndex, 15, new Set([3]));
  testCase.ok(alternateProbe, 'control traffic can use another physical access route');
  testCase.ok(
    alternateProbe?.route.points.every(position => position !== LEAF_POSITIONS[3]),
    'the physical probe avoids the unavailable conversation access switch'
  );

  const blockedProbe = makeSwitchProbeEvent(
    routes,
    recoveringSpineIndex,
    15,
    new Set(LEAF_POSITIONS.map((_, switchIndex) => switchIndex))
  );
  testCase.equal(
    blockedProbe,
    null,
    'a probe cannot reach the switch when every access switch is unavailable'
  );

  recoveringSwitches.clear();
  const confirmedRoutes = getHealthyConversationRoutes(routes, new Set(), recoveringSwitches);
  reroutePackets(packets, confirmedRoutes);
  testCase.equal(getActivePlaneCount(confirmedRoutes), 4, 'probe confirmation restores the plane');
  testCase.ok(
    packets.some(packet => packet.route.points.includes(SPINE_POSITIONS[0])),
    'ordinary traffic resumes after the repaired route is confirmed'
  );
  testCase.end();
});

test('packet-spraying physically probes unused switches and confirms the return path', testCase => {
  const routes = makeConversationRoutes();
  const unusedLeafIndex = 0;
  const probe = makeSwitchProbeEvent(routes, unusedLeafIndex, 9, new Set([unusedLeafIndex]));

  testCase.ok(
    routes.every(({route}) => !route.points.includes(LEAF_POSITIONS[unusedLeafIndex])),
    'the access switch is absent from configured application conversations'
  );
  testCase.deepEqual(
    probe?.route.points,
    [HOST_POSITIONS[unusedLeafIndex], LEAF_POSITIONS[unusedLeafIndex]],
    'a physical control packet can still reach the unused access switch'
  );
  testCase.ok(
    SWITCH_POSITIONS.every((_, switchIndex) => makeSwitchProbeEvent(routes, switchIndex, 9)),
    'every physical switch has a recovery-probe path'
  );

  const confirmation = makeSwitchProbeConfirmationEvent(probe!);
  testCase.equal(confirmation.kind, 'probe-confirmation', 'the response is a confirmation packet');
  testCase.equal(
    confirmation.startedAt,
    probe!.startedAt + probe!.duration,
    'the acknowledgment departs after the outbound control probe arrives'
  );
  testCase.equal(
    confirmation.duration,
    SWITCH_CONFIRMATION_DURATION,
    'confirmation uses the bounded acknowledgment duration'
  );
  testCase.deepEqual(
    confirmation.route,
    probe!.route,
    'the acknowledgment returns through the verified physical route'
  );
  testCase.ok(
    confirmation.color[1] > confirmation.color[0] && confirmation.color[2] > confirmation.color[0],
    'the returning acknowledgment has a distinct cyan color'
  );
  testCase.end();
});

test('packet-spraying transition waves distinguish switch failure from recovery', testCase => {
  const switchIndex = LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length;
  const failureWave = makeSwitchTransitionWave(switchIndex, 'failure', 4);
  const recoveryWave = makeSwitchTransitionWave(switchIndex, 'recovery', 8);

  testCase.equal(failureWave.switchIndex, switchIndex, 'failure stays anchored to its switch');
  testCase.equal(recoveryWave.switchIndex, switchIndex, 'recovery stays anchored to its switch');
  testCase.equal(failureWave.duration, SWITCH_TRANSITION_WAVE_DURATION);
  testCase.equal(recoveryWave.duration, SWITCH_TRANSITION_WAVE_DURATION);
  testCase.ok(failureWave.color[0] > failureWave.color[1], 'failure waves are warm red');
  testCase.ok(recoveryWave.color[1] > recoveryWave.color[0], 'recovery waves are cool cyan');
  testCase.end();
});

test('packet-spraying stops a conversation when its only access switch fails', testCase => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);
  const failedAccessSwitches = new Set([3]);
  const healthyRoutes = getHealthyConversationRoutes(routes, failedAccessSwitches);

  reroutePackets(packets, healthyRoutes);
  testCase.equal(healthyRoutes.length, 0, 'both conversations share the failed access switch');
  testCase.ok(
    packets.every(packet => !packet.enabled),
    'unreachable packets are hidden'
  );
  testCase.equal(makeSwitchArrivals(packets).length, 0, 'disabled traffic cannot flash switches');
  testCase.end();
});

test('packet-spraying failure drops packets before retransmitting on healthy planes', testCase => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);
  const failedSpineIndex = LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length;
  const startedAt = 12;
  const events = makeSwitchPacketEvents({
    packets,
    conversationRoutes: routes,
    scenario: 'failure',
    startedAt,
    switchIndex: failedSpineIndex
  });
  const droppedPackets = events.filter(event => event.kind === 'dropped-payload');
  const retransmittedPackets = events.filter(event => event.kind === 'retransmission');

  testCase.equal(droppedPackets.length, 4, 'both conversations lose two in-flight packets');
  testCase.equal(retransmittedPackets.length, 4, 'each lost packet receives a retransmission');
  testCase.deepEqual(
    droppedPackets.map(event => event.conversationIndex),
    [0, 1, 0, 1],
    'dropped red and green packets preserve their interleaved ordering'
  );
  testCase.ok(
    droppedPackets.every(event => event.startedAt < startedAt + FAILURE_DETECTION_DELAY),
    'packets are only lost during the brief failure-detection window'
  );
  testCase.ok(
    retransmittedPackets.every(event => event.startedAt >= startedAt + FAILURE_DETECTION_DELAY),
    'retransmissions begin once the failed path is retired'
  );
  testCase.ok(
    retransmittedPackets.every(event =>
      event.route.points.every(position => position !== SPINE_POSITIONS[0])
    ),
    'retransmissions take healthy independent network planes'
  );
  testCase.end();
});

test('packet-spraying congestion trims payloads while preserving packet headers', testCase => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);
  const congestedSpineIndex = LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length;
  const events = makeSwitchPacketEvents({
    packets,
    conversationRoutes: routes,
    scenario: 'congestion',
    startedAt: 8,
    switchIndex: congestedSpineIndex
  });

  testCase.equal(
    events.filter(event => event.kind === 'trimmed-payload').length,
    2,
    'each conversation sheds one congested payload'
  );
  testCase.equal(
    events.filter(event => event.kind === 'trimmed-header').length,
    2,
    'each trimmed payload retains a forwarding header'
  );
  testCase.equal(
    events.filter(event => event.kind === 'retransmission').length,
    2,
    'trim notifications trigger retransmissions through other planes'
  );
  testCase.equal(getActivePlaneCount(routes), 4, 'congestion does not retire the plane');

  const probe = makeSwitchProbeEvent(routes, congestedSpineIndex, 15);
  testCase.equal(probe?.kind, 'probe', 'failed paths can be tested with a control probe');
  testCase.equal(probe?.switchIndex, congestedSpineIndex, 'the probe targets the affected switch');
  testCase.end();
});
