/**
 * Hitch Command Line Tool v0.9.3
 * Lightweight backbone based single page application framework
 *
 * @author: Philipp Boes <mostgreedy@gmail.com>
 * @copyright: (c) 2012 Philipp Boes
 * @version: 0.9.3
 *
 *
 */

var exec = require('child_process').exec
  , fs = require('fs')
  , PATH_SELF = __dirname
  , PATH_ROOT = fs.realpathSync(PATH_SELF + '/../')
  , PATH_BUILD = fs.realpathSync(PATH_ROOT + '/build')
  , _ = require('underscore')
  , inflect = require("inflection")
  , args = _.rest(process.argv, 2)
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
  ];

function ucFirst(str) {
  return str.charAt(0).toUpperCase() + str.substring(1);
}

function createFileFromTemplate(filename, template, data) {

  var filePath = PATH_BUILD + '/data/templates/' + template + '.ejs'
    , contents;

  if (exists(filePath)) {
    contents = fs.readFileSync(filePath).toString();
    fs.writeFileSync(filename, _.template(contents, data));
  }
}

function createApplication(path) {

  var data = parseJSONFile();

  // check configuration
  if (!_.isObject(data)) {
    console.log('invalid data argument.');
    process.exit();
    return;
  }

  // check data structure
  if (!data.name || !data.version) {
    console.log('invalid hitch configuration.');
    process.exit();
    return;
  }

  // ensure path
  if (!path) {
    path = process.cwd();
  }

  // check app dir
  if (!exists(path)) {
    fs.mkdirSync(path, 0755);
  }

  // change cwd
  exec('cd ' + path);

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
      module: ucFirst(name)
    }, data));
  });

  // generate resources
  _.each(data.resources, function(resource, name) {
    var resourceFile = process.cwd() + '/public/js/app/resources/' + name + '.js';
    createFileFromTemplate(resourceFile, 'resource', _.extend({
      resource: name,
      model: ucFirst(inflect.singularize(name))
    }, data));
  });
}

function showHelp() {

  console.log('');
  console.log('+---------------------------------------------------------------+');
  console.log('|                      Hitch Console Utils                      |');
  console.log('|                            v0.9.2                             |');
  console.log('+---------------------------------------------------------------+');
  console.log('');
  console.log('USAGE: hitch [command] [args] (e.g. `hitch create MyApplication`)');
  console.log('');
  console.log('- build', '                ', 'creates minified version');
  console.log('- create [path]', '        ', 'creates a fresh hitch application');
  console.log('- help', '                 ', 'shows this information');
  console.log('');

}


function exists(name) {
  var stat;

  try {

    stat = fs.lstatSync(name);
    return stat.isFile() || stat.isDirectory();

  } catch (err) {
  }

  return false;
}

function parseJSONFile() {
  if (exists('hitch.json')) {
    return JSON.parse(fs.readFileSync('hitch.json'));
  }
}

function buildMinified() {

  if (!exists('hitch.json')) {
    console.log("ERROR: No hitch.json found!");
    process.exit();
  }

  var data = parseJSONFile();
  exec('uglifyjs ../hitch.js > ../hitch-' + data.version + '.min.js');
  console.log('created minified version in hitch-' + data.version + '.min.js');
}

if (args.length) {
  switch (args[0]) {
    case 'build':
      buildMinified();
      break;
    case 'create':
      createApplication();
      break;
    default:
      showHelp();
  }

} else {
  showHelp();
}

process.exit();