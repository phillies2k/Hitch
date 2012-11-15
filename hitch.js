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
    , Hitch = root.Hitch = {}
    , extend;

  if (!_) throw new Error("Hitch requires underscore.");
  if (!Backbone) throw new Error("Hitch requires backbone.");
  if (!ObjectId) throw new Error("Hitch requires ObjectId.");

  extend = Backbone.Router.extend;

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

  /**
   * Hitch.Credentials
   * @extend Backbone.Model
   */
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

  /**
   * Hitch.Role
   * @extend Hitch.Object
   */
  Hitch.Role = Hitch.Object.extend({

    defaults: {
      name: 'anonymous'
    },

    /**
     * Returns the name of this role
     * @return {String}
     */
    getName: function() {
      return this.get('name');
    },

    /**
     * Sets the name of this role
     * @param name
     * @param options
     * @return {*}
     */
    setName: function(name, options) {
      return this.set('name', name, options);
    }

  });

  /**
   * Hitch.User
   * @extend Hitch.Object
   */
  Hitch.User = Hitch.Object.extend({

    loggedIn: false,

    relations: {
      role: Hitch.Role
    },

    /**
     * Returns wether this user is logged in or not
     */
    isLoggedIn: function() {
      return this.loggedIn;
    }

  });

  /**
   * Hitch.Credentials
   * @extend Hitch.Object
   */
  Hitch.Credentials = Hitch.Object.extend({

    // the name of the login attribute
    userAttribute: 'username',

    // the name of the password attribute
    passAttribute: 'password',

    /**
     * Validates given credentials
     * @param attributes
     */
    validate: function(attributes) {

      if (!attributes || !_.isPlainObject(attributes)) {
        return "invalid credentials.";
      }

      if (!attributes[this.userAttribute]) {
        return "no " + this.userAttribute + " given.";
      }

      if (!attributes[this.passAttribute]) {
        return "no " + this.passAttribute + " given."
      }

    },

    /**
     * Initializes user credentials
     * @param attrs
     * @param options
     */
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

    /**
     * Trys to authenticate the user and updates models and cookies
     * @param options
     */
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

  /**
   * Hitch.Resource
   * @extend Backbone.Collection
   */
  Hitch.Resource = Backbone.Collection.extend({

    // list of comparison operators
    operators: '$eq $in $or $gt $gte $lt $lte'.split(' '),

    // base model
    model: Hitch.Object,

    // returns the acl for this resource
    getACL: Hitch.Object.prototype.getACL,

    // sets the acl for this resource
    setACL: Hitch.Object.prototype.setACL,

    /**
     * Finds models matching the given criteria
     * @param criteria the criteria to filter for
     * @param options (optional)
     * @return {[]} list of matched models
     */
    find: function(criteria, options) {

      var results;

      if (_.isEmpty(criteria)) return this.models;

      results = this.filter(function(model) {
        for (var key in criteria) {
          if (!this._evaluateCriteria(model, key, criteria[key])) {
            return false;
          }
        }
        return true;
      }, this);

      return options.limit ? _.first(results, options.limit) : results;
    },

    /**
     * Finds one result matching the criteria
     * @param criteria
     * @return {[]}
     */
    findOne: function(criteria) {
      if (!_.isPlainObject(criteria)) return;
      return this.find(criteria, { limit: 1 });
    },

    /**
     * Evaluates the search-criteria for a given attribute on the model
     * @param model the model to use
     * @param attr the attribute name of the property to check
     * @param value the expected value
     * @param operator (optional) operator to use for comparison
     * @return Boolean
     * @private
     */
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

  /**
   * Hitch.Router
   * @param options
   * @constructor
   */
  Hitch.Router = function(options) {

    options = options || {};

    // inject options
    if (options.resource) this.resource = options.resource;
    if (options.routes) this.routes = options.routes;

    // bind filters
    this._bindFilters();

    // bind routes
    this._bindRoutes();

    // call initialize
    this.initialize.apply(this, arguments);
  };

  // make it extendable
  Hitch.Router.extend = extend;

  /**
   * Hitch.Router.prototype
   */
  _.extend(Hitch.Router.prototype, Backbone.Router.prototype, {

    constructor: Hitch.Router,

    // used display slots
    _displaySlots: {},

    // route filters
    _filters: {},

    /**
     * Adds an after filter
     * @param route
     * @param filter
     * @param context
     */
    onAfter: function(route, filter, context) {
      this._addFilter.apply(this, ['after'].concat(_.toArray(arguments)));
    },

    /**
     * Adds a before filter
     * @param route
     * @param filter
     * @param context
     */
    onBefore: function(route, filter, context) {
      this._addFilter.apply(this, ['before'].concat(_.toArray(arguments)));
    },

    /**
     * Routes the request
     * @param route
     * @param name
     * @param callback
     * @return {*}
     */
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

    /**
     * displays a view at the given selector
     * @param selector
     * @param view
     * @return {*}
     */
    showView: function(selector, view) {

      if (this._displaySlots[selector]) {
        this._displaySlots[selector].close();
      }

      $(selector).html(view.render().el);
      view.open();

      this._displaySlots[selector] = view;
      return view;

    },

    /**
     * Adds a filter to the list of route filters
     * @param type
     * @param route
     * @param filter
     * @param context
     * @private
     */
    _addFilter: function(type, route, filter, context) {
      var routeFilters;
      if (!this._filters[type]) this._filters[type] = {};
      if (!this._filters[type][route]) routeFilters = this._filters[type][route] = [];
      routeFilters[routeFilters.length] = _.bind(filter, context || this);
    },

    /**
     * Applies routing filters of the given type
     * @param type
     * @param fragment
     * @param args
     */
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

    /**
     * binds after and before callback handlers
     * @private
     */
    _bindFilters: function() {
      for (var a in this.after) this._addFilter('after', a, this.after[a]);
      for (var b in this.before) this._addFilter('before', b, this.before[b]);
    }

  });

  /**
   * Hitch.View
   * @param options
   * @constructor
   */
  Hitch.View = function(options) {
    if (options && options.resource) this.resource = options.resource;
    Backbone.View.prototype.constructor.call(this, options);
  }

  // make it extendable
  Hitch.View.extend = extend;

  /**
   * Hitch.View.prototype
   */
  _.extend(Hitch.View.prototype, Backbone.View.prototype, {

    /**
     * delegates data-binding event handlers
     */
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

    /**
     * closes this view
     */
    close: function() {

      if (this.beforeClose) {
        this.beforeClose();
      }

      this.undelegateEvents();
      this.remove();
    },

    /**
     * opens this view at the given selector
     * @param selector
     */
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

  /**
   * Hitch.App
   * @param options
   * @constructor
   */
  Hitch.App = function(options) {

    options = options || {};

    // map arguments to properties if options is not a plain object (e.g: { a: 'b', c: 'd' })
    if (!_.isPlainObject(options)) {
      options = _.object(['name', 'apiUrl', 'baseRoute'], _.toArray(arguments));
    }

    // inject mandatory options
    if (options.apiUrl) this.apiUrl = options.apiUrl;
    if (options.baseRoute) this.baseRoute = options.baseRoute;
    if (options.name) this.setName(options.name);

    // ensure base route is an instance of RegExp
    if (!_.isRegExp(this.baseRoute)) {
      this.baseRoute = Backbone.Router.prototype._routeToRegExp(this.baseRoute);
    }

    // setup the error route
    Backbone.history.route(/^(.+?)$/, _.bind(function(fragment) {
      var args = Backbone.Router.prototype._extractParameters(/^(.*?)$/, fragment);
      this.error.apply(this, args);
      this.trigger.apply(this, ['route:error'].concat(args));
      Backbone.history.trigger('route', this, 'error', args);
    }, this));

    // setup the home route
    Backbone.history.route(this.baseRoute, _.bind(function(fragment) {
      var args = Backbone.Router.prototype._extractParameters(this.baseRoute, fragment);
      this.index.apply(this, args);
      this.trigger.apply(this, ['route:index'].concat(args));
      Backbone.history.trigger('route', this, 'index', args);
    }, this));

    // enable pushState style
    if (this.pushState) {
      // filter internal links and map them to backbone history
      $('a').on('click', function(e) {
        var href = $(this).attr('href');
        if (!$(this).attr('target') && !/^(http\:\/\/|www\.)/.test(href)) {
          e.preventDefault();
          Backbone.history.navigate(href, true);
        }
      });
    }

    // apply the ready state callback (when all resources are fetched successfully)
    this.on('ready', this.ready, this);

    // call initialize
    this.initialize.call(this, _.toArray(arguments));
  };

  // make it extendable
  Hitch.App.extend = extend;

  /**
   * Hitch.App.prototype
   */
  _.extend(Hitch.App.prototype, Backbone.Events, {

    // the base route for the home action
    baseRoute: /^$/,

    // the base api url
    apiUrl: '',

    // enables pushState support
    pushState: false,

    // exports the application public interface to the global object (window or globals)
    exports: false,

    // the application name
    name: 'app',

    /*
     * Returns the application name
     */
    getName: function() {
      return this.name;
    },

    /**
     * Sets the application title and modifies the document.title
     * @param name
     */
    setName: function(name) {
      this.name = document.title = ( name || document.title );
    },

    /**
     * Returns the application's base route
     */
    getBaseRoute: function() {
      return this.baseRoute;
    },

    /**
     * Returns the public interface for this application
     * @return {*}
     */
    getPublicInterface: function() {
      var publicInterfaceMethodNames = _.filter(_.keys(this), function(key) { return key.charAt(0) !== '_'; })
      return _.pick(this, publicInterfaceMethodNames);
    },

    /**
     * Appends an asset to the document head
     * @param type
     * @param source
     */
    appendAsset: function(type, source) {
      if (type === 'stylesheet') {
        $('<link rel="stylesheet" type="text/css" href="' + source + '">').appendTo('head');
      } else if (type === 'javascript') {
        $('<script type="text/javascript" src="' + source + '"></script>').appendTo('head');
      }
    },

    /**
     * Loads all resources and fires a ready event when all resources are in sync with the server.
     * @param resources
     */
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

    /**
     * Launches the application
     */
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

  /**
   * Synchronize method that is used by all modules
   */
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