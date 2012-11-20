define(['hitch'], function() {

  return Hitch.Router.extend({

    routes: {
      'users'           : 'index',
      'users/create'    : 'create',
      'users/:id'       : 'view',
      'users/:id/edit'  : 'edit'
    },

    before: {

      'users/create': function() {

        if (this.resource.getACL().getRoleWriteAccess(this.user.role)) {
          return true;
        }

        this.navigate('/login', true);
      },

      'users/:id/edit': function() {

        if (this.resource.getACL().getRoleWriteAccess(this.user.role)) {
          return true;
        }

      }

    },

    beforeAll: function() {

      if (this.user.isLoggedIn()) {
        if (this.resource.getACL().getRoleReadAccess(this.user.role)) {
          return true;
        }
      }

      this.navigate('login', true);
      return false;
    },

    initialize: function(options) {
      this.user = options.user;
    },

    index: function() {
      var view = new UserListView({ model: this.resource });
      this.showView('#content', view);
    },

    create: function() {
      var view = new UserView({ model: new this.resource.model() });
      this.showView('#content', view);
    },

    edit: function(id) {

      var model = this.resource.get(id)
        , view;

      if (model) {
        view = new UserView({ model: model });
        this.showView('#content', view);
      }
    },

    view: function(id) {

      var model = this.resource.get(id)
        , view;

      if (model) {
        view = new UserView({ model: model });
        this.showView('#content', view);
      }
    }

  });

});