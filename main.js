const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

const rpio = require('rpio');

var pin = 12;           /* P12/GPIO18 */
var range = 1024;       /* LEDs can quickly hit max brightness, so only use */
var max = 131072;          /*   the bottom 8th of a larger scale */
var clockdiv = 8;       /* Clock divider (PWM refresh rate), 8 == 2.4MHz */
var interval = 5;       /* setInterval timer, speed of pulses */
var times = 5;          /* How many times to pulse before exiting */

rpio.open(pin, rpio.PWM);
rpio.pwmSetClockDivider(clockdiv);
rpio.pwmSetRange(pin, range);

rpio.pwmSetData(pin, 80);
const baseDir = "/home/pi/pi-413-constrol/html/";

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
}).listen(8080);

const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send('something');
});

server.listen(8080);
