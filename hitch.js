/**
 * Hitch.js - v0.0.1
 * Lightweight backbone based single page application framework
 *
 * @author: Philipp Boes <mostgreedy@gmail.com>
 * @copyright: (c) 2012 Philipp Boes
 * @version: 0.0.1
 *
 */
(function() {

  var root = this
    , Backbone = root.Backbone
    , _ = root._
    , Hitch = root.Hitch = {}
    , extend = Backbone.Router.extend;

  if (!_) throw new Error("Hitch requires underscore.js to work.");
  if (!Backbone) throw new Error("Hitch requires backbone.js to work.");

  Hitch.VERSION = '0.0.1';


  /**
   * Hitch.ACL
   * @param permissions
   * @constructor
   */
  Hitch.ACL = function(permissions) {

    this.permissions = {};

    if (permissions instanceof Hitch.User) {

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

  Hitch.ACL.PUBLIC = 1337;
  Hitch.ACL.extend = extend;

  Hitch.ACL.prototype = {

    constructor: Hitch.ACL,

    _getAccess: function(accessType, userId) {
      var permissions;

      if (userId instanceof Hitch.User) {
        userId = userId.id;
      } else if (userId instanceof Hitch.Role) {
        userId = 'role:' + userId.getName();
      }

      permissions = this.permissions[userId];
      return permissions && permissions[accessType];

    },

    _setAccess: function(accessType, userId, allowed) {
      var permissions;

      if (userId instanceof Hitch.User) {
        userId = userId.id;
      } else if (userId instanceof Hitch.Role) {
        userId = 'role:' + userId.getName();
      }

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
   * Hitch.Asset
   * @param type
   * @param source
   * @param autoload
   * @constructor
   */
  Hitch.Asset = function(type, source, autoload) {
  };



  /**
   * Hitch.Error
   * @param msg
   * @constructor
   */
  Hitch.Error = function(msg) {
    this.message = msg;
  };

  Hitch.Error.extend = extend;

  _.extend(Hitch.Error.prototype, Error.prototype, {
    constructor: Hitch.Error,
    name: 'HitchError'
  });



  /**
   * Hitch.Model
   * @param attributes
   * @param options
   * @constructor
   */
  Hitch.Model = function(attributes, options) {

    if (options && options.acl) {
      this.setACL(options.acl);
      delete options.acl;
    }

    Backbone.Model.prototype.constructor.apply(this, arguments);
  };

  Hitch.Model.extend = extend;

  _.extend(Hitch.Model.prototype, Backbone.Model.prototype, {

    constructor: Hitch.Model,

    isStoredLocally: false,

    storageKey: null,

    setACL: function(acl) {

      if (!acl instanceof Hitch.ACL) {
        throw new Hitch.Error('Invalid ACL given.');
      }

      this.acl = acl;
    },

    getACL: function() {
      return this.acl;
    },

    set: function(attrs, options) {

      _.each(this.relations, function(constructor, name) {

        var related = this[name];

        if (!related) {
          related = this[name] = _.isObject(constructor) ? constructor : new constructor();
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

    toJSON: function() {

      var attributes = _.clone(this.attributes);

      _.each(_.keys(this.relations), function(name) {
        attributes[name] = this[name].toJSON();
      }, this);

      return attributes;
    }

  });



  /**
   * Hitch.Resource
   * @param models
   * @param options
   * @constructor
   */
  Hitch.Resource = function(models, options) {
    Backbone.Collection.prototype.constructor.call(this, models, options);
  };

  Hitch.Resource.extend = extend;

  _.extend(Hitch.Resource.prototype, Backbone.Collection.prototype, {

    constructor: Hitch.Resource,

    loaded: false,

    fetch: function(options) {
      var success = options.success;
      options.success = _.bind(function(response) {
        if (success) success(response);
        this.loaded = true;
      }, this);
    }

  });



  /**
   * Hitch.Role
   * @param name
   * @param acl
   * @constructor
   */
  Hitch.Role = function(name, acl) {
    Hitch.Model.prototype.constructor.call(this, { name: name }, { acl: acl });
  };

  Hitch.Role.extend = extend;

  _.extend(Hitch.Role.prototype, Hitch.Model.prototype, {

    constructor: Hitch.Role,

    getName: function() {
      return this.get('name');
    },

    setName: function(name, options) {
      return this.set({ name: name }, options);
    }

  });



  /**
   * Hitch.Router
   * @param options
   * @constructor
   */
  Hitch.Router = function(options) {
    Backbone.Router.prototype.constructor.call(this, options);
  }

  Hitch.Router.extend = extend;

  _.extend(Hitch.Router.prototype, Backbone.Router.prototype, {

    constructor: Hitch.Router,

    displaySlots: {},

    _filters: {},

    showView: function(selector, view) {

      if (this.displaySlots[selector]) {
        this.displaySlots[selector].close();
      }

      $(selector).html(view.render().el);
      this.displaySlots[selector] = view;
      return view;

    },

    addBeforeFilter: function(route, filter, context) {
      this._addFilter.apply(this, ['before'].concat(_.toArray(arguments)));
    },

    addAfterFilter: function(route, filter, context) {
      this._addFilter.apply(this, ['after'].concat(_.toArray(arguments)));
    },

    _addFilter: function(type, route, filter, context) {
      if (!this._filters[type]) this._filters[type] = {};
      if (!_.isRegExp(route)) route = new RegExp(route);
      this._filters[type][route] = _.bind(filter, context || this);
    },

    _applyFilters: function(type, fragment, args) {

      var filters;

      if (!this._filters[type] || _.isEmpty(this._filters[type])) {
        return true;
      }

      filters = _.filter(this._filters[type], function(fn, route) {
        if (!_.isRegExp(route)) route = new RegExp(route);
        return route.test(fragment);
      });

      return _.isEmpty(filters) || !_.find(filters, function(fn, route) {
        var result = _.isFunction(fn) ? fn.apply(this, args) : this[fn].apply(this, args);
        return _.isBoolean(result) && result === false;
      }, this);
    },

    route: function(route, name, callback) {

      if (!_.isRegExp(route)) {
        route = this._routeToRegExp(route);
      }

      if (!callback) {
        callback = this[name];
      }

      Backbone.history = Backbone.history || new Backbone.History();

      Backbone.history.route(route, _.bind(function(fragment) {

        var args = this._extractParameters(route, fragment);

        if (this._applyFilters('before', fragment, args)) {

          try {

            callback && callback.apply(this, args);

            this._applyFilters('after', fragment, args);

            this.trigger.apply(this, ['route:' + name].concat(args));
            Backbone.history.trigger('route', this, name, args);

          } catch (err) {
            if (err instanceof Hitch.Error) {
              this.trigger.apply(this, ['error', err]);
            } else {
              throw err;
            }
          }

        }


      }, this));
      return this;
    }

  });



  /**
   * Hitch.User
   * @param attributes
   * @param options
   * @constructor
   */
  Hitch.User = function(attributes, options) {
    Hitch.Model.prototype.constructor.call(this, attributes, options);
  };

  Hitch.User.extend = extend;

  _.extend(Hitch.User.prototype, Hitch.Model.prototype, {
    constructor: Hitch.User
  });



  /**
   * Hitch.View
   * @param options
   * @constructor
   */
  Hitch.View = function(options) {
    Backbone.View.prototype.constructor.call(this, options);
  };

  Hitch.View.extend = extend;

  _.extend(Hitch.View.prototype, Backbone.View.prototype, {

    constructor: Hitch.View,

    close: function() {

      if (this.beforeClose) {
        this.beforeClose();
      }

      this.undelegateEvents();
      this.remove();
    }

  });



  /**
   * Hitch.App
   * @param options
   * @constructor
   */
  Hitch.App = function(options) {

    Backbone.Model.prototype.constructor.call(this);

    options = options || {};

    if (_.isString(options)) {
      options = { name: options };
    }

    if (!options.name) options.name = 'HitchApp';
    if (!options.user) options.user = new Hitch.User({ id: new ObjectId().toString(), username: 'anonymous' });

    if (options.assets) {
      _.each(options.assets, function(asset) {
        this.addAsset(asset);
      }, this);
    }

    this.setName(options.name);
    this.setCurrentUser(options.user);
    this.init.apply(this, arguments);
  };

  Hitch.App.extend = extend;

  _.extend(Hitch.App.prototype, Hitch.Model.prototype, {

    constructor: Hitch.App,

    setCurrentUser: function(user, options) {

      if (!user instanceof Hitch.User) {
        user = new Hitch.User(user);
      }

      this.set('user', user, options);
    },

    getCurrentUser: function() {
      return this.get('user');
    },

    setName: function(name, options) {
      this.set('name', name, options);
    },

    getName: function() {
      return this.get('name');
    },

    addAsset: function(asset) {
      var assets;

      if (!asset instanceof Hitch.Asset) {
        throw new Hitch.Error('Invalid asset.');
      }

      assets = this.get('assets') || [];
      this.set('assets', assets.concat([ asset ]));
    },

    init: function() {
      // overwrite in subclasses
    },

    run: function() {
      Backbone.history.start();
    }

  });

}).call(this);