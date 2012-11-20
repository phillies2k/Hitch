define([

  'app/modules/login/index',
  'app/modules/users/index',
  'app/modules/todos/index',
  'app/views/header_view'

], function(LoginRouter,
            UsersRouter,
            TodosRouter,
            HeaderView) {

  return Hitch.App.extend({

    version: '1.0',

    apiUrl: '/api',

    initialize: function() {
      this.appendAsset('stylesheet', 'style.css');
      this.on('ready', this.run, this);
    },

    run: function() {

      this.loginRouter = new LoginRouter({ user: this.getCurrentUser(), resource: this.resources.users });
      this.usersRouter = new UsersRouter({ user: this.getCurrentUser(), resource: this.resources.users });
      this.todosRouter = new TodosRouter({ user: this.getCurrentUser(), resource: this.resources.todos });

      this.headerView = new HeaderView({ resource: this.resources.users, model: this.getCurrentUser() });
      $('#header').html(this.headerView.render().el);

      $('body a').on('click', _.bind(function(e) {
        e.preventDefault();
        var href = $(e.currentTarget).attr('href');
        Backbone.history.navigate(href, true);
      }, this));

      Backbone.history.start({ pushState: true });
      window.app = this;
    },

    getCurrentUser: function() {

      var userId = Hitch.Cookies.get('hitch-user')
        , user;

      if (!this.currentUser) {

        if (userId) {
          user = this.resources.users.get(userId);
        }

        if (!user) {
          user = new this.resources.users.model();
        }

        if (!user.isNew()) {
          user.loggedIn = true;
        }

        this.currentUser = user;
      }

      return this.currentUser;
    },

    index: function() {

    }

  });

});