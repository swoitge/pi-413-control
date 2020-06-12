/* globals Chart:false, feather:false */

(function () {
  'use strict'

  feather.replace();

  setInterval(function(){
    // temperature
    api.rpi.requestI2C(0x41, function(msg){jQuery("#out_temp").html(msg.result);});

    // gyro X
    api.rpi.requestI2C(0x43, function(msg){jQuery("#out_gyro_x").html(msg.result);});
  }, 2000);

}())
