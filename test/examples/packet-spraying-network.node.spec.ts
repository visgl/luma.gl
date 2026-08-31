// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  FAILURE_DETECTION_DELAY,
  ENDPOINT_SIGNAL_DURATION,
  PACKET_TRAVEL_SPEED,
  SWITCH_CONFIRMATION_DURATION,
  SWITCH_PROBE_DURATION,
  SWITCH_TRANSITION_WAVE_DURATION,
  getHealthyConversationRoutes,
  isSwitchProbeRouteAvailable,
  makeEndpointSignals,
  makeLinkPulses,
  makeLinkTraffic,
  makePackets,
  makeNetworkFabricTelemetry,
  makeNetworkPlaneTelemetry,
  makeNetworkSwitchPlaneTelemetry,
  makeSwitchPacketEvents,
  makeSwitchProbeConfirmationEvent,
  makeSwitchProbeEvent,
  makeSwitchQueuePackets,
  makeSwitchArrivals,
  makeSwitchTransitionWave,
  reroutePackets
} from '../../examples/showcase/packet-spraying/animation';
import {
  AGGREGATION_POSITIONS,
  AGGREGATION_SWITCH_RADIUS,
  CONVERSATIONS,
  HOST_POSITIONS,
  LEAF_SWITCH_RADIUS,
  LEAF_POSITIONS,
  NETWORK_SWITCH_PLANE_COUNT,
  SPINE_POSITIONS,
  SPINE_SWITCH_RADIUS,
  SWITCH_POSITIONS,
  getActivePlaneCount,
  getDistance,
  getNetworkPlaneSwitchIndices,
  isFailedSwitchPosition,
  makeConversationRoutes,
  makeLinks,
  makeNetworkPathFocus,
  makePickableNetworkNodes,
  makeSwitchGroups,
  makeLinkKey
} from '../../examples/showcase/packet-spraying/network';

it('packet-spraying network defines two switch planes and four independent spine paths', () => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);

  expect(HOST_POSITIONS.length, 'the server layer contains a four-by-four grid').toBe(16);
  expect(LEAF_POSITIONS.length, 'the access layer contains two rows of four switches').toBe(8);
  expect(AGGREGATION_POSITIONS.length, 'the plane layer contains two rows of four switches').toBe(
    8
  );
  expect(SPINE_POSITIONS.length, 'the backbone contains four independent spines').toBe(4);
  expect(NETWORK_SWITCH_PLANE_COUNT, 'the switch fabric contains two physical planes').toBe(2);
  expect(SWITCH_POSITIONS.length, 'all switch positions have stable picking indices').toBe(20);
  expect(routes.length, 'two conversations each have four independent routes').toBe(8);
  expect(getActivePlaneCount(routes), 'all four backbone paths start available').toBe(4);
  expect(packets.length, 'each conversation contributes one 24-packet burst').toBe(48);
  expect(makeLinks(routes).length, 'network links preserve the complete fabric').toBe(80);
  expect(
    makePickableNetworkNodes().length,
    'every server and switch has an explanatory picking record'
  ).toBe(HOST_POSITIONS.length + SWITCH_POSITIONS.length);
  expect(
    makeSwitchArrivals(packets).length,
    'each packet produces arrivals at its five intermediate switches'
  ).toBe(packets.length * 5);

  const redPacket = packets.find(packet => packet.conversationIndex === 0)!;
  const greenPacket = packets.find(packet => packet.conversationIndex === 1)!;
  const redAccessArrival =
    redPacket.launchTime +
    getDistance(redPacket.route.points[0], redPacket.route.points[1]) / PACKET_TRAVEL_SPEED;
  const greenAccessArrival =
    greenPacket.launchTime +
    getDistance(greenPacket.route.points[0], greenPacket.route.points[1]) / PACKET_TRAVEL_SPEED;
  expect(
    Boolean(Math.abs(greenAccessArrival - redAccessArrival - 0.07) < 0.00001),
    'red and green conversations arrive half a packet interval apart'
  ).toBe(true);
  void 0;
});

