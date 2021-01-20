const fs            = require('fs');
const _             = require('underscore');
const pidController = require('./pid-controller.js');
const positionIP    = require('./position.js');

const CFG_PATH = "./config.js";
const SRV_MIN = 80;
const SRV_MAX = 400;

var currentValues = {
  pitch     : NaN,
  roll      : NaN,
  gyroData  : {}
};

var controlLoopInterval;
var controlLoopRunning = false;

// default config
var globalConfig = {
  controllers : {
    pitch : {
      name    : "pitch",
      pid     : {P:0.5, I:0, D:0, DT:1},
      target  : 0,
      servos  : [{
        id        : "servo1",
        pin       : 12,
        min       : SRV_MIN,
        max       : SRV_MAX,
        multiply  : 1,
        neutral   : 100}]
    },
    roll : {
      name    : "roll",
      pid     : {P:0.5, I:0, D:0, DT:1},
      target  : 0,
      servos  : [{
        id        : "servo2",
        pin       : 35,
        min       : SRV_MIN,
        max       : SRV_MAX,
        multiply  : 1,
        neutral   : 100}]
    }
    //{pin : 13, axis:"roll",  pid:{P:0.5, I:0.1, D:0.1, DT:1}, target:0}
  },
  interval: 100
};

// hold all PID controllers
var pidControllers = {};

var sensor = null;                                      // set with init method
var rpio = null;                                      // set with init method

var init = function(sensorInst, rpioInst) {
  sensor = sensorInst;
  rpio = rpioInst;

  if(fs.existsSync(CFG_PATH)) {
    var json = fs.readFileSync(CFG_PATH, {encoding:"utf-8"});
    globalConfig = JSON.parse(json);
  }
  else{
    updateConfig();
  }
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
  if(pidControllers[name]) {
    pidControllers[name].target = target;
  }
  globalConfig.controllers[name].target = target;
  updateConfig();
}

// set new PID controller with values
var setPID = function(name, pidValues) {

  // construct a new pid controller
  var pidController = newPID(name, pidValues);

  // target from config
  pidController.target = globalConfig.controllers[name].target;
  pidControllers[name] = pidController;

  // update global config
  globalConfig.controllers[name].pid = pidValues;
  updateConfig();
}

// set servo multiply value
var setNeutral = function(id, neutral) {
  var servo = getServo(id);
  if(servo) {
    // set neutral
    servo.neutral = neutral;
    updateConfig();
  }
}

// set servo multiply value
var setMultiply = function(id, multiply) {
  var servo = getServo(id);
  if(servo){
    // set multiply
    servo.multiply = multiply;
    updateConfig();
  }
}

// set servo min value
var setServoMin = function(id, min) {
  toggleControlLoop(false);             // switch off control loop
  var servo = getServo(id);
  if(servo){
    // set min
    servo.min = min;
    updateConfig();
  }
}

// set servo max value
var setServoMax = function(id, max) {
  toggleControlLoop(false);             // switch off control loop
  var servo = getServo(id);
  if(servo){
    // set min
    servo.max = max;
    updateConfig();
  }
}

function getServo(id) {
  // loop controllers
  var retval = null;
  _.each(globalConfig.controllers, function(controller){

    // loop servos
    _.each(controller.servos, function(servo){
      if(servo.id == id) {
        retval = servo;
      }
    })
  });
  return retval;
}

