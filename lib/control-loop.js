const fs = require('fs');
const _ = require('underscore');
const pidController = require('node-pid-controller');

const CFG_PATH = "./config.js";

var controlLoopInterval;

var globalConfig = {
  servos:[
    {pin : 12, axis:"pitch", pid:{P:0.5, I:0.1, D:0.1, DT:1}, target:0},
    {pin : 13, axis:"roll",  pid:{P:0.5, I:0.1, D:0.1, DT:1}, target:0}
  ]
};

var gyro = null;                                      // set with init method
var rpio = null;                                      // set with init method

var init = function(gyroInst, rpioInst) {
  gyro = gyroInst;
  rpio = rpioInst;
}

var degreeToPWM = function(deg) {
  deg = deg + 90;
  var range = 400 - 80;               // pwm edges
  // 0 - 180
  // 80 - 400

  var retval = deg / 180 * range  + 80;
  return retval;
}

var toggleControlLoop = function(enabled) {
  if(enabled) {

    // hold all PID controllers
    var pidControllers = [];

    _.each(globalConfig.servos, function(servoConf){
      // startup pitch PID
      var pid = new pidController({
        k_p: servoConf.pid.P,
        k_i: servoConf.pid.I,
        k_d: servoConf.pid.D,
        dt : servoConf.pid.DT});
      pid.setTarget(servoConf.target);
      pidControllers.push(pid);
    });

    controlLoopInterval = setInterval(function(){
      console.log("inside controlloop");

      // get sensor data
      var gyro_data;
      if(gyro) {
        var gyro_xyz = gyro.get_gyro_xyz();
        var accel_xyz = gyro.get_accel_xyz();
        gyro_data = {
          gyro_xyz  : gyro_xyz,
          accel_xyz : accel_xyz,
          rollpitch : gyro.get_roll_pitch( gyro_xyz, accel_xyz )
        }
      }
      else {
        // no gyro
        gyro_data = {rollpitch:{roll:15, pitch:20}};
      }

      _.each(globalConfig.servos, function(servoConf, idx){

        // servo1 - pitch
        var input;
        if(servoConf.axis == "pitch")  {
          input = gyro_data.rollpitch.pitch;
        }
        if(servoConf.axis == "roll")  {
          input = gyro_data.rollpitch.roll;
        }

        // calculate correction with corresponding PID controller
        var correction = pidControllers[idx].update(input);

        // send correction to servo
        var pwm = degreeToPWM(0-correction);
        console.log("setting servo", servoConf.pin, input, correction, pwm);
        if(rpio) {
          rpio.pwmSetData(servoConf.pin, pwm);
        }

      });
    }, 1000);
  }
  else {
    clearInterval(controlLoopInterval);
  }
}

var getConfig = function() {
  if(fs.existsSync(CFG_PATH)) {
    return fs.readFileSync(CFG_PATH, {encoding:"utf-8"});
  }
  else {
    return {};
  }
}

var updateConfig = function(cfg) {
  globalConfig = cfg;
  return fs.writeFileSync(CFG_PATH, JSON.stringify(globalConfig), {encoding:"utf-8"});
}

module.exports = {toggleControlLoop, getConfig, updateConfig, init};
