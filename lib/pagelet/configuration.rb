# frozen_string_literal: true

module Pagelet
  class ConfigurationError < StandardError; end

  # What the host app tells pagelet. Two hooks are required, and pagelet
  # refuses to serve a request until both are set: an unscoped or unguarded
  # page store is the failure this design exists to prevent.
  #
  #   Pagelet.configure do |config|
  #     # Whose pages this request may see. Every query is scoped to it.
  #     config.owner = ->(controller) { Current.organization }
  #
  #     # May this request do this? action is :edit or :publish.
  #     config.authorize = ->(controller, action, page) { controller.current_user&.admin? }
  #   end
  class Configuration
    # The controller the engine's controllers inherit from, so the host's
    # authentication, CSRF protection and error handling apply to them.
    attr_accessor :parent_controller

    # Largest page document accepted, in bytes of JSON.
    attr_accessor :max_document_bytes

    attr_writer :owner, :authorize

    def initialize
      @parent_controller = "ActionController::Base"
      @max_document_bytes = 1_000_000
      @owner = nil
      @authorize = nil
    end

    def owner
      @owner || raise(ConfigurationError, "Pagelet.config.owner is not set (see the install initializer)")
    end

    def authorize
      @authorize || raise(ConfigurationError, "Pagelet.config.authorize is not set (see the install initializer)")
    end
  end
end
