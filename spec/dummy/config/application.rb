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
    config.action_controller.allow_forgery_protection = false
    config.logger = Logger.new(nil)
  end
end
