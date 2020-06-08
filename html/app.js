const socket = new WebSocket("ws://" + document.location.host);

api = {};
api.rpi = api.rpi || {};

api.rpi.setServo = function(pin, value) {
  socket.send({msg:"setServo", pin:pin, value:value});
}
