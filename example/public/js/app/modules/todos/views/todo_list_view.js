define([

  'app/modules/todos/views/todo_list_item_view'

], function(TodoListItemView) {

  var TodoList = '' +
    '<h2>Todos</h2>' +
    '<nav>' +
    '<span><a href="#!filter/open">open (<%= open %>)</a></span>' +
    '<span><a href="#!filter/done">done (<%= done %>)</a></span>' +
    '</nav>' +
    '<ul class="todo-list"></ul>';

  return Hitch.View.extend({

    template: _.template(TodoList),

    initialize: function() {
      this.model.on('reset', this.render, this);
      this.model.on('add', this.appendTodoItem, this);
    },

    render: function() {

      this.$el.html(this.template({
        done: this.model.where({ status: 'done' }).length,
        open: this.model.where({ status: 'open' }).length
      }));

      _.each(this.model.models, function(todo) {
        this.appendTodoItem(todo);
      }, this);

      return this;
    },

    appendTodoItem: function(todo) {
      this.$('.todo-list').append(new TodoListItemView({ model: todo }).render().el);
    }

  });

});