var toggleControlLoop = function(enabled) {
  controlLoopRunning = enabled;
  if(enabled) {

    // start position interpolation
    positionIP.start();

    for(var key in globalConfig.controllers) {
      var controller = globalConfig.controllers[key];
      // startup pitch PID
      var pid = newPID(key, controller.pid);
      pid.setTarget(controller.target);
    }

    var startDate = new Date();

    controlLoopInterval = setInterval(function(){
      //console.log("inside controlloop");

      // get sensor data
      var gyro_data;
      if(sensor) {

        /*
        gyro: gyro,
    		accel: accel,
    		rotation: rotation,
    		temp: temp
        */
        gyro_data = sensor.readData();

        // notify position lib
        var position = positionIP.setAcelleration(gyro_data.accel);
        currentValues.position = position;
      }
      else {
        // no gyro
        console.log("no gyro");
        var deltaTime = startDate.getTime() - new Date().getTime();
        gyro_data = {
          //gyro_xyz   : {x:-30, y:0, z:90},
          //accel_xyz  : {x:0, y:20, z:-90},
          rotation : {
            x : Math.sin(deltaTime / 1000) * 90,
            y : Math.cos(deltaTime / 1000) * 90}
        };
      }

      // store
      currentValues.gyroData = gyro_data;

      for(var controllerName in globalConfig.controllers) {

        // get controller object
        var controller = globalConfig.controllers[controllerName];

        // servo1 - pitch
        var input;
        if(controllerName == "pitch")  {
          input = gyro_data.rotation.y;
        }
        else if(controllerName == "roll")  {
          input = gyro_data.rotation.x;
        }
        else {
          console.log("invalid controller key", controllerName);
        }

        if(!input) {
          console.log("no input determined", input, controllerName, gyro_data);
          input = 0;
        }

        // calculate correction with corresponding PID controller
        var pidController = pidControllers[controllerName];
        var updatePID     = pidController.update(input);
        var correction    = updatePID.sum;

        // store values
        currentValues[controllerName] = updatePID;

        // set servos
        for(var servo of controller.servos) {

          // multiply per servo
          var multiplyed = correction * servo.multiply;

          // send correction to servo
          var pwm = degreeToPWM(0 - multiplyed) + servo.neutral;

          input       = Math.floor(input);
          multiplyed  = Math.floor(multiplyed);
          pwm         = Math.floor(pwm);

          // ensure save bounds
          pwm = Math.min(SRV_MAX, pwm);
          pwm = Math.max(SRV_MIN, pwm);

          console.log("setting servo:" + servo.pin, input, multiplyed, pwm);
          if(rpio) {
            rpio.pwmSetData(servo.pin, pwm);
          }
        }
      }

    }, globalConfig.interval);
  }
  else {
    clearInterval(controlLoopInterval);
    positionIP.stop();
    return ;
  }
}

var getConfig = function() {
  return globalConfig;
}

var updateConfig = _.throttle(function() {
  return fs.writeFileSync(CFG_PATH, JSON.stringify(globalConfig, null, 2), {encoding:"utf-8"});
}, 1000);

var getCurrentValues = function() {
  return currentValues;
}

var setLoopInterval = function(ms) {
  var wasRunning = controlLoopRunning;
  globalConfig.interval = ms;

  if(wasRunning) {
    toggleControlLoop(false);       // stop
    toggleControlLoop(true);       // start
  }

  updateConfig()
}

var recordings = [];
var recordingTimer = null;
var startRecord = function() {
  var record = {start:new Date(), entries:[], end:null};
  recordings.push(record);
  recordingTimer = setInterval(function(){
    var deltaTime = new Date().getTime() - record.start.getTime();

    var accel_xyz;
    var gyro_xyz;
    if(gyro) {
      gyro_xyz = gyro.get_gyro_xyz();
      accel_xyz = gyro.get_accel_xyz();
    }
    else {
      // simulated gyro valuies
      gyro_xyz = {
        x : Math.sin(deltaTime/500),
        y : Math.cos(deltaTime/500),
        z : Math.sin(deltaTime/250)};
      accel_xyz = {
        x : -Math.sin(deltaTime/500),
        y : -Math.cos(deltaTime/500),
        z : -Math.sin(deltaTime/250)};
    }

    // build an entry
    var e = {
      timestamp : new Date(),
      gyro       : gyro_xyz,
      accel      : accel_xyz
    };
    console.log(e);
    record.entries.push(e);
  }, 100);
}

var stopRecord = function() {
  clearInterval(recordingTimer);
  var currentRecord = recordings[recordings.length-1];
  currentRecord.end = new Date();
  console.log("stop - recorded", currentRecord.entries.length, "elements");
  return currentRecord;
}

module.exports = {
  toggleControlLoop,
  getConfig,
  init,
  setLoopInterval,
  setTarget,
  setPID,
  setMultiply,
  setServoMin,
  setServoMax,
  setNeutral,
  startRecord,
  stopRecord,
  getCurrentValues};
