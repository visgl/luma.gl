// graph.js
// provide some basic scene graph capabilities
import Model from './objects/model';

export default class Node {

  constructor(opt = {}) {
    // a model is associated with the node?
    if (opt.model) {
      if (model instanceof Model) {
        this.model = opt.model;
      } else {
        this.model = new PhiloGL.O3D.Model(opt.model);
      }
    }

    // only a range of components of the model
    // are related to this node?
    // range: {from, to}
    if (opt.range) {
      this.range = opt.range;
    }

    // only a set of indices from the model are
    // related to this node?
    if (opt.indices) {
      this.indices = opt.indices;
    }

    // and check for any children
    this.children = [];
    if (opt.children) {
      this.add.apply(this, opt.children);
    }

    // model position, rotation, scale and all in all matrix
    this.position = new Vec3();
    this.rotation = new Vec3();
    this.scale = new Vec3(1, 1, 1);

    // `end` is the absolute position
    this.endPosition = new Vec3();
    this.endRotation = new Vec3();
    this.endScale = new Vec3(1, 1, 1);

    this.matrix = new Mat4();
  }

  add() {
    var ch = this.children;
    for (var i = 0, l = arguments.length; i < l; ++i) {
      var elem = arguments[i];
      if (elem instanceof Node) {
        elem.parent = this;
        ch.push(elem);
      } else {
        var node = new Node(elem);
        node.parent = this;
        ch.push(node);
      }
    }
  }

  // will update everything
  update() {
    value: function() {
      var matrix = this.matrix,
          pos = this.endPosition,
          rot = this.endRotation,
          scale = this.endScale;

      matrix.id();
      matrix.$translate(pos.x, pos.y, pos.z);
      matrix.$rotateXYZ(rot.x, rot.y, rot.z);
      matrix.$scale(scale.x, scale.y, scale.z);

      if (this.model) {
        var model = this.model,
            vertices = model.vertices,
            normals = model.normals;

        if (this.range) {
          var range = this.range,
              from = range.from,
              to = range.to,
              vfrom = from * 3,
              vto = to * 3,
              vertices = 
              v = new Float32Array(3);

          for (var i = vfrom; i < vto; i += 3) {
            v[0] = vertices[i    ];
            v[1] = vertices[i + 1];
            v[2] = vertices[i + 2];
          }

        } else if (this.indices) {

        } else {

        }
      }
    }
  }

  transform() {

    if (!this.parent) {
      this.endPosition.setVec3(this.position);
      this.endRotation.setVec3(this.rotation);
      this.endScale.setVec3(this.scale);
    } else {
      var parent = this.parent;
      this.endPosition.setVec3(this.position.add(parent.endPosition));
      this.endRotation.setVec3(this.rotation.add(parent.endRotation));
      this.endScale.setVec3(this.scale.add(parent.endScale));
    }

    for (var i = 0, ch = this.children, l = ch.length; i < l; ++i) {
      ch[i].transform();
    }
  }

}
