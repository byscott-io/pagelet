# frozen_string_literal: true

class CreatePageletPages < ActiveRecord::Migration[7.1]
  def change
    create_table :pagelet_pages do |t|
      t.references :owner, polymorphic: true, null: false
      t.string :path, null: false
      t.string :title, null: false
      t.json :draft_document, null: false
      t.bigint :published_version_id
      t.timestamps
    end
    add_index :pagelet_pages, %i[owner_type owner_id path], unique: true
    add_index :pagelet_pages, :published_version_id

    create_table :pagelet_page_versions do |t|
      t.references :page, null: false, foreign_key: { to_table: :pagelet_pages }
      t.integer :number, null: false
      t.json :document, null: false
      t.datetime :published_at, null: false
      t.string :published_by
      t.timestamps
    end
    add_index :pagelet_page_versions, %i[page_id number], unique: true
  end
end
