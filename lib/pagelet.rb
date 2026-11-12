# frozen_string_literal: true

require_relative "pagelet/version"
require_relative "pagelet/configuration"
require_relative "pagelet/engine" if defined?(Rails::Engine)

# Pagelet is a page builder for Rails + React. This gem is the Rails engine:
# it stores pages, keeps every published version, and serves them to the npm
# package's editor and renderer.
module Pagelet
  # The newest page-document format this gem accepts. Matches DOCUMENT_VERSION
  # in the npm package; the two move together.
  DOCUMENT_VERSION = 1

  class << self
    def config
      @config ||= Configuration.new
    end

    def configure
      yield config
    end

    # A page with nothing on it, in the current document format.
    def empty_document
      { "pagelet" => DOCUMENT_VERSION, "data" => { "root" => { "props" => {} }, "content" => [] } }
    end

    # For tests: forget all configuration.
    def reset_config!
      @config = nil
    end
  end
end
