Hitch v0.1.0-alpha
=====

Lightweight backbone-based single page application framework.
***Hitch is currently in a very early alpha state.***

* Default [Hitch.Object](#hitchobject)`s for [users](#hitchuser), [credentials](#hitchcredentials) and [roles](#hitchrole)
* Powerful [Access Control Layer](#hitchacl) for controlling access to [Hitch.Object](#hitchobject)`s
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

#### Getting the npm package

```bash
npm install backbone-hitch
```

#### Cloning the repository

```bash
git clone git@github.com/phillies2k/hitch.git
cd hitch && npm install
```


## Setup

Simply type in the following:

```bash
hitch create [path]
```

There are two ways to get your app working:
Either you can configure a vhost for the public directory of your application or go to your "app/index.js" file and
set the root property to your web-root pointing to your application's public directory.
Point your browser to <our application and have a look at your freshly created hitch application.



## Configuration

Configuration means to modify your 'hitch.json' file which was created by either yourself or the command line tool when
you created your application. The hitch.json is divided into several sections which specifies the application structure
and environment.

##### Configuration Options

* `name` - your application name
* `version` - your application version
* `exports` - Whether to export your app to globals/window or not. If value is a string your application will be exported with that name
* `apiUrl` - your application's base api url
* `root` - your application's web root path (defaults to '/')
* `pushState` - Whether to use push state or not
* `resources` - resource definitions
* `modules` - module definitions
* `assets`- your application styles and media

##### Configuring resources

A resource can be configured as simple as `"myresource": "true"`. This resource will then be loaded on initialization.
You can control access to a resource by defining an acl property for that resource which holds the permissions.

##### Configuring assets

Assets of type text/less or text/scss will be compiled using an appropriate compiler for either LESS- or SASS-like stylesheets.

##### Configuring modules

A module can have an acl property for configuring access to this module like every resource does it. Furthermore a special
property named "resource" is available to define a resource this module uses most. (e.g. a UsersRouter usually manages users)


## Using the Command-Line Tool

##### The `build` command

```bash
hitch build [target]
```

your build target can either be empty ( will execute all building tasks ) or one of the following tasks:
* `resources` - will create non existing resources
* `modules` - will initialize non existing modules
* `main` - will rebuild your bootstrap file. This is necessary to call after every update to resources or modules to ensure everything will be loaded.
* `all` - executes all task at once (same as calling build with no target given.


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
Provides several helper methods that will be mixed in into underscore for being available within the rendering context of your views.

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