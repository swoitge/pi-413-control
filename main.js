const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
var rpio;

try {
  rpio = require('rpio');
}
catch(e){}

var pin = 12;           /* P12/GPIO18 */
var range = 1024;       /* LEDs can quickly hit max brightness, so only use */
var max = 131072;          /*   the bottom 8th of a larger scale */
var clockdiv = 8;       /* Clock divider (PWM refresh rate), 8 == 2.4MHz */
var interval = 5;       /* setInterval timer, speed of pulses */
var times = 5;          /* How many times to pulse before exiting */

if(rpio) {
  rpio.open(pin, rpio.PWM);
  rpio.pwmSetClockDivider(clockdiv);
  rpio.pwmSetRange(pin, range);
  rpio.pwmSetData(pin, 80);
}

const baseDir = "./html/";

/*jjjj*/
const server = http.createServer(function (req, res) {
  fs.readFile(baseDir + req.url, function (err,data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    if(message && message.msg == "setServo") {
      console.log('setServo: pin: %s', message.pin, message.value);
      if(rpio) {
        rpio.pwmSetData(pin, value);
      }
      else {
        //console.log('setServo: pin: %s', message.pin, message.value);
      }
    }
  });

  ws.send('something');
});

server.listen(8080);
