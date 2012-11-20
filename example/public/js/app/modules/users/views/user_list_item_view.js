var UserListItemView = Hitch.View.extend({

  template: _.template($('#user-list-item-view').html()),

  tagName: 'li',

  initialize: function() {
    this.model.on('change', this.render, this);
    this.model.on('destroy', this.close, this);
  },

  render: function() {
    this.$el.html(this.template(_.extend({ model: this.model }, this.model.toJSON())));
    return this;
  }

});