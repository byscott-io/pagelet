# frozen_string_literal: true

# 0.2.0: site settings (theme and menu) per owner, and pages that also answer
# for paths below them.
class CreatePageletSites < ActiveRecord::Migration[7.1]
  def change
    create_table :pagelet_sites do |t|
      t.references :owner, polymorphic: true, null: false, index: { unique: true }
      t.json :settings, null: false
      t.timestamps
    end

    add_column :pagelet_pages, :matches_subpaths, :boolean, null: false, default: false
  end
end
