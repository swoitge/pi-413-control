'use strict';
/* globals Chart:false, feather:false */

(function () {
  'use strict'

  feather.replace();

  var chartCtx = jQuery("#realtime-chart");
  var chart = new Chart(chartCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Roll',
          yAxesGroup: 'A',
          data: []
        },
        {
          label: 'Pitch',
          yAxesGroup: 'B',
          data: []
        }
      ]
    },
    options: {
        scales: {
            xAxes: [{
                type: 'time',
                time: {
                    //unit: 'month'
                }
            }]
        }
    }
});

  setInterval(function(){
    // temperature
    api.call("readI2C", 0x41, function(msg){jQuery("#out_temp").html(msg.result);});

    // roll pitch
    api.call("readRollPitch", function(msg){
      jQuery("#out_gyro_x").html(msg.result.rollpitch.pitch);
      jQuery("#out_gyro_y").html(msg.result.rollpitch.roll);

      chart.data.datasets[0].data.push({x:new Date(), y:msg.result.rollpitch.pitch});
      chart.update();
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
