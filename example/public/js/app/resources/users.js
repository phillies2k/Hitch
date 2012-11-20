define(['hitch'], function() {

  return Hitch.Resource.extend({

    name: 'users',

    model: Hitch.User,

    parse: function(response) {
      return _.values(response);
    }

  });

});