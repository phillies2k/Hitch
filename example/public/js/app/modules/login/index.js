define(['app/modules/login/views/login_view'], function(LoginView) {

  return Hitch.Router.extend({

    routes: {
      'login'     : 'login',
      'logout'    : 'logout'
    },

    initialize: function(options) {
      this.user = options.user;
    },

    logout: function() {
      Hitch.Cookies.clear('hitch-user');
      this.user.loggedIn = false;
      this.user.clear({ silent: true });
      this.navigate('/', true);
    },

    login: function() {

      var loginView = new LoginView({ model: this.resource });

      loginView.on('login.success', function(user) {

        this.user.loggedIn = true;
        this.user.set(user);
        Hitch.Cookies.set('hitch-user', this.user.id);

        loginView.close();

        this.navigate('/', true);

      }, this);

      loginView.on('registration.success', function() {
        this.navigate('/', true);
      }, this);

      this.showView('#login-register', loginView);
    }

  });

});