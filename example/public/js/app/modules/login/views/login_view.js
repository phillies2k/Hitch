define(['hitch'], function(Hitch) {

  return Hitch.View.extend({

    template: _.template($('#login-view').html()),

    className: 'modal-dialog',

    events: {
      'click #login button': 'login',
      'click #register button': 'register'
    },

    beforeOpen: function(callback) {
      $('#overlay').fadeIn(800, _.bind(function() {
        this.$el.fadeIn(500);
      }, this));
    },

    beforeClose: function() {
      $('#overlay').fadeOut(800);
      this.$el.fadeOut(800);
    },

    render: function() {
      this.$el.html(this.template());
      this.$username = this.$('#login-user');
      this.$password = this.$('#login-pass');
      this.$reguname = this.$('#register-user');
      this.$regpass1 = this.$('#register-pass1');
      this.$regpass2 = this.$('#register-pass2');
      return this;
    },

    login: function(e) {

      e.preventDefault();

      var credentials = { username: this.$username.val(), password: this.$password.val() }
        , login = new Hitch.Credentials(credentials, { url: '/hitch/api/login' });

      login.fetch({

        type: 'POST',

        data: credentials,

        success: _.bind(function(user) {
          this.trigger('login.success', user);
        }, this),

        error: _.bind(function() {
          console.log.apply(console, ['invalid credentials'].concat(_.toArray(arguments)));
        }, this)

      });

      return false;
    },

    register: function(e) {
      e.preventDefault();

      if (this.$reguname.val() === '' || this.$regpass1.val() === '' || this.$regpass1.val() !== this.$regpass2.val()) {
        console.log("error");
        return;
      }

      this.model.create({
        username: this.$reguname.val(),
        password: this.$regpass1.val(),
        role: new Hitch.Role({
          name: 'admin'
        })
      }, {
        success:_.bind(function() {
          this.trigger('registration.success');
        }, this)
      });
    }

  });

});