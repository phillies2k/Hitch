desc "Build production version"
task :build do |t|
  sh "uglifyjs hitch.js > hitch.min.js"
end

desc "Creates a fresh application boilerplate"
task :create, :path do |t, args|
  sh "sudo mkdir -p #{args.path}/app/helpers"
  sh "sudo mkdir -p #{args.path}/app/modules"
  sh "sudo mkdir -p #{args.path}/app/resources"
  sh "sudo mkdir -p #{args.path}/app/templates"
  sh "sudo mkdir -p #{args.path}/app/views"
  sh "sudo mkdir -p #{args.path}/vendor"
  sh "sudo wget http://requirejs.org/docs/release/2.1.1/minified/require.js > #{args.path}/vendor/require.js"
  sh "sudo wget http://backbonejs.org/backbone-min.js > #{args.path}/vendor/backbone.js"
  sh "sudo wget http://underscorejs.org/underscore-min.js > #{args.path}/vendor/underscore.js"
  sh "sudo wget http://code.jquery.com/jquery.min.js > #{args.path}/vendor/jquery.js"
  sh "sudo wget https://raw.github.com/justaprogrammer/ObjectId.js/master/Objectid.js > #{args.path}/vendor/Objectid.js"
end