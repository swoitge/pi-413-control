Template.controller.onCreated(function(){
  console.log("on created controller template");
  api.templates.utils.createAccessibleVar(this, "openState", true);
  api.templates.utils.createAccessibleVar(this, "editable", false);
  api.templates.utils.createAccessibleVar(this, "target", this.data.controller.target);
  api.templates.utils.createAccessibleVar(this, "pid", this.data.controller.pid);

  var template = this;

  this.updateTarget = function(target){
    template.target.set(target);
    Meteor.call("setTarget", template.data.controller.name, target, function(){});
  };

  this.updatePID = function(param, value){
    var pid = template.pid.get();
    pid[param] = value;
    template.pid.set(pid);
    Meteor.call("setPID", template.data.controller.name, pid, function(){});
  };
});

Template.controller.onRendered(function(){
  var template = this;
  var controller = this.data.controller;
  new Slider(this.find('[data-role="target"]'), {min : -90, max : 90, value : controller.target})
    .on("slide", function(value){
      template.updateTarget(value);
    });
  new Slider(this.find('[data-role="PID-P"]'), {min : 0, max : 2, step:0.01, value : controller.pid.P})
    .on("slide", function(value){template.updatePID("P", value);});
  new Slider(this.find('[data-role="PID-I"]'), {min : 0, max : 2, step:0.01, value : controller.pid.I})
    .on("slide", function(value){template.updatePID("I", value);});
  new Slider(this.find('[data-role="PID-D"]'), {min : 0, max : 2, step:0.01, value : controller.pid.D})
    .on("slide", function(value){template.updatePID("D", value);});
})

Template.controller.events({
  "click .toggle-editable": function (event, template) {
    var editable = template.editable.get();
    template.editable.set(!editable);
  },
  "click .toggle-open": function (event, template) {
    var openState = template.openState.get();
    template.openState.set(!openState);
  },
  "click .update-target": function (event, template) {
    var thisCtx = this;
    thisCtx.controller.target = target;
    thisCtx.updateTarget(target);
  },
  "click .update-pid": function (param, value) {
    var thisCtx = this;
    thisCtx.controller.pid[param] = value
    api.call("setPID", thisCtx.controller.name, thisCtx.controller.pid, function(){
      //thisCtx.message = thisCtx.state ? "STOP" : "START";
    });
  }
});
