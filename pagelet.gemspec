# frozen_string_literal: true

require_relative "lib/pagelet/version"

Gem::Specification.new do |spec|
  spec.name = "pagelet"
  spec.version = Pagelet::VERSION
  spec.authors = ["Scott Gibson"]
  spec.email = ["scott@byscott.io"]

  spec.summary = "Page builder for Rails + React (under development)"
  spec.description = "A visual page editor and renderer for React, with a Rails engine that stores, " \
                     "versions and publishes pages. Under active development; this early release " \
                     "contains no functionality yet."
  spec.homepage = "https://github.com/byscott-io/pagelet"
  spec.license = "MIT"
  spec.required_ruby_version = ">= 3.0.0"

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = spec.homepage
  # Publish to public RubyGems.org only, so a stray push can't go elsewhere.
  spec.metadata["allowed_push_host"] = "https://rubygems.org"

  spec.files = Dir["lib/**/*", "VERSION", "LICENSE", "README.md", "CHANGELOG.md"]
  spec.require_paths = ["lib"]
end
