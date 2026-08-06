// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  AGGREGATION_POSITIONS,
  AGGREGATION_SWITCH_RADIUS,
  FAILURE_DETECTION_DELAY,
  CONVERSATIONS,
  ENDPOINT_SIGNAL_DURATION,
  HOST_POSITIONS,
  LEAF_SWITCH_RADIUS,
  LEAF_POSITIONS,
  NETWORK_SWITCH_PLANE_COUNT,
  PACKET_TRAVEL_SPEED,
  SPINE_POSITIONS,
  SPINE_SWITCH_RADIUS,
  SWITCH_CONFIRMATION_DURATION,
  SWITCH_PROBE_DURATION,
  SWITCH_POSITIONS,
  SWITCH_TRANSITION_WAVE_DURATION,
  getActivePlaneCount,
  getDistance,
  getHealthyConversationRoutes,
  getNetworkPlaneSwitchIndices,
  isFailedSwitchPosition,
  isSwitchProbeRouteAvailable,
  makeConversationRoutes,
  makeEndpointSignals,
  makeLinks,
  makeLinkPulses,
  makeLinkTraffic,
  makePackets,
  makeNetworkFabricTelemetry,
  makeNetworkPlaneTelemetry,
  makeNetworkPathFocus,
  makeNetworkSwitchPlaneTelemetry,
  makePickableNetworkNodes,
  makeSwitchPacketEvents,
  makeSwitchProbeConfirmationEvent,
  makeSwitchProbeEvent,
  makeSwitchQueuePackets,
  makeSwitchGroups,
  makeSwitchArrivals,
  makeSwitchTransitionWave,
  makeLinkKey,
  reroutePackets
} from '../../examples/showcase/packet-spraying/network';

test('packet-spraying network defines two switch planes and four independent spine paths', testCase => {
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
  testCase.equal(NETWORK_SWITCH_PLANE_COUNT, 2, 'the switch fabric contains two physical planes');
  testCase.equal(SWITCH_POSITIONS.length, 20, 'all switch positions have stable picking indices');
  testCase.equal(routes.length, 8, 'two conversations each have four independent routes');
  testCase.equal(getActivePlaneCount(routes), 4, 'all four backbone paths start available');
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

test('packet-spraying path inspection follows both complete conversations through one spine', testCase => {
  const routes = makeConversationRoutes();

  for (let pathIndex = 0; pathIndex < SPINE_POSITIONS.length; pathIndex++) {
    const focus = makeNetworkPathFocus(routes, pathIndex)!;

    testCase.equal(focus.pathIndex, pathIndex, 'the focus identifies its physical backbone path');
    testCase.equal(
      focus.hostIndices.size,
      4,
      'both source and destination server pairs participate'
    );
    testCase.equal(focus.switchIndices.size, 5, 'the focused path crosses five physical switches');
    testCase.equal(focus.linkKeys.size, 8, 'shared links combine with both endpoint branches');
    testCase.ok(
      focus.switchIndices.has(LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length + pathIndex),
      'the selected spine belongs to its focused route'
    );
  }

  testCase.equal(makeNetworkPathFocus(routes, -1), null, 'negative path indices are rejected');
  testCase.equal(
    makeNetworkPathFocus(routes, SPINE_POSITIONS.length),
    null,
    'out-of-range path indices are rejected'
  );
  testCase.equal(makeNetworkPathFocus([], 0), null, 'missing routes cannot produce a focus');
  testCase.end();
});

test('packet-spraying physical planes contain complete access and aggregation switch tiers', testCase => {
  for (let planeIndex = 0; planeIndex < NETWORK_SWITCH_PLANE_COUNT; planeIndex++) {
    const switchIndices = getNetworkPlaneSwitchIndices(planeIndex);

    testCase.deepEqual(
      switchIndices,
      [
        ...Array.from({length: 4}, (_, switchIndex) => planeIndex * 4 + switchIndex),
        ...Array.from(
          {length: 4},
          (_, switchIndex) => LEAF_POSITIONS.length + planeIndex * 4 + switchIndex
        )
      ],
      `plane ${planeIndex + 1} identifies its four access and four aggregation switches`
    );
    testCase.ok(
      switchIndices.every(
        switchIndex => switchIndex < LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length
      ),
      `plane ${planeIndex + 1} excludes the independent backbone spines`
    );
  }

  testCase.deepEqual(getNetworkPlaneSwitchIndices(-1), [], 'negative plane indices are ignored');
  testCase.deepEqual(
    getNetworkPlaneSwitchIndices(NETWORK_SWITCH_PLANE_COUNT),
    [],
    'missing planes do not produce switch indices'
  );
  testCase.deepEqual(getNetworkPlaneSwitchIndices(1.5), [], 'fractional plane indices are ignored');
  testCase.end();
});

test('packet-spraying physical-plane telemetry preserves four independent backbone paths', testCase => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);
  const failedAggregationSwitchIndex = LEAF_POSITIONS.length;
  const failedSwitches = new Set([failedAggregationSwitchIndex]);

  reroutePackets(packets, getHealthyConversationRoutes(routes, failedSwitches));
  const switchPlaneTelemetry = makeNetworkSwitchPlaneTelemetry(
    routes,
    packets,
    failedSwitches,
    new Set(),
    new Set()
  );

  testCase.equal(switchPlaneTelemetry.length, 2, 'telemetry reports both physical switch planes');
  testCase.equal(
    switchPlaneTelemetry[0].status,
    'congested',
    'a failed aggregation switch marks its physical plane as impaired'
  );
  testCase.equal(switchPlaneTelemetry[1].status, 'healthy', 'the opposite plane remains healthy');
  testCase.ok(
    switchPlaneTelemetry.every(plane => plane.redPacketCount > 0 && plane.greenPacketCount > 0),
    'both physical planes continue carrying traffic on the remaining backbone paths'
  );
  testCase.equal(
    getActivePlaneCount(getHealthyConversationRoutes(routes, failedSwitches)),
    3,
    'three of the four independent backbone paths remain available'
  );
  testCase.end();
});

