# frozen_string_literal: true

ENV["RAILS_ENV"] = "test"
require "spec_helper"
require_relative "dummy/config/environment"
require "rspec/rails"

# An in-memory database built from the engine's own migrations, so the specs
# run exactly the schema a host app gets from pagelet:install:migrations.
ActiveRecord::Migration.verbose = false
ActiveRecord::Schema.define { create_table(:sites) { |t| t.string :name } }
ActiveRecord::MigrationContext.new(Pagelet::Engine.root.join("db/migrate").to_s).migrate

RSpec.configure do |config|
  config.use_transactional_fixtures = true
  config.include ActiveSupport::Testing::TimeHelpers
  config.infer_spec_type_from_file_location!
end
require_relative "support_helpers"
