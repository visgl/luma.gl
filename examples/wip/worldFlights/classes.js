//Log
//Singleton that logs information
//Log singleton
var Log = {
  elem: null,
  timer: null,
  
  getElem: function() {
    if (!this.elem) {
      return (this.elem = $('log-message'));
    }
    return this.elem;
  },
  
  write: function(text, hide) {
    if (this.timer) {
      this.timer = clearTimeout(this.timer);
    }
    
    var elem = this.getElem(),
        style = elem.parentNode.style;

    elem.innerHTML = text;
    style.display = '';

    if (hide) {
      this.timer = setTimeout(function() {
        style.display = 'none';
      }, 2000);
    }
  }
};

//RightMenu
var RightMenu = function(airlineList, airlineMgr) {
  var me = this;
  me.airlineList = airlineList;
  me.airlineMgr = airlineMgr;
  me.selectedAirlines = $('selected-airlines');
  
  airlineList.addEventListener('mousemove', function(e) { me.onMouseMove(e); }, false);
  airlineList.addEventListener('mouseout', function(e) { me.onMouseOut(e); }, false);
  airlineList.addEventListener('change', function(e) { me.onChange(e); }, false);

  me.selectedAirlines.addEventListener('click', function(e) { me.onClick(e); }, false);
  me.selectedAirlines.addEventListener('mousemove', function(e) { me.onHover(e); }, false);
  me.selectedAirlines.addEventListener('mouseout', function (e) { me.onLeave(e); }, false);
};

RightMenu.prototype = {
  load: function(html) {
    this.airlineList.innerHTML = html;
  },

  onMouseMove: function(e) {
    var target = e.target,
        nodeName = target.nodeName;

    if (nodeName == 'INPUT') {
      target = target.parentNode;
    }

    if (nodeName == 'LABEL') {
      target = target.parentNode;
    }

    if (target.nodeName == 'LI') {
      var elem = target,
          prev = elem,
          next = elem.nextSibling,
          x = e.pageX,
          y = e.pageY,
          tol = 30,
          box, elemY, style, lerp;

      while (prev || next) {
        if (prev) {
          style = prev.style;
          box = prev.getBoundingClientRect();
          elemY = (box.top + box.bottom) / 2;
          lerp = (1 + Math.min(Math.abs(y - elemY), tol) / tol * -1);
          prev = prev.previousSibling;
          style.fontSize = (1 + (1.6 - 1) * lerp) + 'em';
        }
        if (next) {
          style = next.style;
          box = next.getBoundingClientRect();
          elemY = (box.top + box.bottom) / 2;
          lerp = (1 + Math.min(Math.abs(y - elemY), tol) / tol  * -1);
          next = next.nextSibling;
          style.fontSize = (1 + (1.6 - 1) * lerp) + 'em';
        }
      }
    }  
  },

  onMouseOut: function(e) {
    var nodeName = e.relatedTarget && e.relatedTarget.nodeName;
    if (nodeName && 'INPUT|LI|LABEL'.indexOf(nodeName) == -1) {
      Array.prototype.slice.call(airlineList.getElementsByTagName('li')).forEach(function(elem) {
        elem.style.fontSize = '1em';
      });
    }
  },

  onChange: function(e) {
    var checkbox = e.target,
        label = checkbox.parentNode,
        airlineId = checkbox.id.split('-')[1],
        name = label.textContent,
        airlineMgr = this.airlineMgr,
        color = airlineMgr.getColor(airlineId) || airlineMgr.getAvailableColor();

    if (checkbox.checked) {
      this.selectedAirlines.innerHTML += '<li id=\'' + airlineId + '-selected\'>' +
        '<input type=\'checkbox\' checked id=\'' + airlineId + '-checkbox-selected\' />' + 
        '<div class=\'square\' style=\'background-color:rgb(' + color + ');\' ></div>' + 
        name + '</li>';
    } else {
      var node = $(airlineId + '-selected');
      node.parentNode.removeChild(node);
    }
  },

  onClick: function(e) {
    var target = e.target, node;
    if (target.nodeName == 'INPUT') {
      var airlineId = target.parentNode.id.split('-')[0];
      var checkbox = $('checkbox-' + airlineId);
      checkbox.checked = false;
      airlineMgr.remove(airlineId);
      target = target.parentNode;
      node = target.nextSibling || target.previousSibling;
      target.parentNode.removeChild(target);
      if (node && node.id) {
        centerAirline(node.id.split('-')[0]);
      }
    } else {
      if (target.nodeName == 'DIV') {
        target = target.parentNode;
      }
      centerAirline(target.id.split('-')[0]);
    }
  },

  onHover: function(e) {
    var target = e.target, airlineId;
    if (target.nodeName == 'INPUT') {
      airlineId = target.parentNode.id.split('-')[0];
    } else {
      if (target.nodeName == 'DIV') {
        target = target.parentNode;
      }
      airlineId = target.id.split('-')[0];
    }
    for (var name in models.airlines) {
      models.airlines[name].lineWidth = name == airlineId ? 2 : 1;
    }
  },
  
  onLeave: function(e) {
    var rt = e.relatedTarget,
        pn = rt && rt.parentNode,
        pn2 = pn && pn.parentNode;

    if (rt != this.selectedAirlines && 
        pn != this.selectedAirlines &&
       pn2 != this.selectedAirlines) {
      
      for (var name in models.airlines) {
        models.airlines[name].lineWidth = 1;
      }
    }
  }
};

