Template.servo.onRendered(function(){
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
})

Template.servo.events({
  "click .toggle-editable": function () {
    Vue.set(this, "editable", !editable.open);
  },
  "clic .toggle-open": function () {
    Vue.set(this, "open", !this.open);
  },
  "click .set-manual": function (value) {
    var thisCtx = this;
    api.call("setManual", thisCtx.servo.id, value, function(){
      //thisCtx.message = thisCtx.state ? "STOP" : "START";
    });
  },
  "click .update-multiply": function (value) {
    var thisCtx = this;
    thisCtx.servo.multiply = value;
    api.call("setMultiply", thisCtx.servo.id, value, function(){
      //thisCtx.message = thisCtx.state ? "STOP" : "START";
    });
  },
  "click .update-neutral": function (value) {
    var thisCtx = this;
    thisCtx.servo.neutral = value;
    api.call("setNeutral", thisCtx.servo.id, value, function(){
      //thisCtx.message = thisCtx.state ? "STOP" : "START";
    });
  },
  "click .update-min": function (value) {
    var thisCtx = this;
    thisCtx.servo.min = value;
    api.call("setServoMin", thisCtx.servo.id, value, function(){
      //thisCtx.message = thisCtx.state ? "STOP" : "START";
    });
  },
  "click .update-max": function (value) {
    var thisCtx = this;
    thisCtx.servo.max = value;
    api.call("setServoMax", thisCtx.servo.id, value, function(){
      //thisCtx.message = thisCtx.state ? "STOP" : "START";
    });
  }
});
