const fs = require('fs');
const http = require('http');
const {spawn} = Npm.require('child_process');
const sensor = require("./lib/sensor.js");
const control = require("./lib/control-loop.js");

const coll = {after:{insert:function(){}, update:function(){}}, before:{insert:function(){}, update:function(){}}};
api.events       = {participants:{collection:coll}};
api.applications = {groups : {collection:coll, assignments:{collection:coll}}};
api.records      = {collection:coll};
api.newsletter   = {subscriptions:{collection:coll}};

// raspberry only libs
var Gpio;

try {
  Gpio = require('pigpio').Gpio;
}
catch(e){
  console.error(e);
}

//var pin = 12;           /* P12/GPIO18 */
var range = 1024;       /* LEDs can quickly hit max brightness, so only use */
var max = 131072;          /*   the bottom 8th of a larger scale */
var clockdiv = 128;       /* Clock divider (PWM refresh rate), 8 == 2.4MHz */

//MPU https://invensense.tdk.com/wp-content/uploads/2015/02/MPU-6000-Register-Map1.pdf


if(Gpio) {
  //rpio.pwmSetClockDivider(clockdiv);

  // pin12
  //rpio.open(12, rpio.PWM);
  //rpio.pwmSetRange(12, range);

  // signal complete startup
  //setTimeout(()=>{rpio.pwmSetData(12, 180);}, 0000);
  //setTimeout(()=>{rpio.pwmSetData(12, 220);}, 0500);
  //setTimeout(()=>{rpio.pwmSetData(12, 200);}, 1500);

  // pin35
  //rpio.open(35, rpio.PWM);
  //rpio.pwmSetRange(35, range);
  //setTimeout(()=>{rpio.pwmSetData(35, 180);}, 2000);
  //setTimeout(()=>{rpio.pwmSetData(35, 220);}, 2500);
  //setTimeout(()=>{rpio.pwmSetData(35, 200);}, 3000);
}

// provide to module
control.init(sensor, Gpio);


Meteor.methods({
  "triggerShutDown" : function(){
    spawn("sh", ["-c", "sudo shutdown now"]);
  },
  "readAllData" : function(){
    return control.getCurrentValues();
  },
  "getConfig" : function(){
    return control.getConfig();
  },
  "getState" : function(){
    return control.getState();
  },
  "toggleControlLoop" : function(enabled){
    return control.toggleControlLoop(enabled);
  },
  "setLoopInterval" : function(ms){
    console.log("setLoopInterval", ms);
    return control.setLoopInterval(ms);
  },
  "setServoValue" : function(pin, value){
    console.log('set servo value: pin: %s', value);
    if(rpio) {
      //servo1.servoWrite(msgObj.value);
      rpio.pwmSetData(pin, value);
    }
  },
  "setNeutral" : function(id, value){
    control.setNeutral(id, value);
  },
  "setMultiply" : function(id, value){
    control.setMultiply(id, value);
  },
  "setServoMin" : function(id, value){
    control.setServoMin(id, value);
  },
  "setServoMax" : function(id, value){
    control.setServoMax(id, value);
  },
  "setTarget" : function(controller, value){
    console.log('set controller target value',controller, value);
    control.setTarget(controller, value);
  },
  "setPID" : function(controller, values){
    console.log('setPID values',controller, values);
    control.setPID(controller, values);
  },
  "startRecord" : function(){
    //console.log('startRecord',controller, values);
    control.startRecord();
  },
  "stopRecord" : function(){
    //console.log('setPID values',controller, values);
    return control.stopRecord();
  }
});
