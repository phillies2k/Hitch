/**
 * Hitch.js - v0.0.2
 * Lightweight backbone based single page application framework
 *
 * @author: Philipp Boes <mostgreedy@gmail.com>
 * @copyright: (c) 2012 Philipp Boes
 * @version: 0.0.2
 *
 * @package: Hitch.Helpers
 *
 */
(function() {

  var root = this
    , Backbone = root.Backbone
    , _ = root._
    , ObjectId = root.ObjectId
    , Hitch = ( root.Hitch || {} );

  if (!ObjectId) throw new Error("Hitch.Helpers requires ObjectId.js");

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