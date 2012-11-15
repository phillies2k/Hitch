/**
 * Hitch.js - v0.0.2
 * Lightweight backbone based single page application framework
 *
 * @author: Philipp Boes <mostgreedy@gmail.com>
 * @copyright: (c) 2012 Philipp Boes
 * @version: 0.0.2
 *
 */
(function() {

  var root = this
    , Backbone = root.Backbone
    , _ = root._
    , ObjectId = root.ObjectId
    , Hitch = root.Hitch = {};

  if (!_) throw new Error("Hitch requires underscore.");
  if (!Backbone) throw new Error("Hitch requires backbone.");
  if (!ObjectId) throw new Error("Hitch requires ObjectId.");

  Hitch.VERSION = '0.0.2';

  Hitch.ACL = function(permissions) {

    this.permissions = {};

    if (permissions instanceof Hitch.Object || permissions instanceof Hitch.Resource) {

      this.setReadAccess(permissions, true);
      this.setWriteAccess(permissions, true);

    } else if (_.isObject(permissions)) {

      _.each(permissions, function(accessList, userId) {

        this.permissions[userId] = {};

        _.each(accessList, function(allowed, permission) {
          this.permissions[userId][permission] = allowed;
        }, this);

      }, this);

    }
  };

  Hitch.ACL.PUBLIC = 'PUBLIC';

  Hitch.ACL.prototype = {

    constructor: Hitch.ACL,

    _determineUserId: function(userId) {
      if (userId instanceof Hitch.User) {
        return userId.id;
      } else if (userId instanceof Hitch.Role) {
        return 'role:' + userId.getName();
      } else if (userId instanceof Hitch.Resource) {
        return 'resource:' + userId.name;
      } else if (_.isObject(userId)) {
        return userId.toString();
      } else {
        return userId;
      }
    },

    _getAccess: function(accessType, userId) {

      var permissions;

      userId = this._determineUserId(userId);
      permissions = this.permissions[userId];

      return permissions && permissions[accessType];

    },

    _setAccess: function(accessType, userId, allowed) {

      var permissions;

      userId = this._determineUserId(userId);
      permissions = this.permissions[userId];

      if (!permissions) {
        if (!allowed) return;
        permissions = {};
        this.permissions[userId] = permissions;
      }

      if (allowed) {
        this.permissions[userId][accessType] = true;
      } else {
        delete permissions[accessType];
        if (_.isEmpty(permissions)) {
          delete permissions[userId];
        }
      }
    },

    getPublicReadAccess: function() {
      return this._getAccess('read', Hitch.ACL.PUBLIC);
    },

    setPublicReadAccess: function(allowed) {
      this._setAccess('read', Hitch.ACL.PUBLIC, allowed);
    },

    getRoleReadAccess: function(role) {
      return this._getAccess('read', role);
    },

    setRoleReadAccess: function(role, allowed) {
      this._setAccess('read', role, allowed);
    },

    getReadAccess: function(userId) {
      return this._getAccess('read', userId);
    },

    setReadAccess: function(userId, allowed) {
      this._setAccess('read', userId, allowed);
    },

    getWriteAccess: function(userId) {
      return this._getAccess('write', userId);
    },

    setWriteAccess: function(userId, allowed) {
      this._setAccess('write', userId, allowed);
    },

    getPublicWriteAccess: function() {
      return this._getAccess('write', Hitch.ACL.PUBLIC);
    },

    setPublicWriteAccess: function(allowed) {
      this._setAccess('write', Hitch.ACL.PUBLIC, allowed);
    },

    getRoleWriteAccess: function(role) {
      return this._getAccess('write', Hitch.ACL.PUBLIC);
    },

    setRoleWriteAccess: function(role, allowed) {
      this._setAccess('write', role, allowed);
    },

    toJSON: function() {
      return _.clone(this.permissions);
    }

  };

  Hitch.Object = Backbone.Model.extend({

    idAttribute: '_id',

    isStoredLocally: false,

    storageKey: null,

    acl: null,

    relations: {},

    getACL: function() {

      if (!this.acl) {
        this.acl = new Hitch.ACL(this);
      }

      return this.acl
    },

    set: function(attrs, options) {

      _.each(this.relations, function(constructor, name) {

        var related = this[name];

        if (!related) {
          if (attrs[name] && (attrs[name] instanceof Backbone.Model || attrs[name] instanceof Backbone.Collection)) {
            related = this[name] = attrs[name];
          } else {
            related = this[name] = new constructor();
          }
        }

        if (attrs[name]) {
          related[ related instanceof Backbone.Collection ? 'reset' : 'set' ](attrs[name], options);
        }

      }, this);

      if (attrs[this.idAttribute]) {
        if (_.isObject(attrs[this.idAttribute]) && _.has(attrs[this.idAttribute], '$id')) {
          attrs[this.idAttribute] = attrs[this.idAttribute].$id;
        }
      }

      return Backbone.Model.prototype.set.call(this, attrs, options);
    },

    sync: function(method, model, options) {
      return Hitch.sync.call(this, method, model, options);
    },

    toJSON: function() {

      var attributes = _.clone(this.attributes);

      _.each(_.keys(this.relations), function(name) {
        attributes[name] = this[name].toJSON();
      }, this);

      return attributes;
    }

  });

  Hitch.Role = Hitch.Object.extend({

    defaults: {
      name: 'anonymous'
    },

    getName: function() {
      return this.get('name');
    },

    setName: function(name, options) {
      return this.set('name', name, options);
    }

  });

  Hitch.User = Hitch.Object.extend({

    loggedIn: false,

    relations: {
      role: Hitch.Role
    },

    isLoggedIn: function() {
      return this.loggedIn;
    }

  });

  Hitch.Credentials = Hitch.Object.extend({

    userAttribute: 'username',

    passAttribute: 'password',

    validate: function(attributes) {

      if (!attributes[this.userAttribute]) {
        return "no " + this.userAttribute + " given.";
      }

      if (!attributes[this.passAttribute]) {
        return "no " + this.passAttribute + " given."
      }

    },

    initialize: function(attrs, options) {

      options = options || {};

      if (options.user && options.user instanceof Hitch.User) {
        this.user = options.user;
      } else {
        this.user = new Hitch.User();
      }

      if (options.url) {
        this.url = options.url;
      }
    },

    fetch: function(options) {

      var success
        , error;

      options = options || {};

      if (options.success) success = options.success;
      if (options.error) error = options.error;

      options.data = this.toJSON();
      options.type = 'POST';

      options.success = _.bind(function(response) {
        this.user.loggedIn = true;
        this.user.set(response);
        Hitch.Cookies.set('hitch-user', this.user.id);
        if (success) success(this, response);
      }, this);

      options.error = _.bind(function(err) {
        Hitch.Cookies.clear('hitch-user');
        this.user.loggedIn = false;
        this.user.clear({ silent: true });
        if (error) error(this, err);
      }, this);

      return Hitch.Object.prototype.fetch.call(this, options);
    }

  });

  Hitch.Resource = Backbone.Collection.extend({

    operators: '$eq $in $or $gt $gte $lt $lte'.split(' '),

    model: Hitch.Object,

    getACL: Hitch.Object.prototype.getACL,

    setACL: Hitch.Object.prototype.setACL,

    find: function(attrs, options) {

      var results;

      if (_.isEmpty(attrs)) return this.models;

      results = this.filter(function(model) {
        for (var key in attrs) {
          if (!this._evaluateCriteria(model, key, attrs[key])) {
            return false;
          }
        }
        return true;
      }, this);

      return options.limit ? _.first(results, options.limit) : results;
    },

    findOne: function(criteria) {
      if (!_.isPlainObject(criteria)) return;
      return this.find(criteria, { limit: 1 });
    },

    _evaluateCriteria: function(model, attr, value, operator) {

      function returnVal(statement, op, condition) {
        switch (op) {
          case '$eq':
            return statement === condition;
          case '$in':
            return statement.indexOf(condition) >= 0;
          case '$or':
            return statement || condition;
          case '$gt':
            return statement > condition;
          case '$gte':
            return statement >= condition;
          case '$lt':
            return statement < condition;
          case '$lte':
            return statement <= condition;
          default:
            return statement == condition;
        }
      }

      if (this.operators.indexOf(attr) === -1) {
        return returnVal(model.get(attr), operator, value);
      } else if (_.isObject(value)) {
        for (var p in value) {
          if (!this._evaluateCriteria(model, p, value[p], attr)) {
            return false;
          }
        }
        return true;
      }
    }

  });

  Hitch.Router = function(options) {

    options = options || {};

    if (options.resource) this.resource = options.resource;
    if (options.routes) this.routes = options.routes;

    this._bindFilters();
    this._bindRoutes();

    this.initialize.apply(this, arguments);
  };

  Hitch.Router.extend = Backbone.Router.extend;

  _.extend(Hitch.Router.prototype, Backbone.Router.prototype, {

    constructor: Hitch.Router,

    before: {},

    after: {},

    _displaySlots: {},

    _filters: {},

    onAfter: function(route, filter, context) {
      this._addFilter.apply(this, ['after'].concat(_.toArray(arguments)));
    },

    onBefore: function(route, filter, context) {
      this._addFilter.apply(this, ['before'].concat(_.toArray(arguments)));
    },

    route: function(route, name, callback) {

      if (!_.isRegExp(route)) {
        route = this._routeToRegExp(route);
      }

      if (!callback) {
        callback = this[name];
      }

      Backbone.history.route(route, _.bind(function(fragment) {

        var args = this._extractParameters(route, fragment);

        if (this._applyFilters('before', fragment, args)) {

          callback && callback.apply(this, args);

          this._applyFilters('after', fragment, args);

          this.trigger.apply(this, ['route:' + name].concat(args));
          Backbone.history.trigger('route', this, name, args);

        }


      }, this));
      return this;
    },

    showView: function(selector, view) {

      if (this._displaySlots[selector]) {
        this._displaySlots[selector].close();
      }

      $(selector).html(view.render().el);
      view.open();

      this._displaySlots[selector] = view;
      return view;

    },

    _addFilter: function(type, route, filter, context) {
      var routeFilters;
      if (!this._filters[type]) this._filters[type] = {};
      if (!this._filters[type][route]) routeFilters = this._filters[type][route] = [];
      routeFilters[routeFilters.length] = _.bind(filter, context || this);
    },

    _applyFilters: function(type, fragment, args) {

      var filters, ret;

      if (!this._filters[type] || _.isEmpty(this._filters[type])) {
        return true;
      }

      filters = _.filter(this._filters[type], function(fn, route) {
        if (!_.isRegExp(route)) route = this._routeToRegExp(route);
        return route.test(fragment);
      }, this);

      ret = _.isEmpty(filters) || !_.find(filters, function(handlers, route) {
        var ret = [];
        _.each(handlers, function(fn) {
          var result = _.isFunction(fn) ? fn.apply(this, args) : this[fn].apply(this, args);
          ret.push(_.isBoolean(result) && result === false);
        }, this);
        return _.compact(ret).length === 0;
      }, this);

      if (type === 'before' && _.isFunction(this.beforeAll)) {
        ret = ret && this.beforeAll();
      }

      if (type === 'after' && _.isFunction(this.afterAll)) {
        ret = ret && this.afterAll();
      }

      return ret;
    },

    _bindFilters: function() {
      for (var a in this.after) this._addFilter('after', a, this.after[a]);
      for (var b in this.before) this._addFilter('before', b, this.before[b]);
    }

  });

  Hitch.View = function(options) {
    if (options && options.resource) this.resource = options.resource;
    Backbone.View.prototype.constructor.call(this, options);
  }

  Hitch.View.extend = Backbone.View.extend;

  _.extend(Hitch.View.prototype, Backbone.View.prototype, {

    delegateBindings: function() {

      _.each(_.toArray(this.$('[data-bind]')), function(node) {

        var attr = $(node).data('bind')
          , prop = $(node).data('bind-attribute');

        this.model.on('change:' + attr, function() {

          if (prop) {
            $(node).attr(prop, this.model.get(attr));
          } else {
            $(node).html(this.model.get(attr));
          }

        }, this);
      }, this);

    },

    close: function() {

      if (this.beforeClose) {
        this.beforeClose();
      }

      this.undelegateEvents();
      this.remove();
    },

    open: function(selector) {

      this.delegateEvents();
      this.delegateBindings();

      if (this.beforeOpen) {
        this.$el.hide();
        this.beforeOpen(_.bind(function() {
          this.$el.show();
        }, this));
      }

    }

  });

  Hitch.App = function(options) {

    options = options || {};

    if (!_.isObject(options)) {
      options = _.object(['name', 'apiUrl', 'baseRoute'], _.toArray(arguments));
    }

    if (options.apiUrl) this.apiUrl = options.apiUrl;
    if (options.baseRoute) this.baseRoute = options.baseRoute;
    if (options.name) this.setName(options.name);
    if (!_.isRegExp(this.baseRoute)) this.baseRoute = Backbone.Router.prototype._routeToRegExp(this.baseRoute);

    // error route
    Backbone.history.route(/^(.+?)$/, _.bind(function(fragment) {
      var args = Backbone.Router.prototype._extractParameters(/^(.*?)$/, fragment);
      this.error.apply(this, args);
      this.trigger.apply(this, ['route:error'].concat(args));
      Backbone.history.trigger('route', this, 'error', args);
    }, this));

    // home route
    Backbone.history.route(this.baseRoute, _.bind(function(fragment) {
      var args = Backbone.Router.prototype._extractParameters(this.baseRoute, fragment);
      this.index.apply(this, args);
      this.trigger.apply(this, ['route:index'].concat(args));
      Backbone.history.trigger('route', this, 'index', args);
    }, this));

    // enable pushState style
    if (this.pushState) {

      $('a').live('click', function(e) {
        var href = $(this).attr('href')
        if (!$(this).attr('target') && !/^(http\:\/\/|www\.)/.test(href)) {
          e.preventDefault();
          Backbone.history.navigate(href, true);
        }
      });

    }

    this.on('ready', this.ready, this);
    this.initialize.call(this, _.toArray(arguments));
  };

  Hitch.App.extend = Backbone.Router.extend;
  _.extend(Hitch.App.prototype, Backbone.Events, {

    baseRoute: /^$/,

    apiUrl: '',

    pushState: false,

    exports: false,

    name: 'app',

    getName: function() {
      return this.name;
    },

    setName: function(name) {
      this.name = document.title = name || document.title;
    },

    getBaseRoute: function() {
      return this.baseRoute;
    },

    getPublicInterface: function() {
      var publicInterfaceMethodNames = _.filter(_.keys(this), function(key) { return key.charAt(0) !== '_'; })
      return _.pick(this, publicInterfaceMethodNames);
    },

    appendAsset: function(type, source) {
      if (type === 'stylesheet') {
        $('<link rel="stylesheet" type="text/css" href="' + source + '">').appendTo('head');
      } else if (type === 'javascript') {
        $('<script type="text/javascript" src="' + source + '"></script>').appendTo('head');
      }
    },

    load: function(resources) {

      var length
        , loaded = 0;

      if (!_.isArray(resources)) {
        resources = _.toArray(arguments);
      }

      length = resources.length;
      this.resources = {};

      _.each(resources, function(resource) {

        if (_.isFunction(resource)) {
          resource = new resource();
        }

        if (!resource.name) {
          resource.name = _.uniqueId('r');
        }

        if (this.apiUrl) {
          resource.url = [ this.apiUrl, resource.name ].join('/');
        }

        resource.fetch({
          success: _.bind(function(collection) {
            this.resources[collection.name] = collection;
            if (++loaded === length) {
              this.trigger('ready', this.resources);
            }
          }, this)
        });

      }, this);

    },

    run: function() {

      Backbone.history.start({ pushState: this.pushState });

      if (this.exports) {
        var globalName = _.isString(this.exports) ? this.exports : this.name;
        root[globalName] = this.getPublicInterface();
      }
    },

    initialize: function() {
      // overwrite in subclasses
    },

    ready: function() {
      // overwrite in subclasses
    },

    index: function() {
      // overwrite in subclasses (default home route)
    },

    error: function() {
      // overwrite in subclasses
    }

  });

  Hitch.sync = function(method, model, options) {

    var success = options.success
      , item;

    if (model.isStoredLocally) {

      if (!model.storageKey) {
        model.storageKey = _.uniqueId('h');
      }

      item = localStorage.getItem(model.storageKey);

      if (method === 'create' || method === 'update') {
        item = model.toJSON();
        localStorage.setItem(model.storageKey, JSON.stringify(item));
      } else if (method === 'read') {
        item = item && JSON.parse(item);
      } else if (method === 'destroy') {
        if (item) localStorage.removeItem(model.storageKey);
      }

      if (success) success(item);
      return true;

    } else {
      return Backbone.sync(method, model, options);
    }
  };

}).call(this);