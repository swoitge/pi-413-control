const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
//const mpu     = require("./lib/mpu-access.js");
const control = require("./lib/control-loop.js");
//const mpuGyro = require("./lib/gyro-mpu6050.js");
//const mpuGyro = require("./lib/gyro-mpu6050.js");


// raspberry only libs
var rpio, i2c;
const MPU6050;

try {
  rpio = require('rpio');
  i2c = require('i2c-bus');
  gyro = require('i2c-mpu6050');
}
catch(e){
  console.error(e);
}

//var pin = 12;           /* P12/GPIO18 */
var range = 1024;       /* LEDs can quickly hit max brightness, so only use */
var max = 131072;          /*   the bottom 8th of a larger scale */
var clockdiv = 128;       /* Clock divider (PWM refresh rate), 8 == 2.4MHz */

//MPU https://invensense.tdk.com/wp-content/uploads/2015/02/MPU-6000-Register-Map1.pdf
const MPU_6050_ADDR = 0x68;
const W_REG_TEMP = 0x41;

if(rpio) {
  rpio.pwmSetClockDivider(clockdiv);

  // pin12
  rpio.open(12, rpio.PWM);
  rpio.pwmSetRange(12, range);

  // signal complete startup
  setTimeout(()=>{rpio.pwmSetData(12, 180);}, 0000);
  setTimeout(()=>{rpio.pwmSetData(12, 220);}, 0500);
  setTimeout(()=>{rpio.pwmSetData(12, 200);}, 1500);

  // pin35
  rpio.open(35, rpio.PWM);
  rpio.pwmSetRange(35, range);
  setTimeout(()=>{rpio.pwmSetData(35, 180);}, 2000);
  setTimeout(()=>{rpio.pwmSetData(35, 220);}, 2500);
  setTimeout(()=>{rpio.pwmSetData(35, 200);}, 3000);
}

var i2cInst;
var gyro;
if(i2c) {
  var bus = 1; //i2c bus used
  const i2c1 = i2c.openSync(1);
  const sensor = new MPU6050(i2c1, MPU_6050_ADDR);
  //const data = sensor.readSync();
  //i2c1.closeSync();
}

// provide to module
control.init(sensor, rpio);


if(i2c) {




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

provideMethod("readAllData", function(){
  return control.getCurrentValues();
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

provideMethod("setNeutral", function(id, value){
  control.setNeutral(id, value);
});

provideMethod("setMultiply", function(id, value){
  control.setMultiply(id, value);
});

provideMethod("setServoMin", function(id, value){
  control.setServoMin(id, value);
});

provideMethod("setServoMax", function(id, value){
  control.setServoMax(id, value);
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