it('packet-spraying switches form spine and two complete physical-plane groups', () => {
  const groups = makeSwitchGroups();

  expect(
    groups.map(group => group.id),
    'semantic switch groups identify the spine and both planes'
  ).toEqual(['spine', 'plane-1', 'plane-2']);
  expect(
    groups.map(group => group.switchIndices.length),
    'spines contain four switches and each plane contains its access and aggregation switches'
  ).toEqual([4, 8, 8]);
  expect(
    groups.flatMap(group => group.switchIndices).sort((first, second) => first - second),
    'every pickable switch belongs to exactly one rendering group'
  ).toEqual(SWITCH_POSITIONS.map((_, switchIndex) => switchIndex));
  expect(
    Boolean(groups[1].switchIndices.every(switchIndex => SWITCH_POSITIONS[switchIndex][2] > 0)),
    'the first physical plane keeps its positive-depth switch row together'
  ).toBe(true);
  expect(
    Boolean(groups[2].switchIndices.every(switchIndex => SWITCH_POSITIONS[switchIndex][2] < 0)),
    'the second physical plane keeps its negative-depth switch row together'
  ).toBe(true);
  void 0;
});

it('packet-spraying path inspection follows both complete conversations through one spine', () => {
  const routes = makeConversationRoutes();

  for (let pathIndex = 0; pathIndex < SPINE_POSITIONS.length; pathIndex++) {
    const focus = makeNetworkPathFocus(routes, pathIndex)!;

    expect(focus.pathIndex, 'the focus identifies its physical backbone path').toBe(pathIndex);
    expect(focus.hostIndices.size, 'both source and destination server pairs participate').toBe(4);
    expect(focus.switchIndices.size, 'the focused path crosses five physical switches').toBe(5);
    expect(focus.linkKeys.size, 'shared links combine with both endpoint branches').toBe(8);
    expect(
      Boolean(
        focus.switchIndices.has(LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length + pathIndex)
      ),
      'the selected spine belongs to its focused route'
    ).toBe(true);
  }

  expect(makeNetworkPathFocus(routes, -1), 'negative path indices are rejected').toBe(null);
  expect(
    makeNetworkPathFocus(routes, SPINE_POSITIONS.length),
    'out-of-range path indices are rejected'
  ).toBe(null);
  expect(makeNetworkPathFocus([], 0), 'missing routes cannot produce a focus').toBe(null);
  void 0;
});

it('packet-spraying physical planes contain complete access and aggregation switch tiers', () => {
  for (let planeIndex = 0; planeIndex < NETWORK_SWITCH_PLANE_COUNT; planeIndex++) {
    const switchIndices = getNetworkPlaneSwitchIndices(planeIndex);

    expect(
      switchIndices,
      `plane ${planeIndex + 1} identifies its four access and four aggregation switches`
    ).toEqual([
      ...Array.from({length: 4}, (_, switchIndex) => planeIndex * 4 + switchIndex),
      ...Array.from(
        {length: 4},
        (_, switchIndex) => LEAF_POSITIONS.length + planeIndex * 4 + switchIndex
      )
    ]);
    expect(
      Boolean(
        switchIndices.every(
          switchIndex => switchIndex < LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length
        )
      ),
      `plane ${planeIndex + 1} excludes the independent backbone spines`
    ).toBe(true);
  }

  expect(getNetworkPlaneSwitchIndices(-1), 'negative plane indices are ignored').toEqual([]);
  expect(
    getNetworkPlaneSwitchIndices(NETWORK_SWITCH_PLANE_COUNT),
    'missing planes do not produce switch indices'
  ).toEqual([]);
  expect(getNetworkPlaneSwitchIndices(1.5), 'fractional plane indices are ignored').toEqual([]);
  void 0;
});

it('packet-spraying physical-plane telemetry preserves four independent backbone paths', () => {
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

  expect(switchPlaneTelemetry.length, 'telemetry reports both physical switch planes').toBe(2);
  expect(
    switchPlaneTelemetry[0].status,
    'a failed aggregation switch marks its physical plane as impaired'
  ).toBe('congested');
  expect(switchPlaneTelemetry[1].status, 'the opposite plane remains healthy').toBe('healthy');
  expect(
    Boolean(
      switchPlaneTelemetry.every(plane => plane.redPacketCount > 0 && plane.greenPacketCount > 0)
    ),
    'both physical planes continue carrying traffic on the remaining backbone paths'
  ).toBe(true);
  expect(
    getActivePlaneCount(getHealthyConversationRoutes(routes, failedSwitches)),
    'three of the four independent backbone paths remain available'
  ).toBe(3);
  void 0;
});

