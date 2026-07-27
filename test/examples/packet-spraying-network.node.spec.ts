// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  AGGREGATION_POSITIONS,
  CONVERSATIONS,
  HOST_POSITIONS,
  LEAF_POSITIONS,
  PACKET_TRAVEL_SPEED,
  SPINE_POSITIONS,
  SWITCH_POSITIONS,
  getActivePlaneCount,
  getDistance,
  getHealthyConversationRoutes,
  isFailedSwitchPosition,
  makeConversationRoutes,
  makeLinks,
  makePackets,
  makePickableNetworkNodes,
  makeSwitchArrivals,
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
