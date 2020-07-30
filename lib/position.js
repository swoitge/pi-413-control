const _      = require('underscore');

var position;
var velocity;
var lastUpdate;
var positionValues;
var velocityValues;

var start = function() {
  position    = {x:0, y:0, z:0};
  velocity    = {x:0, y:0, z:0};
  lastUpdate  = new Date();

  // store arrays
  positionValues = [];
  velocityValues = [];
}

var stop  = function() {
  return {
    velocity : velocityValues,
    position : positionValues
  }
}

var setAcelleration = function(acceleration) {

  // calculate velocity and positions until now
  var now = new Date();
  var timeDiff = now.getTime() - lastUpdate.getTime();

  // calculate positions with last velocity
  position.x = position.x + velocity.x * timeDiff;
  position.y = position.y + velocity.y * timeDiff;
  position.z = position.z + velocity.z * timeDiff;


  // set new velocity values
  velocity.x = velocity.x + acceleration.x * timeDiff;
  velocity.y = velocity.y + acceleration.y * timeDiff;
  velocity.z = velocity.z + acceleration.z * timeDiff;

  // store
  positionValues.push(_.clone(position));
  velocityValues.push(_.clone(velocity));

  lastUpdate = now;
}


module.exports = {
  start,
  stop,
  setAcelleration
};
