const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
//const mpu     = require("./lib/mpu-access.js");
const control = require("./lib/control-loop.js");
const mpuGyro = require("./lib/gyro-mpu6050.js");

// raspberry only libs
var rpio, i2c;

try {
  rpio = require('rpio');
  //i2c = require('i2c-bus');
  //Gpio = require('pigpio').Gpio;
}
catch(e){
  console.error(e);
}

var pin = 12;           /* P12/GPIO18 */
var range = 1024;       /* LEDs can quickly hit max brightness, so only use */
var max = 131072;          /*   the bottom 8th of a larger scale */
var clockdiv = 128;       /* Clock divider (PWM refresh rate), 8 == 2.4MHz */
var interval = 5;       /* setInterval timer, speed of pulses */
var times = 5;          /* How many times to pulse before exiting */

//MPU https://invensense.tdk.com/wp-content/uploads/2015/02/MPU-6000-Register-Map1.pdf
const MPU_ADDR = 0x68;
const W_REG_TEMP = 0x41;

if(rpio) {
  rpio.open(pin, rpio.PWM);
  rpio.pwmSetClockDivider(clockdiv);
  rpio.pwmSetRange(pin, range);
  rpio.pwmSetData(pin, 80);
}

var gyro;
if(mpuGyro) {
  var address = 0x68; //MPU6050 address
  var bus = 1; //i2c bus used
  gyro = new mpuGyro(bus,MPU_ADDR);
}
// provide to module
control.init(gyro, rpio);

var i2cInst;

if(i2c) {
  i2cInst = i2c.openSync(1);
  var rawData_h = i2cInst.readByteSync(MPU_ADDR, W_REG_TEMP);
  var rawData_l = i2cInst.readByteSync(MPU_ADDR, W_REG_TEMP+1);
  console.log("rawData_h", rawData_h);
  console.log("rawData_l", rawData_l);
  var rawData = (rawData_h << 8) + rawData_l;

  //Temperature in degrees C = (TEMP_OUT Register Value as a signed quantity)/340 + 36.53
  var celsius = rawData / 340 + 36.53;
  console.log("current temperature", celsius);
}

const baseDir = "./html/";

/*jjjj*/
const server = http.createServer(function (req, res) {

  //
  console.log("request"+req.url+"-");
  if(req.url == "/") {
    res.statusCode = 302;
    res.setHeader("Location", "/index.html");
    res.end();
    return;
  }

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

var methodsHandler = {};
function provideMethod(name, func) {
  methodsHandler[name] = function(msgObj, ws){
    var retval = func.apply({}, msgObj.args);
    if(msgObj.callback) {
      ws.send(JSON.stringify({
        messageId : msgObj.messageId,
        result    : retval})
      );
    }
  }
}

provideMethod("readRollPitch", function(){
  if(gyro) {
    var gyro_xyz = gyro.get_gyro_xyz();
    var accel_xyz = gyro.get_accel_xyz();

    var roll      = accel_xyz.x/16384.0 * -100;
    var pitch     = accel_xyz.y/16384.0 * -100;

    var gyro_data = {
      gyro_xyz    : gyro_xyz,
      accel_xyz   : accel_xyz,
      rollpitch   : gyro.get_roll_pitch( gyro_xyz, accel_xyz ),
      rollpitch2  : {roll,pitch},
      corrections : control.getLatestCorrections()
    }

    console.log(gyro_data);

    return gyro_data;
  }
  else {
    return {
      gyro_xyz  : 0,
      accel_xyz : 0,
      rollpitch : {roll:12, pitch:24},
      corrections:{pitch:{sum:0}, roll:{sum:0}}
    }
  }
});

provideMethod("getConfig", function(){
  return control.getConfig();
});
provideMethod("toggleControlLoop", function(enabled){
  return control.toggleControlLoop(enabled);
});
provideMethod("setLoopInterval", function(ms){
  return control.setLoopInterval(ms);
});

provideMethod("setServoValue", function(pin, value){
  console.log('set servo value: pin: %s', value);
  if(rpio) {
    //servo1.servoWrite(msgObj.value);
    rpio.pwmSetData(pin, value);
  }
});

provideMethod("setMultiply", function(id, value){
  control.setMultiply(id, value);
});

provideMethod("setTarget", function(controller, value){
  console.log('set controller target value',controller, value);
  control.setTarget(controller, value);
});

provideMethod("setPID", function(controller, values){
  console.log('setPID values',controller, values);
  control.setPID(controller, values);
});

// record flight
provideMethod("startRecord", function(){
  //console.log('startRecord',controller, values);
  control.startRecord();
});
provideMethod("stopRecord", function(){
  //console.log('setPID values',controller, values);
  return control.stopRecord();
});

provideMethod("readI2C", function(register){
  if(i2c) {
    var rawData =  i2cInst.readByteSync(MPU_ADDR, register);
    return rawData;
  }
  else {
    return 42;
  }
});

wss.on('connection', function (ws) {
  console.log("wss on connection");
  ws.on('message', function(message) {
    console.log("wss on message", message);
    var msgObj = JSON.parse(message);

    if(msgObj) {

      // check handler
      var handler = methodsHandler[msgObj.method];
      if(handler) {
        handler(msgObj, ws);
      }
      else {
        console.log("no handler found for method", msgObj.method);
      }
    }
  });
});

server.listen(8080);
