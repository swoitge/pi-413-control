'use strict';
/* globals Chart:false, feather:false */

(function () {

  var intervalDiagramId;

  feather.replace();

  var datasetPitch    = {label: "PITCH",      data: [], color: "#3c8dbc" };
  var datasetRoll     = {label: "ROLL",       data: [], color: "#c50202" };
  var datasetPitch_C  = {label: "COR Pitch",  data: [], color: "#98cff0" };
  var datasetRoll_C   = {label: "COR Roll",   data: [], color: "#dd6262" };

  var datasetAccel_X   = {label: "Accel X",   data: [], color: "#dddddd" };

  var _dataset = [datasetPitch, datasetRoll, datasetPitch_C, datasetRoll_C, datasetAccel_X];

  var options = {
    series: {
        lines: { show: true, lineWidth:0.7},
    },
    xaxis: { mode: "time", timeBase: "milliseconds"}
  };

  // register an onopen callback
  api.onopen = function(){
    api.call("getConfig", function(result){
      console.log("retrieved config", result);

      var config = result.result;

      // root controller
      var app = new Vue({
        el      : '#app',
        data    : {
          state           : false,
          plotState       : false,
          message         : 'RUN',
          recordState     : false,
          recordStateMsg  : "START",
          controllers     : config.controllers,
          servos          : config.servos
        },
        mounted : function() {
          var thisCtx = this;
          new Slider(this.$el.querySelector('#slider-interval'), {min : 0, max : 500, step:1, value : 100})
            .on("slide", throttledSetInterval);
        },
        methods : {
          togglePlot:function(){
            this.plotState = !this.plotState;
            if(this.plotState) {
              intervalDiagramId = setInterval(intervalDiagram, 1000);
            }
            else{
              clearInterval(intervalDiagramId);
            }
          },
          toggleState: function () {
            this.state = !this.state;
            var thisCtx = this;
            api.call("toggleControlLoop", this.state, function(){
              thisCtx.message = thisCtx.state ? "STOP" : "START";
            });
          },
          toggleRecord: function () {
            var thisCtx = this;
            if(this.recordState) {
              api.call("stopRecord", function(result) {
                console.log("stopped recording", result);
              });
            }
            else {
              api.call("startRecord", function() {
              });
            }
            this.recordState = !this.recordState;
            thisCtx.recordStateMsg = thisCtx.recordState ? "STOP" : "START";
          }
        }
      });

    });
  }


  var intervalDiagram = function(){
    // temperature
    //api.call("readI2C", 0x41, function(msg){jQuery("#out_temp").html(msg.result);});

    // roll pitch
    api.call("readAllData", function(msg){
      jQuery("#out_gyro_x").html(msg.result.gyroData.rollpitch.pitch);
      jQuery("#out_gyro_y").html(msg.result.gyroData.rollpitch.roll);

      var pitchCorrection = msg.result.pitch ? msg.result.pitch.sum : 0;
      var rollCorrection = msg.result.roll ? msg.result.roll.sum : 0;

      var now = new Date().getTime();
      datasetPitch.data.push([now, msg.result.gyroData.rollpitch.pitch]);
      //datasetRoll.data.push([new Date().getTime(), msg.result.rollpitch.roll]);
      datasetPitch_C.data.push([now, pitchCorrection]);
      datasetAccel_X.data.push([now, msg.result.gyroData.accel_xyz.x]);
      //datasetRoll_C.data.push([new Date().getTime(), rollCorrection]);
      //$.plot($("#chart-pitch"), _dataset, options);
      //chart.data.datasets[0].data.push({x:new Date(), y:msg.result.rollpitch.pitch});
      //chart.update();
    });

    //api.rpi.requestI2C(0x43, function(msg){jQuery("#out_gyro_x").html(msg.result);});
    // gyro Y
    //api.rpi.requestI2C(0x45, function(msg){jQuery("#out_gyro_y").html(msg.result);});
    // gyro Z
    //api.rpi.requestI2C(0x47, function(msg){jQuery("#out_gyro_z").html(msg.result);});
  };


  var templateStr = {};
  templateStr.servo = jQuery("template[name='servo']").html();
  templateStr.controller = jQuery("template[name='controller']").html();

  Vue.component('servo', {
    props     : ["servo"],
    template  : templateStr.servo,
    mounted   : function(){
      var thisCtx = this;
      new Slider(this.$el.querySelector('[data-role="manual"]'), {min : -90, max : 90, value : 0})
        .on("slide", function(value){
          thisCtx.setManual(value);
        });
      new Slider(this.$el.querySelector('[data-role="multiply"]'), {min : -2, max : 2, step:0.01, value : this.servo.multiply})
        .on("slide", function(value){
          thisCtx.updateMultiply(value);
        });
      new Slider(this.$el.querySelector('[data-role="neutral"]'), {min : -200, max : 200, value : this.servo.neutral})
        .on("slide", function(value){
          thisCtx.updateNeutral(value);
          //thisCtx.servo.neutral = value;
        });
    },
    methods: {
      setManual: function (value) {
        var thisCtx = this;
        api.call("setManual", thisCtx.servo.id, value, function(){
          //thisCtx.message = thisCtx.state ? "STOP" : "START";
        });
      },
      updateMultiply: function (value) {
        var thisCtx = this;
        thisCtx.servo.multiply = value;
        api.call("setMultiply", thisCtx.servo.id, value, function(){
          //thisCtx.message = thisCtx.state ? "STOP" : "START";
        });
      },
      updateNeutral: function (value) {
        var thisCtx = this;
        thisCtx.servo.neutral = value;
        api.call("setNeutral", thisCtx.servo.id, value, function(){
          //thisCtx.message = thisCtx.state ? "STOP" : "START";
        });
      }
    }
  });

  Vue.component('controller', {
    props     : ["controller", "open", "editable"],
    template  : templateStr.controller,
    mounted   : function() {
      var thisCtx = this;
      new Slider(this.$el.querySelector('[data-role="target"]'), {min : -90, max : 90, value : this.controller.target})
        .on("slide", function(value){
          thisCtx.updateTarget(value);
        });
      new Slider(this.$el.querySelector('[data-role="PID-P"]'), {min : 0, max : 2, step:0.01, value : this.controller.pid.P})
        .on("slide", function(value){thisCtx.updatePID("P", value);});
      new Slider(this.$el.querySelector('[data-role="PID-I"]'), {min : 0, max : 2, step:0.01, value : this.controller.pid.I})
        .on("slide", function(value){thisCtx.updatePID("I", value);});
      new Slider(this.$el.querySelector('[data-role="PID-D"]'), {min : 0, max : 2, step:0.01, value : this.controller.pid.D})
        .on("slide", function(value){thisCtx.updatePID("D", value);});
    },
    methods: {
      toggleEditable: function () {
        var thisCtx = this;
        thisCtx.editable = !thisCtx.editable;
      },
      toggleOpen: function () {
        var thisCtx = this;
        thisCtx.open = !thisCtx.open;
      },
      updateTarget: function (target) {
        var thisCtx = this;
        thisCtx.controller.target = target;
        api.call("setTarget", thisCtx.controller.name, target, function(){
          //thisCtx.message = thisCtx.state ? "STOP" : "START";
        });
      },
      updatePID: function (param, value) {
        var thisCtx = this;
        thisCtx.controller.pid[param] = value
        api.call("setPID", thisCtx.controller.name, thisCtx.controller.pid, function(){
          //thisCtx.message = thisCtx.state ? "STOP" : "START";
        });
      }
    }
  })


  // init plotly
  var x = [10, 4, 5];
  var y = [8, 4, 7];
  var z = [6, 4, 9];

  Plotly.newPlot('plotly', [{
    type: 'scatter3d',
    mode: 'lines+markers',
    x: x,
    y: y,
    z: z,
    line: {
      width: 6,
      /*color: c,*/
      colorscale: "Viridis"},
    marker: {
      size: 3.5,
      /*color: c,*/
      colorscale: "Greens",
      cmin: -20,
      cmax: 50
    }},
  ]);

  jQuery("button.new-plot-value").on("click", function(){

    x.push(Math.random() * 5);
    y.push(Math.random() * 4);
    z.push(Math.random() * 3);

    Plotly.react('plotly', [{
      type: 'scatter3d',
      mode: 'lines+markers',
      x: x,
      y: y,
      z: z,
      line: {
        width: 6,
        /*color: c,*/
        colorscale: "Viridis"},
        marker: {
          size: 3.5,
          /*color: c,*/
          colorscale: "Greens",
          cmin: -20,
          cmax: 50
        }},
      ]);

  });

}())
