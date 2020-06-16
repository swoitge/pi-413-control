const socket = new WebSocket("ws://" + document.location.host);

api = {};

api.rpi = api.rpi || {};

var callbacks = {};
var callbackCount = 0;

api.rpi.setServoValue = function(pin, value) {
  console.log("set servo value", value);
  api.call("setServoValue", pin, value);
}

//api.rpi.requestI2C = createMethod("readI2C");

api.call = function() {

  var name = arguments[0];

  // prepare the sending
  var sendObj = {
    messageId : "msg_" + callbackCount++,
    method    : name,
    args      : [],
    callback  : false
  };

  // append all arguments except functions
  for(var i=1; i<arguments.length; i++) {
    var arg = arguments[i];
    if(typeof arg == "function") {
      // skip
    }
    else {
      sendObj.args.push(arg);
    }
  }

  var lastArg = arguments[arguments.length-1];
  if(typeof lastArg == "function") {
    // register callback
    sendObj.callback = true;
    callbacks[sendObj.messageId] = lastArg;
  }
  socket.send(JSON.stringify(sendObj));
}

api.rpi.requestRollPitch = function(callback) {
  var messageId = "msg_" + callbackCount++;
  socket.send(JSON.stringify({messageId, msg:"readRollPitch"}));
  callbacks[messageId] = callback;
}

var throttledSetPWM = _.throttle(function(v){
  console.log("on slideStop", arguments);
  api.rpi.setServoValue(12, v);
}, 1000);

var throttledSetInterval = _.throttle(function(v){
  //console.log("on slideStop", arguments);
  api.call("setLoopInterval", v);
}, 1000);

socket.onmessage = function(msg){
  //console.log("received message", msg);

  // skip something
  if(msg.data == "something") return;

  var data = JSON.parse(msg.data);
  if(callbacks[data.messageId]) {
    callbacks[data.messageId](data);
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

//pwm value
new Slider('#slider-interval', {
  id:"slider-interval",
  //tooltip: 'always',
  min: 10,
  max: 1000,
  //range: true,
  value: 100
}).on("slide", throttledSetInterval);
