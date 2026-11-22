#!/usr/bin/env python3
"""Generate the original luma.gl Marionette Theater assets."""
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import base64
import json
import math
import struct
from pathlib import Path

DIRECTORY = Path(__file__).parent
PHYSICS = 'KHR_physics_rigid_bodies'
FACES = (
    ((1, 0, 0), (0, 0, -1), (0, 1, 0)), ((-1, 0, 0), (0, 0, 1), (0, 1, 0)),
    ((0, 1, 0), (1, 0, 0), (0, 0, -1)), ((0, -1, 0), (1, 0, 0), (0, 0, 1)),
    ((0, 0, 1), (1, 0, 0), (0, 1, 0)), ((0, 0, -1), (-1, 0, 0), (0, 1, 0)),
)


class Document:
    def __init__(self, name):
        self.data = bytearray()
        self.json = {
            'asset': {'version': '2.1', 'generator': name, 'copyright': 'vis.gl contributors'},
            'scene': 0, 'scenes': [{'nodes': []}], 'nodes': [], 'meshes': [], 'materials': [],
            'accessors': [], 'bufferViews': [],
        }

    def node(self, name, **props):
        index = len(self.json['nodes'])
        self.json['nodes'].append({'name': name, **props})
        return index

    def material(self, name, color, roughness, metallic=0):
        index = len(self.json['materials'])
        self.json['materials'].append({
            'name': name,
            'pbrMetallicRoughness': {
                'baseColorFactor': [*color, 1], 'roughnessFactor': roughness,
                'metallicFactor': metallic,
            },
        })
        return index

    def accessor(self, values, kind, component=5126, target=None, bounds=False):
        while len(self.data) % 4:
            self.data.append(0)
        width = len(values[0])
        offset = len(self.data)
        code = {5126: 'f', 5123: 'H'}[component]
        self.data += struct.pack('<' + code * (width * len(values)), *(v for row in values for v in row))
        view = {'buffer': 0, 'byteOffset': offset, 'byteLength': len(self.data) - offset}
        if target is not None:
            view['target'] = target
        view_index = len(self.json['bufferViews'])
        self.json['bufferViews'].append(view)
        accessor = {
            'bufferView': view_index, 'componentType': component,
            'count': len(values), 'type': kind,
        }
        if bounds:
            accessor['min'] = [min(row[i] for row in values) for i in range(width)]
            accessor['max'] = [max(row[i] for row in values) for i in range(width)]
        index = len(self.json['accessors'])
        self.json['accessors'].append(accessor)
        return index

    def mesh(self, name, parts, skinned=False):
        primitives = []
        for material in sorted({part[0] for part in parts}):
            positions, normals, joints, indices = [], [], [], []
            vertices_by_value = {}
            for part_material, joint, center, size, shape in parts:
                if part_material != material:
                    continue
                vertices = box(center, size) if shape == 'box' else sphere(center, size)
                for position, normal in vertices:
                    key = (position, normal, joint)
                    index = vertices_by_value.get(key)
                    if index is None:
                        index = len(positions)
                        vertices_by_value[key] = index
                        positions.append(position)
                        normals.append(normal)
                        joints.append((joint, 0, 0, 0))
                    indices.append((index,))
            attributes = {
                'POSITION': self.accessor(positions, 'VEC3', target=34962, bounds=True),
                'NORMAL': self.accessor(normals, 'VEC3', target=34962),
            }
            if skinned:
                attributes['JOINTS_0'] = self.accessor(joints, 'VEC4', 5123, 34962)
                attributes['WEIGHTS_0'] = self.accessor([(1, 0, 0, 0)] * len(joints), 'VEC4', target=34962)
            primitives.append({
                'attributes': attributes, 'material': material,
                'indices': self.accessor(indices, 'SCALAR', 5123, 34963),
            })
        index = len(self.json['meshes'])
        self.json['meshes'].append({'name': name, 'primitives': primitives})
        return index

    def save(self, name):
        if self.data:
            data = base64.b64encode(self.data).decode('ascii')
            self.json['buffers'] = [{
                'byteLength': len(self.data), 'uri': 'data:application/octet-stream;base64,' + data
            }]
        (DIRECTORY / name).write_text(json.dumps(self.json, separators=(',', ':')) + '\n')


