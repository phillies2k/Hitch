/**
 * Hitch Test Suite
 */
(function() {

  var B = Hitch.Object.extend({})
    , D = Hitch.Object.extend({})
    , C = Hitch.Resource.extend({ model: D })
    , A = Hitch.Object.extend({ relations: { b: B, c: C } })
    , a, b, c, d
    , router;

  /**
   * @module: Hitch.Object
   */
  module('Hitch.Object', {

    setup: function() {
      d = new D();
      c = new C([d]);
      b = new B({ name: 'admin' });
      a = new A({ b: b, c: c });
    },

    teardown: function() {
      a = b = c = d = null;
    }

  });

  /**
   * testing object relations
   */
  test('Object relations', function() {

    var json = a.toJSON();

    deepEqual(json.c, c.toJSON(), 'json encode works properly on related collections');
    deepEqual(json.b, b.toJSON(), 'json encode works properly on related object');

    deepEqual(a.b, b, 'related object is a reference of the object');
    deepEqual(a.c, c, 'related resource is a reference of the resource');

    deepEqual(a.get('b'), b.toJSON(), 'get(nestedModel) returns the json encoded version');
    deepEqual(a.get('c'), c.toJSON(), 'get(nestedCollection) returns the json encoded version');

  });

  /**
   * testing object acl
   */
  test('Access control lists', function() {

    ok(a.getACL() instanceof Hitch.ACL, 'an acl instance is returned for this object');
    ok(a.b.getACL() instanceof Hitch.ACL, 'an acl instance is returned from related objects');
    ok(c.getACL() instanceof Hitch.ACL, 'an acl instance is returned for this resource');
    ok(a.c.getACL() instanceof Hitch.ACL, 'an acl instance is returned from a related resource');

  });


  /**
   * @module: Hitch.Resource
   */
  module('Hitch.Resource');
  asyncTest('Hitch.Resource', function() {

    var R = Hitch.Resource.extend({ url: '/mstgrd.net/api/users', model: Hitch.User, parse: function(response) { return _.values(response); } });
    var r = new R();

    r.fetch({
      success: function() {

        var d = r.findOne();

        ok(d instanceof Hitch.User, 'find working for findOne');

        var u = r.find({
          username: 'admin'
        })[0];

        deepEqual(u.get('username'), 'admin', 'find single deps attributes');

        var n = r.find({
          role: {
            name: 'Moderator'
          }
        });

        deepEqual(n.length, 2, 'find complex criteria attributes');

        start();
      }
    });

  });


  /**
   * @module: Hitch.Router
   * @TODO implement further tests
   */
  module('Hitch.Router', {

    setup: function() {
      router = new Hitch.Router();
      Backbone.history.start();
    },

    teardown: function() {
      router = null;
    }

  });

  /**
   * testing route filters
   */
  test('Routing filters', function() {

    var x = 0, y = 1;

    router.onBefore('home', function() {
      x = 1;
    });

    router.onAfter('home', function() {
      y = 0;
    });

    notEqual(x, 1, 'onBefore filter not called');
    router._applyFilters('before', 'home');
    equal(x, 1, 'onBefore filter called');

    notEqual(y, 0, 'onAfter filter not called');
    router._applyFilters('after', 'home');
    equal(y, 0, 'onAfter filter called');

  });

  /**
   * @module: Hitch.Cookies
   */
  module('Hitch.Cookies');

  test('Get/Set a cookie', function() {
    var value = 'foo';
    Hitch.Cookies.set('testcookie', value);
    equal(Hitch.Cookies.get('testcookie'), value, 'can get/set cookies');

  });

  test('List cookie names', function() {

    var names =  'foo bar nerd'.split(' ')
      , cookieNames;

    _.each(names, function(name) {
      Hitch.Cookies.set(name, 1);
      var list = Hitch.Cookies.names();
      equal(list.indexOf(name) >= 0, true, 'cookie "' + name + '" was found in list');
    });

  });

  /**
   * @module: Hitch.Cookie
   */
  module('Hitch.Cookie');

  test('Test cookies', function() {

    var testCookie1 = new Hitch.Cookie({ name: 'cookieTest', value: 'test' });
    equal(testCookie1.save(), true, 'cookie was saved correctly');

    var testCookie1Value = Hitch.Cookies.get('cookieTest');
    equal(testCookie1Value, 'test', 'document.cookie was set correctly');

    testCookie1.set({ value: 'hello' });
    testCookie1.save();
    equal(Hitch.Cookies.get('cookieTest'), 'hello', 'updating cookies works fine');

    testCookie1.destroy();
    equal(Hitch.Cookies.get('cookieTest'), undefined, 'cookie was destroyed correctly');

  });


}).call(this);



