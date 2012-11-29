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
   * @module: Hitch.ACL
   * @TODO implement tests
   */
  module('Hitch.ACL');
  test('Initializing an ACL', function() { equal(0,0); });

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

    deepEqual(a.get('b'), b.toJSON(), '');
    deepEqual(a.get('c'), c.toJSON(), '');

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

  module('Hitch.Resource');
  test('Initializing a resource', function() { equal(0,0); });

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
   * @module: Hitch.App
   * @TODO implement tests
   */
  module('Hitch.App');
  test('Initializing application', function() { equal(0,0); });

  /**
   * @module: Hitch.View
   * @TODO implement tests
   */
  module('Hitch.View');
  test('Initializing view', function() { equal(0,0); });

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
   * @module: Hitch.Helpers
   * @TODO implement tests
   */
  module('Hitch.Helpers');

  test('tagFor', function() {

    var result = '<a href="/some/url" data-type="resource">Link</a>'
      , tag = Hitch.Helpers.tagFor('a', { href: '/some/url', dataType: 'resource' }, 'Link');

    deepEqual(result, tag, 'excepts result is the same as plain the string.');

  });

  test('ucFirst', function() {

    var input = 'string'
      , result = _.ucFirst(input)
      , excepted = 'String';

    deepEqual(result, excepted, 'excepts first char to be uppercase');

  });

  test('lcFirst', function() {

    var input = 'String'
      , result = _.lcFirst(input)
    , excepted = 'string';

    deepEqual(result, excepted, 'excepts first char to be lowercase');

  });

}).call(this);



