/* globals Chart:false, feather:false */

(function () {
  'use strict'

  feather.replace();

  setInterval(function(){
    // temperature
    api.rpi.requestI2C(0x41, function(msg){jQuery("#out_temp").html(msg.result);});

    // roll pitch
    api.rpi.requestRollPitch(function(msg){
      jQuery("#out_gyro_x").html(msg.result.rollpitch.pitch);
      jQuery("#out_gyro_y").html(msg.result.rollpitch.roll);
    });

    //api.rpi.requestI2C(0x43, function(msg){jQuery("#out_gyro_x").html(msg.result);});
    // gyro Y
    //api.rpi.requestI2C(0x45, function(msg){jQuery("#out_gyro_y").html(msg.result);});
    // gyro Z
    //api.rpi.requestI2C(0x47, function(msg){jQuery("#out_gyro_z").html(msg.result);});
  }, 2000);

}())
