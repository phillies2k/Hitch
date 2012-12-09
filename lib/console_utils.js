var _ = require('underscore');

function ConsoleUtils(defaultHandler) {
  this._defaultHandler = defaultHandler;
  this._handlers = {};
  this._commands = {};
};

ConsoleUtils.prototype.pushCommand = function(command, callback) {

  if (!command instanceof ConsoleUtils.Command) {
    throw new Error("first argument needs to be an instance of ConsoleUtils.Command");
  }

  if (!_.isFunction(callback)) {
    throw new Error("second argument must be a valid callback");
  }

  if (this._commands[command.name]) {
    throw new Error("this command is already registered");
  }

  this._commands[command.name] = command;
  this._handlers[command.name] = callback;
};

ConsoleUtils.prototype.error = function() {

  var error = _.toArray(arguments)
    , errno = 0;

  if (_.isNumber(_.last(error))) {
    errno = error.pop();
  }

  console.log('ERROR (' + errno + ') ' + error.join(' '));
};

ConsoleUtils.prototype.run = function() {

  var args = _.rest(process.argv, 2)
    , dispatched = false;

  _.each(this._handlers, function(callback, name) {
    var command = this._commands[name];
    if (command.accepts(args)) {
      callback.apply(this, _.rest(args));
      dispatched = true;
    }
  }, this);

  if (!dispatched) {
    if (!args.length) {
      this._defaultHandler();
    } else {
      if (!this._commands[args[0]]) {
        this.error('Unknown command: "' + args[0] + '". See hitch help for detailed information.', 1337);
      } else {
        this.error('Invalid usage of "' + args[0] + '". See hitch help for detailed information.', 1338);
      }
    }
  }
};

ConsoleUtils.Command = function(name) {
  this.name = name;
};

ConsoleUtils.Command.prototype.accepts = function(args) {
  if (!args.length) return false;
  if (this.name !== args[0]) return false;
  return true;
};

exports = module.exports = ConsoleUtils;
