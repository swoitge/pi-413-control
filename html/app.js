const socket = new WebSocket("ws://" + document.location.host);

api = {};

api.rpi = api.rpi || {};

api.rpi.setServoValue = function(pin, value) {
  console.log("set servo value", value);
  socket.send(JSON.stringify({msg:"setServoValue", pin, value}));
}

api.rpi.setServoRange = function(pin, range) {
  socket.send({msg:"setServoRange", pin, range});
}

// pwm range
new Slider('#slider1', {
  id:"slider-servo-1",
  tooltip: 'always',
  min: 0,
  max: 2048,
  //range: true,
  value: 500
}).on("slideStop", function(v){
  console.log("on slideStop", arguments);
  api.rpi.setServoRange(12, v);
});

var throttledSetPWM = _.throttle(function(v){
  console.log("on slideStop", arguments);
  api.rpi.setServoValue(12, v);
}, 1000);

//pwm value
new Slider('#slider2', {
  id:"slider-servo-2",
  tooltip: 'always',
  min: 70,
  max: 400,
  //range: true,
  value: 2000
}).on("slide", throttledSetPWM);