test('packet-spraying physical-plane telemetry preserves recovery while data routes are blocked', testCase => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);
  const recoveringAccessSwitchIndex = 3;
  const recoveringSwitches = new Set([recoveringAccessSwitchIndex]);

  reroutePackets(packets, getHealthyConversationRoutes(routes, new Set(), recoveringSwitches));
  const telemetry = makeNetworkSwitchPlaneTelemetry(
    routes,
    packets,
    new Set(),
    recoveringSwitches,
    new Set()
  );

  testCase.equal(telemetry[0].status, 'recovering', 'the blocked physical plane remains probing');
  testCase.equal(telemetry[0].redPacketCount, 0, 'recovery prevents ordinary red traffic');
  testCase.equal(telemetry[0].greenPacketCount, 0, 'recovery prevents ordinary green traffic');
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

test('packet-spraying adaptively shifts load away from congested physical planes', testCase => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);
  const congestedSpineIndex = LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length;
  const congestedSwitches = new Set([congestedSpineIndex]);

  reroutePackets(packets, routes, congestedSwitches);

  for (let conversationIndex = 0; conversationIndex < CONVERSATIONS.length; conversationIndex++) {
    const conversationPackets = packets.filter(
      packet => packet.conversationIndex === conversationIndex
    );
    const congestedPackets = conversationPackets.filter(packet =>
      packet.route.points.includes(SPINE_POSITIONS[0])
    );
    const healthyPackets = conversationPackets.filter(
      packet => !packet.route.points.includes(SPINE_POSITIONS[0])
    );

    testCase.ok(congestedPackets.length > 0, 'a congested plane still receives low-rate traffic');
    testCase.ok(
      congestedPackets.length < 4,
      'the congested plane carries fewer packets than equal round-robin spraying'
    );
    testCase.equal(
      healthyPackets.length + congestedPackets.length,
      conversationPackets.length,
      'congestion-aware routing preserves every packet in the transfer'
    );
  }

  reroutePackets(packets, routes);
  testCase.equal(
    packets.filter(packet => packet.route.points.includes(SPINE_POSITIONS[0])).length,
    12,
    'disabling adaptive pressure restores equal traffic across every plane'
  );

  reroutePackets(packets, routes, new Set([3]));
  testCase.equal(
    packets.filter(packet => packet.route.points.includes(SPINE_POSITIONS[0])).length,
    12,
    'a shared access bottleneck cannot be bypassed by choosing a different plane'
  );
  testCase.end();
});

test('packet-spraying congestion forms bounded alternating queues before switch glass', testCase => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);
  const congestedSwitchIndex = LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length + 1;
  const queue = makeSwitchQueuePackets(packets, congestedSwitchIndex, 12, 6);

  testCase.equal(queue.length, 6, 'the optical queue remains bounded to six visible packets');
  testCase.deepEqual(
    queue.map(packet => packet.conversationIndex),
    [0, 1, 0, 1, 0, 1],
    'the queue preserves alternating red and green packet order'
  );
  testCase.ok(
    queue.every(
      packet =>
        getDistance(packet.position, SWITCH_POSITIONS[congestedSwitchIndex]) > SPINE_SWITCH_RADIUS
    ),
    'queued packets stay outside the glass switch boundary'
  );
  testCase.ok(
    queue.every(packet => packet.strength > 0 && packet.strength < 1),
    'queue pressure remains softly bounded'
  );
  testCase.deepEqual(
    makeSwitchQueuePackets(packets, SWITCH_POSITIONS.length, 12),
    [],
    'unknown switches never create phantom queue packets'
  );
  testCase.deepEqual(
    makeSwitchQueuePackets(packets, congestedSwitchIndex, Number.NaN),
    [],
    'invalid animation times never produce invalid packet positions'
  );
  testCase.end();
});

