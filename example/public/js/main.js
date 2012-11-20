requirejs.config({

  paths: {
    "objectid"        : "vendor/Objectid",
    "jquery"          : "vendor/jquery",
    "underscore"      : "vendor/underscore",
    "backbone"        : "vendor/backbone",
    "hitch"           : "vendor/hitch",
    "hitch.cookies"   : "vendor/hitch.cookies",
    "hitch.helpers"   : "vendor/hitch.helpers",
    "collaborate"     : "app/index"
  },

  shim: {

    "backbone": {
      deps: [ 'jquery', 'underscore' ],
      exports: 'Backbone'
    },

    "hitch": {
      deps: [ 'objectid', 'backbone' ],
      exports: 'Hitch'
    },

    "hitch.cookies": {
      deps: [ 'hitch' ]
    },

    "hitch.helpers": {
      deps: [ 'hitch' ]
    },

    "collaborate": {
      deps: [ 'hitch', 'hitch.cookies', 'hitch.helpers' ],
      exports: "Collaborate"
    }

  }

});

require([

  'collaborate',
  '../../app/resources/users',
  'app/resources/todos'

], function(Collaborate,
            Users,
            Todos
  ) {

  var app = new Collaborate();
  app.load(Users, Todos);

});