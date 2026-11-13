# frozen_string_literal: true

require "rails"
require "active_record/railtie"
require "action_controller/railtie"
require "pagelet"

module Dummy
  class Application < Rails::Application
    config.load_defaults Rails::VERSION::STRING.to_f
    config.root = File.expand_path("..", __dir__)
    config.eager_load = false
    config.hosts.clear
    config.secret_key_base = "test-only-secret-key-base"
    config.active_support.deprecation = :raise
    # Specs drive the API without a browser session. The end-to-end run turns
    # CSRF protection on, so the npm client is proven to send a valid token.
    config.action_controller.allow_forgery_protection = ENV["PAGELET_E2E_DB"].present?
    config.action_dispatch.show_exceptions = :all
    config.logger = Logger.new(nil)
  end
end
