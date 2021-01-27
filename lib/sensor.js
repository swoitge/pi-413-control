var i2c, mpu6050, sensor, i2cInst;

const INTERVAL = 10;
const MPU_6050_ADDR = 0x68;
const W_REG_TEMP = 0x41;
const samplesBuffer = [];

try {
  i2c = require('i2c-bus');
  mpu6050 = require('i2c-mpu6050');
  i2cInst = i2c.openSync(1);
  sensor = new mpu6050(i2cInst, MPU_6050_ADDR);
}
catch(e){
  console.error(e);
}

setTimeout(function(){
  if(sensor) {
    var data = sensor.readSync();
    if(data) {
      samplesBuffer.push(data);
    }
  }
}, INTERVAL);

/*
if(i2cInst) {
  var rawData_h = i2cInst.readByteSync(MPU_6050_ADDR, W_REG_TEMP);
  var rawData_l = i2cInst.readByteSync(MPU_6050_ADDR, W_REG_TEMP+1);
  console.log("rawData_h", rawData_h);
  console.log("rawData_l", rawData_l);
  var rawData = (rawData_h << 8) + rawData_l;

  //Temperature in degrees C = (TEMP_OUT Register Value as a signed quantity)/340 + 36.53
  var celsius = rawData / 340 + 36.53;
  console.log("current temperature", celsius);
}*/


var readData = function() {
  console.log("read samples data, build average from", samplesBuffer.length, "samples");
  var retval = {
    gyro     : {x:0, y:0, z:0},
    accel    : {x:0, y:0, z:0},
    rotation : {x:0, y:0, z:0},
    temp     : 0
  };
  for(var sample of samplesBuffer) {
    retval.gyro.x += sample.gyro.x;
    retval.gyro.y += sample.gyro.y;
    retval.gyro.z += sample.gyro.z;

    retval.accel.x += sample.accel.x;
    retval.accel.y += sample.accel.y;
    retval.accel.z += sample.accel.z;

    retval.rotation.x += sample.rotation.x;
    retval.rotation.y += sample.rotation.y;
    retval.rotation.z += sample.rotation.z;
  }

  retval.gyro.x = retval.gyro.x / samplesBuffer.length;
  retval.gyro.y = retval.gyro.y / samplesBuffer.length;
  retval.gyro.z = retval.gyro.z / samplesBuffer.length;

  retval.accel.x = retval.accel.x / samplesBuffer.length;
  retval.accel.y = retval.accel.y / samplesBuffer.length;
  retval.accel.z = retval.accel.z / samplesBuffer.length;

  retval.rotation.x = retval.rotation.x / samplesBuffer.length;
  retval.rotation.y = retval.rotation.y / samplesBuffer.length;
  retval.rotation.z = retval.rotation.z / samplesBuffer.length;

  // clear the buffer
  samplesBuffer = [];

  return retval;
}

module.exports = {readData};
