/**
 * Hitch.js - v0.0.2
 * Lightweight backbone based single page application framework
 *
 * @author: Philipp Boes <mostgreedy@gmail.com>
 * @copyright: (c) 2012 Philipp Boes
 * @version: 0.0.2
 *
 * @package: Hitch.Cookies
 *
 */
(function() {

  var root = this
    , Backbone = root.Backbone
    , _ = root._
    , Hitch = ( root.Hitch || {} );

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

}).call(this);