it('packet-spraying physical-plane telemetry preserves recovery while data routes are blocked', () => {
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

  expect(telemetry[0].status, 'the blocked physical plane remains probing').toBe('recovering');
  expect(telemetry[0].redPacketCount, 'recovery prevents ordinary red traffic').toBe(0);
  expect(telemetry[0].greenPacketCount, 'recovery prevents ordinary green traffic').toBe(0);
  void 0;
});

it('packet-spraying link traffic follows visible red and green packets', () => {
  const packets = makePackets(makeConversationRoutes());
  const firstRedPacket = packets.find(packet => packet.conversationIndex === 0)!;
  const firstGreenPacket = packets.find(packet => packet.conversationIndex === 1)!;
  const sharedLinkKey = makeLinkKey(firstRedPacket.route.points[1], firstRedPacket.route.points[2]);
  const timeOnSharedLink =
    firstRedPacket.launchTime +
    (firstRedPacket.route.cumulativeLengths[1] + 0.5) / PACKET_TRAVEL_SPEED;
  const traffic = makeLinkTraffic(packets, timeOnSharedLink);

  expect(
    traffic.get(sharedLinkKey),
    'shared switch links report interleaved red and green packets'
  ).toEqual({red: 1, green: 1});

  firstRedPacket.enabled = false;
  expect(
    makeLinkTraffic(packets, timeOnSharedLink).get(sharedLinkKey),
    'disabled or rerouted packets stop illuminating their former link'
  ).toEqual({red: 0, green: 1});

  firstGreenPacket.enabled = false;
  expect(
    makeLinkTraffic(packets, timeOnSharedLink).get(sharedLinkKey),
    'an empty link has no traffic illumination'
  ).toBe(undefined);

  void 0;
});

it('packet-spraying retransmissions and trimmed headers illuminate their physical links', () => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);
  const switchIndex = LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length;
  const failureEvents = makeSwitchPacketEvents({
    packets,
    conversationRoutes: routes,
    scenario: 'failure',
    startedAt: 12,
    switchIndex
  });
  const retransmission = failureEvents.find(event => event.kind === 'retransmission')!;
  const retransmissionLink = makeLinkKey(
    retransmission.route.points[0],
    retransmission.route.points[1]
  );
  const retransmissionTraffic = makeLinkTraffic([], retransmission.startedAt + 0.08, [
    retransmission
  ]);

  expect(
    Boolean((retransmissionTraffic.get(retransmissionLink)?.red ?? 0) > 0),
    'a replacement payload lights the source link it is currently crossing'
  ).toBe(true);

  const congestionEvents = makeSwitchPacketEvents({
    packets,
    conversationRoutes: routes,
    scenario: 'congestion',
    startedAt: 20,
    switchIndex
  });
  const trimmedHeader = congestionEvents.find(event => event.kind === 'trimmed-header')!;
  const switchPointIndex = trimmedHeader.route.points.indexOf(SWITCH_POSITIONS[switchIndex]);
  const downstreamLink = makeLinkKey(
    trimmedHeader.route.points[switchPointIndex],
    trimmedHeader.route.points[switchPointIndex + 1]
  );
  const trimmedHeaderTraffic = makeLinkTraffic([], trimmedHeader.startedAt + 0.08, [trimmedHeader]);

  expect(
    Boolean((trimmedHeaderTraffic.get(downstreamLink)?.red ?? 0) > 0),
    'a forwarded trimmed header lights the downstream link rather than its discarded payload'
  ).toBe(true);
  expect(
    makeLinkTraffic([], trimmedHeader.startedAt + trimmedHeader.duration + 0.01, [trimmedHeader])
      .size,
    'completed recovery packets stop illuminating links'
  ).toBe(0);
  void 0;
});

