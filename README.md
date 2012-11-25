Hitch v0.0.5
=====

Lightweight backbone-based single page application framework.

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

* [Installation](#hitchinstallation)
* [Setup](#hitchsetup)
* [Configuration](#hitchconfiguration)
* [Packages](#hitchpackages)
  * [Hitch.ACL](#hitchacl)
  * [Hitch.App](#hitchapp)
  * [Hitch.Credentials](#hitchcredentials)
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

Change to the directory wherever you want to install Hitch to, or simply create a new one.
Then just type in the following:

```bash
hitch create [path]
```

If the tool will find no hitch.json in the current folder it will prompt you to enter some basic values for your new
application and will auto-generate a hitch.json with the given information.

Two folders ('assets' and 'public') will be created in your application folder. Within these the tool will create your
ready to use kick-start application.

There are two ways to get your app working:
Either you can configure a vhost for the public directory of your application or go to your "app/index.js" file and
set the root property to your web-root pointing to your application's public directory.
Point your browser to <our application and have a look at your freshly created hitch application.



## Configuration

Configuration means to modify your 'hitch.json' file which was created by either yourself or the command line tool when
you created your application. The hitch.json is divided into several sections which specifies the application structure
and environment.

##### Modules `module`
This section defines your application modules

##### Resources `resources`
This section defines the application resources to be available.



## Packages

* [Hitch.ACL](#hitchacl)
* [Hitch.App](#hitchapp)
* [Hitch.Credentials](#hitchcredentials)
* [Hitch.Object](#hitchobject)
* [Hitch.Resource](#hitchresource)
* [Hitch.Role](#hitchrole)
* [Hitch.Router](#hitchrouter)
* [Hitch.User](#hitchuser)
* [Hitch.View](#hitchview)

### Hitch.ACL
### Hitch.App
### Hitch.Helpers

Provides several helper methods that will be mixed in into underscore for being available within the rendering context
of your views.

### Hitch.Cookies

Provides a CRUD-like interface for cookie access.

### Hitch.Credentials
### Hitch.Object
### Hitch.Resource
### Hitch.Role
### Hitch.Router
### Hitch.User
### Hitch.View