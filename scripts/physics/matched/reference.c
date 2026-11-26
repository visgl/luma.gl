// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
#define _POSIX_C_SOURCE 200809L
#include <box3d/box3d.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

static double milliseconds(void) {
  struct timespec timestamp;
  clock_gettime(CLOCK_MONOTONIC, &timestamp);
  return timestamp.tv_sec * 1000.0 + timestamp.tv_nsec / 1000000.0;
}
static double number(void) {
  double value;
  if (scanf("%lf", &value) != 1) { fprintf(stderr, "Invalid benchmark input\n"); exit(1); }
  return value;
}
static void states(b3BodyId* bodies, int count, int step) {
  printf("{\"step\":%d,\"states\":[", step);
  for (int index = 0; index < count; index++) {
    b3Pos position = b3Body_GetPosition(bodies[index]);
    b3Quat rotation = b3Body_GetRotation(bodies[index]);
    b3Vec3 velocity = b3Body_GetLinearVelocity(bodies[index]);
    b3Vec3 angular = b3Body_GetAngularVelocity(bodies[index]);
    printf("%s{\"position\":[%.17g,%.17g,%.17g],\"orientation\":[%.9g,%.9g,%.9g,%.9g],\"velocity\":[%.9g,%.9g,%.9g],\"angularVelocity\":[%.9g,%.9g,%.9g]}", index ? "," : "", position.x, position.y, position.z, rotation.v.x, rotation.v.y, rotation.v.z, rotation.s, velocity.x, velocity.y, velocity.z, angular.x, angular.y, angular.z);
  }
  printf("]}\n");
}
int main(void) {
  int count = (int)number(), jointCount = (int)number(), frames = (int)number(), warmup = (int)number(), substeps = (int)number(), workers = (int)number(), quality = (int)number(), stride = (int)number();
  double timeStep = number();
  if (count < 1 || count > 13000 || jointCount < 0 || jointCount > 64 || frames < 1 || frames > 10000 || warmup < 0 || warmup >= frames || substeps < 1 || substeps > 16 || workers < 1 || workers > 64 || stride < 1 || timeStep <= 0 || timeStep > 1) return 1;
  b3WorldDef worldDefinition = b3DefaultWorldDef();
  double gravity[3];
  for (int axis = 0; axis < 3; axis++) gravity[axis] = number();
  worldDefinition.gravity = (b3Vec3){gravity[0], gravity[1], gravity[2]};
  worldDefinition.enableContinuous = (int)number() != 0;
  worldDefinition.enableSleep = false;
  worldDefinition.restitutionThreshold = 0;
  worldDefinition.maximumLinearSpeed = 10000;
  worldDefinition.workerCount = workers;
  double setupStart = milliseconds();
  b3WorldId world = b3CreateWorld(&worldDefinition);
  b3BodyId* bodies = calloc(count, sizeof(b3BodyId));
  if (!bodies) return 1;
  for (int index = 0; index < count; index++) {
    b3BodyDef body = b3DefaultBodyDef();
    double record[19];
    for (int field = 0; field < 19; field++) record[field] = number();
    body.position = (b3Pos){record[0], record[1], record[2]};
    body.rotation = (b3Quat){{record[3], record[4], record[5]}, record[6]};
    body.linearVelocity = (b3Vec3){record[7], record[8], record[9]};
    body.angularVelocity = (b3Vec3){record[10], record[11], record[12]};
    float horizontal = record[13], depth = record[14], vertical = record[15], mass = record[16];
    body.type = mass == 0 ? b3_staticBody : b3_dynamicBody;
    body.enableSleep = false; body.linearDamping = 0; body.angularDamping = 0;
    bodies[index] = b3CreateBody(world, &body);
    b3BoxHull hull = b3MakeBoxHull(horizontal, depth, vertical);
    b3ShapeDef shape = b3DefaultShapeDef();
    shape.density = mass == 0 ? 0 : mass / (8 * horizontal * depth * vertical);
    shape.baseMaterial.friction = record[17]; shape.baseMaterial.restitution = record[18];
    b3CreateHullShape(bodies[index], &shape, &hull.base);
  }
  for (int index = 0; index < jointCount; index++) {
    int first = (int)number(), second = (int)number();
    float length = number();
    if (first < 0 || first >= count || second < 0 || second >= count) return 1;
    b3DistanceJointDef joint = b3DefaultDistanceJointDef();
    joint.base.bodyIdA = bodies[first]; joint.base.bodyIdB = bodies[second];
    joint.length = length; joint.enableSpring = false; joint.base.collideConnected = false;
    b3CreateDistanceJoint(world, &joint);
  }
  printf("{\"setupMilliseconds\":%.9g,\"bytesBefore\":%lld,\"workers\":%d,\"doublePrecision\":%s}\n", milliseconds() - setupStart, (long long)b3World_GetCounters(world).byteCount, b3World_GetWorkerCount(world), b3IsDoublePrecision() ? "true" : "false");
  printf("{\"parameters\":[");
  for (int index = 0; index < count; index++) {
    b3MassData mass = b3Body_GetMassData(bodies[index]);
    printf("%s{\"mass\":%.9g,\"inertia\":[%.9g,%.9g,%.9g]}", index ? "," : "", mass.mass, mass.inertia.cx.x, mass.inertia.cy.y, mass.inertia.cz.z);
  }
  printf("]}\n");
  if (quality) states(bodies, count, 0);
  double* timings = calloc(frames - warmup, sizeof(double));
  for (int frame = 0; frame < frames; frame++) {
    double start = milliseconds();
    b3World_Step(world, timeStep, substeps);
    double elapsed = milliseconds() - start;
    if (frame >= warmup) timings[frame - warmup] = elapsed;
    if (quality && ((frame + 1) % stride == 0 || frame + 1 == frames)) states(bodies, count, frame + 1);
  }
  printf("{\"bytesAfter\":%lld,\"timings\":[", (long long)b3World_GetCounters(world).byteCount);
  for (int index = 0; index < frames - warmup; index++) printf("%s%.9g", index ? "," : "", timings[index]);
  printf("]}\n");
  free(timings); free(bodies); b3DestroyWorld(world);
  return 0;
}