it('packet-spraying control probes illuminate otherwise unused physical links', () => {
  const routes = makeConversationRoutes();
  const switchIndex = 0;
  const probe = makeSwitchProbeEvent(routes, switchIndex, 9)!;
  const confirmation = makeSwitchProbeConfirmationEvent(probe);
  const physicalLinkKey = makeLinkKey(HOST_POSITIONS[switchIndex], LEAF_POSITIONS[switchIndex]);
  const probeTraffic = makeLinkTraffic([], probe.startedAt + probe.duration / 2, [probe]);
  const confirmationTraffic = makeLinkTraffic(
    [],
    confirmation.startedAt + confirmation.duration / 2,
    [confirmation]
  );

  expect(
    Boolean((probeTraffic.get(physicalLinkKey)?.blue ?? 0) > 0),
    'outbound blue probes light a physical link without application traffic'
  ).toBe(true);
  expect(
    Boolean(
      (confirmationTraffic.get(physicalLinkKey)?.blue ?? 0) > 0 &&
        (confirmationTraffic.get(physicalLinkKey)?.green ?? 0) > 0
    ),
    'returning confirmation packets give the same physical link a cyan highlight'
  ).toBe(true);
  expect(
    makeLinkTraffic([], probe.startedAt - 0.01, [probe]).size,
    'a control path remains dark until its probe actually departs'
  ).toBe(0);
  void 0;
});

it('packet-spraying link pulses follow alternating packets inside physical links', () => {
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

  expect(
    pulses.map(pulse => pulse.conversationIndex).sort(),
    'the shared link contains one red wake and one green wake'
  ).toEqual([0, 1]);
  expect(
    Boolean(pulses.every(pulse => getDistance(pulse.start, pulse.end) <= pulseLength + 0.00001)),
    'each directional wake stays within its configured physical length'
  ).toBe(true);
  expect(
    Boolean(
      pulses.every(pulse =>
        [pulse.start, pulse.end].every(
          position =>
            Math.abs(
              getDistance(linkStart, position) +
                getDistance(position, linkEnd) -
                getDistance(linkStart, linkEnd)
            ) < 0.00001
        )
      )
    ),
    'wake endpoints remain inside the current physical link'
  ).toBe(true);
  expect(
    Boolean(
      pulses.every(pulse => getDistance(linkStart, pulse.start) >= LEAF_SWITCH_RADIUS - 0.00001)
    ),
    'link wakes begin outside the access-switch glass surface'
  ).toBe(true);
  expect(
    Boolean(
      pulses.every(pulse => getDistance(pulse.end, linkEnd) >= AGGREGATION_SWITCH_RADIUS - 0.00001)
    ),
    'link wakes stop before the aggregation-switch glass surface'
  ).toBe(true);

  firstRedPacket.enabled = false;
  expect(
    makeLinkPulses(packets, animationTime, pulseLength)
      .filter(pulse => pulse.linkKey === sharedLinkKey)
      .map(pulse => pulse.conversationIndex),
    'disabling a packet removes its optical wake'
  ).toEqual([1]);

  firstGreenPacket.enabled = false;
  expect(
    makeLinkPulses(packets, animationTime, pulseLength).filter(
      pulse => pulse.linkKey === sharedLinkKey
    ).length,
    'idle links do not receive packet wakes'
  ).toBe(0);
  expect(
    makeLinkPulses(packets, animationTime, 0),
    'zero pulse length disables directional wakes'
  ).toEqual([]);
  void 0;
});

it('packet-spraying traffic immediately avoids and restores failed planes', () => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);
  const failedSpineIndex = LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length;
  const failedSwitches = new Set([failedSpineIndex]);
  const healthyRoutes = getHealthyConversationRoutes(routes, failedSwitches);

  expect(healthyRoutes.length, 'one failed spine removes one route per conversation').toBe(6);
  expect(getActivePlaneCount(healthyRoutes), 'three healthy planes remain online').toBe(3);
  expect(
    Boolean(isFailedSwitchPosition(SPINE_POSITIONS[0], failedSwitches)),
    'the failed spine is recognized from its world-space position'
  ).toBe(true);

  reroutePackets(packets, healthyRoutes);
  expect(Boolean(packets.every(packet => packet.enabled)), 'both conversations remain active').toBe(
    true
  );
  expect(
    Boolean(
      packets.every(packet =>
        packet.route.points.every(position => !isFailedSwitchPosition(position, failedSwitches))
      )
    ),
    'no packet continues through the failed switch'
  ).toBe(true);
  for (let conversationIndex = 0; conversationIndex < CONVERSATIONS.length; conversationIndex++) {
    const packetsByPlane = new Map<string, number>();
    for (const packet of packets.filter(packet => packet.conversationIndex === conversationIndex)) {
      const planeKey = packet.route.points[3].join(',');
      packetsByPlane.set(planeKey, (packetsByPlane.get(planeKey) || 0) + 1);
    }
    expect(
      [...packetsByPlane.values()],
      `conversation ${conversationIndex + 1} balances traffic across the remaining planes`
    ).toEqual([8, 8, 8]);
  }

  failedSwitches.clear();
  const restoredRoutes = getHealthyConversationRoutes(routes, failedSwitches);
  reroutePackets(packets, restoredRoutes);
  expect(getActivePlaneCount(restoredRoutes), 'restoring the switch restores its plane').toBe(4);
  expect(
    new Set(packets.map(packet => packet.route.points[3].join(','))).size,
    'packets resume using all four paths'
  ).toBe(4);
  void 0;
});

