# frozen_string_literal: true

require_relative "lib/pagelet/version"

Gem::Specification.new do |spec|
  spec.name = "pagelet"
  spec.version = Pagelet::VERSION
  spec.authors = ["Scott Gibson"]
  spec.email = ["scott@byscott.io"]

  spec.summary = "Page builder for Rails + React: store, version and publish pages"
  spec.description = "A Rails engine that stores, versions and publishes pages built with the " \
                     "@byscott-io/pagelet visual editor for React."
  spec.homepage = "https://github.com/byscott-io/pagelet"
  spec.license = "MIT"
  spec.required_ruby_version = ">= 3.1"

  spec.metadata["source_code_uri"] = spec.homepage
  # Publish to public RubyGems.org only, so a stray push can't go elsewhere.
  spec.metadata["allowed_push_host"] = "https://rubygems.org"
  spec.metadata["rubygems_mfa_required"] = "true"

  spec.files = Dir["app/**/*", "config/**/*", "db/**/*", "lib/**/*", "VERSION", "LICENSE", "README.md", "CHANGELOG.md"]
  spec.require_paths = ["lib"]

  spec.add_dependency "rails", ">= 7.1"
end
