var UserListView = Hitch.View.extend({

  template: _.template($('#user-list-view').html()),

  initialize: function() {
    this.model.on('reset', this.render, this);
    this.model.on('add', this.appendUser, this);
  },

  render: function() {

    this.$el.html(this.template({ users: this.model }));

    _.each(this.model.models, function(user) {
      this.appendUser(user);
    }, this);

    return this;
  },

  appendUser: function(user) {
    this.$('.user-list').append(new UserListItemView({ model: user }).render().el);
  }

});