it('packet-spraying adaptively shifts load away from congested physical planes', () => {
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

    expect(
      Boolean(congestedPackets.length > 0),
      'a congested plane still receives low-rate traffic'
    ).toBe(true);
    expect(
      Boolean(congestedPackets.length < 4),
      'the congested plane carries fewer packets than equal round-robin spraying'
    ).toBe(true);
    expect(
      healthyPackets.length + congestedPackets.length,
      'congestion-aware routing preserves every packet in the transfer'
    ).toBe(conversationPackets.length);
  }

  reroutePackets(packets, routes);
  expect(
    packets.filter(packet => packet.route.points.includes(SPINE_POSITIONS[0])).length,
    'disabling adaptive pressure restores equal traffic across every plane'
  ).toBe(12);

  reroutePackets(packets, routes, new Set([3]));
  expect(
    packets.filter(packet => packet.route.points.includes(SPINE_POSITIONS[0])).length,
    'a shared access bottleneck cannot be bypassed by choosing a different plane'
  ).toBe(12);
  void 0;
});

it('packet-spraying congestion forms bounded alternating queues before switch glass', () => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);
  const congestedSwitchIndex = LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length + 1;
  const queue = makeSwitchQueuePackets(packets, congestedSwitchIndex, 12, 6);

  expect(queue.length, 'the optical queue remains bounded to six visible packets').toBe(6);
  expect(
    queue.map(packet => packet.conversationIndex),
    'the queue preserves alternating red and green packet order'
  ).toEqual([0, 1, 0, 1, 0, 1]);
  expect(
    Boolean(
      queue.every(
        packet =>
          getDistance(packet.position, SWITCH_POSITIONS[congestedSwitchIndex]) > SPINE_SWITCH_RADIUS
      )
    ),
    'queued packets stay outside the glass switch boundary'
  ).toBe(true);
  expect(
    Boolean(queue.every(packet => packet.strength > 0 && packet.strength < 1)),
    'queue pressure remains softly bounded'
  ).toBe(true);
  expect(
    makeSwitchQueuePackets(packets, SWITCH_POSITIONS.length, 12),
    'unknown switches never create phantom queue packets'
  ).toEqual([]);
  expect(
    makeSwitchQueuePackets(packets, congestedSwitchIndex, Number.NaN),
    'invalid animation times never produce invalid packet positions'
  ).toEqual([]);
  void 0;
});

it('packet-spraying telemetry reports per-plane load, failure, and recovery', () => {
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

  expect(congestedTelemetry.length, 'telemetry includes all four backbone paths').toBe(4);
  expect(congestedTelemetry[0].status, '').toBe('congested');
  expect(
    Boolean(congestedTelemetry[0].redPacketCount < congestedTelemetry[1].redPacketCount),
    'telemetry exposes reduced red allocation on the congested plane'
  ).toBe(true);
  expect(
    Boolean(congestedTelemetry[0].greenPacketCount < congestedTelemetry[1].greenPacketCount),
    'telemetry exposes reduced green allocation on the congested plane'
  ).toBe(true);

  const failedSwitches = new Set([planeSwitchIndex]);
  reroutePackets(packets, getHealthyConversationRoutes(routes, failedSwitches));
  const failedTelemetry = makeNetworkPlaneTelemetry(
    routes,
    packets,
    failedSwitches,
    new Set(),
    new Set()
  );
  expect(failedTelemetry[0].status, 'a retired plane is visibly marked offline').toBe('failed');
  expect(failedTelemetry[0].redPacketCount, 'retired planes carry no red packets').toBe(0);
  expect(failedTelemetry[0].greenPacketCount, 'retired planes carry no green packets').toBe(0);

  const recoveringSwitches = new Set([planeSwitchIndex]);
  reroutePackets(packets, getHealthyConversationRoutes(routes, new Set(), recoveringSwitches));
  const recoveringTelemetry = makeNetworkPlaneTelemetry(
    routes,
    packets,
    new Set(),
    recoveringSwitches,
    new Set()
  );
  expect(
    recoveringTelemetry[0].status,
    'a repaired plane remains in recovery until its acknowledgment returns'
  ).toBe('recovering');
  expect(
    Boolean(recoveringTelemetry.slice(1).every(plane => plane.status === 'healthy')),
    'unaffected planes continue operating normally'
  ).toBe(true);
  void 0;
});