def box(center, size):
    for normal, right, up in FACES:
        for horizontal, vertical in ((-1, -1), (1, -1), (1, 1), (-1, -1), (1, 1), (-1, 1)):
            yield tuple(
                center[axis] + size[axis] * (
                    normal[axis] + right[axis] * horizontal + up[axis] * vertical
                ) / 2 for axis in range(3)
            ), normal


def sphere(center, size):
    def vertex(row, column):
        phi, theta = math.pi * row / 6, math.tau * column / 10
        unit = (math.sin(phi) * math.cos(theta), math.cos(phi), math.sin(phi) * math.sin(theta))
        inverse_normal = tuple(unit[axis] / size[axis] for axis in range(3))
        length = math.hypot(*inverse_normal)
        return (
            tuple(center[axis] + unit[axis] * size[axis] / 2 for axis in range(3)),
            tuple(value / length for value in inverse_normal),
        )

    for row in range(6):
        for column in range(10):
            for vertical, horizontal in ((0, 0), (0, 1), (1, 1), (0, 0), (1, 1), (1, 0)):
                yield vertex(row + vertical, column + horizontal)


robot = Document('luma.gl Marionette Theater puppet')
teal = robot.material('Petrol enamel', (0.025, 0.29, 0.30), 0.30, 0.12)
brass = robot.material('Aged brass', (0.61, 0.35, 0.10), 0.31, 0.50)
ink = robot.material('Graphite rubber', (0.016, 0.027, 0.035), 0.52)
cream = robot.material('Porcelain ivory', (0.84, 0.68, 0.44), 0.34)
amber = robot.material('Amber glass', (0.94, 0.42, 0.055), 0.23, 0.05)

bones = []
centers = []
parts = []
shapes = []
root_nodes = robot.json['scenes'][0]['nodes']
joint_definitions = []
materials = [{'staticFriction': 0.78, 'dynamicFriction': 0.54, 'restitution': 0.07}]


def add_shape(size):
    index = len(shapes)
    shapes.append({'type': 'box', 'box': {'size': size}})
    return index


def limb(name, parent, position, size, offset, mass, swing=None):
    bone = len(bones)
    center = position if parent is None else tuple(a + b for a, b in zip(centers[parent], position))
    centers.append(center)
    node = robot.node(name, translation=position, children=[], extensions={
        PHYSICS: {'motion': {'mass': mass, 'centerOfMass': offset}}
    })
    bones.append(node)
    if parent is None:
        root_nodes.append(node)
    else:
        robot.json['nodes'][bones[parent]]['children'].append(node)

    collider = robot.node(name + ' collider', translation=offset, extensions={
        PHYSICS: {'collider': {'geometry': {'shape': add_shape(size)}, 'physicsMaterial': 0}}
    })
    children = robot.json['nodes'][node]['children']
    children.append(collider)
    if parent is not None:
        limits = [{'linearAxes': [0, 1, 2], 'min': 0, 'max': 0}]
        limits.extend({'angularAxes': [axis], 'min': -bound, 'max': bound}
                      for axis, bound in enumerate(swing))
        joint_index = len(joint_definitions)
        joint_definitions.append({'limits': limits})
        anchor = robot.node(name + ' parent anchor', translation=position)
        robot.json['nodes'][bones[parent]]['children'].append(anchor)
        socket = robot.node(name + ' joint', extensions={PHYSICS: {
            'joint': {'joint': joint_index, 'connectedNode': anchor, 'enableCollision': False}
        }})
        children.append(socket)
        parts.append((brass, bone, center, (0.16, 0.16, 0.16), 'sphere'))
    parts.append((teal, bone, tuple(a+b for a,b in zip(center,offset)), size, 'box'))
    return bone


def detail(bone, material, offset, size, shape='box'):
    parts.append((material, bone, tuple(a + b for a, b in zip(centers[bone], offset)), size, shape))


