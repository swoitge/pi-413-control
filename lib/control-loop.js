const fs            = require('fs');
const _             = require('underscore');
const pidController = require('./pid-controller.js');

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
  controllers:{
    pitch:{pin : 12, pid:{P:0.5, I:0, D:0, DT:1}, target:0}
    //{pin : 13, axis:"roll",  pid:{P:0.5, I:0.1, D:0.1, DT:1}, target:0}
  },
  interval: 100
};

// hold all PID controllers
var pidControllers = {};

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

var newPID = function(name, pid) {
  // register a new PID controller instance
  var pid = new pidController({
    k_p: pid.P,
    k_i: pid.I,
    k_d: pid.D,
    dt : globalConfig.interval / 1000});
  pidControllers[name] = pid;
  return pid;
}

// set the new target value
var setTarget = function(name, target) {
  pidControllers[name].target = target;
}

// set new PID controller with values
var setPID = function(name, pidValues) {

  // construct a new pid controller
  var pidController = newPID(name, pidValues);

  // target from config
  pidController.target = globalConfig.controllers[name].target;
  pidControllers[name] = pidController;
}

var toggleControlLoop = function(enabled) {
  if(enabled) {

    for(var key in globalConfig.controllers) {
      var controller = globalConfig.controllers[key];
      // startup pitch PID
      var pid = newPID(key, controller.pid);
      pid.setTarget(controller.target);
    }

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

      for(var controllerName in globalConfig.controllers) {

        // get controlelr object
        var controller = globalConfig.controllers[controllerName];

        // servo1 - pitch
        var input;
        if(controllerName == "pitch")  {
          input = gyro_data.rollpitch.pitch;
        }
        if(controllerName == "roll")  {
          input = gyro_data.rollpitch.roll;
        }

        // calculate correction with corresponding PID controller
        var pidController = pidControllers[controllerName];
        var updatePID     = pidController.update(input);
        var correction    = updatePID.sum;

        // send correction to servo
        var pwm = degreeToPWM(0-correction);

        input       = Math.floor(input);
        correction  = Math.floor(correction);
        pwm         = Math.floor(pwm);

        // store values
        latestCorrections[controller.name] = updatePID;

        // ensure save bounds
        pwm = Math.min(SRV_MAX, pwm);
        pwm = Math.max(SRV_MIN, pwm);

        console.log("setting servo:" + controller.pin, input, correction, pwm);
        if(rpio) {
          rpio.pwmSetData(controller.pin, pwm);
        }
      }
      
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

module.exports = {
  toggleControlLoop,
  getConfig,
  updateConfig,
  init,
  setLoopInterval,
  setTarget,
  setPID,
  getLatestCorrections};
