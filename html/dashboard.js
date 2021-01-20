'use strict';
/* globals Chart:false, feather:false */

var charts = {
  PITCH : {
    title : "Pitch",
    data : null,
    columns : [{type:'datetime', def:'X'}, {type:'number', def:'Pitch'}, {type:'number', def:'Pitch Corr.'}],
  },
  ROLL : {
    title : "Roll",
    data : null,
    columns : [{type:'datetime', def:'X'}, {type:'number', def:'Pitch'}, {type:'number', def:'Pitch Corr.'}],
  },
  ACCEL : {
    title : "Accelleration",
    data : null,
    columns : [{type:'datetime', def:'X'}, {type:'number', def:'X'}, {type:'number', def:'Y'}, {type:'number', def:'Z'}],
  },
  GYRO : {
    title : "Gyro",
    data : null,
    columns : [{type:'datetime', def:'X'}, {type:'number', def:'X'}, {type:'number', def:'Y'}, {type:'number', def:'Z'}],
  }
};

(function () {

  var intervalDiagramId;

  feather.replace();

  var datasetPitch    = {label: "PITCH",      data: [], color: "#3c8dbc" };
  var datasetRoll     = {label: "ROLL",       data: [], color: "#c50202" };
  var datasetPitch_C  = {label: "COR Pitch",  data: [], color: "#98cff0" };
  var datasetRoll_C   = {label: "COR Roll",   data: [], color: "#dd6262" };

  var datasetAccel_X   = {label: "Accel X",   data: [], color: "#00dddd" };
  var datasetAccel_Y   = {label: "Accel Y",   data: [], color: "#dd00dd" };
  var datasetAccel_Z   = {label: "Accel Z",   data: [], color: "#dddd00" };

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
      jQuery("#out_gyro_x").html(msg.result.gyroData.rotation.x);
      jQuery("#out_gyro_y").html(msg.result.gyroData.rotation.y);

      var pitchCorrection = msg.result.pitch ? msg.result.pitch.sum : 0;
      var rollCorrection = msg.result.roll ? msg.result.roll.sum : 0;

      var now = new Date();

      // update pitch
      var chartDef = charts.PITCH;
      chartDef.data.addRow([now, msg.result.gyroData.rotation.y, pitchCorrection]);
      chartDef.lineChart.draw(chartDef.data);

      // update roll
      chartDef = charts.ROLL;
      chartDef.data.addRow([now, msg.result.gyroData.rotation.x, rollCorrection]);
      chartDef.lineChart.draw(chartDef.data);

      // update access
      chartDef = charts.ACCEL;
      chartDef.data.addRow([now, msg.result.gyroData.accel.x, msg.result.gyroData.accel.y, msg.result.gyroData.accel.z]);
      chartDef.lineChart.draw(chartDef.data);

      // update gyro
      chartDef = charts.GYRO;
      chartDef.data.addRow([now, msg.result.gyroData.gyro.x, msg.result.gyroData.gyro.y, msg.result.gyroData.gyro.z]);
      chartDef.lineChart.draw(chartDef.data);

      //datasetPitch.data.push([now, msg.result.gyroData.rollpitch.pitch]);
      //datasetRoll.data.push([new Date().getTime(), msg.result.rollpitch.roll]);
      //datasetPitch_C.data.push([now, pitchCorrection]);
      //datasetAccel_X.data.push([now, msg.result.gyroData.accel_xyz.x]);
      //datasetRoll_C.data.push([new Date().getTime(), rollCorrection]);
      //$.plot($("#chart-pitch"), _dataset, options);
      //chart.data.datasets[0].data.push({x:new Date(), y:msg.result.rollpitch.pitch});
      //chart.update();


      x.push(msg.result.position.x);
      y.push(msg.result.position.y);
      z.push(msg.result.position.z);

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
    data      : function(){return {open:false, editable:false}},
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
      new Slider(this.$el.querySelector('[data-role="min"]'), {min : 80, max : 400, value : this.servo.min})
        .on("slide", function(value){
          thisCtx.updateMin(value);
          //thisCtx.servo.neutral = value;
        });
      new Slider(this.$el.querySelector('[data-role="max"]'), {min : 80, max : 400, value : this.servo.max})
        .on("slide", function(value){
          thisCtx.updateMax(value);
          //thisCtx.servo.neutral = value;
        });
    },
    methods: {
      toggleEditable: function () {
        Vue.set(this, "editable", !editable.open);
      },
      toggleOpen: function () {
        Vue.set(this, "open", !this.open);
      },
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
      },
      updateMin: function (value) {
        var thisCtx = this;
        thisCtx.servo.min = value;
        api.call("setServoMin", thisCtx.servo.id, value, function(){
          //thisCtx.message = thisCtx.state ? "STOP" : "START";
        });
      },
      updateMax: function (value) {
        var thisCtx = this;
        thisCtx.servo.max = value;
        api.call("setServoMax", thisCtx.servo.id, value, function(){
          //thisCtx.message = thisCtx.state ? "STOP" : "START";
        });
      }
    }
  });

  Vue.component('controller', {
    props     : ["controller"],
    data      : function(){return {open:false, editable:false}},
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
        Vue.set(this, "editable", !this.editable);
      },
      toggleOpen: function () {
        Vue.set(this, "open", !this.open);
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

  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(drawCharts);

  function drawCharts() {

    for(var key in charts) {
      var chartDef = charts[key];

      chartDef.data = new google.visualization.DataTable();
      _.each(chartDef.columns, function(column){
        chartDef.data.addColumn(column.type, column.def);
      });

      var options = {
        title     :  chartDef.title,
        curveType : 'function',
        legend    : { position: 'bottom' }
      };

      // create container
      var div = document.createElement("DIV");                 // Create a <p> element
      document.getElementById("charts-container").appendChild(div);

      chartDef.lineChart = new google.visualization.LineChart(div);
      chartDef.lineChart.draw(chartDef.data, options);
    }


  }

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