torso = limb('Torso', None, (0, 1.66, 0), (0.51, 0.59, 0.29), (0, 0.045, 0), 3.0)
head = limb('Head', torso, (0, 0.34, 0), (0.43, 0.35, 0.33), (0, 0.23, 0), 0.8, (0.45, 0.50, 0.44))
detail(torso, ink, (0, 0.045, 0.158), (0.37, 0.41, 0.044))
detail(torso, brass, (0, 0.068, 0.184), (0.31, 0.22, 0.025))
detail(torso, amber, (0, 0.067, 0.206), (0.135, 0.135, 0.034), 'sphere')
detail(torso, brass, (0, -0.18, 0), (0.54, 0.075, 0.32))
detail(head, ink, (0, 0.24, 0.169), (0.34, 0.205, 0.052))
detail(head, brass, (0, 0.41, 0), (0.44, 0.057, 0.33))
detail(head, brass, (0, 0.476, 0), (0.048, 0.12, 0.048))
detail(head, amber, (0, 0.55, 0), (0.11, 0.11, 0.11), 'sphere')
for side in (-1, 1):
    detail(head, cream, (side * 0.09, 0.272, 0.198), (0.068, 0.063, 0.024), 'sphere')
    detail(head, brass, (side * 0.228, 0.23, 0), (0.07, 0.15, 0.14), 'sphere')
for offset in (-0.063, 0, 0.063):
    detail(head, brass, (offset, 0.173, 0.198), (0.044, 0.016, 0.011))

arms = []
legs = []
for side, label in ((-1, 'Left'), (1, 'Right')):
    upper = limb(label + ' shoulder', torso, (side * 0.29, 0.21, 0), (0.15, 0.35, 0.18),
                 (0, -0.195, 0), 0.65, (1.1, 0.55, 1.1))
    forearm = limb(label + ' elbow', upper, (0, -0.40, 0), (0.16, 0.34, 0.19),
                   (0, -0.175, 0), 0.38, (1.15, 0.18, 0.85))
    detail(upper, cream, (0, -0.15, 0.095), (0.09, 0.18, 0.018))
    detail(forearm, ink, (0, -0.31, 0), (0.18, 0.16, 0.19))
    detail(forearm, brass, (0, -0.20, 0.100), (0.12, 0.09, 0.015))
    arms.append((side, upper, forearm))
    thigh = limb(label + ' hip', torso, (side * 0.145, -0.28, 0), (0.20, 0.43, 0.22),
                 (0, -0.225, 0), 0.95, (1.0, 0.25, 0.38))
    shin = limb(label + ' knee', thigh, (0, -0.46, 0), (0.20, 0.51, 0.26),
                (0, -0.255, 0.035), 0.65, (1.1, 0.17, 0.20))
    detail(thigh, brass, (0, -0.18, 0.113), (0.12, 0.18, 0.019))
    detail(shin, ink, (0, -0.49, 0.086), (0.23, 0.14, 0.37))
    detail(shin, cream, (0, -0.49, 0.204), (0.19, 0.10, 0.13))
    legs.append((side, thigh, shin))

root_nodes.append(robot.node('Puppet skin', mesh=robot.mesh('Painted marionette', parts, True), skin=0))
string_mesh = robot.mesh('Puppet strings', [(brass, 0, (0, 0, 0), (0.006, 1, 0.006), 'box')])
for name in ('Left string', 'Center string', 'Right string'):
    mesh = len(robot.json['meshes'])
    robot.json['meshes'].append({'name': name + ' mesh', 'primitives': robot.json['meshes'][string_mesh]['primitives']})
    root_nodes.append(robot.node(name, mesh=mesh))
root_nodes.append(robot.node('Stage collider', translation=(0, -0.10, 0), extensions={
    PHYSICS: {'collider': {'geometry': {'shape': add_shape((8, 0.2, 5))}, 'physicsMaterial': 0}}
}))
robot.json['skins'] = [{
    'joints': bones, 'skeleton': bones[0],
    'inverseBindMatrices': robot.accessor([
        (1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -x, -y, -z, 1) for x, y, z in centers
    ], 'MAT4'),
}]
robot.json['shapes'] = shapes
robot.json['extensionsUsed'] = [PHYSICS]
robot.json['extensions'] = {PHYSICS: {'physicsJoints': joint_definitions, 'physicsMaterials': materials}}
steps = 48
timestamps = [(3 * index / steps,) for index in range(steps + 1)]
time_accessor = robot.accessor(timestamps, 'SCALAR', bounds=True)
animation = {'name': 'Clockwork dance', 'samplers': [], 'channels': []}


def channel(bone, path, sample):
    values = [sample(math.tau * index / steps) for index in range(steps + 1)]
    index = len(animation['samplers'])
    animation['samplers'].append({
        'input': time_accessor, 'output': robot.accessor(values, 'VEC4' if path == 'rotation' else 'VEC3')
    })
    animation['channels'].append({'sampler': index, 'target': {'node': bones[bone], 'path': path}})


