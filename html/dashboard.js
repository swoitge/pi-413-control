'use strict';
/* globals Chart:false, feather:false */

(function () {

  feather.replace();

  var datasetPitch    = {label: "PITCH",   data: [], color: "#3c8dbc" };
  var datasetRoll     = {label: "ROLL",     data: [], color: "#008d00" };
  var datasetCorrect  = {label: "CORRECT",  data: [], color: "#3c8d00" };
  var _dataset = [datasetPitch, datasetRoll];

  var options = {xaxis: { mode: "time", timeBase: "milliseconds"}};


  setInterval(function(){
    // temperature
    api.call("readI2C", 0x41, function(msg){jQuery("#out_temp").html(msg.result);});

    // roll pitch
    api.call("readRollPitch", function(msg){
      jQuery("#out_gyro_x").html(msg.result.rollpitch.pitch);
      jQuery("#out_gyro_y").html(msg.result.rollpitch.roll);

      datasetPitch.data.push([new Date().getTime(), msg.result.rollpitch.pitch]);
      datasetRoll.data.push([new Date().getTime(), msg.result.rollpitch.roll]);
      $.plot($("#placeholder"), _dataset, options);
      //chart.data.datasets[0].data.push({x:new Date(), y:msg.result.rollpitch.pitch});
      //chart.update();
    });

    //api.rpi.requestI2C(0x43, function(msg){jQuery("#out_gyro_x").html(msg.result);});
    // gyro Y
    //api.rpi.requestI2C(0x45, function(msg){jQuery("#out_gyro_y").html(msg.result);});
    // gyro Z
    //api.rpi.requestI2C(0x47, function(msg){jQuery("#out_gyro_z").html(msg.result);});
  }, 2000);

  var app = new Vue({
    el: '#rc-toggle-control-loop',
    data: {
      state  : false,
      message: 'RUN'
    },
    methods: {
     toggleState: function () {
       this.state = !this.state;
       var thisCtx = this;
       api.call("toggleControlLoop", this.state, function(){
         thisCtx.message = thisCtx.state ? "STOP" : "START";
       });
     }
   }
  });

  jQuery("button.toggle.control-loop").on("click", function(){
    api.call("readRollPitch", function(){});
  })

}())
