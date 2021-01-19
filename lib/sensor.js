var i2c, mpu6050, sensor, i2cInst;

const MPU_6050_ADDR = 0x68;

const W_REG_TEMP = 0x41;

try {
  i2c = require('i2c-bus');
  mpu6050 = require('i2c-mpu6050');
  i2cInst = i2c.openSync(1);
  sensor = new mpu6050(i2cInst, MPU_6050_ADDR);
}
catch(e){
  console.error(e);
}

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
  if(sensor) {
    return sensor.readSync();
  }
  return {};
}

module.exports = {readData};