def turn(axis, angle):
    return tuple([math.sin(angle / 2) if index == axis else 0 for index in range(3)] + [math.cos(angle / 2)])


channel(torso, 'translation', lambda angle: (0.12 * math.sin(angle), 1.66 + 0.11 * math.cos(2 * angle), 0))
channel(torso, 'rotation', lambda angle: turn(2, 0.16 * math.sin(angle)))
channel(head, 'rotation', lambda angle: turn(1, 0.27 * math.sin(angle + 0.5)))
for side, upper, forearm in arms:
    channel(upper, 'rotation', lambda angle: turn(2, side * (0.60 + 0.33 * math.sin(angle + side))))
    channel(forearm, 'rotation', lambda angle: turn(0, -0.40 + 0.25 * math.sin(angle + side)))
for side, thigh, shin in legs:
    channel(thigh, 'rotation', lambda angle: turn(0, 0.33 * math.sin(angle + side * math.pi / 2)))
    channel(shin, 'rotation', lambda angle: turn(0, 0.35 + 0.23 * math.sin(angle + side * math.pi / 2)))
robot.json['animations'] = [animation]
robot.save('marionette.gltf')

stage = Document('luma.gl Marionette Theater stage')
walnut = stage.material('Dark walnut', (0.111, 0.049, 0.023), 0.50)
velvet = stage.material('Wine velvet', (0.242, 0.019, 0.042), 0.87)
dark_velvet = stage.material('Curtain folds', (0.119, 0.008, 0.026), 0.89)
stage_brass = stage.material('Brass trim', (0.63, 0.35, 0.085), 0.38, 0.40)
mat = stage.material('Petrol stage mat', (0.028, 0.100, 0.105), 0.85)
backdrop = stage.material('Backdrop', (0.070, 0.027, 0.038), 0.83)
parts = [
    (walnut, 0, (0, -0.22, 0), (7.4, 0.35, 3.85), 'box'),
    (mat, 0, (0, -0.087, 0.05), (6.98, 0.17, 3.45), 'box'),
    (stage_brass, 0, (0, -0.15, 1.934), (7.35, 0.04, 0.026), 'box'),
    (backdrop, 0, (0, 1.68, -1.79), (7.22, 3.52, 0.13), 'box'),
    (walnut, 0, (0, 3.29, -0.75), (7.42, 0.44, 0.49), 'box'),
    (stage_brass, 0, (0, 3.12, -0.485), (7.40, 0.055, 0.042), 'box'),
    (stage_brass, 0, (0, 3.42, -0.485), (7.40, 0.04, 0.042), 'box'),
]
for side in (-1, 1):
    parts.append((walnut, 0, (side * 3.61, 1.58, -0.71), (0.31, 3.23, 0.43), 'box'))
    parts.append((stage_brass, 0, (side * 3.60, 1.58, -0.476), (0.06, 3.06, 0.04), 'box'))
    for fold in range(6):
        distance = 2.72 + fold * 0.125
        parts.append((velvet if fold % 2 == 0 else dark_velvet, 0,
                      (side * distance, 1.63, -0.74 - fold * 0.044), (0.15, 3.10, 0.20), 'box'))
    for inset in range(13):
        parts.append((stage_brass, 0, (side * (0.075 + inset * 0.27), -0.24, 1.939),
                      (0.035, 0.035, 0.035), 'sphere'))
stage_root = stage.node('Marionette Theater', mesh=stage.mesh('Stage and curtains', parts))
first = stage.node('Opal', translation=(-1.12, 0, 0.26), externalAsset=0, boundingVolume={
    'shape': 0, 'translation': (0, 1.48, 0)
})
second = stage.node('Copper', translation=(1.12, 0, 0.26), externalAsset=0, boundingVolume={
    'shape': 0, 'translation': (0, 1.48, 0)
})
stage.json['nodes'][stage_root]['children'] = [first, second]
stage.json['scenes'][0]['nodes'] = [stage_root]
stage.json['files'] = [{'uri': 'marionette.gltf', 'mimeType': 'model/gltf+json'}]
stage.json['externalAssets'] = [{'file': 0}]
stage.json['shapes'] = [{'type': 'box', 'box': {'size': [2.0, 3.0, 1.3]}}]
stage.save('theater.gltf')
