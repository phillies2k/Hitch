/**
 * Hitch.js - v0.0.5
 * Lightweight backbone based single page application framework
 *
 * @author: Philipp Boes <mostgreedy@gmail.com>
 * @copyright: (c) 2012 Philipp Boes
 * @version: 0.0.5
 *
 */
(function() {

  // setup
  var root = this
    , Backbone = root.Backbone
    , _ = root._
    , ObjectId = root.ObjectId
    , Hitch = root.Hitch = {}
    , extend;

  // check dependencies
  if (!_) throw new Error("Hitch requires underscore.");
  if (!Backbone) throw new Error("Hitch requires backbone.");
  if (!ObjectId) throw new Error("Hitch requires ObjectId.");

  // cache extend
  extend = Backbone.Router.extend;

  // keep in syn with package.json
  Hitch.VERSION = '0.0.5';

  /**
   * Hitch.ACL
   * @param permissions
   * @constructor
   */
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

  // Public access role
  Hitch.ACL.PUBLIC = 'PUBLIC';

  /**
   * Hitch.ACL.prototype
   * @type {Object}
   */
  Hitch.ACL.prototype = {

    constructor: Hitch.ACL,

    /**
     * Returns the user id
     * @param userId
     * @return {*}
     * @private
     */
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

    /**
     * Returns access permissions for the given access type and user id
     * @param accessType
     * @param userId
     * @return {*}
     * @private
     */
    _getAccess: function(accessType, userId) {

      var permissions;

      userId = this._determineUserId(userId);
      permissions = this.permissions[userId];

      return permissions && permissions[accessType];

    },

    /**
     * Sets the access rights for the given access type and user id
     * @param accessType
     * @param userId
     * @param allowed
     * @private
     */
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

    /**
     * Returns the public read access permission
     * @return {*}
     */
    getPublicReadAccess: function() {
      return this._getAccess('read', Hitch.ACL.PUBLIC);
    },

    /**
     * Sets the public read access permission
     * @param allowed
     */
    setPublicReadAccess: function(allowed) {
      this._setAccess('read', Hitch.ACL.PUBLIC, allowed);
    },

    /**
     * Returns role read permissions
     * @param role
     * @return {*}
     */
    getRoleReadAccess: function(role) {
      return this._getAccess('read', role);
    },

    /**
     * Sets read access permissions for the given role
     * @param role
     * @param allowed
     */
    setRoleReadAccess: function(role, allowed) {
      this._setAccess('read', role, allowed);
    },

    /**
     * Returns the read access permission for a given user id
     * @param userId
     * @return {*}
     */
    getReadAccess: function(userId) {
      return this._getAccess('read', userId);
    },

    /**
     * Sets the read access permission for a given user id
     * @param userId
     * @param allowed
     */
    setReadAccess: function(userId, allowed) {
      this._setAccess('read', userId, allowed);
    },

    /**
     * Returns the write access permission for a given user id
     * @param userId
     * @return {*}
     */
    getWriteAccess: function(userId) {
      return this._getAccess('write', userId);
    },

    /**
     * Sets the write access permission for a given user id
     * @param userId
     * @param allowed
     */
    setWriteAccess: function(userId, allowed) {
      this._setAccess('write', userId, allowed);
    },

    /**
     * Returns the public write access permission
     * @return {*}
     */
    getPublicWriteAccess: function() {
      return this._getAccess('write', Hitch.ACL.PUBLIC);
    },

    /**
     * Sets the public write access permission
     * @param allowed
     */
    setPublicWriteAccess: function(allowed) {
      this._setAccess('write', Hitch.ACL.PUBLIC, allowed);
    },

    /**
     * Returns the write access permission for a given role
     * @param role
     * @return {*}
     */
    getRoleWriteAccess: function(role) {
      return this._getAccess('write', Hitch.ACL.PUBLIC);
    },

    /**
     * Sets the write access permission for a given role
     * @param role
     * @param allowed
     */
    setRoleWriteAccess: function(role, allowed) {
      this._setAccess('write', role, allowed);
    },

    /**
     * Returns a JSON representation of this ACL's permissions
     * @return {*}
     */
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

    /**
     * Returns the acl instance for this object
     * @return {*}
     */
    getACL: function() {

      if (!this.acl) {
        this.acl = new Hitch.ACL(this);
      }

      return this.acl
    },

    /**
     * Wrapper for Backbone.Model.prototype.set
     * Wires relations and id attributes
     * @param attrs
     * @param options
     */
    set: function(attrs, options) {

      _.each(this.relations, function(constructor, name) {

        var related = this[name]
          , data;

        if (!related) {
          if (attrs[name] && (attrs[name] instanceof Backbone.Model || attrs[name] instanceof Backbone.Collection)) {
            related = this[name] = attrs[name];
          } else {
            related = this[name] = new constructor();
          }
        }

        if (attrs[name]) {

          if (attrs[name] instanceof Backbone.Model || attrs[name] instanceof Backbone.Collection) {
            data = attrs[name].toJSON();
          } else {
            data = attrs[name];
          }

          related[ related instanceof Backbone.Collection ? 'reset' : 'set' ](data, options);
          attrs[name] = related.toJSON();
        }


      }, this);

      if (attrs[this.idAttribute]) {
        if (_.isObject(attrs[this.idAttribute]) && _.has(attrs[this.idAttribute], '$id')) {
          attrs[this.idAttribute] = attrs[this.idAttribute]['$id'];
        }
      }

      return Backbone.Model.prototype.set.call(this, attrs, options);
    },

    /**
     * Wrapper for Backbone.sync
     * @param method
     * @param model
     * @param options
     * @return {*}
     */
    sync: function(method, model, options) {
      return Hitch.sync.call(this, method, model, options);
    },

    /**
     * Returns the JSON representation of this object's data
     * @return {*}
     */
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

    // cookie
    cookie: {
      expires: false,
      path: false,
      domain: false,
      secure: false,
    },

    /**
     * Validates given credentials
     * @param attributes
     */
    validate: function(attributes) {

      if (!attributes || !$.isPlainObject(attributes)) {
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

      if (options.expires) {
        this.cookie.expires = options.expires;
      }

      if (options.path) {
        this.cookie.path = options.path;
      }

      if (options.domain) {
        this.cookie.domain = options.domain;
      }

      if (options.secure) {
        this.cookie.secure = !!options.secure;
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
        var args = _.compact(_.values(this.cookie));
        this.user.loggedIn = true;
        this.user.set(response);
        Hitch.Cookies.set.call(null, ['hitch-user', this.user.id].concat(args));
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
          if (!this._evaluateCriteria(model, key, criteria[key], null)) {
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
     * @return {*}
     */
    findOne: function(criteria) {
      if (!$.isPlainObject(criteria)) return;
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

      function returnVal(statement, condition, op) {
        if (!op) return statement == condition;
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
            return false;
        }
      }

      if (this.operators.indexOf(attr) === -1) {
        return returnVal(model.get(attr), value, operator);
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

    // create an acl
    this.acl = new Hitch.ACL(this);

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

      var allMethod = type + 'All'
        , filterAll = _.has(this, allMethod) ? this[allMethod] : false
        , filters
        , ret;

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

      if (_.isFunction(filterAll)) {
        ret = ret && filterAll();
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
    if (!$.isPlainObject(options)) {
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
      $('a[href]').live('click', function(e) {
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

      if (!length) {
        this.trigger('ready', this.resources);
      } else {
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
            success: _.bind(function() {
              this.resources[resource.name] = resource;
              resource.trigger('load', resource);
              if (++loaded === length) {
                this.trigger('ready', this.resources);
              }
            }, this)
          });

        }, this);
      }
    },

    /**
     * Launches the application
     */
    run: function(options) {

      Backbone.history.start(_.extend({ pushState: this.pushState }, options));

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

  Hitch.Cookies = {

    get: function (sKey) {
      if (!sKey || !this.has(sKey)) { return null; }
      return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
    },

    set: function(name, value, expires, path, domain, secure) {
      var cookie = {};

      if (!name || /^(?:expires|max\-age|path|domain|secure)$/i.test(name)) return;

      cookie[name] = escape(value);

      _.extend(cookie, _.object(
        ['expires', 'path', 'domain', 'secure'],
        _.rest(_.toArray(arguments), 2)
      ));

      if (cookie.expires && cookie.expires.constructor === Number) {
        if (cookie.expires === Infinity) {
          cookie.expires = 'Tue, 19 Jan 2038 03:14:07 GMT';
        } else {
          cookie['max-age'] = cookie.expires;
          delete cookie.expires;
        }
      } else if (cookie.expires && cookie.expires.constructor === Date) {
        cookie.expires = cookie.expires.toGMTString();
      } else if (cookie.expires && cookie.expires.constructor !== String) {
        delete cookie.expires;
      }

      document.cookie = _.compact(_.map(_.pairs(cookie), function(pair) {
        return !_.isUndefined(pair[1]) && pair.join('=');
      })).join(';');
    },

    clear: function (name, path) {
      if (!name || !this.has(name)) return;
      document.cookie = escape(name) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (path ? "; path=" + path : "");
    },

    has: function (name) {
      return _.indexOf(this.names(), name) !== -1;
    },

    names: function () {
      return _.map(document.cookie
        .replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "")
        .split(/\s*(?:\=[^;]*)?;\s*/)
        , function(name) {
          return unescape(name);
        });
    }
  };

  Hitch.Helpers = {

    createdAt: function(id) {
      return new ObjectId(id).getDate();
    },

    formField: function(model, attr, options) {

      function onFocus(e) {
        $('label[for^=' + _id + ']').removeClass('error')
        $(selector).removeClass('error').next('span').remove();
        prev = $(selector).val();
      }

      function onBlur(e) {

        var attrs = {}
          , value = $(selector).val();

        if (prev === curr) return;

        if (options.prop) {
          attrs[attr] = {};
          attrs[attr][options.prop] = value;
        } else {
          attrs[attr] = value;
        }

        model.on('error', function(m, err) {
          $('label[for^=' + _id + ']').addClass('error')
          $(selector).addClass('error').val(prev).insertAfter(
            $('<span></span>').text(err)
          );
        });

        model.set(attrs);
        if (options.save) model.save();
      }

      var curr = model.get(attr)
        , type
        , selector = '#' + attr + (model.isNew() ? '' : '-' + model.id )
        , _id = selector.substring(1)
        , prev = $(selector).val()
        , tagName = 'input'
        , label = attr
        , attrs = { id: _id, value: curr };

      options = options || {};

      if (_.isBoolean(options)) options = { save: options };
      if (_.isString(options)) options = { label: options };
      if (options.label) label = options.label;
      if (options.password) type = 'password';
      if (options.placeholder) attrs.placeholder = options.placeholder;
      if (options.prop && curr && _.has(curr, options.prop)) curr = attrs.value = curr[options.prop];

      type = attrs.type = type || ( _.isBoolean(curr) ? 'checkbox' : ( _.isNumber(curr) ? 'number' : 'text' ));

      if (options.text) {
        tagName = 'textarea';
        attrs = _.pick(attrs, 'id', 'placeholder');
      } else if (options.source instanceof Hitch.Resource) {
        tagName = 'select';
        attrs = _.pick(attrs, 'id', 'placeholder');
        _.each(options.source, function(model) {
          _.tagFor('option', { value: model.get() }, model.get())
        });
      }

      _.inDom(selector, function() {
        $(selector).on('focus', onFocus);
        $(selector).on('blur', onBlur);
      });

      return _.tagFor('dt', _.tagFor('label', { for: _id }, label)) +
        _.tagFor('dd', _.tagFor(tagName, attrs, options.text && curr));
    },

    inDom: function(el, callback) {
      var timer, to;
      (timer = function() {
        if (!$(el).length) return to = setTimeout(timer, 20);
        if (to) clearTimeout(to);
        callback();
      })();
    },

    tagFor: function(tagName, attrs, content) {

      var _noClosingTags = 'link input meta'.split(' ')

      if (attrs && !content && !_.isObject(attrs)) {
        content = attrs;
        attrs = {};
      }

      return '<' + tagName + ' ' + _.flatten(_.map(_.pairs(attrs), function(attr) {
        return attr.join('="') + '"';
      })).join(' ') + '>' +
        ( content
          ? content
          : ''
          ) +
        ( _noClosingTags.indexOf(tagName) >= 0
          ? ''
          : '</' + tagName + '>'
          );
    },

    ucFirst: function(str) {
      return str.charAt(0).toUpperCase() + str.substring(1);
    },

    lcFirst: function(str) {
      return str.charAt(0).toLowerCase() + str.substring(1);
    }
  };

  _.mixin(Hitch.Helpers);

}).call(this);