test('packet-spraying telemetry reports per-plane load, failure, and recovery', testCase => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);
  const planeSwitchIndex = LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length;
  const congestedSwitches = new Set([planeSwitchIndex]);

  reroutePackets(packets, routes, congestedSwitches);
  const congestedTelemetry = makeNetworkPlaneTelemetry(
    routes,
    packets,
    new Set(),
    new Set(),
    congestedSwitches
  );

  testCase.equal(congestedTelemetry.length, 4, 'telemetry includes all four backbone paths');
  testCase.equal(congestedTelemetry[0].status, 'congested');
  testCase.ok(
    congestedTelemetry[0].redPacketCount < congestedTelemetry[1].redPacketCount,
    'telemetry exposes reduced red allocation on the congested plane'
  );
  testCase.ok(
    congestedTelemetry[0].greenPacketCount < congestedTelemetry[1].greenPacketCount,
    'telemetry exposes reduced green allocation on the congested plane'
  );

  const failedSwitches = new Set([planeSwitchIndex]);
  reroutePackets(packets, getHealthyConversationRoutes(routes, failedSwitches));
  const failedTelemetry = makeNetworkPlaneTelemetry(
    routes,
    packets,
    failedSwitches,
    new Set(),
    new Set()
  );
  testCase.equal(failedTelemetry[0].status, 'failed', 'a retired plane is visibly marked offline');
  testCase.equal(failedTelemetry[0].redPacketCount, 0, 'retired planes carry no red packets');
  testCase.equal(failedTelemetry[0].greenPacketCount, 0, 'retired planes carry no green packets');

  const recoveringSwitches = new Set([planeSwitchIndex]);
  reroutePackets(packets, getHealthyConversationRoutes(routes, new Set(), recoveringSwitches));
  const recoveringTelemetry = makeNetworkPlaneTelemetry(
    routes,
    packets,
    new Set(),
    recoveringSwitches,
    new Set()
  );
  testCase.equal(
    recoveringTelemetry[0].status,
    'recovering',
    'a repaired plane remains in recovery until its acknowledgment returns'
  );
  testCase.ok(
    recoveringTelemetry.slice(1).every(plane => plane.status === 'healthy'),
    'unaffected planes continue operating normally'
  );
  testCase.end();
});

test('packet-spraying fabric telemetry measures capacity and exceptional packet handling', testCase => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);
  const spineSwitchIndex = LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length + 1;
  const congestedSwitches = new Set([spineSwitchIndex]);
  reroutePackets(packets, routes, congestedSwitches);
  const congestedPaths = makeNetworkPlaneTelemetry(
    routes,
    packets,
    new Set(),
    new Set(),
    congestedSwitches
  );
  const queue = makeSwitchQueuePackets(packets, spineSwitchIndex, 12, 6);
  const congestedMetrics = makeNetworkFabricTelemetry(congestedPaths, queue, [], 12);

  testCase.equal(congestedMetrics.state, 'congested');
  testCase.equal(congestedMetrics.capacityPercent, 100, 'congestion preserves physical capacity');
  testCase.equal(congestedMetrics.queuedPacketCount, 6, 'the visible queue is measured directly');

  const failedSwitches = new Set([spineSwitchIndex]);
  const failureEvents = makeSwitchPacketEvents({
    packets,
    conversationRoutes: routes,
    scenario: 'failure',
    startedAt: 20,
    switchIndex: spineSwitchIndex
  });
  reroutePackets(packets, getHealthyConversationRoutes(routes, failedSwitches));
  const failedPaths = makeNetworkPlaneTelemetry(
    routes,
    packets,
    failedSwitches,
    new Set(),
    new Set()
  );
  const reroutingMetrics = makeNetworkFabricTelemetry(failedPaths, [], failureEvents, 20.8);

  testCase.equal(reroutingMetrics.state, 'rerouting');
  testCase.equal(reroutingMetrics.activePathCount, 3, 'one failed spine retires one path');
  testCase.equal(reroutingMetrics.capacityPercent, 75, 'capacity reflects three surviving paths');
  testCase.ok(reroutingMetrics.droppedPayloadCount > 0, 'in-flight loss is measured');
  testCase.ok(reroutingMetrics.retransmissionCount > 0, 'replacement traffic is measured');

  const probe = makeSwitchProbeEvent(routes, spineSwitchIndex, 30)!;
  const probingMetrics = makeNetworkFabricTelemetry(failedPaths, [], [probe], 30.2);
  testCase.equal(probingMetrics.state, 'probing', 'control traffic takes telemetry precedence');
  testCase.equal(probingMetrics.controlPacketCount, 1);
  testCase.end();
});

