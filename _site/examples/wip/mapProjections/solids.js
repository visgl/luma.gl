importScripts('../../build/PhiloGL.js');

PhiloGL.unpack(self);

//Pairing Heap
function PHeap(elem, subheaps) {
  if (elem && subheaps) {
    this.elem = elem;
    this.subheaps = subheaps.slice();
  } else {
    this.elem = false;
  }
}

(function() {

  function merge(h1, h2) {
    if (!h1 || !h1.elem) {
      return h2;
    } else if (!h2 || !h2.elem) {
      return h1;
    } else if (h1.elem.weight > h2.elem.weight) {
      h1.subheaps.unshift(h2);
      return new PHeap(h1.elem, h1.subheaps);
    } else {
      h2.subheaps.unshift(h1);
      return new PHeap(h2.elem, h2.subheaps);
    }
  }

    
  PHeap.prototype = {
    find: function() {
      if (!this.elem) {
        return null;
      }
      return this.elem;
    },

    insert: function(elem) {
      return merge(this, new PHeap(elem, []));
    },

    erase: function() {
      if (!this.elem) {
        return null;
      } else {
        return this.mergePairs(this.subheaps);
      }
    },

    mergePairs: function(subheaps) {
      var len = subheaps.length;
      if (len == 0) {
        return null;
      } else if (len == 1) {
        return subheaps[0];
      } else {
        return merge(merge(subheaps[0], subheaps[1]), this.mergePairs(subheaps.slice(2)));
      }
    }
  };

})();

//Graph class
function Graph() {
  this.nodes = [];
}

Graph.prototype = {
  addNode: function(index, node) {
    if (!this.nodes[index]) {
      this.nodes[index] = node;
      node.edges = {};
    }
    return this;
  },

  pushNode: function(node) {
    this.nodes.push(node);
    node.edges = {};
  },

  addEdge: function(index1, index2, edge) {
    if (!this.nodes[index1] || !this.nodes[index2]) {
      return this;
    }
    this.nodes[index1].edges[index2] = edge;
    this.nodes[index2].edges[index1] = edge;
    return this;
  },

  getNode: function(index) {
    return this.nodes[index];
  },

  getEdge: function(index1, index2) {
    if (this.nodes[index1]) {
      return this.nodes[index1].edges[index2];
    }
  },

  eachNode: function(fn) {
    this.nodes.forEach(fn);
  }
};

function Solids() {}

