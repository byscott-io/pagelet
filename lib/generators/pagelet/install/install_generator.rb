# frozen_string_literal: true

require "rails/generators"

module Pagelet
  module Generators
    # bin/rails generate pagelet:install
    class InstallGenerator < Rails::Generators::Base
      source_root File.expand_path("templates", __dir__)

      def copy_initializer
        template "pagelet.rb", "config/initializers/pagelet.rb"
      end

      def copy_migrations
        rake "pagelet:install:migrations"
      end

      def mount_engine
        route 'mount Pagelet::Engine, at: "/pagelet"'
      end

      def explain
        say <<~MSG

          pagelet is installed. Before it will serve a request:
            1. bin/rails db:migrate
            2. Set config.owner and config.authorize in config/initializers/pagelet.rb
        MSG
      end
    end
  end
end