it('packet-spraying fabric telemetry measures capacity and exceptional packet handling', () => {
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

  expect(congestedMetrics.state, '').toBe('congested');
  expect(congestedMetrics.capacityPercent, 'congestion preserves physical capacity').toBe(100);
  expect(congestedMetrics.queuedPacketCount, 'the visible queue is measured directly').toBe(6);

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

  expect(reroutingMetrics.state, '').toBe('rerouting');
  expect(reroutingMetrics.activePathCount, 'one failed spine retires one path').toBe(3);
  expect(reroutingMetrics.capacityPercent, 'capacity reflects three surviving paths').toBe(75);
  expect(Boolean(reroutingMetrics.droppedPayloadCount > 0), 'in-flight loss is measured').toBe(
    true
  );
  expect(Boolean(reroutingMetrics.retransmissionCount > 0), 'replacement traffic is measured').toBe(
    true
  );

  const probe = makeSwitchProbeEvent(routes, spineSwitchIndex, 30)!;
  const probingMetrics = makeNetworkFabricTelemetry(failedPaths, [], [probe], 30.2);
  expect(probingMetrics.state, 'control traffic takes telemetry precedence').toBe('probing');
  expect(probingMetrics.controlPacketCount, '').toBe(1);
  void 0;
});

it('packet-spraying endpoint signals follow packet launch and delivery', () => {
  const packets = makePackets(makeConversationRoutes());
  const redPacket = packets.find(packet => packet.conversationIndex === 0)!;
  const launchTime = redPacket.launchTime + ENDPOINT_SIGNAL_DURATION * 0.4;
  const sourceSignals = makeEndpointSignals(packets, launchTime);
  const redSourceSignal = sourceSignals.find(
    signal => signal.conversationIndex === 0 && signal.kind === 'source'
  );

  expect(
    redSourceSignal?.hostIndex,
    'red launch activity remains attached to the source server'
  ).toBe(CONVERSATIONS[0].sourceHostIndex);
  expect(
    Boolean((redSourceSignal?.strength ?? 0) > 0 && (redSourceSignal?.strength ?? 0) <= 1),
    'launch signals remain smoothly bounded'
  ).toBe(true);

  const deliveryTime =
    redPacket.launchTime +
    redPacket.route.totalLength / PACKET_TRAVEL_SPEED +
    ENDPOINT_SIGNAL_DURATION * 0.4;
  const redDeliverySignal = makeEndpointSignals(packets, deliveryTime).find(
    signal => signal.conversationIndex === 0 && signal.kind === 'destination'
  );
  expect(
    redDeliverySignal?.hostIndex,
    'delivery signals arrive at the intended destination server'
  ).toBe(CONVERSATIONS[0].destinationHostIndex);

  for (const packet of packets.filter(packet => packet.conversationIndex === 0)) {
    packet.enabled = false;
  }
  expect(
    Boolean(
      makeEndpointSignals(packets, launchTime).every(signal => signal.conversationIndex !== 0)
    ),
    'disabled traffic cannot illuminate its source or destination'
  ).toBe(true);
  expect(makeEndpointSignals(packets, launchTime, 0), 'zero duration disables').toEqual([]);
  void 0;
});

