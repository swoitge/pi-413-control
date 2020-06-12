/* globals Chart:false, feather:false */

(function () {
  'use strict'

  feather.replace();

  setInterval(function(){
    api.rpi.requestI2C(0x41, function(msg){jQuery("#out_temp").html(msg.result);});
  }, 2000);

}())
