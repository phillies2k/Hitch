
var fs = require('fs')
  , exec = require('child_process').exec
  , _ = require('underscore')
  , inflect = require('inflection')
  , PATH_SELF = __dirname
  , PATH_ROOT = fs.realpathSync(PATH_SELF + '/../')
  , PATH_RJS = PATH_ROOT + '/node_modules/requirejs/bin/r.js';

function _strRepeat(str, times) {
  return _.range(0,times).map(function(n){ return str; }).join('')
}

function _strCenter(str, len, char) {

  var ws = len - str.length
    , bf = 0
    , af = 0;

  if (len <= str.length) return str;
  char = char || ' ';

  if (ws%2===0) {
    bf=af=ws/2;
  } else {
    bf=Math.floor(ws/2);
    af=Math.ceil(ws/2);
  }

  return _strRepeat(char, bf) + str + _strRepeat(char, af);
}

function _printTable(data, options) {

  var rows = data.length
    , cols = rows && data[0].length;

  _.each(data, function(row, rowIndex) {
    var log = [];
    _.each(row, function(column, columnIndex) {
      var columnWidth = options.columns[columnIndex]
        , whiteSpaceAfter = columnWidth - column.length;
      log.push(column + _strRepeat(' ', whiteSpaceAfter));
    });
    console.log(log.join(''));
  });

}

