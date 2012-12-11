/**
 * Hitch.js - v0.1.1
 * Lightweight backbone based single page application framework
 *
 * @author: Philipp Boes <mostgreedy@gmail.com>
 * @copyright: (c) 2012 Philipp Boes
 * @version: 0.1.1
 *
 */
(function() {

  // setup
  var root = this
    , Backbone = root.Backbone
    , _ = root._
    , Hitch = root.Hitch = {}
    , extend;

  // check dependencies
  if (!_) throw new Error("Hitch requires underscore.");
  if (!Backbone) throw new Error("Hitch requires backbone.");

  // cache extend
  extend = Backbone.Router.extend;

  // keep in sync with package.json
  Hitch.VERSION = '0.1.1';

  /**
   * Hitch.Access Mixin
   * @type {Object}
   */
  Hitch.Access = {

    acl: null,

    /**
     * Returns the acl instance for this object
     * @return {*}
     */
    getACL: function() {

      if (!this.acl) {
        this.acl = new Hitch.ACL();
      }

      return this.acl;
    },

    /**
     * Sets the ACL instance for this object
     * @param acl
     */
    setACL: function(acl) {

      if (!acl instanceof Hitch.ACL) {
        throw new Error("acl must be an instance of Hitch.ACL");
      }

      this.acl = acl;
    }
  };

  /**
   * Hitch.Cookies
   * @type {Object}
   */
  Hitch.Cookies = {

    /**
     * Return the cookie value for the given name
     * @param name
     * @return {*}
     */
    get: function (name) {
      if (!name || !this.has(name)) { return null; }
      return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(name).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
    },

    /**
     * Creates a cookie
     * @param name
     * @param value
     * @param expires
     * @param path
     * @param domain
     * @param secure
     */
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

    /**
     * Deletes a cookie by its name and optional path
     * @param name
     * @param path
     */
    clear: function (name, path) {
      if (!name || !this.has(name)) return;
      document.cookie = escape(name) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (path ? "; path=" + path : "");
    },

    /**
     * Checks if a cookie with given name was set
     * @param name
     */
    has: function (name) {
      return _.indexOf(this.names(), name) !== -1;
    },

    /**
     * Returns the list of cookie names
     */
    names: function () {
      return _.map(document.cookie
        .replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "")
        .split(/\s*(?:\=[^;]*)?;\s*/)
        , function(name) {
          return unescape(name);
        });
    }
  };

  /**
   * Hitch.Helpers Mixin
   * @type {Object}
   */
  Hitch.Helpers = {

    /**
     * Creates a labeled and edittable form field for given model and attribute.
     * @param model
     * @param attr
     * @param options
     */
    formField: function(model, attr, options) {

      function onFocus(e) {
        $('label[for^=' + _id + ']').removeClass('error');
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
          $('label[for^=' + _id + ']').addClass('error');
          $(selector).addClass('error').val(prev).insertAfter(
            $('<span></span>').text(err)
          );
        });

        model.set(attrs);
        if (options.save) model.save();
      }

      function onInsertDOM(e) {
        $(selector).on('focus', onFocus);
        $(selector).on('blur', onBlur);
      }

      var curr = model.get(attr)
        , type
        , selector = '#' + attr + (model.isNew() ? '' : '-' + model.id )
        , _id = selector.substring(1)
        , prev = $(selector).val()
        , tagName = 'input'
        , label = attr
        , attrs = { id: _id, value: curr }
        , fieldEl = 'div';

      options = options || {};

      if (_.isBoolean(options)) options = { save: options };
      if (_.isString(options)) options = { label: options };
      if (options.label) label = options.label;
      if (options.fieldEl) labelEl = options.fieldEl;
      if (options.password) type = 'password';
      if (options.placeholder) attrs.placeholder = options.placeholder;
      if (options.prop && curr && _.has(curr, options.prop)) curr = attrs.value = curr[options.prop];
      if (options.text) {
        tagName = 'textarea';
        attrs = _.pick(attrs, 'id', 'placeholder');
      }

      type = attrs.type = type || ( _.isBoolean(curr) ? 'checkbox' : ( _.isNumber(curr) ? 'number' : 'text' ));
      _.inDom(selector, onInsertDOM);

      return _.tagFor(fieldEl, { id: 'ff-' + _id, class: 'form-field' }, [
        _.tagFor('div', { class: 'form-field-name' }, [
          _.tagFor('label', { class: 'form-field-label', for: _id }, label),
          _.tagFor('span', { class: 'form-field-description' }, options.description)
        ]),
        _.tagFor(tagName, attrs, options.text && curr)
      ]);
    },

    /**
     * Waits until given element or selector was found in the dom and then calls callback
     * @param el
     * @param callback
     */
    inDom: function(el, callback) {

      var attempts = 0
        , to;

      (function timer() {
        if (++attempts > 1000) return;
        if (!$(el).length) return to = setTimeout(timer, 0);
        if (to) clearTimeout(to);
        callback();
      })();

    },

    /**
     * Creates a html tag
     * @param tagName
     * @param attrs
     * @param content
     */
    tagFor: function(tagName, attrs, content) {

      var _noClosingTags = 'link input meta'.split(' ')

      if (attrs && !content && !_.isObject(attrs)) {
        content = attrs;
        attrs = {};
      }

      return '<' + tagName + ' ' + _.flatten(_.map(_.pairs(attrs), function(attr) {
        attr[0] = attr[0].replace(/([a-z])([A-Z])/, function(m) { return m[0] + '-' + m[1].toLowerCase(); })
        return attr.join('="') + '"';
      })).join(' ') + '>' +
        ( content
          ? _.isArray(content) ? content.join('') : content
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

  // mixin helpers
  _.mixin(Hitch.Helpers);

  /**
   * Hitch.ACL
   * @constructor
   */
  Hitch.ACL = function(obj, permissions) {

    this._publicPermissions = {};
    this._routePermissions = {};

    if ($.isPlainObject(obj) && obj.public && obj.routes) {
      this._publicPermissions = obj.public;
      this._routePermissions = obj.routes;
    }
  };

  /**
   * Hitch.ACL.prototype
   * @type {Object}
   */
  Hitch.ACL.prototype = {

    constructor: Hitch.ACL,

    getAccess: function(route, obj) {

      var permissions;

      if (!obj instanceof Hitch.Object) {
        throw new Error("second argument must be an instance of Hitch.Object");
      }

      if (this._publicPermissions[route] || !this._routePermissions[route]) return true;
      permissions = this._routePermissions[route];

      return !!permissions[obj.id];

    },

    setAccess: function(route, obj, permissions) {

      if (!route) {
        throw new Error("setAccess requires at least one argument: the route.");
      }

      if (_.isUndefined(obj) || obj === true) {
        this._publicPermissions[route] = true;
        return true;
      }

      if (_.isUndefined(permissions)) {
        permissions = true;
      }

      if (!_.isBoolean(permissions)) {
        permissions = !!permissions;
      }

      if (route === '*') {

        this._publicPermissions[route] = permissions;

      } else {

        if (!this._routePermissions[route]) {
          this._routePermissions[route] = {};
        }

        this._routePermissions[route][obj.id] = permissions;
      }
    },

    toJSON: function() {
      return { public: this._publicPermissions, routes: this._routePermissions };
    }
  };

  /**
   * Hitch.Credentials
   * @extend Backbone.Model
   */
  Hitch.Object = Backbone.Model.extend(_.extend({}, Hitch.Access, {

    // defaults to Mongo-style id
    idAttribute: '_id',

    // if the object is stored locally (window.localStorage)
    isStoredLocally: false,

    // the storage key to use when writing to window.localStorage
    storageKey: null,

    // object relations
    relations: {},

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

  }));

  /**
   * Hitch.Resource
   * @extend Backbone.Collection
   */
  Hitch.Resource = Backbone.Collection.extend(_.extend({}, Hitch.Access, {

    // list of comparison operators
    operators: '$eq $in $or $gt $gte $lt $lte'.split(' '),

    // base model
    model: Hitch.Object,

    initialize: function(options) {
      this._autoLoad = options && options.load;
    },

    /**
     * Finds models matching the given criteria
     * @param criteria the criteria to filter for
     * @param options (optional)
     * @return {[]} list of matched models
     */
    find: function(criteria, options) {

      var results;
      if (!criteria || _.isEmpty(criteria)) return this.models;
      options = options || {};

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
      var all = this.find(criteria);
      return all.length ? all[0] : all;
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

      if (_.isObject(value) && model[attr]) {
        for (var p in value) {
          if (!this._evaluateCriteria(model[attr], p, value[p], operator)) {
            return false;
          }
        }
        return true;
      }

      return returnVal(model.get(attr), value, operator);
    },

    load: function(options) {

      var success;

      options = options || {};
      success = options.success;

      options.success = _.bind(function() {
        this.trigger('load', this);
        if (success) success();
      }, this);

      return this.fetch(options);
    }

  }));

  /**
   * Hitch.Cookie
   * @extend Hitch.Object
   */
  Hitch.Cookie = Hitch.Object.extend({

    initialize: function() {
      this.id = _.uniqueId(this.get('name'));
    },

    sync: function(method, model, options) {

      var success = options.success
        , error = options.error
        , resp = Hitch.Cookies.get(this.get('name'));

      if (method === 'create' || method === 'update') {

        Hitch.Cookies.set(
          this.get('name'),
          this.get('value'),
          this.get('expires'),
          this.get('path'),
          this.get('domain'),
          this.get('secure')
        );

        if (success) {
          success(true);
        }

        return true;

      } else if (method === 'read') {

        if (success) {
          success(resp);
        }

        return true;

      } else if (method === 'delete') {

        if (resp) {
          Hitch.Cookies.clear(this.get('name'));
        }

        return true;

      }

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
  Hitch.Credentials = function(user, options) {

    if (!user instanceof Hitch.User) {
      throw new Error("user must be an instance of Hitch.User");
    }

    options = options || {};
  };

  // make it extendable
  Hitch.Credentials.extend = extend;

  /**
   * Hitch.Credentials.prototype
   * @type {*}
   */
  Hitch.Credentials.prototype = _.extend({}, Hitch.Object.prototype, {

    constructor: Hitch.Credentials,

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
    },

    authenticate: function(user, options) {

      if (!user instanceof Hitch.User) {
        throw new Error("user must be an instance of Hitch.User");
      }

      var login = user.get(this.userAttribute)
        , password = user.get(this.passAttribute)
        , attrs = {};

      if (login && password) {
        attrs[this.userAttribute] = login;
        attrs[this.passAttribute] = password;
        this.set(attrs, { silent: options.silent });
        this.fetch(options);
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

    // setup current session user if provided
    if (options.currentUser) {
      this.getCurrentUser(options.currentUser);
    }

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
  _.extend(Hitch.Router.prototype, Backbone.Router.prototype, Hitch.Access, {

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
     * renders a view at the given selector
     * @param selector
     * @param view
     * @return {*}
     */
    display: function(selector, view) {

      if (!$(selector).length) {
        throw new Error("No dom element found matching given selector: " + selector);
      }

      if (!view instanceof Backbone.View) {
        throw new Error("view must be an instance of Backbone.View");
      }

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
     * binds routing callback handlers
     * @private
     */
    _bindFilters: function() {
      for (var a in this.after) this._addFilter('after', a, this.after[a]);
      for (var b in this.before) this._addFilter('before', b, this.before[b]);
    }

  });

  // ensure history is present
  Backbone.history = Backbone.history || new Backbone.History();

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

    // check exports
    if (!_.isUndefined(options.exports)) this.exports = !!(options.exports);

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

    // apply the ready state callback (when all resources are fetched successfully)
    this.on('ready', this.ready, this);

    // call initialize
    this.initialize.apply(this, arguments);
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
    apiUrl: '/',

    // exports the application public interface to the global object (window or globals)
    exports: false,

    // the application name
    name: 'app',

    /**
     * Sets the application title and updates document.title if available
     * @param name
     */
    setName: function(name) {

      if (document && document.title) {
        document.title = name;
      }

      this.name = name;
    },

    /**
     * Appends an asset to the document head
     * @param type
     * @param source
     */
    appendAsset: function(type, source) {
      if (type === 'stylesheet') {
        $('<link rel="stylesheet" type="text/css" href="' + source + '">').appendTo('head');
      } else if (type === 'favicon') {
        $('<link rel="favicon" type="image/icon" href="' + source + '">').appendTo('head');
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

          if (!resource.url) {
            resource.url = [ this.apiUrl, resource.name ].join('/');
          }

          if (resource._autoLoad) {
            resource.load({
              success: _.bind(function() {
                if (++loaded === length) {
                  this.trigger('ready', this.resources);
                }
              }, this)
            });
          }

          this.resources[resource.name] = resource;

        }, this);
      }
    },

    /**
     * Launches the application
     */
    run: function(options) {

      Backbone.history.start(options);

      if (options.pushState) {
        // map dom links to backbone history
        $('a[href]').live('click', function(e) {
          var href = $(this).attr('href');
          if (!$(this).attr('target') && !/^(http\:\/\/|www\.)/.test(href)) {
            e.preventDefault();
            Backbone.history.navigate(href, true);
          }
        });
      }

      if (this.exports) {
        var globalName = _.isString(this.exports) ? this.exports : this.name;
        root[globalName] = this;
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
      // overwrite in subclasses (default error route)
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
