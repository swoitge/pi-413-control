
Template.dashboard.onCreated(function(){

  this.controllers = new ReactiveVar({});
  this.servos = new ReactiveVar({});

  api.templates.utils.createAccessibleVar(this, "state", {});

  var template = this;

  Meteor.call("getConfig", function(erer,result){
    template.controllers.set(result.controllers);
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
  new Slider(this.find('#slider-interval'), {min : 0, max : 500, step:1, value : 100})
    .on("slide", _.throttle(function(v){
      //console.log("on slideStop", arguments);
      Meteor.call("setLoopInterval", v);
    }, 1000));
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