it('packet-spraying keeps repaired planes offline until a recovery probe confirms them', () => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);
  const recoveringSpineIndex = LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length;
  const recoveringSwitches = new Set([recoveringSpineIndex]);
  const recoveringRoutes = getHealthyConversationRoutes(routes, new Set(), recoveringSwitches);

  expect(getActivePlaneCount(recoveringRoutes), 'a repaired plane remains unavailable').toBe(3);
  reroutePackets(packets, recoveringRoutes);
  expect(
    Boolean(
      packets.every(packet =>
        packet.route.points.every(position => position !== SPINE_POSITIONS[0])
      )
    ),
    'ordinary traffic cannot enter a recovering switch'
  ).toBe(true);

  const recoveryProbe = makeSwitchProbeEvent(routes, recoveringSpineIndex, 15, recoveringSwitches);
  expect(recoveryProbe?.kind, 'a blue control packet verifies the repaired path').toBe('probe');
  expect(
    Boolean(recoveryProbe?.route.points.includes(SPINE_POSITIONS[0])),
    'the recovery probe reaches the repaired switch'
  ).toBe(true);

  const alternateProbe = makeSwitchProbeEvent(routes, recoveringSpineIndex, 15, new Set([3]));
  expect(Boolean(alternateProbe), 'control traffic can use another physical access route').toBe(
    true
  );
  expect(
    Boolean(alternateProbe?.route.points.every(position => position !== LEAF_POSITIONS[3])),
    'the physical probe avoids the unavailable conversation access switch'
  ).toBe(true);

  const blockedProbe = makeSwitchProbeEvent(
    routes,
    recoveringSpineIndex,
    15,
    new Set(LEAF_POSITIONS.map((_, switchIndex) => switchIndex))
  );
  expect(
    blockedProbe,
    'a probe cannot reach the switch when every access switch is unavailable'
  ).toBe(null);

  recoveringSwitches.clear();
  const confirmedRoutes = getHealthyConversationRoutes(routes, new Set(), recoveringSwitches);
  reroutePackets(packets, confirmedRoutes);
  expect(getActivePlaneCount(confirmedRoutes), 'probe confirmation restores the plane').toBe(4);
  expect(
    Boolean(packets.some(packet => packet.route.points.includes(SPINE_POSITIONS[0]))),
    'ordinary traffic resumes after the repaired route is confirmed'
  ).toBe(true);
  void 0;
});

it('packet-spraying physically probes unused switches and confirms the return path', () => {
  const routes = makeConversationRoutes();
  const unusedLeafIndex = 0;
  const probe = makeSwitchProbeEvent(routes, unusedLeafIndex, 9, new Set([unusedLeafIndex]));
  const physicalLinkKeys = new Set(
    makeLinks(routes).map(link => makeLinkKey(link.start, link.end))
  );

  expect(
    Boolean(routes.every(({route}) => !route.points.includes(LEAF_POSITIONS[unusedLeafIndex]))),
    'the access switch is absent from configured application conversations'
  ).toBe(true);
  expect(
    probe?.route.points,
    'a physical control packet can still reach the unused access switch'
  ).toEqual([HOST_POSITIONS[unusedLeafIndex], LEAF_POSITIONS[unusedLeafIndex]]);
  expect(
    Boolean(
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
      })
    ),
    'every physical switch has a control path composed entirely of real fabric links'
  ).toBe(true);

  const confirmation = makeSwitchProbeConfirmationEvent(probe!);
  expect(probe?.duration, 'probe timing uses the shared duration').toBe(SWITCH_PROBE_DURATION);
  expect(confirmation.kind, 'the response is a confirmation packet').toBe('probe-confirmation');
  expect(
    confirmation.startedAt,
    'the acknowledgment departs after the outbound control probe arrives'
  ).toBe(probe!.startedAt + probe!.duration);
  expect(confirmation.duration, 'confirmation uses the bounded acknowledgment duration').toBe(
    SWITCH_CONFIRMATION_DURATION
  );
  expect(
    confirmation.route,
    'the acknowledgment returns through the verified physical route'
  ).toEqual(probe!.route);
  expect(
    Boolean(
      confirmation.color[1] > confirmation.color[0] && confirmation.color[2] > confirmation.color[0]
    ),
    'the returning acknowledgment has a distinct cyan color'
  ).toBe(true);
  void 0;
});

