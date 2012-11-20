define(['hitch'], function() {

  var Todo = Hitch.Object.extend({

    idAttribute: '_id',

    defaults: {
      status: 'open'
    },

    setDone: function(undo) {
      if (undo === true) {
        this.set('status', 'open');
      } else {
        this.set('status', 'done');
      }
    }

  });

  return Hitch.Resource.extend({

    name: 'todos',

    model: Todo,

    parse: function(response) {
      return _.values(response);
    }

  });

});