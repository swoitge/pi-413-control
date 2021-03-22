Template.servo.onCreated(function(){
  console.log("on created servo template");

  api.templates.utils.createAccessibleVar(this, "openState", false);
  api.templates.utils.createAccessibleVar(this, "editable", false);

  api.templates.utils.createAccessibleVar(this, "multiply", this.data.servo.multiply);
  api.templates.utils.createAccessibleVar(this, "neutral", this.data.servo.neutral);
  api.templates.utils.createAccessibleVar(this, "min", this.data.servo.min);
  api.templates.utils.createAccessibleVar(this, "max", this.data.servo.max);
  api.templates.utils.createAccessibleVar(this, "manual", 0);
});

Template.servo.onRendered(function(){

  var template = this;
  template.throttledUpdate = _.throttle(function(method, value){
    console.log("throttled update");
    Meteor.call(method, template.data.servo.id, value);
  }, 1000);

  new Slider(this.find('[data-role="manual"]'), {min : -90, max : 90, value : 0})
    .on("slide", function(value){
      template.manual.set(value);
    });
  new Slider(this.find('[data-role="multiply"]'), {min : -0, max : 20, step:0.1, value : this.data.servo.multiply})
    .on("slide", function(value){
      template.multiply.set(value);
      template.throttledUpdate("setMultiply", value);
    });
  new Slider(this.find('[data-role="neutral"]'), {min : 1000, max : 2000, value : this.data.servo.neutral})
    .on("slide", function(value){
      template.neutral.set(value);
      //thisCtx.servo.neutral = value;
    });
  new Slider(this.find('[data-role="min"]'), {min : 500, max : 2500, value : this.data.servo.min})
    .on("slide", function(value){
      template.min.set(value);
      //thisCtx.servo.neutral = value;
    });
  new Slider(this.find('[data-role="max"]'), {min : 500, max : 2500, value : this.data.servo.max})
    .on("slide", function(value){
      template.max.set(value);
      //thisCtx.servo.neutral = value;
    });
})

Template.servo.events({
  "click .servo.toggle-editable": function (event, template) {
    template.editable.set(!template.editable.get());
  },
  "click .servo.toggle-open": function (event, template) {
    template.openState.set(!template.openState.get());
  }
});
