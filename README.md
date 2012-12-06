Hitch v0.1.0-alpha
=====
Lightweight backbone-based single page application framework.

***Hitch is currently in a very early alpha state.***

* Default [Hitch.Object](#hitchobject)s for [users](#hitchuser), [credentials](#hitchcredentials) and [roles](#hitchrole)
* Powerful [Access Control Layer](#hitchacl) for controlling access to [Hitch.Router](#hitchobject)s
* Auto-generate your hitch applications using the command-line tool
* Provides a npm package.json like config for building your application and to keep it up-to-date.
* Module based app structure based on the amd module pattern
* Reduces glue code to a minimum
* Generic view data binding using HTML data-attributes
* Preloaded resources

===

## Table of Contents:

* [Installation](#installation)
* [Setup](#setup)
* [Configuration](#configuration)
* [Using the Command-Line Tool](#using-the-command-line-tool)
* [Packages](#packages)
  * [Hitch.Access](#hitchaccess)
  * [Hitch.ACL](#hitchacl)
  * [Hitch.App](#hitchapp)
  * [Hitch.Cookie](#hitchcookie)
  * [Hitch.Cookies](#hitchcookies)
  * [Hitch.Credentials](#hitchcredentials)
  * [Hitch.Helpers](#hitchhelpers)
  * [Hitch.Object](#hitchobject)
  * [Hitch.Resource](#hitchresource)
  * [Hitch.Role](#hitchrole)
  * [Hitch.Router](#hitchrouter)
  * [Hitch.User](#hitchuser)
  * [Hitch.View](#hitchview)

## Installation

You can either install the npm package or clone this repository and build your custom Hitch installation.

#### Using the npm package

```bash
npm install backbone-hitch -g
```
Now you're ready to go.

#### Cloning the repository

```bash
git clone git@github.com/phillies2k/hitch.git
cd hitch && npm install
```

Now all necessary dependencies are available and Hitch can be used.
Ensure to add the commandline tool in ./bin/hitch to your PATH variable.


## Setup

Simply type in the following:

```bash
hitch create [path]
```

There are two ways to get your app working:
Either you can configure a vhost for the public directory of your application or go to your "app/index.js" file and
set the root property to your web-root pointing to your application's public directory.
Point your browser to your application and have a look at your freshly created hitch application.


## Configuration

Configuration means to modify your 'hitch.json' file which was created by either yourself or the command line tool when
you created your application. The hitch.json is divided into several sections which specifies the application structure
and environment.

##### Configuration Options

* `name` - your application name
* `version` - your application version
* `exports` - Boolean (default:true) If value is a string your application will be exported with that name
* `apiUrl` - your application's base api url
* `root` - your application's web root path (defaults to '/')
* `pushState` - Whether to use push state or not
* `resources` - resource definitions
* `modules` - module definitions
* `assets`- your application styles and media

##### Configuring resources

A resource can be configured as simple as `"myresource": "true"`. This resource will then be loaded on initialization.
```javascript
{
  ...
  "resources": {
    "users": "true"
  }
}
```

##### Configuring assets

Assets of type text/less or text/scss will be compiled using an appropriate compiler for either LESS- or SASS-like 
stylesheets.
```javascript
{
  ...
  "assets": [
    {
      "type": "scss",
      "path": "scss/layout/common"
    }
  ]
}
```

##### Configuring modules

A module can have an `acl` property for configuring access to this module (e.g. access to the routes). Furthermore a 
special property named "resource" is available to define a resource this module manages
```javascript
{
  ...
  "modules": {
    "users": {
      "resource": "users",
      "acl": {
        "role:user": "r",
        "role:admin": "rw"
      }
    }
  }
}
```


## Using the Command-Line Tool

Hitchs command line tool offers a bunch of helpful tools to ease up developers life when using Hitch to create single
page applications. See `hitch help` for a detailed documentation.

##### The `create` command

```bash
hitch create [target]
```

your target can either be the path of the hitch application you want to create or one of the following targets:
* `resource` - will create a new resource
* `module` - will create a module

Its recommended that you use the `create [resource|module] [name]` commands with care because hitch.json will not be
updated when creating targets manually. You have to extend the hitch.json file by yourself.


##### The `build` command

```bash
hitch build [target]
```

your build target can either be empty ( will execute all building tasks ) or one of the following tasks:
* `resources` - will create non existing resources
* `modules` - will initialize non existing modules
* `main` - will rebuild your bootstrap file. This is necessary to call after every update to resources or modules to 
           ensure everything will be loaded.
* `all` - executes all task at once (same as calling build with no target given.


##### The `deploy` command

```bash
hitch deploy
```

This command tries to deploy your project to the deployment configuration found in your hitch.json. It will create a 
build/ folder in your application root and will deploy your compiled application to a new sub folder `build/$version$/`. 
It will also create `build/config.js` which holds the requirejs r.js build configuration to combine/uglify your 
applications code. It will also deploy your assets by using an appropriate compiler to compile LESS and SASS stylesheets.

Currently the deployment only works for `'deployment.server = 'local'`.


## Packages

* [Hitch.Access](#hitchaccess)
* [Hitch.ACL](#hitchacl)
* [Hitch.App](#hitchapp)
* [Hitch.Cookie](#hitchcookie)
* [Hitch.Cookies](#hitchcookies)
* [Hitch.Credentials](#hitchcredentials)
* [Hitch.Helpers](#hitchhelpers)
* [Hitch.Object](#hitchobject)
* [Hitch.Resource](#hitchresource)
* [Hitch.Role](#hitchrole)
* [Hitch.Router](#hitchrouter)
* [Hitch.User](#hitchuser)
* [Hitch.View](#hitchview)

### Hitch.Access
The acl public interface mixin

### Hitch.ACL
Represents an acl instance

### Hitch.App
Represents a hitch web application

### Hitch.Cookie
Represents a cookie

### Hitch.Cookies
Provides a CRUD-like interface for cookie access.

### Hitch.Credentials
A ready-to-use login interface

### Hitch.Helpers
Provides several helper methods that will be mixed in into underscore for being available within the rendering context 
of your views.

### Hitch.Object
The enhanced Backbone.Model

### Hitch.Resource
The enhanced Backbone.Collection

### Hitch.Role
A default role model representation

### Hitch.Router
The enhanced Backbone.Router

### Hitch.User
A default user model representation

### Hitch.View
The enhanced Backbone.View