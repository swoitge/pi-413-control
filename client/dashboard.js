
Template.dashboard.onCreated(function(){

  this.controllers = new ReactiveVar({});
  this.servos = new ReactiveVar({});

  api.templates.utils.createAccessibleVar(this, "state", {});
  api.templates.utils.createAccessibleVar(this, "intervalMS", {});

  var template = this;

  Meteor.call("getConfig", function(erer,result){
    template.controllers.set(result.controllers);
    template.intervalMS.set(result.interval);
    template.servos.set(result.servos);
  });

  Meteor.call("getState", function(erer,result){
    template.state.set(result);
  });
});

Template.dashboard.helpers({
  controllers : function(){
    return _.values(Template.instance().controllers.get());
  }
});


Template.dashboard.onRendered(function(){
  var template = this;
  var throttledWriteConfig = _.throttle(function(v){
    //console.log("on slideStop", arguments);
    Meteor.call("setLoopInterval", v);
  });
  new Slider(this.find('#slider-interval'), {min : 0, max : 500, step:1, value : 100})
    .on("slide", function(v){
      template.intervalMS.set(v);
      throttledWriteConfig(v);
    }, 1000);
});

Template.dashboard.events({
  "click .toggle-state": function (event, template) {
    var state = template.state.get();
    state.running = !state.running;
    template.state.set(state);
    Meteor.call("toggleControlLoop", state.running);
  },
  "click .toggle-open": function (event, template) {
    var openState = template.openState.get();
    template.openState.set(!openState);
  }
});
