
var intervalDiagramMS = 1000;
var diagramMaxRows = 1000;
const charts = {
  PITCH : {
    title : "Pitch",
    data : null,
    columns : [{type:'datetime', def:'X'}, {type:'number', def:'Pitch'}, {type:'number', def:'Pitch Corr.'}],
  },
  ROLL : {
    title : "Roll",
    data : null,
    columns : [{type:'datetime', def:'X'}, {type:'number', def:'Roll'}, {type:'number', def:'Roll Corr.'}],
  },
  ACCEL : {
    title : "Accelleration",
    data : null,
    columns : [{type:'datetime', def:'X'}, {type:'number', def:'ACCEL X'}, {type:'number', def:'ACCEL Y'}, {type:'number', def:'ACCEL Z'}],
  },
  GYRO : {
    title : "Gyro",
    data : null,
    columns : [{type:'datetime', def:'X'}, {type:'number', def:'GYRO X'}, {type:'number', def:'GYRO Y'}, {type:'number', def:'GYRO Z'}],
  }
};

Template.diagrams.onCreated(function(){

  var template = this;
  api.templates.utils.createAccessibleVar(this, "state", {});
/*
  Meteor.call("getConfig", function(erer,result){
    template.controllers.set(result.controllers);
    template.servos.set(result.servos);
  });*/
});


Template.diagrams.onRendered(function(){
  var intervalDiagram = function(){
    // temperature
    //api.call("readI2C", 0x41, function(msg){jQuery("#out_temp").html(msg.result);});

    // roll pitch
    Meteor.call("readAllData", function(err, msg){
      //jQuery("#out_gyro_x").html(msg.result.gyroData.rotation.x);
      //jQuery("#out_gyro_y").html(msg.result.gyroData.rotation.y);

      var pitchCorrection = msg.result.pitch ? msg.result.pitch.sum : 0;
      var rollCorrection = msg.result.roll ? msg.result.roll.sum : 0;

      var now = new Date();

      // update pitch
      var chartDef = charts.PITCH;
      chartDef.data.addRow([now, msg.result.gyroData.rotation.y, pitchCorrection]);
      if(chartDef.data.getNumberOfRows() > diagramMaxRows) chartDef.data.removeRow(0);
      chartDef.lineChart.draw(chartDef.data);

      // update roll
      chartDef = charts.ROLL;
      chartDef.data.addRow([now, msg.result.gyroData.rotation.x, rollCorrection]);
      if(chartDef.data.getNumberOfRows() > diagramMaxRows) chartDef.data.removeRow(0);
      chartDef.lineChart.draw(chartDef.data);

      // update access
      chartDef = charts.ACCEL;
      chartDef.data.addRow([now, msg.result.gyroData.accel.x, msg.result.gyroData.accel.y, msg.result.gyroData.accel.z]);
      if(chartDef.data.getNumberOfRows() > diagramMaxRows) chartDef.data.removeRow(0);
      chartDef.lineChart.draw(chartDef.data);

      // update gyro
      chartDef = charts.GYRO;
      chartDef.data.addRow([now, msg.result.gyroData.gyro.x, msg.result.gyroData.gyro.y, msg.result.gyroData.gyro.z]);
      if(chartDef.data.getNumberOfRows() > diagramMaxRows) chartDef.data.removeRow(0);
      chartDef.lineChart.draw(chartDef.data);

      x.push(msg.result.position.x);
      y.push(msg.result.position.y);
      z.push(msg.result.position.z);

      /*Plotly.react('plotly', [{
        type: 'scatter3d',
        mode: 'lines+markers',
        x: x,
        y: y,
        z: z,
        line: {
          width: 6,
          colorscale: "Viridis"},
          marker: {
            size: 3.5,
            colorscale: "Greens",
            cmin: -20,
            cmax: 50
          }},
        ]);*/
    });
  };


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

  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(drawCharts);
});

Template.diagrams.events({
  "click .toggle-plot" : function(event, template) {
    var state = template.state.get();
    state = !state;
    template.state.set(state);
    if(state) {
      intervalDiagramId = setInterval(intervalDiagram, intervalDiagramMS);
    }
    else{
      clearInterval(intervalDiagramId);
    }
  }
});

/*
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

        },
        methods : {
          togglePlot:function(){
            this.plotState = !this.plotState;
            if(this.plotState) {
              intervalDiagramId = setInterval(intervalDiagram, intervalDiagramMS);
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




}())

*/
