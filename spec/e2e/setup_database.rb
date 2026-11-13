# frozen_string_literal: true

# Builds the end-to-end database: the engine's migrations plus two sites.
# Run with: PAGELET_E2E_DB=tmp/e2e.sqlite3 bundle exec ruby spec/e2e/setup_database.rb
require_relative "../dummy/config/environment"

ActiveRecord::Migration.verbose = false
ActiveRecord::Schema.define { create_table(:sites, force: true) { |t| t.string :name } }
ActiveRecord::MigrationContext.new(Pagelet::Engine.root.join("db/migrate").to_s).migrate
Site.create!(id: 1, name: "Ours")
Site.create!(id: 2, name: "Theirs")