Solids.prototype = Object.create(null, {
  
  createTetra: {
    value: function(iterations) {
      if (this.tetra) return this.tetra;
      
      var graph = new Graph,
          vertices = [],
          indices = [],
          sq2 = Math.SQRT2,
          sqrt = Math.sqrt;

      vertices.push(0          , 0            , 1      ,
                    2 * sq2 / 3, 0            , - 1 / 3,
                    - sq2 / 3  , sqrt(6) / 3  , - 1 / 3,
                    - sq2 / 3  , - sqrt(6) / 3, - 1 / 3);
      
      indices.push(0, 1, 2,
                   0, 2, 3,
                   0, 3, 1,
                   1, 3, 2);

      //Add first nodes to graph
      for (var i = 0, l = vertices.length / 3; i < l; i++) {
        var i3 = i * 3;
        graph.addNode(i, {
          x: vertices[i3    ],
          y: vertices[i3 + 1],
          z: vertices[i3 + 2],
          weight: 0 
        });
      }

      return (this.tetra = this.processModel(graph, vertices, indices, iterations));
    }
  },

  createHexa: {
    value: function(iterations) {
      if (this.hexa) return this.hexa;
      
      var graph = new Graph,
          vertices = [],
          indices = [],
          connectivity = [],
          sqrt = Math.sqrt,
          sq3 = sqrt(3);

      vertices.push(-1 / sq3, -1 / sq3, -1 / sq3,
                     1 / sq3, -1 / sq3, -1 / sq3,
                     1 / sq3,  1 / sq3, -1 / sq3,
                    -1 / sq3,  1 / sq3, -1 / sq3,
                    -1 / sq3, -1 / sq3,  1 / sq3,
                     1 / sq3, -1 / sq3,  1 / sq3,
                     1 / sq3,  1 / sq3,  1 / sq3,
                    -1 / sq3,  1 / sq3,  1 / sq3);
      
      indices.push(0, 3, 2,
                   0, 4, 7,
                   6, 2, 3,
                   0, 2, 1,
                   0, 7, 3,
                   6, 3, 7,
                   0, 1, 5,
                   6, 5, 1,
                   6, 7, 4,
                   0, 5, 4,
                   6, 1, 2,
                   6, 4, 5);

      connectivity.push([0, 3, 2, 1],
                        [6, 5, 1, 2],
                        [0, 1, 5, 4],
                        [6, 2, 3, 7],
                        [0, 4, 7, 3],
                        [6, 7, 4, 5]);
      
      //Add first nodes to graph
      for (var i = 0, l = vertices.length / 3; i < l; i++) {
        var i3 = i * 3;
        graph.addNode(i, {
          x: vertices[i3    ],
          y: vertices[i3 + 1],
          z: vertices[i3 + 2],
          weight: 0
        });
      }

      return (this.hexa = this.processModel(graph, vertices, indices, iterations, connectivity));
    }
  },

  createOcta: {
    value: function(iterations) {
      if (this.octa) return this.octa;
      
      var graph = new Graph,
          vertices = [],
          indices = [],
          sqrt = Math.sqrt,
          sq3 = sqrt(3);

      vertices.push( 1,  0,  0,
                    -1,  0,  0,
                     0,  1,  0,
                     0, -1,  0,
                     0,  0,  1,
                     0,  0, -1);
      
      indices.push(4, 0, 2,
                   5, 1, 2,
                   5, 2, 0,
                   4, 2, 1,
                   4, 1, 3,
                   5, 3, 1,
                   4, 3, 0,
                   5, 0, 3);

      //Add first nodes to graph
      for (var i = 0, l = vertices.length / 3; i < l; i++) {
        var i3 = i * 3;
        graph.addNode(i, {
          x: vertices[i3    ],
          y: vertices[i3 + 1],
          z: vertices[i3 + 2],
          weight: 0
        });
      }

      return (this.octa = this.processModel(graph, vertices, indices, iterations));
    }
  },

  createDode: {
    value: function(iterations) {
      if (this.dode) return this.dode;
      
      var graph = new Graph,
          vertices = [],
          indices = [],
          connectivity = [],
          sqrt = Math.sqrt,
          sq3 = sqrt(3),
          a = 1 / sq3,
          b = sqrt((3 - sqrt(5)) / 6),
          c = sqrt((3 + sqrt(5)) / 6);

      vertices.push( a,  a,  a,
                     a,  a, -a,
                     a, -a,  a,
                     a, -a, -a,
                    -a,  a,  a,
                    -a,  a, -a,
                    -a, -a,  a,
                    -a, -a, -a,
                     b,  c,  0,
                    -b,  c,  0,
                     b, -c,  0,
                    -b, -c,  0,
                     c,  0,  b,
                     c,  0, -b,
                    -c,  0,  b,
                    -c,  0, -b,
                     0,  b,  c,
                     0, -b,  c,
                     0,  b, -c,
                     0, -b, -c);
      
      indices.push( 0,  8,  9,
                    0, 16, 17,
                   12,  2, 10,
                    9,  5, 15,
                    3, 19, 18,
                    7, 11,  6,
                    0,  9,  4,
                    0, 17,  2,
                   12, 10,  3,
                    9, 15, 14,
                    3, 18,  1,
                    7,  6, 14,
                    0,  4, 16,
                    0,  2, 12,
                   12,  3, 13,
                    9, 14,  4,
                    3,  1, 13,
                    7, 14, 15,
                    0, 12, 13,
                    8,  1, 18,
                   16,  4, 14,
                    6, 11, 10,
                    7, 15,  5,
                    7, 19,  3,
                    0, 13,  1,
                    8, 18,  5,
                   16, 14,  6,
                    6, 10,  2,
                    7,  5, 18,
                    7,  3, 10,
                    0,  1,  8,
                    8,  5,  9,
                   16,  6, 17,
                    6,  2, 17,
                    7, 18, 19,
                    7, 10, 11);

      connectivity.push([0, 8, 9, 4, 16],
                        [12, 2, 10, 3, 13],
                        [3, 19, 18, 1, 13],
                        [0, 12, 13, 1, 8],
                        [16, 4, 14, 6, 17],
                        [7, 15, 5, 18, 19],
                        [0, 16, 17, 2, 12],
                        [9, 5, 15, 14, 4],
                        [7, 11, 6, 14, 15],
                        [8, 1, 18, 5, 9],
                        [6, 11, 10, 2, 17],
                        [7, 19, 3, 10, 11]);
      //Add first nodes to graph
      for (var i = 0, l = vertices.length / 3; i < l; i++) {
        var i3 = i * 3;
        graph.addNode(i, {
          x: vertices[i3    ],
          y: vertices[i3 + 1],
          z: vertices[i3 + 2],
          weight: 0 
        });
      }

      return (this.dode = this.processModel(graph, vertices, indices, iterations, connectivity));
    }
  },
  
  createIco: {
    value: function(iterations) {
      if (this.ico) return this.ico;
      
      var graph = new Graph,
          vertices = [],
          indices = [],
          sqrt = Math.sqrt,
          t = (1 + sqrt(5)) / 2,
          len = sqrt(1 + t * t);

    vertices.push(-1 / len,  t / len,  0,
                   1 / len,  t / len,  0,
                  -1 / len, -t / len,  0,
                   1 / len, -t / len,  0,

                   0, -1 / len,  t / len,
                   0,  1 / len,  t / len,
                   0, -1 / len, -t / len,
                   0,  1 / len, -t / len,

                   t / len,  0, -1 / len,
                   t / len,  0,  1 / len,
                  -t / len,  0, -1 / len,
                  -t / len,  0,  1 / len);

    
      indices.push(0, 11, 5,
                   0, 5, 1,
                   0, 1, 7,
                   0, 7, 10,
                   0, 10, 11,

                   1, 5, 9,
                   5, 11, 4,
                   11, 10, 2,
                   10, 7, 6,
                   7, 1, 8,

                   3, 9, 4,
                   3, 4, 2,
                   3, 2, 6,
                   3, 6, 8,
                   3, 8, 9,

                   4, 9, 5,
                   2, 4, 11,
                   6, 2, 10,
                   8, 6, 7,
                   9, 8, 1);

      //Add first nodes to graph
      for (var i = 0, l = vertices.length / 3; i < l; i++) {
        var i3 = i * 3;
        graph.addNode(i, {
          x: vertices[i3    ],
          y: vertices[i3 + 1],
          z: vertices[i3 + 2],
          weight: 0 
        });
      }

      return (this.ico = this.processModel(graph, vertices, indices, iterations));
    }
  },


  processModel: {
    value: function(graph, vertices, indices, iterations, connectivity) {
      var ans = this.subdivide({
        graph: graph,
        vertices: vertices,
        indices: indices,
        iterations: iterations,
        connectivity: connectivity
      });

      ans.tree = this.maximalSpanningTree(ans.dual);

      //make unfolded model
      this.unfoldTree(ans.tree);

      //Add real vertices, normals and texCoords
      var vertices = [],
          endVertices = [],
          normals = [],
          endNormals = [],
          texCoords = [],
          endTexCoords = [],
          colors = [];
      
      ans.tree.eachNode(function(face, i) {
        face.nodes.forEach(function(n) {
          colors.push.apply(colors, n.color);
          vertices.push(n.x, n.y, n.z);
          endVertices.push(n.xf, n.yf, n.zf);
          
          texCoords.push(n.u, n.v);
          endTexCoords.push(n.u, n.v);
          
          normals.push(face.normal.x, 
                       face.normal.y, 
                       face.normal.z);
          endNormals.push(face.endNormal.x, 
                          face.endNormal.y, 
                          face.endNormal.z);
        });
      });
     
      ans.model = {
        vertices: vertices,
        normals: normals,
        texCoords: texCoords,
//        colors: colors,
        shininess: 32,
        textures: ['img/earth1.jpg', 'img/clouds.jpg'],
        program: 'earth',
        attributes: {
          endPosition: {
            value: endVertices,
            size: 3
          },
          endNormal: {
            value: endNormals,
            size: 3
          }
        }
      };

      return ans;
    }
  },
  
  subdivide: {
    value: function(options) {
      var graph = options.graph,
          vertices = options.vertices,
          indices = options.indices,
          iterations = options.iterations,
          connectivity = options.connectivity,
          dual = new Graph,
          acos = Math.acos,
          atan2 = Math.atan2,
          sqrt = Math.sqrt,
          pi = Math.PI,
          abs = Math.abs,
          pi2 = pi * 2,
          //graticule function
          wPhi = 0.00001,
          wLambda = 0.0001,
          phi0 = 0,
          lambda0 = 0,
          graticuleFn = function(wPhi, phi, phi0, wLambda, lambda, lambda0) {
            //postMessage([wPhi, phi, phi0, wLambda, lambda, lambda0]);
            //return - (wPhi * abs((2 * phi) - phi0) + wLambda * (abs((lambda + Math.PI) - lambda0) % pi2));
            // graticuleFn.maxPhi = graticuleFn.maxPhi || -Infinity;
            // graticuleFn.maxLambda = graticuleFn.maxLambda || -Infinity;
            // graticuleFn.minPhi = graticuleFn.minPhi || Infinity;
            // graticuleFn.minLambda = graticuleFn.minLambda || Infinity;

            // graticuleFn.maxPhi = Math.max(phi, graticuleFn.maxPhi);
            // graticuleFn.maxLambda = Math.max(lambda, graticuleFn.maxLambda);
            // graticuleFn.minPhi = Math.min(phi, graticuleFn.minPhi);
            // graticuleFn.minLambda = Math.min(lambda, graticuleFn.minLambda);

            var del = abs(lambda - lambda0) % pi2;
            if (del > Math.PI) {
              del = Math.PI * 2 - del;
            }
            return - (wPhi * abs(phi - phi0) + wLambda * del);
          };
      
      var getMiddlePoint = (function() {
        var pointMemo = {};
        
        return function(i1, i2, itern) {
          var index1 = i1,
              index2 = i2,
              n1 = graph.getNode(i1),
              n2 = graph.getNode(i2);

          i1 *= 3;
          i2 *= 3;
          
          var mini = i1 < i2 ? i1 : i2,
              maxi = i1 > i2 ? i1 : i2,
              key = mini + '|' + maxi;

          if (key in pointMemo) {
            return pointMemo[key];
          }

          var x1 = vertices[i1    ],
              y1 = vertices[i1 + 1],
              z1 = vertices[i1 + 2],
              x2 = vertices[i2    ],
              y2 = vertices[i2 + 1],
              z2 = vertices[i2 + 2],
              xm = (x1 + x2) / 2,
              ym = (y1 + y2) / 2,
              zm = (z1 + z2) / 2,
              len = sqrt(xm * xm + ym * ym + zm * zm);

          xm /= len;
          ym /= len;
          zm /= len;

          vertices.push(xm, ym, zm);

          var weight = 0;
          //if it's the first iteration then
          //add weights according to each face
          //connectivity
          if (itern == 2) {
            //if a connectivity array is provided
            //(which means the solid faces aren't triangles)
            if (false && connectivity) {
              for (var c = 0, lc = connectivity.length; c < lc; c++) {
                var conn = connectivity[c],
                    ci1 = conn.indexOf(index1),
                    ci2 = conn.indexOf(index2),
                    clen = conn.length;

                if (ci1 > -1 && ci2 > -1 && (((ci1 + 1) % clen) == ci2 || ((ci2 + 1) % clen) == ci1)) {
                  weight = 0;//1;//Math.random() < 0.5 ? 1 : 0.9999;
                  break;
                }
              }
              //they're not connected then just 0.
              if (!weight) {
                weight = 0;
              }
            } else {
              weight = 0;//1;//Math.random() < 0.5 ? 1 : 0.9999;
            }
          //else add weight by averaging other nodes' weights
          } else {
            weight = (n1.weight + n2.weight) / 2;
          }
          
          graph.pushNode({
            x: xm,
            y: ym,
            z: zm,
            weight: weight,
            itern: itern
          });

          return (pointMemo[key] = (vertices.length / 3 - 1));
        };
      })();

      for (var i = 0; i < iterations; i++) {
        var indices2 = [],
            itern = i + 2;
        for (var j = 0, l = indices.length; j < l; j += 3) {
          var a = getMiddlePoint(indices[j    ], indices[j + 1], itern),
              b = getMiddlePoint(indices[j + 1], indices[j + 2], itern),
              c = getMiddlePoint(indices[j + 2], indices[j    ], itern);

          indices2.push(indices[j], a, c,
                        indices[j + 1], b, a,
                        indices[j + 2], c, b,
                        a, b, c);
        }
        indices = indices2;
      }

      //Calculate texCoords and normals
      for (var i = 0, l = indices.length; i < l; i += 3) {
        var i1 = indices[i    ],
            i2 = indices[i + 1],
            i3 = indices[i + 2],
            node1 = graph.getNode(i1),
            node2 = graph.getNode(i2),
            node3 = graph.getNode(i3),
            in1 = i1 * 3,
            in2 = i2 * 3,
            in3 = i3 * 3,
            iu1 = i1 * 2,
            iu2 = i2 * 2,
            iu3 = i3 * 2,
            x1 = vertices[in1    ],
            y1 = vertices[in1 + 1],
            z1 = vertices[in1 + 2],
            theta1 = acos(z1 / sqrt(x1 * x1 + y1 * y1 + z1 * z1)),
            phi1 = atan2(y1, x1),
            v1 = theta1 / pi,
            u1 = 1 - phi1 / pi2,
            x2 = vertices[in2    ],
            y2 = vertices[in2 + 1],
            z2 = vertices[in2 + 2],
            theta2 = acos(z2 / sqrt(x2 * x2 + y2 * y2 + z2 * z2)),
            phi2 = atan2(y2, x2),
            v2 = theta2 / pi,
            u2 = 1 - phi2 / pi2,
            x3 = vertices[in3    ],
            y3 = vertices[in3 + 1],
            z3 = vertices[in3 + 2],
            theta3 = acos(z3 / sqrt(x3 * x3 + y3 * y3 + z3 * z3)),
            phi3 = atan2(y3, x3),
            v3 = theta3 / pi,
            u3 = 1 - phi3 / pi2,
            vec1 = {
              x: x3 - x2,
              y: y3 - y2,
              z: z3 - z2
            },
            vec2 = {
              x: x1 - x2,
              y: y1 - y2,
              z: z1 - z2
            },
            normal = Vec3.cross(vec1, vec2).$unit(),
            x12m = (x1 + x2) / 2,
            y12m = (y1 + y2) / 2,
            z12m = (z1 + z2) / 2,
            l12m = sqrt(x12m * x12m + y12m * y12m + z12m * z12m),
            x23m = (x2 + x3) / 2,
            y23m = (y2 + y3) / 2,
            z23m = (z2 + z3) / 2,
            l23m = sqrt(x23m * x23m + y23m * y23m + z23m * z23m),
            x31m = (x3 + x1) / 2,
            y31m = (y3 + y1) / 2,
            z31m = (z3 + z1) / 2,
            l31m = sqrt(x31m * x31m + y31m * y31m + z31m * z31m);

        x12m /= l12m;
        y12m /= l12m;
        z12m /= l12m;

        x23m /= l23m;
        y23m /= l23m;
        z23m /= l23m;
        
        x31m /= l31m;
        y31m /= l31m;
        z31m /= l31m;

        var phi12 = Math.atan(z12m / sqrt(x12m * x12m + y12m * y12m)),
            lambda12 = Math.atan2(y12m, x12m) + Math.PI,
            phi23 = Math.atan(z23m / sqrt(x23m * x23m + y23m * y23m)),
            lambda23 = Math.atan2(y23m, x23m) + Math.PI,
            phi31 = Math.atan(z31m / sqrt(x31m * x31m + y31m * y31m)),
            lambda31 = Math.atan2(y31m, x31m) + Math.PI;
        
        graph.addEdge(i1, i2, {
          n1: i1,
          n2: i2,
          weight: ((node1.weight + node2.weight) / 2 + graticuleFn(wPhi, phi12, phi0, wLambda, lambda12, lambda0))
        });
        
        graph.addEdge(i2, i3, {
          n1: i2,
          n2: i3,
          weight: ((node2.weight + node3.weight) / 2 + graticuleFn(wPhi, phi23, phi0, wLambda, lambda23, lambda0))
        });
        
        graph.addEdge(i3, i1, {
          n1: i3,
          n2: i1,
          weight: ((node3.weight + node1.weight) / 2 + graticuleFn(wPhi, phi31, phi0, wLambda, lambda31, lambda0))
        });

        node1.u = u1;
        node1.v = v1;
        node1.color = [node1.weight / 2, node1.weight / 2, node1.weight / 2, 1];
        
        node2.u = u2;
        node2.v = v2;
        node2.color = [node2.weight / 2, node2.weight / 2, node2.weight / 2, 1];
        
        node3.u = u3;
        node3.v = v3;
        node3.color = [node3.weight / 2, node3.weight / 2, node3.weight / 2, 1];

        //Add dual graph node
        dual.pushNode({
          indices: [i1, i2, i3],
          normal: normal,
          nodes: [Object.create(node1),
                  Object.create(node2),
                  Object.create(node3)]
        });
      }
      
      //Add dual graph edges
      var nodes = dual.nodes;
      for (var i = 0, ln = nodes.length; i < ln; i++) {
        var nodesi = nodes[i].nodes,
            indicesi = nodes[i].indices;

        for (var j = i + 1; j < ln; j++) {
          var nodesj = nodes[j].nodes,
              indicesj = nodes[j].indices,
              i0 = indicesj.indexOf(indicesi[0]) > -1,
              i1 = indicesj.indexOf(indicesi[1]) > -1,
              i2 = indicesj.indexOf(indicesi[2]) > -1;

          if (i0 && i1 || i1 && i2 || i0 && i2) {
            var edge = false;
            if (i0 && i1) {
              edge = graph.getEdge(indicesi[0], indicesi[1]);
            } else if (i1 && i2) {
              edge = graph.getEdge(indicesi[1], indicesi[2]);
            } else {
              edge = graph.getEdge(indicesi[0], indicesi[2]);
            }

            dual.addEdge(i, j, {
              n1: i,
              n2: j,
              weight: edge.weight
            });
          }
        }
      }

      return {
        graph: graph,
        dual: dual
      };
    }
  },

  getClosestIndex: {
    value: function(tree) {
      var count = Infinity,
          minIndex = 0;
      tree.nodes.forEach(function(n, i) {
        n.nodes.forEach(function(node) {
          if (node.y < count) {
            count = node.y;
            minIndex = i;
          }
        });
      });
      return minIndex;
    }
  },

  maximalSpanningTree: {
    value: function(graph) {
      var len = graph.nodes.length,
          tree = new Graph,
          index = this.getClosestIndex(graph),
          node = graph.getNode(index),
          heap = new PHeap;

      tree.addNode(index, Object.create(node));

      for (var i = 0; i < len -1; i++) {
        //Add all edges to the priority queue
        var edges = node.edges;
        for (var k in edges) {
          heap = heap.insert(edges[k]);
        }
        //Take the highest weight edge
        var edge = heap.find();
        while (edge && tree.nodes[edge.n1] && tree.nodes[edge.n2]) {
          heap = heap.erase();
          edge = heap && heap.find();
        }
        if (!edge) {
          console.log('Log: This shouldn\'t happen');
          break;
        }
        //Add the edge nodes
        if (!tree.nodes[edge.n1]) {
          tree.addNode(edge.n1, Object.create(graph.getNode(edge.n1)));
          node = graph.getNode(edge.n1);
        } else if (!tree.nodes[edge.n2]) {
          tree.addNode(edge.n2, Object.create(graph.getNode(edge.n2)));
          node = graph.getNode(edge.n2);
        }
        //Add the edge
        tree.addEdge(edge.n1, edge.n2, Object.create(edge));
      }
      return tree;
    }
  },

  unfoldTree: {
    value: function(tree) {
      var index = this.getClosestIndex(tree),
          faceFrom = tree.getNode(index),
          faceFromNodes = faceFrom.nodes,
          mark = !faceFrom.mark,
          edges = faceFrom.edges,
          stack = [faceFrom],
          normal = faceFrom.normal;

      //set end values for the nodes in the selected face
      faceFrom.endNormal = normal;
      faceFromNodes.forEach(function(n) {
        n.xf = n.x;
        n.yf = n.y;
        n.zf = n.z;
      });

      //for each face...
      while (stack.length) {
        faceFrom = stack.pop();
        faceFromNodes = faceFrom.nodes;
        faceFrom.mark = mark;
        edges = faceFrom.edges;
        
        //go through each adjacent face
        for (var k in edges) {
          var faceTo = tree.getNode(+k),
              faceToNodes = faceTo.nodes,
              faceToIndices = faceTo.indices,
              faceFromIndices = faceFrom.indices,
              shared = [], 
              notSharedFrom, notSharedTo;
          
          //We already went through this node
          if (faceTo.mark == mark)
            continue;

          //Add it to the stack
          stack.push(faceTo);

          //set end normal
          faceTo.endNormal = faceFrom.endNormal;

          //update shared nodes of the adjacent face with the end position and normal values
          //and identify shared nodes between faces
          notSharedTo = false;
          faceToIndices.forEach(function(index, i) {
            var indexOf = faceFromIndices.indexOf(index);
            if (indexOf >  -1) {
              var refNode = faceFromNodes[indexOf];
                  node = faceTo.nodes[i];
              
              node.xf = refNode.xf;
              node.yf = refNode.yf;
              node.zf = refNode.zf;

              shared.push(node);
            } else {
              notSharedTo = faceTo.nodes[i];
            }
          });

          notSharedFrom = false;
          faceFromIndices.forEach(function(index, i) {
            if (faceToIndices.indexOf(index) == -1) {
              notSharedFrom = faceFromNodes[i];
            }
          });

          var diff1 = {
              x: shared[0].xf - notSharedFrom.xf,
              y: shared[0].yf - notSharedFrom.yf,
              z: shared[0].zf - notSharedFrom.zf
            },
            diff2 = {
              x: shared[1].xf - notSharedFrom.xf,
              y: shared[1].yf - notSharedFrom.yf,
              z: shared[1].zf - notSharedFrom.zf
            },
            from = {
              x: notSharedFrom.xf,
              y: notSharedFrom.yf,
              z: notSharedFrom.zf
            },
            res = Vec3.add(from, diff1).$add(diff2);

          notSharedTo.xf = res.x;
          notSharedTo.yf = res.y;
          notSharedTo.zf = res.z;
        }
      }
    }
  }
});


onmessage = function(e) {
  var solids = new Solids();

  solids.createTetra(5);
  
  postMessage(20);

/*  solids.createHexa(1);

  postMessage(40);

  solids.createOcta(1);

  postMessage(60);

  solids.createDode(1);

  postMessage(80);

  solids.createIco(1);
*/
  postMessage(100);

  postMessage({
    tetra: solids.tetra.model,
//    hexa: solids.hexa.model,
//    octa: solids.octa.model,
//    dode: solids.dode.model,
//    ico: solids.ico.model
  });
};