function createFileFromTemplate(filename, template, data, callback) {

  var filePath = PATH_SELF + '/data/' + template + '.ejs'
    , contents, tmpl, compiled;

  if (exists(filePath)) {

    contents = fs.readFileSync(filePath).toString();

    tmpl = _.template(contents);

    compiled = tmpl(_.extend({
      ucFirst: function(str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
      },
      moduleConfigurationToJavascript: moduleConfigurationToJavascript
    }, data));

    fs.writeFileSync(filename, compiled);
    if (callback) callback();
  }
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

function parseFile(file) {

  var contents
    , raw
    , ext;

  if (exists(file)) {

    ext = _.last(file.split('.'));
    raw = fs.readFileSync(file).toString();

    try {
      if (ext === 'json') {
        contents = JSON.parse(raw);
      } else if (ext === 'js') {
        eval('contents = ' + raw);
      } else {
        contents = raw;
      }
    } catch(err) {
      throw new Error("invalid file in '" + file + "'.");
    }
  }

  return contents;
}

function buildAssets(path, data) {
  _.each(data.assets, function(asset) {
    buildAsset(path, asset.type, asset.name, asset.watch);
  });
}

function buildAsset(path, type, name, watch) {

  var fileExt = type
    , command = type === 'less' ? 'lessc --yui-compress' : type === 'scss' ? 'scss' : null
    , getPath = function(s) { return '/' + _.compact(_.initial(s.split('/'))).join('/'); }
    , srcFile = path + '/assets/' + type + '/' + name + '.' + fileExt
    , dstFile = path + '/public/css/' + name + '.css'
    , srcPath = getPath(srcFile)
    , dstPath = getPath(dstFile);

  if (command) {

    if (!exists(srcFile)) {
      if (!exists(srcPath)) {
        fs.mkdirSync(srcPath, 0755);
      }
      createFileFromTemplate(srcFile, 'asset', { type: type, name: name });
    }

    if (!exists(dstPath)) {
      fs.mkdirSync(dstPath, 0755);
    }

    if (exists(dstFile)) {
      fs.unlinkSync(dstFile);
    }

    exec([ command, srcFile, dstFile ].join(' '));

    if (type === 'scss' && watch === true) {
      exec('scss --watch ' + [ srcFile, dstFile ].join(':'));
    }
  }
}

function buildTarget(target, path) {

  var data;

  if (!target) {
    target = 'all';
  }

  path = path || process.cwd();
  data = parseFile(path + '/app.js');

  if (!data) {
    throw new Error("invalid location. no hitch.json found in path");
  }

  if (!data.resources) {
    data.resources = {};
  }

  if (!data.modules) {
    data.modules = {};
  }

  if (!data.assets) {
    data.assets = [];
  }

  switch (target) {
    case 'targets':
      console.log('build targets: assets, modules, resources, main, all');
      break;
    case 'assets':
      buildAssets(data);
      break;
    case 'modules':
      generateModules(path, data);
      break;
    case 'resources':
      generateResources(path, data);
      break;
    case 'main':
      generateBootstrap(path, data);
      break;
    case 'all':
      buildAssets(path, data);
      generateModules(path, data);
      generateResources(path, data);
      generateMainIndex(path, data);
      generateBootstrap(path, data);
      generateIndexHtml(path, data);
      break;
    default:
      throw new Error("invalid build target. Use one of assets, modules, resources, main, all.");
  }

}

function createTarget(target) {

  var path = process.cwd()
    , args = _.rest(arguments)
    , data = parseFile(path + '/app.js');

  if (!target) {
    throw new Error("invalid target");
  }

  switch (target) {
    case 'asset':
      buildAsset(path, args[0], args[1]);
      break;
    case 'module':
      generateModule(path, args[0], data);
      break;
    case 'resource':
      generateResource(path, args[0], data);
      break;
    default:
      createApplication(target);
  }
}

function removeTarget(target) {
  console.log('not yet implemented.');
}

function generateModules(path, data) {
  if (data && _.has(data, 'modules') && _.size(data.modules)) {
    _.each(data.modules, function(module, name) {
      generateModule(path, name, data);
    });
  }
}

function generateResources(path, data) {
  if (data && _.has(data, 'resources') && _.size(data.resources)) {
    _.each(data.resources, function(resource, name) {
      generateResource(path, name, data);
    });
  }
}

function generateBootstrap(path, data) {
  var file = path + '/public/js/main.js';
  if (exists(file)) fs.unlinkSync(file);
  createFileFromTemplate(file, 'main', data);
}

function generateIndexHtml(path, data) {

  var file = path + '/public/index.html'
    , htaccess = path + '/public/.htaccess';

  if (data.pushState === true && !exists(htaccess)) {
    exec('cp ' + PATH_SELF + '/data/.htaccess ' + path + '/public/.htaccess');
  }

  if (exists(file)) return;

  data.root = data.root.charAt(data.root.length-1) !== '/' ? data.root + '/' : data.root;
  createFileFromTemplate(file, 'index', data);
}

function generateMainIndex(path, data) {
  var file = path + '/public/js/app/index.js';
  if (exists(file)) return;
  createFileFromTemplate(file, 'app', data);
}

function generateResource(path, name, data) {
  var resourceFile = path + '/public/js/app/resources/' + name + '.js';
  if (!exists(resourceFile)) {
    createFileFromTemplate(resourceFile, 'resource', _.extend({
      resource: name,
      model: inflect.classify(name)
    }, data));
  }
}

function generateModule(path, name, data) {

  var modulePath = path + '/public/js/app/modules/' + name;

  if (!exists(modulePath)) {

    fs.mkdirSync(modulePath, 0755);
    fs.mkdirSync(modulePath + '/templates', 0755);
    fs.mkdirSync(modulePath + '/views', 0755);

    createFileFromTemplate(modulePath + '/index.js', 'module', _.extend({
      module: name
    }, data));
  }
}

function createApplication(path) {

  var appName
    , data;

  // ensure path
  if (!path) {
    path = process.cwd();
  } else if (path.charAt(0) !== '/') {
    path = process.cwd() + '/' + path;
  }

  // check app dir
  if (!exists(path)) {
    fs.mkdirSync(path, 0755);
  }

  // apply app name
  appName = path.split('/').pop();

  // ensure hitch.json
  if (!exists(path + '/app.js')) {
    createFileFromTemplate(path + '/app.js', 'config', {
      name: appName,
      apiUrl: '/api',
      version: '1.0',
      root: '/',
      pushState: false,
      exports: true
    });
  }

  // read configuration
  data = parseFile(path + '/app.js');

  // check configuration
  if (!data || !data.name || !data.version) {
    console.log('invalid hitch configuration.');
    process.exit();
    return;
  }

  // create the app skeleton
  [
    'assets',
    'public',
    'public/css',
    'public/js',
    'public/js/app',
    'public/js/app/modules',
    'public/js/app/resources',
    'public/js/app/templates',
    'public/js/app/views',
    'public/js/vendor',
    'public/js/vendor/backbone',
    'public/js/vendor/hitch',
    'public/js/vendor/jquery',
    'public/js/vendor/require',
    'public/js/vendor/underscore'
  ].forEach(function(p) {
      fs.mkdirSync(path + '/' + p, 0755);
    });

  // copy dependencies
  exec('cp ' + PATH_ROOT + '/node_modules/backbone/backbone.js ' + path + '/public/js/vendor/backbone/backbone.js');
  exec('cp ' + PATH_ROOT + '/node_modules/underscore/underscore.js ' + path + '/public/js/vendor/underscore/underscore.js');
  exec('cp ' + PATH_ROOT + '/node_modules/requirejs/require.js ' + path + '/public/js/vendor/require/require.js');
  exec('cp ' + PATH_ROOT + '/node_modules/jquery/tmp/jquery.js ' + path + '/public/js/vendor/jquery/jquery.js');
  exec('cp ' + PATH_ROOT + '/lib/vendor/text.js ' + path + '/public/js/vendor/require/text.js');
  exec('cp ' + PATH_ROOT + '/hitch.js ' + path + '/public/js/vendor/hitch/hitch.js');

  // install dependencies
  var vars = [ '$', '_', 'Backbone', 'Hitch'];
  _.each([ 'jquery', 'underscore', 'backbone', 'hitch' ], function(n,i) {
    createFileFromTemplate(path + '/public/js/vendor/' + n + '.js', 'wrapper', { paths: ['\'vendor/' + n + '/' + n + '\''], vars: [], exports: vars[i] });
  });

  // build
  buildTarget('all', path);
}

function deploy() {

  var data = parseFile('app.js')
    , buildPath = process.cwd() + '/build'
    , buildConfig = buildPath + '/config.js'
    , deploymentPath
    , currentBuildPath;

  if (!data) {
    throw new Error("no hitch.json found");
  }

  if (!data.deployment) {
    throw new Error("no deployment configured");
  }

  if (!data.deployment.server) {
    data.deployment.server = 'local';
  }

  if (!data.deployment.root) {
    data.deployment.root = '/';
  }

  if (!data.deployment.path) {
    data.deployment.path = '';
  }

  deploymentPath = data.deployment.root + data.deployment.path;
  currentBuildPath = buildPath + '/' + data.version;

  console.log('STARTING DEPLOYMENT');
  console.log('Path: ' + deploymentPath);
  console.log('Name: ' + data.name);
  console.log('Version: ' + data.version);

  if (!exists(buildPath)) {
    fs.mkdirSync(buildPath, 0755);
  }

  if (exists(buildConfig)) {
    exec('rm ' + buildConfig, function() {
      console.log('> removed existing build configuration');
    });
  }

  createFileFromTemplate(buildConfig, 'build', {
    out: data.version + '/main-' + data.version + '.js'
  }, function() {
    console.log('> created build configuration');
  });

  // remove existing build folder
  if (exists(currentBuildPath)) {
    exec('rm -Rf ' + currentBuildPath, function() {
      console.log('> removed existing build directory');
    });
  }

  // build
  exec('mkdir -p ' + currentBuildPath, function() {
    console.log('> created current build folder');
    console.log('> building...');
    exec('node ' + PATH_RJS + ' -o ' + buildConfig, function() {
      console.log('BUILD SUCCESSFULL!');
    });
  });
}

function showHelp() {

  var pkg = parseFile(PATH_ROOT + '/package.json');

  console.log('+' + _strRepeat('-', 73) + '+');
  console.log('|' + _strCenter('Hitch Command Line Tools', 73) + '|');
  console.log('|' + _strCenter('Hitch v' + pkg.version, 73) + '|');
  console.log('+' + _strRepeat('-', 73) + '+');
  console.log('');
  console.log('USAGE: hitch [command] [args] (e.g. `hitch create MyApplication`)');
  console.log('');
  console.log('COMMANDS:');

  _printTable([
    [''],
    ['- create'                       , 'creates project targets.'],
    ['         asset [type] [name]'   , 'creates a new asset of given type and name.'],
    ['         module [name]'         , 'creates a new named module.'],
    ['         resource [name]'       , 'creates a new resource'],
    ['         [path]'                , 'creates a new hitch application'],
    [''],
    ['- build [target]'               , 'builds/rebuilds project targets.'],
    ['         assets'                , 'compiles assets and updates public files'],
    ['         modules'               , 'creates missing module folders and files'],
    ['         resources'             , 'creates missing resource files'],
    ['         main'                  , 'rebuilds your main.js'],
    ['         all'                   , 'executes all targets at once'],
    [''],
    ['- remove [target]'              , 'removes project targets'],
    ['         module [name]'         , 'removes given module from the project'],
    ['         resource [name]'       , 'deletes the given resource'],
    [''],
    ['- help'                         , 'shows this information'],
    ['']
  ], {
    columns: [ 30, 45 ]
  });
}

function moduleConfigurationToJavascript(obj) {

  var length = _.size(obj)
    , string = "{"
    , index = -1;

  _.each(obj, function(value, key) {

    ++index;

    string += (index === 0 ? "" : ",") + "\n";

    if (/^\w+$/.test(key)) {
      string += key + ": ";
    } else {
      string += "'" + key + "': ";
    }

    if (_.isObject(value)) {
      string += objectToJavascriptNotation(value);
    } else {

      if (key == 'resource') {
        string += "this.resources." + value;
      } else {
        if (_.isNumber(value)) {
          string += value;
        } else if (_.isString(value)) {
          string += "'" + value + "'";
        } else if (_.isBoolean(value)) {
          string += value ? 'true' : 'false';
        } else if (_.isNull(value)) {
          string += 'null';
        } else if (_.isUndefined(value)) {
          string += 'undefined';
        }
      }
    }
  });

  return string + "\n}";

};

exports.createTarget = createTarget;
exports.buildTarget = buildTarget;
exports.removeTarget = removeTarget;
exports.showHelp = showHelp;
exports.deploy = deploy;
