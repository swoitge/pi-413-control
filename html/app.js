const socket = new WebSocket("ws://" + document.location.host);

api = {};

api.rpi = api.rpi || {};

var callbacks = {};
var callbackCount = 0;

api.rpi.setServoValue = function(pin, value) {
  console.log("set servo value", value);
  socket.send(JSON.stringify({msg:"setServoValue", pin, value}));
}

api.rpi.requestI2C = function(register, callback) {
  var messageId = "msg_" + callbackCount++;
  socket.send(JSON.stringify({msg:"readI2C", register}));
  callbacks[messageId] = callback;
}

var throttledSetPWM = _.throttle(function(v){
  console.log("on slideStop", arguments);
  api.rpi.setServoValue(12, v);
}, 1000);

socket.onmessage = function(msg){
  //console.log("received message", msg);

  // skip something
  if(msg.data == "something") return;

  var data = JSON.parse(msg.data);
  if(data.msg == "resultI2C") {
    if(callbacks[data.messageId]) {
      callbacks[data.messageId](data);
    }
  }
}

//pwm value
new Slider('#slider1', {
  id:"slider-servo-1",
  //tooltip: 'always',
  min: 70,
  max: 400,
  //range: true,
  value: 2000
}).on("slide", throttledSetPWM);
