define([

  'app/modules/todos/views/todo_list_view',
  'app/modules/todos/views/todo_view'

], function(TodoListView,
            TodoView
  ) {

  return Hitch.Router.extend({

    routes: {
      'todos'           : 'index',
      'todos/create'    : 'create',
      'todos/:id'       : 'view',
      'todos/:id/edit'  : 'edit'
    },

    initialize: function(options) {
      this.user = options.user;
    },

    index: function() {
      var view = new TodoListView({ model: this.resource });
      this.showView('#content', view);
    },

    create: function() {
      var view = new TodoView({ model: new this.resource.model() });
      this.showView('#content', view);
    },

    edit: function(id) {

      var model = this.resource.get(id)
        , view;

      if (model) {
        view = new TodoView({ model: model });
        this.showView('#content', view);
      }
    },

    view: function(id) {

      var model = this.resource.get(id)
        , view;

      if (model) {
        view = new TodoView({ model: model });
        this.showView('#content', view);
      }
    }

  });

});