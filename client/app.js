

var setServoValue = function(pin, value) {
  console.log("set servo value", value);
  Meteor.call("setServoValue", pin, value);
}
var throttledSetPWM = _.throttle(function(v){
  console.log("on slideStop", arguments);
  api.rpi.setServoValue(12, v);
}, 1000);
