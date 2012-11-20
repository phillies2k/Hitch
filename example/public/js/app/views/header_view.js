define(['hitch'], function() {

  return Hitch.View.extend({

    template: _.template($('#header-view').html()),

    initialize: function() {
      this.model.on('change', this.render, this);
    },

    render: function() {
      this.$el.html(this.template(_.extend({ user: this.model, users: this.resource }, this.model.toJSON())));
      return this;
    }

  });

});