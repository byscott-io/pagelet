# frozen_string_literal: true

require "json"
# rake build -> pkg/pagelet-X.Y.Z.gem (the path the release push uses).
require "bundler/gem_tasks"

namespace :version do
  desc "Show the current version"
  task :show do
    puts File.read("VERSION").strip
  end

  desc "Bump the version for the gem and the npm package (rake version:bump[0.1.1])"
  task :bump, [:new_version] do |_task, args|
    new_version = args[:new_version] or abort "Usage: rake version:bump[0.1.1]"

    File.write("VERSION", "#{new_version}\n")
    pkg = JSON.parse(File.read("package.json"))
    pkg["version"] = new_version
    File.write("package.json", "#{JSON.pretty_generate(pkg)}\n")
    puts "Version is now #{new_version} in VERSION and package.json; run bundle install to update Gemfile.lock"
  end
end
