define(['hitch'], function() {

  return Hitch.View.extend({

    template: _.template($('#user-view').html()),

    initialize: function() {
      this.model.on('change', this.render, this);
      this.model.on('destroy', this.close, this);
    },

    events: {
      'focus input': 'onFocus'
    },

    onFocus: function() {

    },

    render: function(data) {
      data = _.extend({ model: this.model }, this.model.toJSON(), data);
      this.$el.html(this.template(data));
      return this;
    }

  });

});