test('packet-spraying endpoint signals follow packet launch and delivery', testCase => {
  const packets = makePackets(makeConversationRoutes());
  const redPacket = packets.find(packet => packet.conversationIndex === 0)!;
  const launchTime = redPacket.launchTime + ENDPOINT_SIGNAL_DURATION * 0.4;
  const sourceSignals = makeEndpointSignals(packets, launchTime);
  const redSourceSignal = sourceSignals.find(
    signal => signal.conversationIndex === 0 && signal.kind === 'source'
  );

  testCase.equal(
    redSourceSignal?.hostIndex,
    CONVERSATIONS[0].sourceHostIndex,
    'red launch activity remains attached to the source server'
  );
  testCase.ok(
    (redSourceSignal?.strength ?? 0) > 0 && (redSourceSignal?.strength ?? 0) <= 1,
    'launch signals remain smoothly bounded'
  );

  const deliveryTime =
    redPacket.launchTime +
    redPacket.route.totalLength / PACKET_TRAVEL_SPEED +
    ENDPOINT_SIGNAL_DURATION * 0.4;
  const redDeliverySignal = makeEndpointSignals(packets, deliveryTime).find(
    signal => signal.conversationIndex === 0 && signal.kind === 'destination'
  );
  testCase.equal(
    redDeliverySignal?.hostIndex,
    CONVERSATIONS[0].destinationHostIndex,
    'delivery signals arrive at the intended destination server'
  );

  for (const packet of packets.filter(packet => packet.conversationIndex === 0)) {
    packet.enabled = false;
  }
  testCase.ok(
    makeEndpointSignals(packets, launchTime).every(signal => signal.conversationIndex !== 0),
    'disabled traffic cannot illuminate its source or destination'
  );
  testCase.deepEqual(makeEndpointSignals(packets, launchTime, 0), [], 'zero duration disables');
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
  const physicalLinkKeys = new Set(
    makeLinks(routes).map(link => makeLinkKey(link.start, link.end))
  );

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
    SWITCH_POSITIONS.every((switchPosition, switchIndex) => {
      const physicalProbe = makeSwitchProbeEvent(routes, switchIndex, 9);
      return (
        Boolean(physicalProbe?.route.points.includes(switchPosition)) &&
        physicalProbe!.route.points.every(
          (position, positionIndex) =>
            positionIndex === 0 ||
            physicalLinkKeys.has(
              makeLinkKey(physicalProbe!.route.points[positionIndex - 1], position)
            )
        )
      );
    }),
    'every physical switch has a control path composed entirely of real fabric links'
  );

  const confirmation = makeSwitchProbeConfirmationEvent(probe!);
  testCase.equal(probe?.duration, SWITCH_PROBE_DURATION, 'probe timing uses the shared duration');
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

test('packet-spraying recovery acknowledgments reject newly unavailable return paths', testCase => {
  const routes = makeConversationRoutes();
  const recoveringSpineIndex = LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length;
  const recoveringSwitches = new Set([recoveringSpineIndex]);
  const probe = makeSwitchProbeEvent(routes, recoveringSpineIndex, 15, recoveringSwitches)!;
  const confirmation = makeSwitchProbeConfirmationEvent(probe);
  const targetPositionIndex = probe.route.points.indexOf(SWITCH_POSITIONS[recoveringSpineIndex]);
  const intermediateSwitchPosition = probe.route.points.find(
    position =>
      position !== SWITCH_POSITIONS[recoveringSpineIndex] &&
      isFailedSwitchPosition(position, new Set([3]))
  );
  const downstreamSwitchIndex = probe.route.points
    .slice(targetPositionIndex + 1)
    .map(position => SWITCH_POSITIONS.indexOf(position))
    .find(switchIndex => switchIndex >= 0);

  testCase.ok(
    isSwitchProbeRouteAvailable(confirmation, recoveringSwitches),
    'the target switch itself remains available to control traffic while recovering'
  );
  testCase.ok(intermediateSwitchPosition, 'the confirmation traverses another physical switch');
  testCase.notOk(
    isSwitchProbeRouteAvailable(confirmation, new Set([...recoveringSwitches, 3])),
    'a newly failed intermediate switch invalidates the return acknowledgment'
  );
  testCase.ok(
    downstreamSwitchIndex !== undefined &&
      isSwitchProbeRouteAvailable(
        confirmation,
        new Set([...recoveringSwitches, downstreamSwitchIndex])
      ),
    'an unrelated downstream switch cannot invalidate the acknowledgment return path'
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
