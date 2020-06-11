const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const mpu = require("./lib/mpu-access.js")
// raspberry only libs
var rpio, i2c, Gpio;

try {
  rpio = require('rpio');
  i2c = require('i2c-bus');
  Gpio = require('pigpio').Gpio;
}
catch(e){}

var pin = 12;           /* P12/GPIO18 */
var range = 1024;       /* LEDs can quickly hit max brightness, so only use */
var max = 131072;          /*   the bottom 8th of a larger scale */
var clockdiv = 8;       /* Clock divider (PWM refresh rate), 8 == 2.4MHz */
var interval = 5;       /* setInterval timer, speed of pulses */
var times = 5;          /* How many times to pulse before exiting */

//MPU https://invensense.tdk.com/wp-content/uploads/2015/02/MPU-6000-Register-Map1.pdf
const MPU_ADDR = 0x68;
const W_REG_TEMP = 0x41;


/*if(rpio) {
  rpio.open(pin, rpio.PWM);
  rpio.pwmSetClockDivider(clockdiv);
  //rpio.pwmSetRange(pin, range);
  rpio.pwmSetData(pin, 80);
}*/

var servo1;

if(Gpio) {
  servo1 = new Gpio(18, {mode: Gpio.OUTPUT});
  servo1.servoWrite(1000);
}

if(i2c) {
  var i2c_inst = i2c.openSync(1);
  var rawData = mpu.readWord(i2c_inst, MPU_ADDR, W_REG_TEMP);

  //Temperature in degrees C = (TEMP_OUT Register Value as a signed quantity)/340 + 36.53
  var celsius = rawData / 340 + 36.53;
  console.log("current temperature", celsius);
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

    if(message && message.msg == "setServoValue") {
      console.log('set servo value: pin: %s', message.pin, message.value);
      if(rpio) {
        rpio.pwmSetData(message.pin, message.value);
      }
    }

    if(message && message.msg == "setServoRange") {
      console.log('set servo range: pin: %s', message.pin, message.range);
      if(Gpio) {
        servo1.servoWrite(message.range);
        //rpio.pwmSetRange(message.pin, message.range);
      }
    }
  });

  ws.send('something');
});

server.listen(8080);
