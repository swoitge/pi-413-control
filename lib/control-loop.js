const fs = require('fs');
const _ = require('underscore');
const pidController = require('node-pid-controller');

const CFG_PATH = "./config.js";
const SRV_MIN = 80;
const SRV_MAX = 400;

var latestCorrections = {
  pitch:NaN,
  roll:NaN
};
var controlLoopInterval;

// default config
var globalConfig = {
  servos:[
    {pin : 12, axis:"pitch", pid:{P:0.5, I:0, D:0, DT:1}, target:0}
    //{pin : 13, axis:"roll",  pid:{P:0.5, I:0.1, D:0.1, DT:1}, target:0}
  ],
  interval: 100
};

var gyro = null;                                      // set with init method
var rpio = null;                                      // set with init method

var init = function(gyroInst, rpioInst) {
  gyro = gyroInst;
  rpio = rpioInst;
}

var degreeToPWM = function(deg) {
  deg = deg + 90;
  var range = SRV_MAX - SRV_MIN;               // pwm edges
  // 0 - 180
  // 80 - 400

  var retval = deg / 180 * range  + SRV_MIN;
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
        dt : globalConfig.interval / 1000});
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

        input       = Math.floor(input);
        correction  = Math.floor(correction);
        pwm         = Math.floor(pwm);

        // store value
        latestCorrections[servoConf.axis] = correction;

        // ensure save bounds
        pwm = Math.min(SRV_MAX, pwm);
        pwm = Math.max(SRV_MIN, pwm);

        console.log("setting servo:" + servoConf.pin, input, correction, pwm);
        if(rpio) {
          rpio.pwmSetData(servoConf.pin, pwm);
        }

      });
    }, globalConfig.interval);
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

var getLatestCorrections = function() {
  return latestCorrections;
}

var setLoopInterval = function(ms) {
  toggleControlLoop(false);       // stop
  globalConfig.interval = ms;
  fs.writeFileSync(CFG_PATH, JSON.stringify(globalConfig), {encoding:"utf-8"});

  toggleControlLoop(true);       // start
}

module.exports = {toggleControlLoop, getConfig, updateConfig, init, setLoopInterval, getLatestCorrections};