//AirlineManager
//Takes care of adding and removing routes
//for the selected airlines
var AirlineManager = function(data, models) {

  var airlineIdColor = {};
  
  var availableColors = {
    '171, 217, 233': 0,
    '253, 174, 97': 0,
    '244, 109, 67': 0,
    '255, 115, 136': 0,
    '186, 247, 86': 0,
    '220, 50, 50': 0
  };

  var getAvailableColor = function() {
    var min = Infinity,
        res = false;
    for (var color in availableColors) {
      var count = availableColors[color];
      if (count < min) {
        min = count;
        res = color;
      }
    }
    return res;
  };

  return {
    
    airlineIds: [],

    getColor: function(airlineId) {
        return airlineIdColor[airlineId];
    },

    getAvailableColor: getAvailableColor,

    add: function(airline) {
      var airlineIds = this.airlineIds,
          color = getAvailableColor(),
          routes = data.airlinesRoutes[airline],
          airlines = models.airlines,
          model = airlines[airline],
          samplings = 10,
          vertices = [],
          indices = [],
          fromTo = [],
          sample = [],
          parsedColor;

      parsedColor = color.split(',');
      parsedColor = [parsedColor[0] / (255 * 1.3), 
                     parsedColor[1] / (255 * 1.3), 
                     parsedColor[2] / (255 * 1.3)];
      
      if (model) {
        model.uniforms.color = parsedColor;
      } else {

        for (var i = 0, l = routes.length; i < l; i++) {
          var ans = this.createRoute(routes[i], vertices.length / 3);
          vertices.push.apply(vertices, ans.vertices);
          fromTo.push.apply(fromTo, ans.fromTo);
          sample.push.apply(sample, ans.sample);
          indices.push.apply(indices, ans.indices);
        }

        airlines[airline] = model = new O3D.Model({
          vertices: vertices,
          indices: indices,
          program: 'airline_layer',
          uniforms: {
            color: parsedColor
          },
          render: function(gl, program, camera) {
              gl.lineWidth(this.lineWidth || 1);
              gl.drawElements(gl.LINES, this.$indicesLength, gl.UNSIGNED_SHORT, 0);
          },
          attributes: {
            fromTo: {
              size: 4,
              value: new Float32Array(fromTo)
            },
            sample: {
              size: 1,
              value: new Float32Array(sample)
            }
          }
        });

        model.fx = new Fx({
          transition: Fx.Transition.Quart.easeOut
        });
      }
      
      this.show(model);

      airlineIds.push(airline);
      //set color for airline Id
      availableColors[color]++;
      airlineIdColor[airline] = color;
    },
    
    remove: function(airline) {
      var airlines = models.airlines,
          model = airlines[airline],
          color = airlineIdColor[airline];

      this.hide(model);

      //unset color for airline Id.
      availableColors[color]--;
      delete airlineIdColor[airline];
    },

    show: function(model) {
      model.uniforms.animate = true;
      this.app.scene.add(model);
      model.fx.start({
        delay: 0,
        duration: 1800,
        onCompute: function(delta) {
          model.uniforms.delta = delta;
        },
        onComplete: function() {
          model.uniforms.animate = false;
        }
      });
    },

    hide: function(model) {
      var me = this;
      model.uniforms.animate = true;
      model.fx.start({
        delay: 0,
        duration: 900,
        onCompute: function(delta) {
          model.uniforms.delta = (1 - delta);
        },
        onComplete: function() {
          model.uniforms.animate = false;
          me.app.scene.remove(model);
        }
      });
    },

    getCoordinates: function(from, to) {
      var pi = Math.PI,
          pi2 = pi * 2,
          sin = Math.sin,
          cos = Math.cos,
          theta = pi2 - (+to + 180) / 360 * pi2,
          phi = pi - (+from + 90) / 180 * pi,
          sinTheta = sin(theta),
          cosTheta = cos(theta),
          sinPhi = sin(phi),
          cosPhi = cos(phi),
          p = new Vec3(cosTheta * sinPhi, cosPhi, sinTheta * sinPhi);

      return {
        theta: theta,
        phi: phi,
        p: p
      };
    },

    //creates a quadratic bezier curve as a route
    createRoute: function(route, offset) {
      var key1 = route[2] + '^' + route[1],
          city1 = data.cities[key1],
          key2 = route[4] + '^' + route[3],
          city2 = data.cities[key2];

      if (!city1 || !city2) {
        return {
          vertices: [],
          from: [],
          to: [],
          indices: []
        };
      }

      var c1 = this.getCoordinates(city1[2], city1[3]),
          c2 = this.getCoordinates(city2[2], city2[3]),
          p1 = c1.p,
          p2 = c2.p,
          p3 = p2.add(p1).$scale(0.5).$unit().$scale(p1.distTo(p2) / 3 + 1.2),
          theta1 = c1.theta,
          theta2 = c2.theta,
          phi1 = c1.phi,
          phi2 = c2.phi,
          pArray = [],
          pIndices = [],
          fromTo = [],
          sample = [],
          t = 0,
          count = 0,
          samplings = 10,
          deltat = 1 / samplings;

      for (var i = 0; i <= samplings; i++) {
        pArray.push(p3[0], p3[1], p3[2]);
        fromTo.push(theta1, phi1, theta2, phi2);
        sample.push(i);

        if (i !== 0) {
          pIndices.push(i -1, i);
        }
      }

      return {
        vertices: pArray,
        fromTo: fromTo,
        sample: sample,
        indices: pIndices.map(function(i) { return i + offset; }),
        p1: p1,
        p2: p2
      };
    }
  };

};