it('packet-spraying recovery acknowledgments reject newly unavailable return paths', () => {
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

  expect(
    Boolean(isSwitchProbeRouteAvailable(confirmation, recoveringSwitches)),
    'the target switch itself remains available to control traffic while recovering'
  ).toBe(true);
  expect(
    Boolean(intermediateSwitchPosition),
    'the confirmation traverses another physical switch'
  ).toBe(true);
  expect(
    Boolean(isSwitchProbeRouteAvailable(confirmation, new Set([...recoveringSwitches, 3]))),
    'a newly failed intermediate switch invalidates the return acknowledgment'
  ).toBe(false);
  expect(
    Boolean(
      downstreamSwitchIndex !== undefined &&
        isSwitchProbeRouteAvailable(
          confirmation,
          new Set([...recoveringSwitches, downstreamSwitchIndex])
        )
    ),
    'an unrelated downstream switch cannot invalidate the acknowledgment return path'
  ).toBe(true);
  void 0;
});

it('packet-spraying transition waves distinguish switch failure from recovery', () => {
  const switchIndex = LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length;
  const failureWave = makeSwitchTransitionWave(switchIndex, 'failure', 4);
  const recoveryWave = makeSwitchTransitionWave(switchIndex, 'recovery', 8);

  expect(failureWave.switchIndex, 'failure stays anchored to its switch').toBe(switchIndex);
  expect(recoveryWave.switchIndex, 'recovery stays anchored to its switch').toBe(switchIndex);
  expect(failureWave.duration, '').toBe(SWITCH_TRANSITION_WAVE_DURATION);
  expect(recoveryWave.duration, '').toBe(SWITCH_TRANSITION_WAVE_DURATION);
  expect(Boolean(failureWave.color[0] > failureWave.color[1]), 'failure waves are warm red').toBe(
    true
  );
  expect(
    Boolean(recoveryWave.color[1] > recoveryWave.color[0]),
    'recovery waves are cool cyan'
  ).toBe(true);
  void 0;
});

it('packet-spraying stops a conversation when its only access switch fails', () => {
  const routes = makeConversationRoutes();
  const packets = makePackets(routes);
  const failedAccessSwitches = new Set([3]);
  const healthyRoutes = getHealthyConversationRoutes(routes, failedAccessSwitches);

  reroutePackets(packets, healthyRoutes);
  expect(healthyRoutes.length, 'both conversations share the failed access switch').toBe(0);
  expect(Boolean(packets.every(packet => !packet.enabled)), 'unreachable packets are hidden').toBe(
    true
  );
  expect(makeSwitchArrivals(packets).length, 'disabled traffic cannot flash switches').toBe(0);
  void 0;
});

it('packet-spraying failure drops packets before retransmitting on healthy planes', () => {
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

  expect(droppedPackets.length, 'both conversations lose two in-flight packets').toBe(4);
  expect(retransmittedPackets.length, 'each lost packet receives a retransmission').toBe(4);
  expect(
    droppedPackets.map(event => event.conversationIndex),
    'dropped red and green packets preserve their interleaved ordering'
  ).toEqual([0, 1, 0, 1]);
  expect(
    Boolean(droppedPackets.every(event => event.startedAt < startedAt + FAILURE_DETECTION_DELAY)),
    'packets are only lost during the brief failure-detection window'
  ).toBe(true);
  expect(
    Boolean(
      retransmittedPackets.every(event => event.startedAt >= startedAt + FAILURE_DETECTION_DELAY)
    ),
    'retransmissions begin once the failed path is retired'
  ).toBe(true);
  expect(
    Boolean(
      retransmittedPackets.every(event =>
        event.route.points.every(position => position !== SPINE_POSITIONS[0])
      )
    ),
    'retransmissions take healthy independent network planes'
  ).toBe(true);
  void 0;
});

it('packet-spraying congestion trims payloads while preserving packet headers', () => {
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

  expect(
    events.filter(event => event.kind === 'trimmed-payload').length,
    'each conversation sheds one congested payload'
  ).toBe(2);
  expect(
    events.filter(event => event.kind === 'trimmed-header').length,
    'each trimmed payload retains a forwarding header'
  ).toBe(2);
  expect(
    events.filter(event => event.kind === 'retransmission').length,
    'trim notifications trigger retransmissions through other planes'
  ).toBe(2);
  expect(getActivePlaneCount(routes), 'congestion does not retire the plane').toBe(4);

  const probe = makeSwitchProbeEvent(routes, congestedSpineIndex, 15);
  expect(probe?.kind, 'failed paths can be tested with a control probe').toBe('probe');
  expect(probe?.switchIndex, 'the probe targets the affected switch').toBe(congestedSpineIndex);
  void 0;
});
