'use strict';
/* globals Chart:false, feather:false */

(function () {

  feather.replace();

  var datasetPitch    = {label: "PITCH",   data: [], color: "#3c8dbc" };
  var datasetRoll     = {label: "ROLL",     data: [], color: "#008d00" };
  var datasetPitch_C  = {label: "COR Pitch",  data: [], color: "#3c8dff" };
  var datasetRoll_C   = {label: "COR Roll",  data: [], color: "#008dff" };
  var _dataset = [datasetPitch, datasetRoll];

  var options = {xaxis: { mode: "time", timeBase: "milliseconds"}};

  /*
  setInterval(function(){
    // temperature
    api.call("readI2C", 0x41, function(msg){jQuery("#out_temp").html(msg.result);});

    // roll pitch
    api.call("readRollPitch", function(msg){
      jQuery("#out_gyro_x").html(msg.result.rollpitch.pitch);
      jQuery("#out_gyro_y").html(msg.result.rollpitch.roll);

      datasetPitch.data.push([new Date().getTime(), msg.result.rollpitch.pitch]);
      datasetRoll.data.push([new Date().getTime(), msg.result.rollpitch.roll]);

      datasetPitch_C.data.push([new Date().getTime(), msg.result.corrections.pitch.sum]);
      //datasetRoll.data.push([new Date().getTime(), msg.result.rollpitch.roll]);
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
*/


  Vue.component('controller', {
    props : ["controller"],
    data: function(){
      return {
        pid    : {P:0.5, I:0, D:0},
        target : 0
      };
    },
    mounted:function(){
      var thisCtx = this;
      new Slider(this.$el.querySelector('[data-role="target"]'), {min : -90, max : 90, value : 0})
        .on("slide", function(value){
          thisCtx.updateTarget(value);
        });
      new Slider(this.$el.querySelector('[data-role="PID-P"]'), {min : 0, max : 2, step:0.01, value : 0})
        .on("slide", function(value){thisCtx.updatePID("P", value);});
      new Slider(this.$el.querySelector('[data-role="PID-I"]'), {min : 0, max : 2, step:0.01, value : 0})
        .on("slide", function(value){thisCtx.updatePID("I", value);});
      new Slider(this.$el.querySelector('[data-role="PID-D"]'), {min : 0, max : 2, step:0.01, value : 0})
        .on("slide", function(value){thisCtx.updatePID("D", value);});
    },
    methods: {
      updateTarget: function (target) {
        var thisCtx = this;
        api.call("setTarget", thisCtx.controller.name, target, function(){
          //thisCtx.message = thisCtx.state ? "STOP" : "START";
        });
      },
      updatePID: function (param, value) {
        var thisCtx = this;
        thisCtx.pid[param] = value
        api.call("setPID", thisCtx.controller.name, thisCtx.pid, function(){
          //thisCtx.message = thisCtx.state ? "STOP" : "START";
        });
      }
    }
  })

  // root controller
  var app = new Vue({
    el      : '#app',
    data    : {
      state       : false,
      message     : 'RUN',
      controllers : [{name:"pitch"}, {name:"roll"}]},
    mounted : function() {
        var thisCtx = this;
        new Slider(this.$el.querySelector('#slider-interval'), {min : 0, max : 500, step:1, value : 100})
          .on("slide", throttledSetInterval);
      },
    methods : {
      toggleState: function () {
        this.state = !this.state;
        var thisCtx = this;
        api.call("toggleControlLoop", this.state, function(){
          thisCtx.message = thisCtx.state ? "STOP" : "START";
        });
      }
    }
  });

  /*
  jQuery("button.toggle.control-loop").on("click", function(){
    api.call("readRollPitch", function(){});
  })*/

}())
