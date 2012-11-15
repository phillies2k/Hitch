desc "Build production version"
task :build do |t|
  sh "cat src/hitch.js src/hitch.cookies.js src/hitch.helpers.js | uglifyjs > hitch.min.js"
end