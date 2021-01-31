// backoffice pages routes
var onBeforeAction = function() {
	var currentUser = Meteor.userId();
	if(currentUser){
		// logged-in
		//this.next();
	} else {
		// not logged-in
		//Router.go('/sign-in');
	}
	this.next();
};

Router.route('/', {
	name: 'dashboard',
  template: 'dashboard',
  layoutTemplate: "AdminLTE"/*,
  onBeforeAction: onBeforeAction*/
});

Router.route('/diagrams', {
  template: 'diagrams',
  layoutTemplate: "AdminLTE"/*,
  onBeforeAction: onBeforeAction*/
});
