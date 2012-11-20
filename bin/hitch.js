

var exec = require('child_process').exec
  , fs = require('fs')
  , PATH_SELF = __dirname
  , PATH_ROOT = fs.realpathSync(PATH_SELF + '/../')
  , PATH_BUILD = fs.realpathSync(PATH_ROOT + '/build')
  , _ = require('underscore')
  , inflect = require("inflection")
  , args = process.argv
  , appSkeleton = [
    'assets',
    'public',
    'public/css',
    'public/img',
    'public/js',
    'public/js/app',
    'public/js/app/modules',
    'public/js/app/resources',
    'public/js/app/templates',
    'public/js/app/views',
    'public/js/vendor'
  ]
  , Package = parseJSONFile();

_.mixin({
  ucFirst: function(str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
  }
});

function createFileFromTemplate(filename, template, data) {
  var file = fs.readFileSync(PATH_BUILD + '/data/templates/' + template + '.ejs');
  fs.writeFileSync(filename, _.template(file.toString(), data));
}

function createApplication(data) {

  if (!_.isObject(data)) {
    console.log('invalid data argument.');
    process.exit();
    return;
  }

  // clean up

  // create the app skeleton
  appSkeleton.forEach(function(p) {
    fs.mkdirSync(process.cwd() + '/' + p, 0755);
  });

  // copy dependencies
  exec('rsync -av ' + PATH_ROOT + '/vendor/* ' + process.cwd() + '/public/js/vendor');
  exec('cp ' + PATH_ROOT + '/hitch.js ' + process.cwd() + '/public/js/vendor/hitch.js');

  // generate mandatory files
  createFileFromTemplate(process.cwd() + '/public/js/app/index.js', 'app', data);
  createFileFromTemplate(process.cwd() + '/public/js/main.js', 'main', data);
  createFileFromTemplate(process.cwd() + '/public/index.html', 'index', data);

  // generate modules
  _.each(data.modules, function(module, name) {
    var modulePath = process.cwd() + '/public/js/app/modules/' + name;
    fs.mkdirSync(modulePath, 0755);
    fs.mkdirSync(modulePath + '/templates', 0755);
    fs.mkdirSync(modulePath + '/views', 0755);
    createFileFromTemplate(modulePath + '/index.js', 'module', _.extend({
      module: _.ucFirst(name)
    }, data));
  });

  // generate resources
  _.each(data.resources, function(resource, name) {
    var resourceFile = process.cwd() + '/public/js/app/resources/' + name + '.js';
    createFileFromTemplate(resourceFile, 'resource', _.extend({
      resource: _.ucFirst(name),
      model: _.ucFirst(inflect.singularize(name))
    }, data));
  });
}

function showHelp() {

  console.log('');
  console.log('+---------------------------------------------------------------+');
  console.log('|                      Hitch Console Utils                      |');
  console.log('|                            v0.0.3                             |');
  console.log('+---------------------------------------------------------------+');
  console.log('');
  console.log('USAGE: hitch [command] [args] (e.g. `hitch create MyApplication`)');
  console.log('');
  console.log('- build', '                ', 'creates minified version');
  console.log('- create [path]', '        ', 'creates a fresh hitch application');
  console.log('- help', '                 ', 'shows this information');
  console.log('');

}

function parseJSONFile() {
  var file = fs.readFileSync(process.cwd() + '/hitch.json');
  return file && JSON.parse(file);
}

if (!Package) {
  console.log("ERROR: No hitch.json found!");
} else if (args.length === 2) {
  showHelp();
} else if (args[2] === 'build') {
  exec('uglifyjs ../hitch.js > ../hitch-0.0.3.min.js');
  console.log('created minified version in hitch-0.0.3.min.js');
} else if (args[2] === 'create') {
  createApplication(Package);
} else {
  showHelp();
}

process.exit();